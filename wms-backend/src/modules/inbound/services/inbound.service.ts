import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { InboundDocumentStatus } from '../../../common/constants/inbound.constant';
import {
  InventoryMovementType,
  InventoryReferenceType,
  LocationType,
} from '../../../common/constants/inventory.constant';
import {
  LocationNotFoundException,
  OnlyBinForStockException,
  WarehouseNotFoundException,
} from '../../../common/exceptions/inventory.exceptions';
import {
  InboundCannotModifyCompletedException,
  InboundDocumentNoDuplicateException,
  InboundInvalidStatusException,
  InboundMissingLocationException,
  InboundNoLinesException,
  InboundNotFoundException,
  InboundSupplierInactiveException,
  InboundWarehouseInactiveException,
} from '../../../common/exceptions/inbound.exceptions';
import { VariantNotFoundException } from '../../../common/exceptions/product.exceptions';
import { SupplierNotFoundException } from '../../../common/exceptions/supplier.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { InboundDocument } from '../../../database/entities/inbound-document.entity';
import { InboundLine } from '../../../database/entities/inbound-line.entity';
import { InventoryStockService } from '../../inventory/services/inventory-stock.service';
import { ProductVariantsRepository } from '../../products/repositories/product-variants.repository';
import { SuppliersRepository } from '../../suppliers/repositories/suppliers.repository';
import { LocationsRepository } from '../../warehouses/repositories/locations.repository';
import { WarehousesRepository } from '../../warehouses/repositories/warehouses.repository';
import { CreateInboundDto } from '../dto/create-inbound.dto';
import { InboundDocumentResponseDto } from '../dto/inbound-document-response.dto';
import { ListInboundQueryDto } from '../dto/list-inbound-query.dto';
import { ReplaceInboundLinesDto } from '../dto/replace-inbound-lines.dto';
import { UpdateInboundDto } from '../dto/update-inbound.dto';
import { InboundLineInputDto } from '../dto/inbound-line-input.dto';
import { InboundDocumentsRepository } from '../repositories/inbound-documents.repository';
import { InboundLinesRepository } from '../repositories/inbound-lines.repository';

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
export class InboundService {
  constructor(
    private readonly inboundDocumentsRepo: InboundDocumentsRepository,
    private readonly inboundLinesRepo: InboundLinesRepository,
    private readonly suppliersRepo: SuppliersRepository,
    private readonly warehousesRepo: WarehousesRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly productVariantsRepo: ProductVariantsRepository,
    private readonly inventoryStock: InventoryStockService,
    private readonly dataSource: DataSource,
  ) {}

