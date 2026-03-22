import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  InventoryMovementType,
  InventoryReferenceType,
} from '../../../common/constants/inventory.constant';
import {
  InsufficientStockException,
  LocationNotFoundException,
  LocationWarehouseMismatchException,
} from '../../../common/exceptions/inventory.exceptions';
import { VariantNotFoundException } from '../../../common/exceptions/product.exceptions';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';
import { Location } from '../../../database/entities/location.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { StockBalance } from '../../../database/entities/stock-balance.entity';

export interface ApplyInventoryDeltaInput {
  warehouseId: string;
  locationId: string;
  variantId: string;
  quantityDelta: string;
  movementType: InventoryMovementType;
  referenceType: InventoryReferenceType;
  referenceId: string;
  referenceLineId?: string | null;
}

export interface ApplyTransferInput {
  from: { warehouseId: string; locationId: string; variantId: string };
  to: { warehouseId: string; locationId: string; variantId: string };
  quantity: string;
  referenceType: InventoryReferenceType;
  referenceId: string;
  referenceLineId?: string | null;
}

function compareBalanceKeys(
  a: { warehouseId: string; locationId: string; variantId: string },
  b: { warehouseId: string; locationId: string; variantId: string },
): number {
  const c1 = a.warehouseId.localeCompare(b.warehouseId);
  if (c1 !== 0) return c1;
  const c2 = a.locationId.localeCompare(b.locationId);
  if (c2 !== 0) return c2;
  return a.variantId.localeCompare(b.variantId);
}

function formatQty(n: number): string {
  return n.toFixed(4);
}

@Injectable()
export class InventoryStockService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Cập nhật tồn + ghi ledger trong transaction (SERIALIZABLE khi không truyền manager).
   * Dùng nội bộ từ Inbound / Outbound / Transfer.
   */
  async applyDelta(
    input: ApplyInventoryDeltaInput,
    manager?: EntityManager,
  ): Promise<void> {
    const run = async (em: EntityManager) => {
      const balanceRepo = em.getRepository(StockBalance);
      const movementRepo = em.getRepository(InventoryMovement);
      const locationRepo = em.getRepository(Location);
      const variantRepo = em.getRepository(ProductVariant);

      const variant = await variantRepo.findOne({
        where: { id: input.variantId },
      });
      if (!variant) {
        throw new VariantNotFoundException();
      }

      const location = await locationRepo.findOneBy({ id: input.locationId });
      if (!location) {
        throw new LocationNotFoundException();
      }
      if (location.warehouseId !== input.warehouseId) {
        throw new LocationWarehouseMismatchException();
      }

      const delta = parseFloat(input.quantityDelta);
      if (!Number.isFinite(delta) || delta === 0) {
        return;
      }

      let row = await balanceRepo.findOne({
        where: {
          warehouseId: input.warehouseId,
          locationId: input.locationId,
          variantId: input.variantId,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!row) {
        if (delta < 0) {
          throw new InsufficientStockException();
        }
        row = balanceRepo.create({
          warehouseId: input.warehouseId,
          locationId: input.locationId,
          variantId: input.variantId,
          quantity: '0.0000',
        });
        await balanceRepo.save(row);
        row = await balanceRepo.findOne({
          where: { id: row.id },
          lock: { mode: 'pessimistic_write' },
        });
      }

      if (!row) {
        throw new InsufficientStockException();
      }

      const current = parseFloat(String(row.quantity));
      const next = current + delta;
      if (next < 0) {
        throw new InsufficientStockException();
      }

      row.quantity = formatQty(next);
      await balanceRepo.save(row);

      await movementRepo.save(
        movementRepo.create({
          warehouseId: input.warehouseId,
          locationId: input.locationId,
          variantId: input.variantId,
          quantityDelta: formatQty(delta),
          movementType: input.movementType,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          referenceLineId: input.referenceLineId ?? null,
        }),
      );
    };

    if (manager) {
      await run(manager);
      return;
    }
    await this.dataSource.transaction('SERIALIZABLE', run);
  }

  /**
   * Chuyển kho: trừ nguồn + cộng đích, khóa theo thứ tự key cố định.
   */
  async applyTransfer(input: ApplyTransferInput): Promise<void> {
    const qty = parseFloat(input.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return;
    }

    const qStr = formatQty(qty);
    const negStr = formatQty(-qty);

    const ops = [
      {
        warehouseId: input.from.warehouseId,
        locationId: input.from.locationId,
        variantId: input.from.variantId,
        quantityDelta: negStr,
        movementType: InventoryMovementType.TRANSFER_OUT,
      },
      {
        warehouseId: input.to.warehouseId,
        locationId: input.to.locationId,
        variantId: input.to.variantId,
        quantityDelta: qStr,
        movementType: InventoryMovementType.TRANSFER_IN,
      },
    ].sort((a, b) =>
      compareBalanceKeys(
        {
          warehouseId: a.warehouseId,
          locationId: a.locationId,
          variantId: a.variantId,
        },
        {
          warehouseId: b.warehouseId,
          locationId: b.locationId,
          variantId: b.variantId,
        },
      ),
    );

    await this.dataSource.transaction('SERIALIZABLE', async (em) => {
      for (const op of ops) {
        await this.applyDelta(
          {
            warehouseId: op.warehouseId,
            locationId: op.locationId,
            variantId: op.variantId,
            quantityDelta: op.quantityDelta,
            movementType: op.movementType,
            referenceType: input.referenceType,
            referenceId: input.referenceId,
            referenceLineId: input.referenceLineId,
          },
          em,
        );
      }
    });
  }
}
