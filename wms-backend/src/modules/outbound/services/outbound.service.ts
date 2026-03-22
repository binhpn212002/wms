import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { OutboundDocumentStatus } from '../../../common/constants/outbound.constant';
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
  OutboundCannotModifyCompletedException,
  OutboundDocumentNoDuplicateException,
  OutboundInvalidStatusException,
  OutboundNoLinesException,
  OutboundNotFoundException,
  OutboundWarehouseInactiveException,
} from '../../../common/exceptions/outbound.exceptions';
import { VariantNotFoundException } from '../../../common/exceptions/product.exceptions';
import { OutboundDocument } from '../../../database/entities/outbound-document.entity';
import { OutboundLine } from '../../../database/entities/outbound-line.entity';
import { InventoryStockService } from '../../inventory/services/inventory-stock.service';
import { StockBalancesRepository } from '../../inventory/repositories/stock-balances.repository';
import { ProductVariantsRepository } from '../../products/repositories/product-variants.repository';
import { LocationsRepository } from '../../warehouses/repositories/locations.repository';
import { WarehousesRepository } from '../../warehouses/repositories/warehouses.repository';
import { CreateOutboundDto } from '../dto/create-outbound.dto';
import { ListOutboundQueryDto } from '../dto/list-outbound-query.dto';
import { OutboundDocumentResponseDto } from '../dto/outbound-document-response.dto';
import { OutboundLineInputDto } from '../dto/outbound-line-input.dto';
import { ReplaceOutboundLinesDto } from '../dto/replace-outbound-lines.dto';
import { UpdateOutboundDto } from '../dto/update-outbound.dto';
import { OutboundDocumentsRepository } from '../repositories/outbound-documents.repository';
import { OutboundLinesRepository } from '../repositories/outbound-lines.repository';

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
export class OutboundService {
  constructor(
    private readonly outboundDocumentsRepo: OutboundDocumentsRepository,
    private readonly outboundLinesRepo: OutboundLinesRepository,
    private readonly warehousesRepo: WarehousesRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly productVariantsRepo: ProductVariantsRepository,
    private readonly stockBalancesRepo: StockBalancesRepository,
    private readonly inventoryStock: InventoryStockService,
    private readonly dataSource: DataSource,
  ) {}

