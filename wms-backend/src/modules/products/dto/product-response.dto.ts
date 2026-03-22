import { Product } from '../../../database/entities/product.entity';
import { ProductVariantResponseDto } from './product-variant-response.dto';

export class CategoryEmbedDto {
  id: string;
  code: string;
  name: string;
}

export class UnitEmbedDto {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
}

export class ProductResponseDto {
  id: string;
  code: string;
  name: string;
  category_id: string;
  category: CategoryEmbedDto;
  default_uom_id: string;
  default_uom: UnitEmbedDto;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  variants?: ProductVariantResponseDto[];

  static fromEntity(
    p: Product,
    options?: { variants?: ProductVariantResponseDto[] },
  ): ProductResponseDto {
    const d = new ProductResponseDto();
    d.id = p.id;
    d.code = p.code;
    d.name = p.name;
    d.category_id = p.categoryId;
    d.default_uom_id = p.defaultUomId;
    d.active = p.active;
    d.created_at = p.createdAt;
    d.updated_at = p.updatedAt;
    d.deleted_at = p.deletedAt;
    d.category = {
      id: p.category.id,
      code: p.category.code,
      name: p.category.name,
    };
    d.default_uom = {
      id: p.defaultUom.id,
      code: p.defaultUom.code,
      name: p.defaultUom.name,
      symbol: p.defaultUom.symbol,
    };
    if (options?.variants !== undefined) {
      d.variants = options.variants;
    }
    return d;
  }
}
