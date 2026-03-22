import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CategoryNotFoundException } from '../../../common/exceptions/category.exceptions';
import {
  ProductCodeDuplicateException,
  ProductNotFoundException,
  VariantAttributeInvalidException,
  VariantBarcodeDuplicateException,
  VariantComboDuplicateException,
  VariantInUseException,
  VariantNotFoundException,
  VariantSkuDuplicateException,
} from '../../../common/exceptions/product.exceptions';
import { UnitNotFoundException } from '../../../common/exceptions/unit.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { Product } from '../../../database/entities/product.entity';
import { Unit } from '../../../database/entities/unit.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { GetProductQueryDto } from '../dto/get-product-query.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductVariantResponseDto } from '../dto/product-variant-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly productVariantsRepo: ProductVariantsRepository,
    private readonly dataSource: DataSource,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepo: Repository<AttributeValue>,
  ) {}

  private comboKey(attributeValueIds: string[]): string {
    return [...attributeValueIds].sort().join(',');
  }

  /** Stub: thay bằng đếm tồn/chứng từ khi có module kho. */
  private async countStockRefsByVariantId(_variantId: string): Promise<number> {
    void _variantId;
    return 0;
  }

  private async assertCategoryAndUnit(
    categoryId: string,
    defaultUomId: string,
  ): Promise<void> {
    const cat = await this.categoryRepo.findOne({
      where: { id: categoryId },
      withDeleted: true,
    });
    if (!cat || cat.deletedAt) {
      throw new CategoryNotFoundException();
    }
    if (!cat.active) {
      throw new CategoryNotFoundException();
    }
    const unit = await this.unitRepo.findOne({
      where: { id: defaultUomId },
      withDeleted: true,
    });
    if (!unit || unit.deletedAt) {
      throw new UnitNotFoundException();
    }
    if (!unit.active) {
      throw new UnitNotFoundException();
    }
  }

  private async validateAttributeValueIds(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const uniq = [...new Set(ids)];
    if (uniq.length !== ids.length) {
      throw new VariantAttributeInvalidException();
    }
    const rows = await this.attributeValueRepo.find({
      where: { id: In(uniq) },
      relations: ['attribute'],
    });
    if (rows.length !== uniq.length) {
      throw new VariantAttributeInvalidException();
    }
    for (const r of rows) {
      if (r.deletedAt) {
        throw new VariantAttributeInvalidException();
      }
      if (!r.active) {
        throw new VariantAttributeInvalidException();
      }
    }
    const attrIds = rows.map((r) => r.attributeId);
    if (new Set(attrIds).size !== attrIds.length) {
      throw new VariantAttributeInvalidException();
    }
  }

  private async assertComboUniqueForProduct(
    productId: string,
    attributeValueIds: string[],
    excludeVariantId?: string | null,
  ): Promise<void> {
    const key = this.comboKey(attributeValueIds);
    const vids =
      await this.productVariantsRepo.findVariantIdsByProductId(productId);
    for (const vid of vids) {
      if (excludeVariantId && vid === excludeVariantId) {
        continue;
      }
      const existing =
        await this.productVariantsRepo.getSortedAttributeValueIdsForVariant(
          vid,
        );
      if (this.comboKey(existing) === key) {
        throw new VariantComboDuplicateException();
      }
    }
  }

  private assertIntraCreateComboUnique(
    variants: CreateProductVariantDto[],
  ): void {
    const seen = new Set<string>();
    for (const vd of variants) {
      const k = this.comboKey(vd.attributeValueIds ?? []);
      if (seen.has(k)) {
        throw new VariantComboDuplicateException();
      }
      seen.add(k);
    }
  }

  async list(
    query: ListProductsQueryDto,
  ): Promise<ListResponseDto<ProductResponseDto>> {
    const res = await this.productsRepo.findManyWithFilters(query);
    let variantByProduct = new Map<string, ProductVariant[]>();
    if (query.includeVariants && res.data.length > 0) {
      const pids = res.data.map((p) => p.id);
      const variants = await this.productVariantsRepo.findByProductIds(pids);
      variantByProduct = variants.reduce((m, v) => {
        if (v.deletedAt) {
          return m;
        }
        const arr = m.get(v.productId) ?? [];
        arr.push(v);
        m.set(v.productId, arr);
        return m;
      }, new Map<string, ProductVariant[]>());
    }
    const data = res.data.map((p) => {
      const opts = query.includeVariants
        ? {
            variants: (variantByProduct.get(p.id) ?? []).map((v) =>
              ProductVariantResponseDto.shallow(v),
            ),
          }
        : {};
      return ProductResponseDto.fromEntity(p, opts);
    });
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(
    id: string,
    query?: GetProductQueryDto,
  ): Promise<ProductResponseDto> {
    const includeDeleted = query?.includeDeleted === true;
    const entity = await this.productsRepo.findByIdWithDetails(id, {
      withDeleted: includeDeleted,
    });
    if (!entity) {
      throw new ProductNotFoundException();
    }
    if (!includeDeleted && entity.deletedAt) {
      throw new ProductNotFoundException();
    }
    const variants = (entity.variants ?? []).filter(
      (v) => includeDeleted || !v.deletedAt,
    );
    const variantDtos = variants.map((v) =>
      ProductVariantResponseDto.fromEntity(v, v.attributeValueMaps),
    );
    return ProductResponseDto.fromEntity(entity, { variants: variantDtos });
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const code = dto.code.trim().toUpperCase();
    await this.assertCategoryAndUnit(dto.categoryId, dto.defaultUomId);
    if (await this.productsRepo.existsActiveByCode(code)) {
      throw new ProductCodeDuplicateException();
    }
    this.assertIntraCreateComboUnique(dto.variants);
    for (const vd of dto.variants) {
      await this.validateAttributeValueIds(vd.attributeValueIds ?? []);
      if (await this.productVariantsRepo.existsActiveBySku(vd.sku)) {
        throw new VariantSkuDuplicateException();
      }
      if (vd.barcode) {
        if (await this.productVariantsRepo.existsActiveByBarcode(vd.barcode)) {
          throw new VariantBarcodeDuplicateException();
        }
      }
    }

    const newProductId = await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(ProductVariant);
      const mapRepo = manager.getRepository(ProductVariantAttributeValue);

      const product = productRepo.create({
        code,
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        defaultUomId: dto.defaultUomId,
        active: dto.active ?? true,
      });
      await productRepo.save(product);

      for (const vd of dto.variants) {
        const variant = variantRepo.create({
          productId: product.id,
          sku: vd.sku.trim().toUpperCase(),
          barcode: vd.barcode?.trim() ? vd.barcode.trim() : null,
        });
        await variantRepo.save(variant);
        const ids = vd.attributeValueIds ?? [];
        if (ids.length > 0) {
          await mapRepo.insert(
            ids.map((attributeValueId) => ({
              variantId: variant.id,
              attributeValueId,
            })),
          );
        }
      }

      return product.id;
    });

    return this.findOne(newProductId);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const entity = await this.productsRepo.findById(id);
    if (!entity) {
      throw new ProductNotFoundException();
    }
    if (dto.categoryId !== undefined || dto.defaultUomId !== undefined) {
      await this.assertCategoryAndUnit(
        dto.categoryId ?? entity.categoryId,
        dto.defaultUomId ?? entity.defaultUomId,
      );
    }
    if (dto.code !== undefined) {
      const next = dto.code.trim().toUpperCase();
      if (await this.productsRepo.existsActiveByCode(next, id)) {
        throw new ProductCodeDuplicateException();
      }
      entity.code = next;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name.trim();
    }
    if (dto.categoryId !== undefined) {
      entity.categoryId = dto.categoryId;
    }
    if (dto.defaultUomId !== undefined) {
      entity.defaultUomId = dto.defaultUomId;
    }
    if (dto.active !== undefined) {
      entity.active = dto.active;
    }
    await this.productsRepo.save(entity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.productsRepo.findById(id, { withDeleted: true });
    if (!entity) {
      throw new ProductNotFoundException();
    }
    if (entity.deletedAt) {
      return;
    }
    await this.productVariantsRepo.softDeleteByProductId(id);
    await this.productsRepo.softDeleteById(id);
  }

  async createVariant(
    productId: string,
    dto: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new ProductNotFoundException();
    }
    await this.validateAttributeValueIds(dto.attributeValueIds ?? []);
    await this.assertComboUniqueForProduct(
      productId,
      dto.attributeValueIds ?? [],
    );
    if (await this.productVariantsRepo.existsActiveBySku(dto.sku)) {
      throw new VariantSkuDuplicateException();
    }
    if (dto.barcode) {
      if (await this.productVariantsRepo.existsActiveByBarcode(dto.barcode)) {
        throw new VariantBarcodeDuplicateException();
      }
    }

    const variant = await this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const mapRepo = manager.getRepository(ProductVariantAttributeValue);
      const v = variantRepo.create({
        productId,
        sku: dto.sku.trim().toUpperCase(),
        barcode: dto.barcode?.trim() ? dto.barcode.trim() : null,
      });
      await variantRepo.save(v);
      const ids = dto.attributeValueIds ?? [];
      if (ids.length > 0) {
        await mapRepo.insert(
          ids.map((attributeValueId) => ({
            variantId: v.id,
            attributeValueId,
          })),
        );
      }
      return v;
    });

    const full = await this.productVariantsRepo.findOne({
      where: { id: variant.id },
      relations: [
        'attributeValueMaps',
        'attributeValueMaps.attributeValue',
        'attributeValueMaps.attributeValue.attribute',
      ],
    });
    if (!full) {
      throw new VariantNotFoundException();
    }
    return ProductVariantResponseDto.fromEntity(full, full.attributeValueMaps);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.productVariantsRepo.findByIdAndProductId(
      variantId,
      productId,
    );
    if (!variant) {
      throw new VariantNotFoundException();
    }
    if (dto.sku !== undefined) {
      const next = dto.sku.trim().toUpperCase();
      if (await this.productVariantsRepo.existsActiveBySku(next, variantId)) {
        throw new VariantSkuDuplicateException();
      }
      variant.sku = next;
    }
    if (dto.barcode !== undefined) {
      const b =
        dto.barcode === null || dto.barcode === ''
          ? null
          : String(dto.barcode).trim();
      if (
        b &&
        (await this.productVariantsRepo.existsActiveByBarcode(b, variantId))
      ) {
        throw new VariantBarcodeDuplicateException();
      }
      variant.barcode = b;
    }
    if (dto.attributeValueIds !== undefined) {
      await this.validateAttributeValueIds(dto.attributeValueIds);
      await this.assertComboUniqueForProduct(
        productId,
        dto.attributeValueIds,
        variantId,
      );
      await this.productVariantsRepo.replaceAttributeMaps(
        variantId,
        dto.attributeValueIds,
      );
    }
    await this.productVariantsRepo.save(variant);
    const full = await this.productVariantsRepo.findOne({
      where: { id: variantId },
      relations: [
        'attributeValueMaps',
        'attributeValueMaps.attributeValue',
        'attributeValueMaps.attributeValue.attribute',
      ],
    });
    if (!full) {
      throw new VariantNotFoundException();
    }
    return ProductVariantResponseDto.fromEntity(full, full.attributeValueMaps);
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const variant = await this.productVariantsRepo.findByIdAndProductId(
      variantId,
      productId,
      { withDeleted: true },
    );
    if (!variant) {
      throw new VariantNotFoundException();
    }
    if (variant.deletedAt) {
      return;
    }
    const n = await this.countStockRefsByVariantId(variantId);
    if (n > 0) {
      throw new VariantInUseException();
    }
    await this.productVariantsRepo.softDeleteById(variantId);
  }
}
