import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Product } from '../../../database/entities/product.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { StockBalance } from '../../../database/entities/stock-balance.entity';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import { BalanceSortField, ListBalancesQueryDto } from '../dto/list-balances-query.dto';
import { SummaryQueryDto } from '../dto/summary-query.dto';
import {
  SummaryByProductItemDto,
  SummaryByWarehouseItemDto,
} from '../dto/summary-response.dto';

@Injectable()
export class StockBalancesRepository extends BaseRepository<StockBalance> {
  constructor(
    @InjectRepository(StockBalance)
    repository: Repository<StockBalance>,
  ) {
    super(repository);
  }

  /** Join stock_balances → variant, product, warehouse (chỉ bản ghi chưa xóa mềm). */
  private baseBalancesQuery(
    query: SummaryQueryDto,
  ): SelectQueryBuilder<StockBalance> {
    const qb = this.repository
      .createQueryBuilder('sb')
      .innerJoin(
        ProductVariant,
        'v',
        'v.id = sb.variant_id AND v.deleted_at IS NULL',
      )
      .innerJoin(Product, 'p', 'p.id = v.product_id AND p.deleted_at IS NULL')
      .innerJoin(
        Warehouse,
        'w',
        'w.id = sb.warehouse_id AND w.deleted_at IS NULL',
      );

    if (query.warehouseId) {
      qb.andWhere('sb.warehouse_id = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.productId) {
      qb.andWhere('v.product_id = :productId', { productId: query.productId });
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
      .where('v.deleted_at IS NULL')
      .andWhere('p.deleted_at IS NULL')
      .andWhere('w.deleted_at IS NULL');

    if (query.warehouseId) {
      qb.andWhere('sb.warehouse_id = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.locationId) {
      qb.andWhere('sb.location_id = :locationId', {
        locationId: query.locationId,
      });
    }
    if (query.variantId) {
      qb.andWhere('sb.variant_id = :variantId', {
        variantId: query.variantId,
      });
    }
    if (query.productId) {
      qb.andWhere('v.product_id = :productId', { productId: query.productId });
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
      qb.orderBy('sb.updated_at', order === SortOrder.ASC ? 'ASC' : 'DESC');
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
}
