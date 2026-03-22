import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from 'src/common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Product } from '../../../database/entities/product.entity';
import {
  ListProductsQueryDto,
  ProductSortField,
} from '../dto/list-products-query.dto';

@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Product> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async findByIdWithDetails(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
      relations: [
        'category',
        'defaultUom',
        'variants',
        'variants.attributeValueMaps',
        'variants.attributeValueMaps.attributeValue',
        'variants.attributeValueMaps.attributeValue.attribute',
      ],
    });
  }

  async findManyWithFilters(
    query: ListProductsQueryDto,
  ): Promise<ListResponseDto<Product>> {
    query.normalize();
    const qb = this.createQueryBuilder('p');
    qb.leftJoinAndSelect('p.category', 'category');
    qb.leftJoinAndSelect('p.defaultUom', 'defaultUom');
    if (query.includeDeleted) {
      qb.withDeleted();
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(p.code) LIKE LOWER(:q) OR LOWER(p.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', {
        categoryId: query.categoryId,
      });
    }
    if (query.active !== undefined) {
      qb.andWhere('p.active = :active', { active: query.active });
    }
    const sortBy = query.sortBy ?? ProductSortField.NAME;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === ProductSortField.CODE
        ? 'p.code'
        : sortBy === ProductSortField.CREATED_AT
          ? 'p.createdAt'
          : 'p.name';
    qb.orderBy(col, dir);
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    return this.repository.count({ where: { categoryId } });
  }

  async countByDefaultUomId(defaultUomId: string): Promise<number> {
    return this.repository.count({ where: { defaultUomId } });
  }
}
