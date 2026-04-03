import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';

export class AttributeValueEmbedDto {
  id: string;
  attribute_id: string;
  code: string;
  name: string;
}

export class ProductMinimalEmbedDto {
  id: string;
  code: string;
  name: string;
}

export class ProductVariantResponseDto {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  active: boolean;
  currency_code: string | null;
  list_price: number | null;
  cost_price: number | null;
  image_urls: string[];
  min_stock: number | null;
  max_stock: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  attribute_id: string | null;
  value_id: string | null;
  attribute_value: AttributeValueEmbedDto | null;
  /** Chỉ dùng cho GET /product-variants lookup */
  product?: ProductMinimalEmbedDto;

  static fromEntity(
    v: ProductVariant,
    maps?: ProductVariantAttributeValue[],
  ): ProductVariantResponseDto {
    const d = new ProductVariantResponseDto();
    d.id = v.id;
    d.product_id = v.productId;
    d.sku = v.sku;
    d.barcode = v.barcode;
    d.active = v.active ?? true;
    d.currency_code = v.currencyCode ?? null;
    d.list_price = v.listPrice ?? null;
    d.cost_price = v.costPrice ?? null;
    d.image_urls = Array.isArray(v.imageUrls) ? v.imageUrls : [];
    d.min_stock = v.minStock ?? null;
    d.max_stock = v.maxStock ?? null;
    d.created_at = v.createdAt;
    d.updated_at = v.updatedAt;
    d.deleted_at = v.deletedAt;

    const list = maps ?? v.attributeValueMaps ?? [];
    const first = list[0];
    const av = first?.attributeValue;
    if (av) {
      d.attribute_id = av.attributeId;
      d.value_id = av.id;
      d.attribute_value = {
        id: av.id,
        attribute_id: av.attributeId,
        code: av.code,
        name: av.name,
      };
    } else {
      d.attribute_id = null;
      d.value_id = null;
      d.attribute_value = null;
    }
    return d;
  }

  static fromEntityWithProduct(
    v: ProductVariant,
    maps?: ProductVariantAttributeValue[],
  ): ProductVariantResponseDto {
    const d = ProductVariantResponseDto.fromEntity(v, maps);
    const p = v.product;
    if (p) {
      d.product = {
        id: p.id,
        code: p.code,
        name: p.name,
      };
    }
    return d;
  }

  /** Danh sách rút gọn (list product, không load attribute values). */
  static shallow(v: ProductVariant): ProductVariantResponseDto {
    const d = ProductVariantResponseDto.fromEntity(v, []);
    d.attribute_id = null;
    d.value_id = null;
    d.attribute_value = null;
    return d;
  }
}
