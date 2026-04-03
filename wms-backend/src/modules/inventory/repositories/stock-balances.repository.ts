import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Location } from '../../../database/entities/location.entity';
import { Product } from '../../../database/entities/product.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { StockBalance } from '../../../database/entities/stock-balance.entity';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import {
  BalanceSortField,
  ListBalancesQueryDto,
} from '../dto/list-balances-query.dto';
import { SummaryQueryDto } from '../dto/summary-query.dto';
import {
  SummaryByProductItemDto,
  SummaryByWarehouseItemDto,
} from '../dto/summary-response.dto';

export interface InventoryCheckVariantRow {
  variantId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  productCode: string;
  productName: string;
  defaultUomId: string;
}

export interface InventoryCheckSummaryAggregateRow {
  variantId: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: string;
}

export interface InventoryCheckDetailLineRow {
  variantId: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  locationId: string;
  locationCode: string;
  locationName: string | null;
  quantity: string;
  balanceUpdatedAt: Date;
}

@Injectable()
export class StockBalancesRepository extends BaseRepository<StockBalance> {
  constructor(
    @InjectRepository(StockBalance)
    repository: Repository<StockBalance>,
  ) {
    super(repository);
  }

  private baseBalancesQuery(
    query: SummaryQueryDto,
  ): SelectQueryBuilder<StockBalance> {
    const qb = this.repository
      .createQueryBuilder('sb')
      .innerJoin(
        ProductVariant,
        'v',
        'v.id = sb.variantId AND v.deletedAt IS NULL',
      )
      .innerJoin(Product, 'p', 'p.id = v.productId AND p.deletedAt IS NULL')
      .innerJoin(
        Warehouse,
        'w',
        'w.id = sb.warehouseId AND w.deletedAt IS NULL',
      );

    if (query.warehouseId) {
      qb.andWhere('sb.warehouseId = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.productId) {
      qb.andWhere('v.productId = :productId', { productId: query.productId });
    }
    return qb;
  }

  private async countGroupedRows(
    query: SummaryQueryDto,
    mode: 'by-product' | 'by-warehouse',
  ): Promise<number> {
    const qb = this.baseBalancesQuery(query);
    if (mode === 'by-product') {
      qb.select('p.id', 'pid')
        .addSelect('v.id', 'vid')
        .groupBy('p.id')
        .addGroupBy('v.id');
    } else {
      qb.select('w.id', 'wid')
        .addSelect('v.id', 'vid')
        .groupBy('w.id')
        .addGroupBy('v.id');
    }
    const innerSql = qb.getQuery();
    const params = qb.getParameters();
    const row = await this.repository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'cnt')
      .from(`(${innerSql})`, 'sub')
      .setParameters(params)
      .getRawOne();
    return parseInt(String(row?.cnt ?? 0), 10);
  }