  private genDocumentNo(): string {
    return `INB-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
  }

  private assertNotCompleted(status: InboundDocumentStatus): void {
    if (status === InboundDocumentStatus.COMPLETED) {
      throw new InboundCannotModifyCompletedException();
    }
  }

  private assertDraftForLines(status: InboundDocumentStatus): void {
    if (status !== InboundDocumentStatus.DRAFT) {
      throw new InboundInvalidStatusException();
    }
  }

  private async loadSupplierForInbound(supplierId: string): Promise<void> {
    const s = await this.suppliersRepo.findById(supplierId);
    if (!s) {
      throw new SupplierNotFoundException();
    }
    if (!s.active) {
      throw new InboundSupplierInactiveException();
    }
  }

  private async loadWarehouseForInbound(warehouseId: string): Promise<void> {
    const w = await this.warehousesRepo.findById(warehouseId);
    if (!w) {
      throw new WarehouseNotFoundException();
    }
    if (!w.active) {
      throw new InboundWarehouseInactiveException();
    }
  }

  private async assertVariantOk(variantId: string): Promise<void> {
    const v = await this.productVariantsRepo.findById(variantId);
    if (!v) {
      throw new VariantNotFoundException();
    }
  }

  private async resolveLocationId(
    warehouseId: string,
    line: InboundLineInputDto,
  ): Promise<string> {
    const wh = await this.warehousesRepo.findById(warehouseId);
    if (!wh) {
      throw new WarehouseNotFoundException();
    }
    const locId = line.locationId ?? wh.defaultLocationId;
    if (!locId) {
      throw new InboundMissingLocationException();
    }
    const loc = await this.locationsRepo.findByIdAndWarehouseId(
      locId,
      warehouseId,
    );
    if (!loc) {
      throw new LocationNotFoundException();
    }
    if (loc.type !== LocationType.BIN) {
      throw new OnlyBinForStockException();
    }
    return locId;
  }

  private validateLineInputs(lines: InboundLineInputDto[]): void {
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

  async create(dto: CreateInboundDto): Promise<InboundDocumentResponseDto> {
    await this.loadSupplierForInbound(dto.supplierId);
    await this.loadWarehouseForInbound(dto.warehouseId);

    const documentNo = dto.documentNo?.trim() ?? this.genDocumentNo();
    if (await this.inboundDocumentsRepo.existsByDocumentNo(documentNo)) {
      throw new InboundDocumentNoDuplicateException();
    }

    const documentDate =
      dto.documentDate ?? new Date().toISOString().slice(0, 10);

    const doc = await this.inboundDocumentsRepo.createAndSave({
      documentNo,
      documentDate,
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId,
      status: InboundDocumentStatus.DRAFT,
      notes: dto.notes ?? null,
    });

    const full = await this.inboundDocumentsRepo.findByIdWithLines(doc.id);
    return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async list(
    query: ListInboundQueryDto,
  ): Promise<ListResponseDto<InboundDocumentResponseDto>> {
    query.normalize();
    const res = await this.inboundDocumentsRepo.findManyWithFilters(query);
    const data = res.data.map((d) =>
      InboundDocumentResponseDto.fromEntity(d, { includeLines: false }),
    );
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(id: string): Promise<InboundDocumentResponseDto> {
    const doc = await this.inboundDocumentsRepo.findByIdWithLines(id);
    if (!doc) {
      throw new InboundNotFoundException();
    }
    return InboundDocumentResponseDto.fromEntity(doc, { includeLines: true });
  }

  async update(
    id: string,
    dto: UpdateInboundDto,
  ): Promise<InboundDocumentResponseDto> {
    const doc = await this.inboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new InboundNotFoundException();
    }
    this.assertNotCompleted(doc.status as InboundDocumentStatus);

    if (dto.supplierId && dto.supplierId !== doc.supplierId) {
      await this.loadSupplierForInbound(dto.supplierId);
    }
    if (dto.warehouseId && dto.warehouseId !== doc.warehouseId) {
      await this.loadWarehouseForInbound(dto.warehouseId);
    }

    if (dto.documentNo !== undefined && dto.documentNo.trim() !== doc.documentNo) {
      if (
        await this.inboundDocumentsRepo.existsByDocumentNo(
          dto.documentNo.trim(),
          doc.id,
        )
      ) {
        throw new InboundDocumentNoDuplicateException();
      }
    }

    if (dto.supplierId) doc.supplierId = dto.supplierId;
    if (dto.warehouseId) doc.warehouseId = dto.warehouseId;
    if (dto.documentNo !== undefined) {
      doc.documentNo = dto.documentNo.trim();
    }
    if (dto.documentDate !== undefined) {
      doc.documentDate = dto.documentDate;
    }
    if (dto.notes !== undefined) doc.notes = dto.notes;

    await this.inboundDocumentsRepo.save(doc);

    const full = await this.inboundDocumentsRepo.findByIdWithLines(doc.id);
    return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async replaceLines(
    id: string,
    dto: ReplaceInboundLinesDto,
  ): Promise<InboundDocumentResponseDto> {
    const doc = await this.inboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new InboundNotFoundException();
    }
    this.assertDraftForLines(doc.status as InboundDocumentStatus);

    this.validateLineInputs(dto.lines);

    const warehouseId = doc.warehouseId;
    const rows: Partial<InboundLine>[] = [];

    for (const line of dto.lines) {
      await this.assertVariantOk(line.variantId);
      const locationId = await this.resolveLocationId(warehouseId, line);
      const qty = parseFloat(line.quantity);
      rows.push({
        inboundDocumentId: doc.id,
        lineNo: line.lineNo,
        variantId: line.variantId,
        quantity: formatQty(qty),
        unitPrice:
          line.unitPrice != null && line.unitPrice !== ''
            ? formatQty(parseFloat(line.unitPrice))
            : null,
        locationId,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      await this.inboundLinesRepo.deleteByInboundDocumentId(manager, doc.id);
      for (const row of rows) {
        await manager.save(InboundLine, row);
      }
    });

    const full = await this.inboundDocumentsRepo.findByIdWithLines(doc.id);
    return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async confirm(id: string): Promise<InboundDocumentResponseDto> {
    const doc = await this.inboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new InboundNotFoundException();
    }
    if (doc.status === InboundDocumentStatus.COMPLETED) {
      throw new InboundInvalidStatusException();
    }
    if (doc.status === InboundDocumentStatus.CONFIRMED) {
      const full = await this.inboundDocumentsRepo.findByIdWithLines(doc.id);
      return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
    }
    if (doc.status !== InboundDocumentStatus.DRAFT) {
      throw new InboundInvalidStatusException();
    }
    doc.status = InboundDocumentStatus.CONFIRMED;
    await this.inboundDocumentsRepo.save(doc);
    const full = await this.inboundDocumentsRepo.findByIdWithLines(doc.id);
    return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async complete(id: string): Promise<InboundDocumentResponseDto> {
    const existing = await this.inboundDocumentsRepo.findByIdWithLines(id);
    if (!existing) {
      throw new InboundNotFoundException();
    }
    if (existing.status === InboundDocumentStatus.COMPLETED) {
      return InboundDocumentResponseDto.fromEntity(existing, {
        includeLines: true,
      });
    }
    if (
      existing.status !== InboundDocumentStatus.DRAFT &&
      existing.status !== InboundDocumentStatus.CONFIRMED
    ) {
      throw new InboundInvalidStatusException();
    }
    if (!existing.lines?.length) {
      throw new InboundNoLinesException();
    }

    await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const doc = await manager
        .getRepository(InboundDocument)
        .createQueryBuilder('d')
        .where('d.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!doc) {
        throw new InboundNotFoundException();
      }
      if (doc.status === InboundDocumentStatus.COMPLETED) {
        return;
      }
      if (
        doc.status !== InboundDocumentStatus.DRAFT &&
        doc.status !== InboundDocumentStatus.CONFIRMED
      ) {
        throw new InboundInvalidStatusException();
      }

      const lines = await manager.find(InboundLine, {
        where: { inboundDocumentId: id },
      });
      if (!lines.length) {
        throw new InboundNoLinesException();
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
            quantityDelta: formatQty(qty),
            movementType: InventoryMovementType.INBOUND_RECEIPT,
            referenceType: InventoryReferenceType.INBOUND,
            referenceId: doc.id,
            referenceLineId: line.id,
          },
          manager,
        );
      }

      doc.status = InboundDocumentStatus.COMPLETED;
      await manager.save(doc);
    });

    const full = await this.inboundDocumentsRepo.findByIdWithLines(id);
    return InboundDocumentResponseDto.fromEntity(full!, { includeLines: true });
  }

  async remove(id: string): Promise<void> {
    const doc = await this.inboundDocumentsRepo.findById(id);
    if (!doc) {
      throw new InboundNotFoundException();
    }
    this.assertDraftForLines(doc.status as InboundDocumentStatus);

    await this.dataSource.transaction(async (manager) => {
      await this.inboundLinesRepo.softDeleteByInboundDocumentId(manager, id);
      await manager.softDelete(InboundDocument, { id });
    });
  }
}