  private genDocumentNo(): string {
    return `OUT-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  private assertNotCompleted(status: OutboundDocumentStatus): void {
    if (status === OutboundDocumentStatus.COMPLETED) {
      throw new OutboundCannotModifyCompletedException();
    }
  }

  private assertDraftForLines(status: OutboundDocumentStatus): void {
    if (status !== OutboundDocumentStatus.DRAFT) {
      throw new OutboundInvalidStatusException();
    }
  }

  private async loadWarehouseForOutbound(warehouseId: string): Promise<void> {
    const w = await this.warehousesRepo.findById(warehouseId);
    if (!w) {
      throw new WarehouseNotFoundException();
    }
    if (!w.active) {
      throw new OutboundWarehouseInactiveException();
    }
  }

  private async assertVariantOk(variantId: string): Promise<void> {
    const v = await this.productVariantsRepo.findById(variantId);
    if (!v) {
      throw new VariantNotFoundException();
    }
  }

  /** Ô nguồn: thuộc kho phiếu và là bin. */
  private async assertSourceLocation(
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

  private validateLineInputs(lines: OutboundLineInputDto[]): void {
    const lineNos = lines.map((l) => l.lineNo);
    const uniq = new Set(lineNos);
    if (uniq.size !== lineNos.length) {
      throw new UnprocessableEntityException({
        message: 'lineNo không được trùng trong cùng phiếu',
      });
    }
    for (const l of lines) {
      const q = parseFloat(l.quantity);
      if (!Number.isFinite(q) || q <= 0) {
        throw new UnprocessableEntityException({
          message: `Số lượng không hợp lệ tại line ${l.lineNo}`,
        });
      }
    }
  }

  /** Kiểm tra đủ tồn (đọc balance hiện tại, không cập nhật). */
  private async assertSufficientStockForDocument(
    warehouseId: string,
    lines: OutboundLine[],
  ): Promise<void> {
    for (const line of lines) {
      await this.assertSourceLocation(warehouseId, line.locationId);
      await this.assertVariantOk(line.variantId);
      const qty = parseFloat(String(line.quantity));
      const bal = await this.stockBalancesRepo.findOneBy({
        warehouseId,
        locationId: line.locationId,
        variantId: line.variantId,
      });
      const available = parseFloat(bal?.quantity ?? '0');
      if (!Number.isFinite(available) || available < qty) {
        throw new InsufficientStockException();
      }
    }
  }

  async create(dto: CreateOutboundDto): Promise<OutboundDocumentResponseDto> {
    await this.loadWarehouseForOutbound(dto.warehouseId);

    const documentNo = dto.documentNo?.trim() ?? this.genDocumentNo();
    if (await this.outboundDocumentsRepo.existsByDocumentNo(documentNo)) {
      throw new OutboundDocumentNoDuplicateException();
    }

    const documentDate =
      dto.documentDate ?? new Date().toISOString().slice(0, 10);

    const doc = await this.outboundDocumentsRepo.createAndSave({
      documentNo,
      documentDate,
      warehouseId: dto.warehouseId,
      status: OutboundDocumentStatus.DRAFT,
      reason: dto.reason ?? null,
      notes: dto.notes ?? null,
    });

    const full = await this.outboundDocumentsRepo.findByIdWithLines(doc.id);
    return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async list(
    query: ListOutboundQueryDto,
  ): Promise<ListResponseDto<OutboundDocumentResponseDto>> {
    query.normalize();
    const res = await this.outboundDocumentsRepo.findManyWithFilters(query);
    const data = res.data.map((d) =>
      OutboundDocumentResponseDto.fromEntity(d, { includeLines: false }),
    );
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(id: string): Promise<OutboundDocumentResponseDto> {
    const doc = await this.outboundDocumentsRepo.findByIdWithLines(id);
    if (!doc) {
      throw new OutboundNotFoundException();
    }
    return OutboundDocumentResponseDto.fromEntity(doc, { includeLines: true });
  }

  async update(
    id: string,
    dto: UpdateOutboundDto,
  ): Promise<OutboundDocumentResponseDto> {
    const doc = await this.outboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new OutboundNotFoundException();
    }
    this.assertNotCompleted(doc.status as OutboundDocumentStatus);

    if (dto.warehouseId && dto.warehouseId !== doc.warehouseId) {
      await this.loadWarehouseForOutbound(dto.warehouseId);
    }

    if (dto.documentNo !== undefined && dto.documentNo.trim() !== doc.documentNo) {
      if (
        await this.outboundDocumentsRepo.existsByDocumentNo(
          dto.documentNo.trim(),
          doc.id,
        )
      ) {
        throw new OutboundDocumentNoDuplicateException();
      }
    }

    if (dto.warehouseId) doc.warehouseId = dto.warehouseId;
    if (dto.documentNo !== undefined) {
      doc.documentNo = dto.documentNo.trim();
    }
    if (dto.documentDate !== undefined) {
      doc.documentDate = dto.documentDate;
    }
    if (dto.reason !== undefined) doc.reason = dto.reason;
    if (dto.notes !== undefined) doc.notes = dto.notes;

    await this.outboundDocumentsRepo.save(doc);

    const full = await this.outboundDocumentsRepo.findByIdWithLines(doc.id);
    return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async replaceLines(
    id: string,
    dto: ReplaceOutboundLinesDto,
  ): Promise<OutboundDocumentResponseDto> {
    const doc = await this.outboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new OutboundNotFoundException();
    }
    this.assertDraftForLines(doc.status as OutboundDocumentStatus);

    this.validateLineInputs(dto.lines);

    const warehouseId = doc.warehouseId;
    const rows: Partial<OutboundLine>[] = [];

    for (const line of dto.lines) {
      await this.assertVariantOk(line.variantId);
      await this.assertSourceLocation(warehouseId, line.locationId);
      const qty = parseFloat(line.quantity);
      rows.push({
        outboundDocumentId: doc.id,
        lineNo: line.lineNo,
        variantId: line.variantId,
        quantity: formatQty(qty),
        locationId: line.locationId,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.outboundLinesRepo.deleteByOutboundDocumentId(manager, doc.id);
      for (const row of rows) {
        await manager.save(OutboundLine, row);
      }
    });

    const full = await this.outboundDocumentsRepo.findByIdWithLines(doc.id);
    return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async validate(id: string): Promise<{ ok: true }> {
    const existing = await this.outboundDocumentsRepo.findByIdWithLines(id);
    if (!existing) {
      throw new OutboundNotFoundException();
    }
    if (
      existing.status !== OutboundDocumentStatus.DRAFT &&
      existing.status !== OutboundDocumentStatus.CONFIRMED
    ) {
      throw new OutboundInvalidStatusException();
    }
    if (!existing.lines?.length) {
      throw new OutboundNoLinesException();
    }
    await this.assertSufficientStockForDocument(
      existing.warehouseId,
      existing.lines,
    );
    return { ok: true };
  }

  async confirm(id: string): Promise<OutboundDocumentResponseDto> {
    const doc = await this.outboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new OutboundNotFoundException();
    }
    if (doc.status === OutboundDocumentStatus.COMPLETED) {
      throw new OutboundInvalidStatusException();
    }
    if (doc.status === OutboundDocumentStatus.CONFIRMED) {
      const full = await this.outboundDocumentsRepo.findByIdWithLines(doc.id);
      return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
    }
    if (doc.status !== OutboundDocumentStatus.DRAFT) {
      throw new OutboundInvalidStatusException();
    }
    doc.status = OutboundDocumentStatus.CONFIRMED;
    await this.outboundDocumentsRepo.save(doc);
    const full = await this.outboundDocumentsRepo.findByIdWithLines(doc.id);
    return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async complete(id: string): Promise<OutboundDocumentResponseDto> {
    const existing = await this.outboundDocumentsRepo.findByIdWithLines(id);
    if (!existing) {
      throw new OutboundNotFoundException();
    }
    if (existing.status === OutboundDocumentStatus.COMPLETED) {
      return OutboundDocumentResponseDto.fromEntity(existing, {
        includeLines: true,
      });
    }
    if (
      existing.status !== OutboundDocumentStatus.DRAFT &&
      existing.status !== OutboundDocumentStatus.CONFIRMED
    ) {
      throw new OutboundInvalidStatusException();
    }
    if (!existing.lines?.length) {
      throw new OutboundNoLinesException();
    }

    await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const doc = await manager
        .getRepository(OutboundDocument)
        .createQueryBuilder('d')
        .where('d.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!doc) {
        throw new OutboundNotFoundException();
      }
      if (doc.status === OutboundDocumentStatus.COMPLETED) {
        return;
      }
      if (
        doc.status !== OutboundDocumentStatus.DRAFT &&
        doc.status !== OutboundDocumentStatus.CONFIRMED
      ) {
        throw new OutboundInvalidStatusException();
      }

      const lines = await manager.find(OutboundLine, {
        where: { outboundDocumentId: id },
      });
      if (!lines.length) {
        throw new OutboundNoLinesException();
      }

      lines.sort((a, b) =>
        compareBalanceKeys(
          {
            warehouseId: doc.warehouseId,
            locationId: a.locationId,
            variantId: a.variantId,
          },
          {
            warehouseId: doc.warehouseId,
            locationId: b.locationId,
            variantId: b.variantId,
          },
        ),
      );

      for (const line of lines) {
        const qty = parseFloat(String(line.quantity));
        await this.inventoryStock.applyDelta(
          {
            warehouseId: doc.warehouseId,
            locationId: line.locationId,
            variantId: line.variantId,
            quantityDelta: formatQty(-qty),
            movementType: InventoryMovementType.OUTBOUND_ISSUE,
            referenceType: InventoryReferenceType.OUTBOUND,
            referenceId: doc.id,
            referenceLineId: line.id,
          },
          manager,
        );
      }

      doc.status = OutboundDocumentStatus.COMPLETED;
      await manager.save(doc);
    });

    const full = await this.outboundDocumentsRepo.findByIdWithLines(id);
    return OutboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async remove(id: string): Promise<void> {
    const doc = await this.outboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new OutboundNotFoundException();
    }
    this.assertDraftForLines(doc.status as OutboundDocumentStatus);

    await this.dataSource.transaction(async (manager) => {
      await this.outboundLinesRepo.softDeleteByOutboundDocumentId(manager, id);
      await manager.softDelete(OutboundDocument, { id });
    });
  }
}