  async findManyWithFilters(
    query: ListBalancesQueryDto,
  ): Promise<ListResponseDto<StockBalance>> {
    query.normalize();
    const qb = this.repository
      .createQueryBuilder('sb')
      .innerJoinAndSelect('sb.warehouse', 'w')
      .innerJoinAndSelect('sb.location', 'loc')
      .innerJoinAndSelect('sb.variant', 'v')
      .innerJoinAndSelect('v.product', 'p')
      .where('v.deletedAt IS NULL')
      .andWhere('p.deletedAt IS NULL')
      .andWhere('w.deletedAt IS NULL');

    if (query.warehouseId) {
      qb.andWhere('sb.warehouseId = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.locationId) {
      qb.andWhere('sb.locationId = :locationId', {
        locationId: query.locationId,
      });
    }
    if (query.variantId) {
      qb.andWhere('sb.variantId = :variantId', {
        variantId: query.variantId,
      });
    }
    if (query.productId) {
      qb.andWhere('v.productId = :productId', { productId: query.productId });
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(v.sku) LIKE LOWER(:q) OR LOWER(p.code) LIKE LOWER(:q) OR LOWER(p.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }

    const sortBy = query.sortBy ?? BalanceSortField.UPDATED_AT;
    const order = query.sortOrder ?? SortOrder.DESC;
    if (sortBy === BalanceSortField.SKU) {
      qb.orderBy('v.sku', order === SortOrder.ASC ? 'ASC' : 'DESC');
    } else if (sortBy === BalanceSortField.QUANTITY) {
      qb.orderBy('sb.quantity', order === SortOrder.ASC ? 'ASC' : 'DESC');
    } else {
      qb.orderBy('sb.updatedAt', order === SortOrder.ASC ? 'ASC' : 'DESC');
    }

    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async summaryByProduct(
    query: SummaryQueryDto,
  ): Promise<ListResponseDto<SummaryByProductItemDto>> {
    query.normalize();
    const total = await this.countGroupedRows(query, 'by-product');

    const qb = this.baseBalancesQuery(query)
      .select('p.id', 'productId')
      .addSelect('p.code', 'productCode')
      .addSelect('p.name', 'productName')
      .addSelect('v.id', 'variantId')
      .addSelect('v.sku', 'sku')
      .addSelect('SUM(sb.quantity)', 'quantity')
      .groupBy('p.id')
      .addGroupBy('p.code')
      .addGroupBy('p.name')
      .addGroupBy('v.id')
      .addGroupBy('v.sku')
      .orderBy('p.code', 'ASC')
      .addOrderBy('v.sku', 'ASC')
      .offset(query.skip)
      .limit(query.limit);

    const raw = await qb.getRawMany();

    const items: SummaryByProductItemDto[] = raw.map((r) => ({
      productId: r.productId,
      productCode: r.productCode,
      productName: r.productName,
      variantId: r.variantId,
      sku: r.sku,
      quantity: String(r.quantity ?? '0'),
    }));

    return ListResponseDto.create(items, total, query.page, query.limit);
  }

  async summaryByWarehouse(
    query: SummaryQueryDto,
  ): Promise<ListResponseDto<SummaryByWarehouseItemDto>> {
    query.normalize();
    const total = await this.countGroupedRows(query, 'by-warehouse');

    const qb = this.baseBalancesQuery(query)
      .select('w.id', 'warehouseId')
      .addSelect('w.code', 'warehouseCode')
      .addSelect('w.name', 'warehouseName')
      .addSelect('v.id', 'variantId')
      .addSelect('v.sku', 'sku')
      .addSelect('SUM(sb.quantity)', 'quantity')
      .groupBy('w.id')
      .addGroupBy('w.code')
      .addGroupBy('w.name')
      .addGroupBy('v.id')
      .addGroupBy('v.sku')
      .orderBy('w.code', 'ASC')
      .addOrderBy('v.sku', 'ASC')
      .offset(query.skip)
      .limit(query.limit);

    const raw = await qb.getRawMany();

    const items: SummaryByWarehouseItemDto[] = raw.map((r) => ({
      warehouseId: r.warehouseId,
      warehouseCode: r.warehouseCode,
      warehouseName: r.warehouseName,
      variantId: r.variantId,
      sku: r.sku,
      quantity: String(r.quantity ?? '0'),
    }));

    return ListResponseDto.create(items, total, query.page, query.limit);
  }

  /** Có ít nhất một dòng tồn > 0 tại ô. */
  existsPositiveQuantityAtLocation(locationId: string): Promise<boolean> {
    return this.repository
      .createQueryBuilder('sb')
      .where('sb.locationId = :locationId', { locationId })
      .andWhere('CAST(sb.quantity AS DECIMAL) > 0')
      .getExists();
  }

  /** Có tồn > 0 tại bất kỳ ô nào trong danh sách. */
  existsPositiveQuantityAtAnyLocations(
    locationIds: string[],
  ): Promise<boolean> {
    if (locationIds.length === 0) {
      return Promise.resolve(false);
    }
    return this.repository
      .createQueryBuilder('sb')
      .where('sb.locationId IN (:...ids)', { ids: locationIds })
      .andWhere('CAST(sb.quantity AS DECIMAL) > 0')
      .getExists();
  }

  /** Có tồn > 0 tại bất kỳ ô nào trong kho. */
  existsPositiveQuantityInWarehouse(warehouseId: string): Promise<boolean> {
    return this.repository
      .createQueryBuilder('sb')
      .where('sb.warehouseId = :warehouseId', { warehouseId })
      .andWhere('CAST(sb.quantity AS DECIMAL) > 0')
      .getExists();
  }

  /** Variant còn hiệu lực khớp SKU hoặc barcode (chính xác, có phân biệt hoa thường). */
  async findActiveVariantRowsBySkuOrBarcode(
    q: string,
  ): Promise<InventoryCheckVariantRow[]> {
    const raw = await this.repository.manager
      .createQueryBuilder(ProductVariant, 'v')
      .innerJoin(Product, 'p', 'p.id = v.productId AND p.deletedAt IS NULL')
      .where('v.deletedAt IS NULL')
      .andWhere(
        '(LOWER(v.sku) = LOWER(:q) OR (v.barcode IS NOT NULL AND LOWER(v.barcode) = LOWER(:q)))',
        { q },
      )
      .select('v.id', 'variantId')
      .addSelect('v.productId', 'productId')
      .addSelect('v.sku', 'sku')
      .addSelect('v.barcode', 'barcode')
      .addSelect('p.code', 'productCode')
      .addSelect('p.name', 'productName')
      .addSelect('p.defaultUomId', 'defaultUomId')
      .orderBy('v.sku', 'ASC')
      .getRawMany();

    return raw.map((r) => ({
      variantId: r.variantId,
      productId: r.productId,
      sku: r.sku,
      barcode: r.barcode ?? null,
      productCode: r.productCode,
      productName: r.productName,
      defaultUomId: r.defaultUomId,
    }));
  }

  async findActiveVariantRowById(
    variantId: string,
  ): Promise<InventoryCheckVariantRow | null> {
    const raw = await this.repository.manager
      .createQueryBuilder(ProductVariant, 'v')
      .innerJoin(Product, 'p', 'p.id = v.productId AND p.deletedAt IS NULL')
      .where('v.deletedAt IS NULL')
      .andWhere('v.id = :variantId', { variantId })
      .select('v.id', 'variantId')
      .addSelect('v.productId', 'productId')
      .addSelect('v.sku', 'sku')
      .addSelect('v.barcode', 'barcode')
      .addSelect('p.code', 'productCode')
      .addSelect('p.name', 'productName')
      .addSelect('p.defaultUomId', 'defaultUomId')
      .getRawOne();

    if (!raw) {
      return null;
    }
    return {
      variantId: raw.variantId,
      productId: raw.productId,
      sku: raw.sku,
      barcode: raw.barcode ?? null,
      productCode: raw.productCode,
      productName: raw.productName,
      defaultUomId: raw.defaultUomId,
    };
  }

  /** Tổng tồn theo variant + kho (để breakdown). */
  async listInventoryCheckSummaryAggregates(
    variantIds: string[],
    warehouseId?: string,
    locationId?: string,
  ): Promise<InventoryCheckSummaryAggregateRow[]> {
    if (variantIds.length === 0) {
      return [];
    }
    const qb = this.repository
      .createQueryBuilder('sb')
      .innerJoin(
        Warehouse,
        'w',
        'w.id = sb.warehouseId AND w.deletedAt IS NULL',
      )
      .innerJoin(
        Location,
        'loc',
        'loc.id = sb.locationId AND loc.deletedAt IS NULL',
      )
      .where('sb.variantId IN (:...variantIds)', { variantIds });

    if (warehouseId) {
      qb.andWhere('sb.warehouseId = :warehouseId', { warehouseId });
    }
    if (locationId) {
      qb.andWhere('sb.locationId = :locationId', { locationId });
    }

    qb.select('sb.variantId', 'variantId')
      .addSelect('sb.warehouseId', 'warehouseId')
      .addSelect('w.code', 'warehouseCode')
      .addSelect('w.name', 'warehouseName')
      .addSelect('SUM(sb.quantity)', 'quantity')
      .groupBy('sb.variantId')
      .addGroupBy('sb.warehouseId')
      .addGroupBy('w.code')
      .addGroupBy('w.name')
      .orderBy('sb.variantId', 'ASC')
      .addOrderBy('w.code', 'ASC');

    const raw = await qb.getRawMany();
    return raw.map((r) => ({
      variantId: r.variantId,
      warehouseId: r.warehouseId,
      warehouseCode: r.warehouseCode,
      warehouseName: r.warehouseName,
      quantity: String(r.quantity ?? '0'),
    }));
  }

  async listInventoryCheckDetailLines(
    variantIds: string[],
    warehouseId?: string,
    locationId?: string,
  ): Promise<InventoryCheckDetailLineRow[]> {
    if (variantIds.length === 0) {
      return [];
    }
    const qb = this.repository
      .createQueryBuilder('sb')
      .innerJoin(
        Warehouse,
        'w',
        'w.id = sb.warehouseId AND w.deletedAt IS NULL',
      )
      .innerJoin(
        Location,
        'loc',
        'loc.id = sb.locationId AND loc.deletedAt IS NULL',
      )
      .where('sb.variantId IN (:...variantIds)', { variantIds })
      .andWhere('CAST(sb.quantity AS DECIMAL) > 0');

    if (warehouseId) {
      qb.andWhere('sb.warehouseId = :warehouseId', { warehouseId });
    }
    if (locationId) {
      qb.andWhere('sb.locationId = :locationId', { locationId });
    }

    qb.select('sb.variantId', 'variantId')
      .addSelect('sb.warehouseId', 'warehouseId')
      .addSelect('w.code', 'warehouseCode')
      .addSelect('w.name', 'warehouseName')
      .addSelect('sb.locationId', 'locationId')
      .addSelect('loc.code', 'locationCode')
      .addSelect('loc.name', 'locationName')
      .addSelect('sb.quantity', 'quantity')
      .addSelect('sb.updatedAt', 'balanceUpdatedAt')
      .orderBy('sb.variantId', 'ASC')
      .addOrderBy('w.code', 'ASC')
      .addOrderBy('loc.code', 'ASC');

    const raw = await qb.getRawMany();
    return raw.map((r) => ({
      variantId: r.variantId,
      warehouseId: r.warehouseId,
      warehouseCode: r.warehouseCode,
      warehouseName: r.warehouseName,
      locationId: r.locationId,
      locationCode: r.locationCode,
      locationName: r.locationName ?? null,
      quantity: String(r.quantity ?? '0'),
      balanceUpdatedAt: r.balanceUpdatedAt,
    }));
  }
}
