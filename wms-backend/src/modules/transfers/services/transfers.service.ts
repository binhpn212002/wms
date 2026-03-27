import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { TransferStatus } from '../../../common/constants/transfers.constant';
import {
  InventoryMovementType,
  InventoryReferenceType,
  LocationType,
} from '../../../common/constants/inventory.constant';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import {
  InsufficientStockException,
  LocationNotFoundException,
  OnlyBinForStockException,
  WarehouseNotFoundException,
} from '../../../common/exceptions/inventory.exceptions';
import {
  TransferCannotModifyCompletedException,
  TransferDocumentNoDuplicateException,
  TransferInvalidStatusException,
  TransferNoLinesException,
  TransferNotFoundException,
  TransferSourceDestSameException,
  TransferWarehouseInactiveException,
} from '../../../common/exceptions/transfers.exceptions';
import { VariantNotFoundException } from '../../../common/exceptions/product.exceptions';
import { Transfer } from '../../../database/entities/transfer.entity';
import { TransferLine } from '../../../database/entities/transfer-line.entity';
import { InventoryStockService } from '../../inventory/services/inventory-stock.service';
import { StockBalancesRepository } from '../../inventory/repositories/stock-balances.repository';
import { ProductVariantsRepository } from '../../products/repositories/product-variants.repository';
import { LocationsRepository } from '../../warehouses/repositories/locations.repository';
import { WarehousesRepository } from '../../warehouses/repositories/warehouses.repository';
import { CreateTransferDto } from '../dto/create-transfer.dto';
import { ListTransfersQueryDto } from '../dto/list-transfers-query.dto';
import { ReplaceTransferLinesDto } from '../dto/replace-transfer-lines.dto';
import { TransferLineInputDto } from '../dto/transfer-line-input.dto';
import { TransferResponseDto } from '../dto/transfer-response.dto';
import { TransfersRepository } from '../repositories/transfers.repository';
import { TransferLinesRepository } from '../repositories/transfer-lines.repository';
import { UpdateTransferDto } from '../dto/update-transfer.dto';

