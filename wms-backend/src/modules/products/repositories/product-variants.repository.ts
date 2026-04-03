import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { ListProductVariantsQueryDto } from '../dto/list-product-variants-query.dto';

@Injectable()
export class ProductVariantsRepository extends BaseRepository<ProductVariant> {
  constructor(
    @InjectRepository(ProductVariant)
    repository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantAttributeValue)
    private readonly mapRepo: Repository<ProductVariantAttributeValue>,
  ) {
    super(repository);
  }

  findByIdAndProductId(
    variantId: string,
    productId: string,
    options?: { withDeleted?: boolean },
  ): Promise<ProductVariant | null> {
    return this.repository.findOne({
      where: { id: variantId, productId },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveBySku(sku: string, excludeVariantId?: string): Promise<boolean> {
    const where: FindOptionsWhere<ProductVariant> = excludeVariantId
      ? { sku, id: Not(excludeVariantId) }
      : { sku };
    return this.repository.existsBy(where);
  }

  existsActiveByBarcode(
    barcode: string,
    excludeVariantId?: string,
  ): Promise<boolean> {
    const where: FindOptionsWhere<ProductVariant> = excludeVariantId
      ? { barcode, id: Not(excludeVariantId) }
      : { barcode };
    return this.repository.existsBy(where);
  }

  async replaceAttributeMap(
    variantId: string,
    valueId: string | null,
  ): Promise<void> {
    await this.mapRepo.delete({ variantId });
    if (valueId) {
      await this.mapRepo.insert({ variantId, attributeValueId: valueId });
    }
  }

  async findByProductIds(productIds: string[]): Promise<ProductVariant[]> {
    if (productIds.length === 0) {
      return [];
    }
    return this.repository.find({
      where: { productId: In(productIds) },
      order: { sku: 'ASC' },
      relations: [
        'attributeValueMaps',
        'attributeValueMaps.attributeValue',
        'attributeValueMaps.attributeValue.attribute',
      ],
    });
  }

  async findManyByProductId(
    productId: string,
    query: ListProductVariantsQueryDto,
  ): Promise<ListResponseDto<ProductVariant>> {
    query.normalize();
    const qb = this.repository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.attributeValueMaps', 'm')
      .leftJoinAndSelect('m.attributeValue', 'av')
      .leftJoinAndSelect('av.attribute', 'attr')
      .where('v.product_id = :productId', { productId });

    if (query.includeDeleted) {
      qb.withDeleted();
    }

    if (query.active !== undefined) {
      qb.andWhere('v.active = :active', { active: query.active });
    }

    if (query.q) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('v.sku ILIKE :q', { q: `%${query.q}%` }).orWhere(
            'v.barcode ILIKE :q',
            { q: `%${query.q}%` },
          );
        }),
      );
    }

    qb.orderBy('v.sku', 'ASC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async findManyLookup(
    query: ListProductVariantsQueryDto,
  ): Promise<ListResponseDto<ProductVariant>> {
    query.normalize();
    const qb = this.repository
      .createQueryBuilder('v')
      .innerJoinAndSelect('v.product', 'p')
      .leftJoinAndSelect('v.attributeValueMaps', 'm')
      .leftJoinAndSelect('m.attributeValue', 'av')
      .leftJoinAndSelect('av.attribute', 'attr');

    if (query.includeDeleted) {
      qb.withDeleted();
    }

    if (query.productId) {
      qb.andWhere('v.product_id = :productId', { productId: query.productId });
    }

    if (query.active !== undefined) {
      qb.andWhere('v.active = :active', { active: query.active });
    }

    if (query.q) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('v.sku ILIKE :q', { q: `%${query.q}%` }).orWhere(
            'v.barcode ILIKE :q',
            { q: `%${query.q}%` },
          );
        }),
      );
    }

    qb.orderBy('v.sku', 'ASC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  /** Variant khác (cùng product) đang giữ valueId này. */
  async findVariantIdHoldingValueOnProduct(
    productId: string,
    valueId: string,
    excludeVariantId?: string,
  ): Promise<string | null> {
    const qb = this.repository
      .createQueryBuilder('v')
      .innerJoin('v.attributeValueMaps', 'm')
      .where('v.product_id = :productId', { productId })
      .andWhere('m.attribute_value_id = :valueId', { valueId });
    if (excludeVariantId) {
      qb.andWhere('v.id != :excludeVariantId', { excludeVariantId });
    }
    const row = await qb.getOne();
    return row?.id ?? null;
  }

  /** Tìm một variant “default” (không có dòng map) khác excludeVariantId. */
  async findFirstDefaultVariantId(
    productId: string,
    excludeVariantId?: string,
  ): Promise<string | null> {
    const qb = this.repository
      .createQueryBuilder('v')
      .where('v.product_id = :productId', { productId })
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM product_variant_attribute_values m WHERE m.variant_id = v.id)',
      );
    if (excludeVariantId) {
      qb.andWhere('v.id != :excludeVariantId', { excludeVariantId });
    }
    const row = await qb.getOne();
    return row?.id ?? null;
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async softDeleteByProductId(productId: string): Promise<void> {
    await this.repository.softDelete({ productId });
  }
}
