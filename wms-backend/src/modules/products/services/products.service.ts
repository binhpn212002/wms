import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { CategoryNotFoundException } from '../../../common/exceptions/category.exceptions';
import {
  AttributeValueInvalidException,
  AttributeValueMismatchException,
  ProductCodeDuplicateException,
  ProductNotFoundException,
  VariantBarcodeDuplicateException,
  VariantComboDuplicateException,
  VariantInUseException,
  VariantNotFoundException,
  VariantRuleViolationException,
  VariantSkuDuplicateException,
} from '../../../common/exceptions/product.exceptions';
import { UnitNotFoundException } from '../../../common/exceptions/unit.exceptions';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';
import { Category } from '../../../database/entities/category.entity';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';
import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { Product } from '../../../database/entities/product.entity';
import { Unit } from '../../../database/entities/unit.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { GetProductQueryDto } from '../dto/get-product-query.dto';
import { ListProductVariantsQueryDto } from '../dto/list-product-variants-query.dto';
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

  /** Stub: thay bằng đếm tồn/chứng từ khi có module kho. */
  private async countStockRefsByVariantId(_variantId: string): Promise<number> {
    void _variantId;
    return 0;
  }

  private createDtoResolvedValueId(dto: CreateProductVariantDto): string | null {
    const a = dto.attributeId;
    const v = dto.valueId;
    const hasA = a !== undefined && a !== null;
    const hasV = v !== undefined && v !== null;
    if (hasA !== hasV) {
      throw new AttributeValueMismatchException();
    }
    if (!hasA) {
      return null;
    }
    return v as string;
  }

  private assertCatalogNumbers(
    minStock?: number | null,
    maxStock?: number | null,
  ): void {
    if (
      minStock != null &&
      maxStock != null &&
      maxStock < minStock
    ) {
      throw new VariantRuleViolationException();
    }
  }

  private async assertAttributeValueForPair(
    attributeId: string,
    valueId: string,
  ): Promise<void> {
    const row = await this.attributeValueRepo.findOne({
      where: { id: valueId },
    });
    if (!row || row.deletedAt) {
      throw new AttributeValueInvalidException();
    }
    if (!row.active) {
      throw new AttributeValueInvalidException();
    }
    if (row.attributeId !== attributeId) {
      throw new AttributeValueMismatchException();
    }
  }

  private async assertValueIdUniqueOnProduct(
    productId: string,
    valueId: string,
    excludeVariantId?: string,
  ): Promise<void> {
    const holder =
      await this.productVariantsRepo.findVariantIdHoldingValueOnProduct(
        productId,
        valueId,
        excludeVariantId,
      );
    if (holder) {
      throw new VariantComboDuplicateException();
    }
  }

  private async assertDefaultVariantUniqueOnProduct(
    productId: string,
    excludeVariantId?: string,
  ): Promise<void> {
    const existing = await this.productVariantsRepo.findFirstDefaultVariantId(
      productId,
      excludeVariantId,
    );
    if (existing) {
      throw new VariantComboDuplicateException();
    }
  }

  private assertIntraCreateVariantUniques(
    variants: CreateProductVariantDto[],
  ): void {
    const seenValue = new Set<string>();
    let defaultCount = 0;
    for (const vd of variants) {
      const valueId = this.createDtoResolvedValueId(vd);
      if (valueId) {
        if (seenValue.has(valueId)) {
          throw new VariantComboDuplicateException();
        }
        seenValue.add(valueId);
      } else {
        defaultCount += 1;
        if (defaultCount > 1) {
          throw new VariantComboDuplicateException();
        }
      }
    }
  }

  /** Chuẩn hóa + kiểm tra attribute value; không kiểm tra trùng theo product (dùng khi tạo sản phẩm mới). */
  private async prepareVariantDtoForCreateProduct(
    dto: CreateProductVariantDto,
  ): Promise<string | null> {
    this.assertCatalogNumbers(dto.minStock, dto.maxStock);
    const valueId = this.createDtoResolvedValueId(dto);
    if (valueId) {
      await this.assertAttributeValueForPair(
        dto.attributeId as string,
        valueId,
      );
    }
    if (await this.productVariantsRepo.existsActiveBySku(dto.sku)) {
      throw new VariantSkuDuplicateException();
    }
    if (dto.barcode) {
      if (await this.productVariantsRepo.existsActiveByBarcode(dto.barcode)) {
        throw new VariantBarcodeDuplicateException();
      }
    }
    return valueId;
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
              ProductVariantResponseDto.fromEntity(v, v.attributeValueMaps),
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

  async listVariants(
    productId: string,
    query: ListProductVariantsQueryDto,
  ): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const product = await this.productsRepo.findById(productId, {
      withDeleted: query.includeDeleted === true,
    });
    if (!product) {
      throw new ProductNotFoundException();
    }
    if (!query.includeDeleted && product.deletedAt) {
      throw new ProductNotFoundException();
    }
    const res = await this.productVariantsRepo.findManyByProductId(
      productId,
      query,
    );
    const data = res.data.map((v) =>
      ProductVariantResponseDto.fromEntity(v, v.attributeValueMaps),
    );
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async lookupVariants(
    query: ListProductVariantsQueryDto,
  ): Promise<ListResponseDto<ProductVariantResponseDto>> {
    const res = await this.productVariantsRepo.findManyLookup(query);
    const data = res.data.map((v) =>
      ProductVariantResponseDto.fromEntityWithProduct(v, v.attributeValueMaps),
    );
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const code = dto.code.trim().toUpperCase();
    await this.assertCategoryAndUnit(dto.categoryId, dto.defaultUomId);
    if (await this.productsRepo.existsActiveByCode(code)) {
      throw new ProductCodeDuplicateException();
    }
    const variants = dto.variants ?? [];
    if (variants.length > 0) {
      this.assertIntraCreateVariantUniques(variants);
      for (const vd of variants) {
        await this.prepareVariantDtoForCreateProduct(vd);
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

      for (const vd of variants) {
        const valueId = this.createDtoResolvedValueId(vd);
        const variant = variantRepo.create({
          productId: product.id,
          sku: vd.sku,
          barcode: vd.barcode?.trim() ? vd.barcode.trim() : null,
          active: vd.active ?? true,
          currencyCode: vd.currencyCode?.trim() ? vd.currencyCode.trim() : null,
          listPrice: vd.listPrice ?? null,
          costPrice: vd.costPrice ?? null,
          imageUrls: vd.imageUrls?.length ? vd.imageUrls : [],
          minStock: vd.minStock ?? null,
          maxStock: vd.maxStock ?? null,
        });
        await variantRepo.save(variant);
        if (valueId) {
          await mapRepo.insert({
            variantId: variant.id,
            attributeValueId: valueId,
          });
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
    this.assertCatalogNumbers(dto.minStock, dto.maxStock);
    const valueId = this.createDtoResolvedValueId(dto);
    if (valueId) {
      await this.assertAttributeValueForPair(
        dto.attributeId as string,
        valueId,
      );
      await this.assertValueIdUniqueOnProduct(productId, valueId);
    } else {
      await this.assertDefaultVariantUniqueOnProduct(productId);
    }
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
        sku: dto.sku,
        barcode: dto.barcode?.trim() ? dto.barcode.trim() : null,
        active: dto.active ?? true,
        currencyCode: dto.currencyCode?.trim() ? dto.currencyCode.trim() : null,
        listPrice: dto.listPrice ?? null,
        costPrice: dto.costPrice ?? null,
        imageUrls: dto.imageUrls?.length ? dto.imageUrls : [],
        minStock: dto.minStock ?? null,
        maxStock: dto.maxStock ?? null,
      });
      await variantRepo.save(v);
      if (valueId) {
        await mapRepo.insert({
          variantId: v.id,
          attributeValueId: valueId,
        });
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

    const hasAttrKey = Object.prototype.hasOwnProperty.call(dto, 'attributeId');
    const hasValKey = Object.prototype.hasOwnProperty.call(dto, 'valueId');
    if (hasAttrKey !== hasValKey) {
      throw new AttributeValueMismatchException();
    }
    let mapReplaceValueId: string | null | undefined;
    if (hasAttrKey && hasValKey) {
      const a = dto.attributeId;
      const v = dto.valueId;
      const bothNull = a === null && v === null;
      const bothSet = a !== undefined && a !== null && v !== undefined && v !== null;
      if (!bothNull && !bothSet) {
        throw new AttributeValueMismatchException();
      }
      if (bothNull) {
        mapReplaceValueId = null;
        await this.assertDefaultVariantUniqueOnProduct(productId, variantId);
      } else {
        await this.assertAttributeValueForPair(a as string, v as string);
        await this.assertValueIdUniqueOnProduct(productId, v as string, variantId);
        mapReplaceValueId = v as string;
      }
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
    if (dto.active !== undefined) {
      variant.active = dto.active;
    }
    if (dto.currencyCode !== undefined) {
      const c = dto.currencyCode;
      variant.currencyCode =
        c === null || c === undefined || c === '' ? null : String(c).trim().toUpperCase();
    }
    if (dto.listPrice !== undefined) {
      variant.listPrice = dto.listPrice;
    }
    if (dto.costPrice !== undefined) {
      variant.costPrice = dto.costPrice;
    }
    if (dto.imageUrls !== undefined) {
      variant.imageUrls =
        dto.imageUrls === null || dto.imageUrls.length === 0 ? [] : dto.imageUrls;
    }
    if (dto.minStock !== undefined) {
      variant.minStock = dto.minStock;
    }
    if (dto.maxStock !== undefined) {
      variant.maxStock = dto.maxStock;
    }

    this.assertCatalogNumbers(variant.minStock, variant.maxStock);

    await this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const mapRepo = manager.getRepository(ProductVariantAttributeValue);
      await variantRepo.save(variant);
      if (mapReplaceValueId !== undefined) {
        await mapRepo.delete({ variantId });
        if (mapReplaceValueId) {
          await mapRepo.insert({
            variantId,
            attributeValueId: mapReplaceValueId,
          });
        }
      }
    });

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
