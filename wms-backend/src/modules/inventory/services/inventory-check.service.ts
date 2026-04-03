import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LocationNotFoundException,
  LocationWarehouseMismatchException,
  WarehouseNotFoundException,
} from '../../../common/exceptions/inventory.exceptions';
import { VariantNotFoundException } from '../../../common/exceptions/product.exceptions';
import { Location } from '../../../database/entities/location.entity';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import {
  InventoryCheckLookupQueryDto,
  InventoryCheckMode,
  InventoryCheckVariantQueryDto,
} from '../dto/inventory-check-query.dto';
import {
  InventoryCheckDetailLineRow,
  InventoryCheckSummaryAggregateRow,
  InventoryCheckVariantRow,
  StockBalancesRepository,
} from '../repositories/stock-balances.repository';

function toQty(v: string | number | null | undefined): number {
  if (v == null) {
    return 0;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export type InventoryCheckLineResponse = {
  warehouseId: string;
  warehouse: { id: string; code: string; name: string };
  locationId: string;
  location: { id: string; code: string; name: string | null };
  quantity: number;
  balanceUpdatedAt: string;
};

export type InventoryCheckBreakdownWarehouse = {
  warehouseId: string;
  code: string;
  name: string;
  quantity: number;
};

export type InventoryCheckItemResponse = {
  variantId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  product: { id: string; code: string; name: string };
  defaultUomId: string;
  quantity: number;
  breakdownByWarehouse?: InventoryCheckBreakdownWarehouse[];
  lines?: InventoryCheckLineResponse[];
};

export type InventoryCheckLookupResponse = {
  items: InventoryCheckItemResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
};

@Injectable()
export class InventoryCheckService {
  constructor(
    private readonly stockBalancesRepo: StockBalancesRepository,
    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  /**
   * Chuẩn hóa filter kho/vị trí; chỉ `locationId` → lọc theo warehouse của vị trí.
   */
  private async resolveStockFilters(
    warehouseId?: string,
    locationId?: string,
  ): Promise<{ warehouseId?: string; locationId?: string }> {
    if (locationId) {
      const loc = await this.locationRepo.findOne({ where: { id: locationId } });
      if (!loc || loc.deletedAt) {
        throw new LocationNotFoundException();
      }
      if (warehouseId && loc.warehouseId !== warehouseId) {
        throw new LocationWarehouseMismatchException();
      }
      const whId = warehouseId ?? loc.warehouseId;
      const w = await this.warehouseRepo.findOne({ where: { id: whId } });
      if (!w || w.deletedAt) {
        throw new WarehouseNotFoundException();
      }
      return { warehouseId: whId, locationId };
    }
    if (warehouseId) {
      const w = await this.warehouseRepo.findOne({
        where: { id: warehouseId },
      });
      if (!w || w.deletedAt) {
        throw new WarehouseNotFoundException();
      }
      return { warehouseId };
    }
    return {};
  }

  private buildProduct(row: InventoryCheckVariantRow) {
    return {
      id: row.productId,
      code: row.productCode,
      name: row.productName,
    };
  }

  private breakdownFromAggregates(
    rows: InventoryCheckSummaryAggregateRow[],
    variantId: string,
  ): InventoryCheckBreakdownWarehouse[] {
    return rows
      .filter((r) => r.variantId === variantId)
      .map((r) => ({
        warehouseId: r.warehouseId,
        code: r.warehouseCode,
        name: r.warehouseName,
        quantity: toQty(r.quantity),
      }));
  }

  private linesFromDetailRows(
    rows: InventoryCheckDetailLineRow[],
    variantId: string,
  ): InventoryCheckLineResponse[] {
    return rows
      .filter((r) => r.variantId === variantId)
      .map((r) => ({
        warehouseId: r.warehouseId,
        warehouse: {
          id: r.warehouseId,
          code: r.warehouseCode,
          name: r.warehouseName,
        },
        locationId: r.locationId,
        location: {
          id: r.locationId,
          code: r.locationCode,
          name: r.locationName,
        },
        quantity: toQty(r.quantity),
        balanceUpdatedAt:
          r.balanceUpdatedAt instanceof Date
            ? r.balanceUpdatedAt.toISOString()
            : String(r.balanceUpdatedAt),
      }));
  }

  private buildSummaryItem(
    row: InventoryCheckVariantRow,
    aggregates: InventoryCheckSummaryAggregateRow[],
  ): InventoryCheckItemResponse {
    const breakdown = this.breakdownFromAggregates(aggregates, row.variantId);
    const quantity = breakdown.reduce((s, b) => s + b.quantity, 0);
    return {
      variantId: row.variantId,
      productId: row.productId,
      sku: row.sku,
      barcode: row.barcode,
      product: this.buildProduct(row),
      defaultUomId: row.defaultUomId,
      quantity,
      breakdownByWarehouse: breakdown,
    };
  }

  private buildDetailsItem(
    row: InventoryCheckVariantRow,
    detailRows: InventoryCheckDetailLineRow[],
  ): InventoryCheckItemResponse {
    const lines = this.linesFromDetailRows(detailRows, row.variantId);
    const quantity = lines.reduce((s, l) => s + l.quantity, 0);
    return {
      variantId: row.variantId,
      productId: row.productId,
      sku: row.sku,
      barcode: row.barcode,
      product: this.buildProduct(row),
      defaultUomId: row.defaultUomId,
      quantity,
      lines,
    };
  }

  async lookup(
    query: InventoryCheckLookupQueryDto,
  ): Promise<InventoryCheckLookupResponse> {
    const filters = await this.resolveStockFilters(
      query.warehouseId,
      query.locationId,
    );

    const variantRows =
      await this.stockBalancesRepo.findActiveVariantRowsBySkuOrBarcode(query.q);
    const totalItems = variantRows.length;
    const start = (query.page - 1) * query.pageSize;
    const pageRows = variantRows.slice(start, start + query.pageSize);
    const pageVariantIds = pageRows.map((r) => r.variantId);

    if (pageVariantIds.length === 0) {
      return {
        items: [],
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
      };
    }

    if (query.mode === InventoryCheckMode.SUMMARY) {
      const aggregates =
        await this.stockBalancesRepo.listInventoryCheckSummaryAggregates(
          pageVariantIds,
          filters.warehouseId,
          filters.locationId,
        );
      const items = pageRows.map((r) =>
        this.buildSummaryItem(r, aggregates),
      );
      return {
        items,
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
      };
    }

    const detailRows =
      await this.stockBalancesRepo.listInventoryCheckDetailLines(
        pageVariantIds,
        filters.warehouseId,
        filters.locationId,
      );
    const items = pageRows.map((r) => this.buildDetailsItem(r, detailRows));
    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
    };
  }

  async getByVariantId(
    variantId: string,
    query: InventoryCheckVariantQueryDto,
  ): Promise<InventoryCheckItemResponse> {
    const filters = await this.resolveStockFilters(
      query.warehouseId,
      query.locationId,
    );

    const row =
      await this.stockBalancesRepo.findActiveVariantRowById(variantId);
    if (!row) {
      throw new VariantNotFoundException();
    }

    if (query.mode === InventoryCheckMode.SUMMARY) {
      const aggregates =
        await this.stockBalancesRepo.listInventoryCheckSummaryAggregates(
          [variantId],
          filters.warehouseId,
          filters.locationId,
        );
      return this.buildSummaryItem(row, aggregates);
    }

    const detailRows =
      await this.stockBalancesRepo.listInventoryCheckDetailLines(
        [variantId],
        filters.warehouseId,
        filters.locationId,
      );
    return this.buildDetailsItem(row, detailRows);
  }
}
