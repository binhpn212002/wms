import { ProductVariant } from '../../../database/entities/product-variant.entity';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';

export class AttributeValueOnVariantDto {
  id: string;
  code: string;
  name: string;
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
}

export class ProductVariantResponseDto {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  attribute_values: AttributeValueOnVariantDto[];

  static fromEntity(
    v: ProductVariant,
    maps?: ProductVariantAttributeValue[],
  ): ProductVariantResponseDto {
    const d = new ProductVariantResponseDto();
    d.id = v.id;
    d.product_id = v.productId;
    d.sku = v.sku;
    d.barcode = v.barcode;
    d.created_at = v.createdAt;
    d.updated_at = v.updatedAt;
    d.deleted_at = v.deletedAt;
    d.attribute_values = [];
    const list = maps ?? v.attributeValueMaps ?? [];
    for (const m of list) {
      const av = m.attributeValue;
      if (!av) {
        continue;
      }
      const attr = av.attribute;
      d.attribute_values.push({
        id: av.id,
        code: av.code,
        name: av.name,
        attribute_id: av.attributeId,
        attribute_code: attr?.code ?? '',
        attribute_name: attr?.name ?? '',
      });
    }
    return d;
  }

  /** Danh sách rút gọn (list product, không load attribute values). */
  static shallow(v: ProductVariant): ProductVariantResponseDto {
    const d = new ProductVariantResponseDto();
    d.id = v.id;
    d.product_id = v.productId;
    d.sku = v.sku;
    d.barcode = v.barcode;
    d.created_at = v.createdAt;
    d.updated_at = v.updatedAt;
    d.deleted_at = v.deletedAt;
    d.attribute_values = [];
    return d;
  }
}
