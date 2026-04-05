import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserStatus } from '../../../common/constants/user.constant';
import { StockBalance } from '../../../database/entities/stock-balance.entity';
import { User } from '../../../database/entities/user.entity';
import type { LowStockAlertQueueMessage } from '../types/low-stock-alert-message';

@Injectable()
export class LowStockAlertService {
  private readonly logger = new Logger(LowStockAlertService.name);

  constructor(
    @InjectRepository(StockBalance)
    private readonly stockBalanceRepo: Repository<StockBalance>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tổng tồn theo (variant, kho) ≤ min_stock của variant → đẩy một message lên SQS để Lambda gửi mail.
   */
  async scanAndEnqueue(): Promise<{
    belowThresholdCount: number;
    enqueued: boolean;
    recipientCount: number;
  }> {
    const queueUrl = this.configService.get<string>('lowStockAlert.queueUrl');

    const rows = await this.stockBalanceRepo
      .createQueryBuilder('sb')
      .innerJoin('sb.variant', 'v')
      .innerJoin('v.product', 'p')
      .innerJoin('sb.warehouse', 'w')
      .where('v.minStock IS NOT NULL')
      .andWhere('v.active = :vActive', { vActive: true })
      .andWhere('w.active = :wActive', { wActive: true })
      .select('sb.variantId', 'variantId')
      .addSelect('sb.warehouseId', 'warehouseId')
      .addSelect('SUM(CAST(sb.quantity AS DECIMAL(18,4)))', 'totalQty')
      .addSelect('MAX(v.sku)', 'sku')
      .addSelect('MAX(p.name)', 'productName')
      .addSelect('MAX(w.name)', 'warehouseName')
      .addSelect('MAX(CAST(v.minStock AS DECIMAL(18,3)))', 'minStock')
      .groupBy('sb.variantId')
      .addGroupBy('sb.warehouseId')
      .having(
        'SUM(CAST(sb.quantity AS DECIMAL(18,4))) <= MAX(CAST(v.minStock AS DECIMAL(18,3)))',
      )
      .getRawMany<{
        variantId: string;
        warehouseId: string;
        totalQty: string;
        sku: string;
        productName: string;
        warehouseName: string;
        minStock: string;
      }>();

    const recipientEmails = await this.resolveRecipientEmails();
    if (rows.length === 0) {
      this.logger.log('Low-stock scan: no lines below threshold');
      return {
        belowThresholdCount: 0,
        enqueued: false,
        recipientCount: recipientEmails.length,
      };
    }

    if (!queueUrl) {
      this.logger.warn(
        'LOW_STOCK_QUEUE_URL is empty — skip SQS (set env to enable enqueue)',
      );
      return {
        belowThresholdCount: rows.length,
        enqueued: false,
        recipientCount: recipientEmails.length,
      };
    }

    if (recipientEmails.length === 0) {
      this.logger.warn(
        'No recipient emails (users with email or LOW_STOCK_ALERT_EMAILS) — skip enqueue',
      );
      return {
        belowThresholdCount: rows.length,
        enqueued: false,
        recipientCount: 0,
      };
    }

    const payload: LowStockAlertQueueMessage = {
      subject: 'WMS — Cảnh báo tồn kho thấp',
      recipientEmails,
      generatedAt: new Date().toISOString(),
      items: rows.map((r) => ({
        variantId: r.variantId,
        warehouseId: r.warehouseId,
        sku: r.sku,
        productName: r.productName,
        warehouseName: r.warehouseName,
        quantity: String(r.totalQty),
        minStock: String(r.minStock),
      })),
    };

    const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
    const client = new SQSClient(region ? { region } : {});
    await client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(payload),
      }),
    );

    this.logger.log(
      `Low-stock scan: enqueued ${rows.length} line(s) for ${recipientEmails.length} recipient(s)`,
    );

    return {
      belowThresholdCount: rows.length,
      enqueued: true,
      recipientCount: recipientEmails.length,
    };
  }

  private async resolveRecipientEmails(): Promise<string[]> {
    const extra = process.env.LOW_STOCK_ALERT_EMAILS;
    if (extra?.trim()) {
      return extra
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    }

    const users = await this.userRepo.find({
      where: {
        email: Not(IsNull()),
        status: UserStatus.ACTIVE,
      },
      select: ['email'],
    });

    const set = new Set<string>();
    for (const u of users) {
      if (u.email?.trim()) {
        set.add(u.email.trim().toLowerCase());
      }
    }
    return [...set];
  }
}