function formatQty(n: number): string {
  return n.toFixed(4);
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

@Injectable()
export class TransfersService {
  constructor(
    private readonly transfersRepo: TransfersRepository,
    private readonly transferLinesRepo: TransferLinesRepository,
    private readonly warehousesRepo: WarehousesRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly productVariantsRepo: ProductVariantsRepository,
    private readonly stockBalancesRepo: StockBalancesRepository,
    private readonly inventoryStock: InventoryStockService,
    private readonly dataSource: DataSource,
  ) {}

  private genDocumentNo(): string {
    return `TRF-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  private assertNotCompleted(status: TransferStatus): void {
    if (status === TransferStatus.COMPLETED) {
      throw new TransferCannotModifyCompletedException();
    }
  }

  private assertDraftOnly(status: TransferStatus): void {
    if (status !== TransferStatus.DRAFT) {
      throw new TransferInvalidStatusException();
    }
  }

  private async assertWarehouseActive(warehouseId: string): Promise<void> {
    const w = await this.warehousesRepo.findById(warehouseId);
    if (!w) {
      throw new WarehouseNotFoundException();
    }
    if (!w.active) {
      throw new TransferWarehouseInactiveException();
    }
  }

  private async assertVariantOk(variantId: string): Promise<void> {
    const v = await this.productVariantsRepo.findById(variantId);
    if (!v) {
      throw new VariantNotFoundException();
    }
  }

  private async assertBinLocation(
    warehouseId: string,
    locationId: string,
  ): Promise<void> {
    const loc = await this.locationsRepo.findByIdAndWarehouseId(
      locationId,
      warehouseId,
    );
    if (!loc) {
      throw new LocationNotFoundException();
    }
    if (loc.type !== LocationType.BIN) {
      throw new OnlyBinForStockException();
    }
  }

  private validateLineInputs(lines: TransferLineInputDto[]): void {
    for (const l of lines) {
      const qty = parseFloat(l.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new UnprocessableEntityException({
          message: 'Số lượng không hợp lệ (quantity > 0)',
        });
      }
      if (
        l.warehouseIdFrom === l.warehouseIdTo &&
        l.locationIdFrom === l.locationIdTo
      ) {
        throw new TransferSourceDestSameException();
      }
    }
  }

  private async assertSufficientStockForDocument(lines: TransferLine[]): Promise<void> {
    for (const line of lines) {
      await this.assertWarehouseActive(line.warehouseIdFrom);
      await this.assertWarehouseActive(line.warehouseIdTo);
      await this.assertVariantOk(line.variantId);
      await this.assertBinLocation(line.warehouseIdFrom, line.locationIdFrom);
      await this.assertBinLocation(line.warehouseIdTo, line.locationIdTo);

      const qty = parseFloat(String(line.quantity));
      const bal = await this.stockBalancesRepo.findOneBy({
        warehouseId: line.warehouseIdFrom,
        locationId: line.locationIdFrom,
        variantId: line.variantId,
      });
      const available = parseFloat(bal?.quantity ?? '0');
      if (!Number.isFinite(available) || available < qty) {
        throw new InsufficientStockException();
      }
    }
  }

  async create(dto: CreateTransferDto): Promise<TransferResponseDto> {
    const documentNo = dto.documentNo?.trim() ?? this.genDocumentNo();
    if (await this.transfersRepo.existsByDocumentNo(documentNo)) {
      throw new TransferDocumentNoDuplicateException();
    }

    const documentDate = dto.documentDate ?? new Date().toISOString().slice(0, 10);

    const doc = await this.transfersRepo.createAndSave({
      documentNo,
      documentDate,
      status: TransferStatus.DRAFT,
      note: dto.note ?? null,
      completedAt: null,
    });

    if (dto.lines?.length) {
      await this.replaceLines(doc.id, { lines: dto.lines });
    }

    const full = await this.transfersRepo.findByIdWithLines(doc.id);
    return TransferResponseDto.fromEntity(full!, { includeLines: true });
  }

  async list(
    query: ListTransfersQueryDto,
  ): Promise<ListResponseDto<TransferResponseDto>> {
    query.normalize();
    const res = await this.transfersRepo.findManyWithFilters(query);
    const data = res.data.map((d) =>
      TransferResponseDto.fromEntity(d, { includeLines: false }),
    );
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(id: string): Promise<TransferResponseDto> {
    const doc = await this.transfersRepo.findByIdWithLines(id);
    if (!doc) {
      throw new TransferNotFoundException();
    }
    return TransferResponseDto.fromEntity(doc, { includeLines: true });
  }

  async update(id: string, dto: UpdateTransferDto): Promise<TransferResponseDto> {
    const doc = await this.transfersRepo.findById(id);
    if (!doc) {
      throw new TransferNotFoundException();
    }
    this.assertNotCompleted(doc.status as TransferStatus);

    if (dto.documentNo !== undefined && dto.documentNo.trim() !== doc.documentNo) {
      if (await this.transfersRepo.existsByDocumentNo(dto.documentNo.trim(), doc.id)) {
        throw new TransferDocumentNoDuplicateException();
      }
      doc.documentNo = dto.documentNo.trim();
    }
    if (dto.documentDate !== undefined) {
      doc.documentDate = dto.documentDate;
    }
    if (dto.note !== undefined) {
      doc.note = dto.note;
    }

    await this.transfersRepo.save(doc);
    const full = await this.transfersRepo.findByIdWithLines(doc.id);
    return TransferResponseDto.fromEntity(full!, { includeLines: true });
  }

  async replaceLines(
    id: string,
    dto: ReplaceTransferLinesDto,
  ): Promise<TransferResponseDto> {
    const doc = await this.transfersRepo.findById(id);
    if (!doc) {
      throw new TransferNotFoundException();
    }
    this.assertDraftOnly(doc.status as TransferStatus);

    this.validateLineInputs(dto.lines);

    const rows: Partial<TransferLine>[] = [];
    for (const line of dto.lines) {
      await this.assertWarehouseActive(line.warehouseIdFrom);
      await this.assertWarehouseActive(line.warehouseIdTo);
      await this.assertVariantOk(line.variantId);
      await this.assertBinLocation(line.warehouseIdFrom, line.locationIdFrom);
      await this.assertBinLocation(line.warehouseIdTo, line.locationIdTo);

      const qty = parseFloat(line.quantity);
      rows.push({
        transferId: doc.id,
        variantId: line.variantId,
        quantity: formatQty(qty),
        warehouseIdFrom: line.warehouseIdFrom,
        locationIdFrom: line.locationIdFrom,
        warehouseIdTo: line.warehouseIdTo,
        locationIdTo: line.locationIdTo,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.transferLinesRepo.deleteByTransferId(manager, doc.id);
      for (const row of rows) {
        await manager.save(TransferLine, row);
      }
    });

    const full = await this.transfersRepo.findByIdWithLines(doc.id);
    return TransferResponseDto.fromEntity(full!, { includeLines: true });
  }

  async validate(id: string): Promise<{ ok: true }> {
    const existing = await this.transfersRepo.findByIdWithLines(id);
    if (!existing) {
      throw new TransferNotFoundException();
    }
    if (existing.status !== TransferStatus.DRAFT) {
      throw new TransferInvalidStatusException();
    }
    if (!existing.lines?.length) {
      throw new TransferNoLinesException();
    }
    await this.assertSufficientStockForDocument(existing.lines);
    return { ok: true };
  }

  async complete(id: string): Promise<TransferResponseDto> {
    const existing = await this.transfersRepo.findByIdWithLines(id);
    if (!existing) {
      throw new TransferNotFoundException();
    }
    if (existing.status === TransferStatus.COMPLETED) {
      return TransferResponseDto.fromEntity(existing, { includeLines: true });
    }
    if (existing.status !== TransferStatus.DRAFT) {
      throw new TransferInvalidStatusException();
    }
    if (!existing.lines?.length) {
      throw new TransferNoLinesException();
    }

    await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const doc = await manager
        .getRepository(Transfer)
        .createQueryBuilder('d')
        .where('d.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!doc) {
        throw new TransferNotFoundException();
      }
      if (doc.status === TransferStatus.COMPLETED) {
        return;
      }
      if (doc.status !== TransferStatus.DRAFT) {
        throw new TransferInvalidStatusException();
      }

      const lines = await manager.find(TransferLine, { where: { transferId: id } });
      if (!lines.length) {
        throw new TransferNoLinesException();
      }

      const ops: Array<{
        warehouseId: string;
        locationId: string;
        variantId: string;
        quantityDelta: string;
        movementType: InventoryMovementType;
        referenceLineId: string;
      }> = [];

      for (const line of lines) {
        if (
          line.warehouseIdFrom === line.warehouseIdTo &&
          line.locationIdFrom === line.locationIdTo
        ) {
          throw new TransferSourceDestSameException();
        }

        const qty = parseFloat(String(line.quantity));
        ops.push({
          warehouseId: line.warehouseIdFrom,
          locationId: line.locationIdFrom,
          variantId: line.variantId,
          quantityDelta: formatQty(-qty),
          movementType: InventoryMovementType.TRANSFER_OUT,
          referenceLineId: line.id,
        });
        ops.push({
          warehouseId: line.warehouseIdTo,
          locationId: line.locationIdTo,
          variantId: line.variantId,
          quantityDelta: formatQty(qty),
          movementType: InventoryMovementType.TRANSFER_IN,
          referenceLineId: line.id,
        });
      }

      ops.sort((a, b) =>
        compareBalanceKeys(
          { warehouseId: a.warehouseId, locationId: a.locationId, variantId: a.variantId },
          { warehouseId: b.warehouseId, locationId: b.locationId, variantId: b.variantId },
        ),
      );

      for (const op of ops) {
        await this.inventoryStock.applyDelta(
          {
            warehouseId: op.warehouseId,
            locationId: op.locationId,
            variantId: op.variantId,
            quantityDelta: op.quantityDelta,
            movementType: op.movementType,
            referenceType: InventoryReferenceType.TRANSFER,
            referenceId: doc.id,
            referenceLineId: op.referenceLineId,
          },
          manager,
        );
      }

      doc.status = TransferStatus.COMPLETED;
      doc.completedAt = new Date();
      await manager.save(doc);
    });

    const full = await this.transfersRepo.findByIdWithLines(id);
    return TransferResponseDto.fromEntity(full!, { includeLines: true });
  }

  async remove(id: string): Promise<void> {
    const doc = await this.transfersRepo.findById(id);
    if (!doc) {
      throw new TransferNotFoundException();
    }
    this.assertDraftOnly(doc.status as TransferStatus);

    await this.dataSource.transaction(async (manager) => {
      await this.transferLinesRepo.softDeleteByTransferId(manager, id);
      await manager.softDelete(Transfer, { id });
    });
  }
}

