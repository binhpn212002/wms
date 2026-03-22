import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Not, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';

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

  async getSortedAttributeValueIdsForVariant(
    variantId: string,
  ): Promise<string[]> {
    const rows = await this.mapRepo.find({
      where: { variantId },
      order: { attributeValueId: 'ASC' },
    });
    return rows.map((r) => r.attributeValueId);
  }

  async findVariantIdsByProductId(productId: string): Promise<string[]> {
    const rows = await this.repository.find({
      where: { productId },
      select: ['id'],
    });
    return rows.map((r) => r.id);
  }

  async replaceAttributeMaps(
    variantId: string,
    attributeValueIds: string[],
  ): Promise<void> {
    await this.mapRepo.delete({ variantId });
    if (attributeValueIds.length === 0) {
      return;
    }
    await this.mapRepo.insert(
      attributeValueIds.map((attributeValueId) => ({
        variantId,
        attributeValueId,
      })),
    );
  }

  async findByProductIds(productIds: string[]): Promise<ProductVariant[]> {
    if (productIds.length === 0) {
      return [];
    }
    return this.repository.find({
      where: { productId: In(productIds) },
      order: { sku: 'ASC' },
    });
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async softDeleteByProductId(productId: string): Promise<void> {
    await this.repository.softDelete({ productId });
  }
}
