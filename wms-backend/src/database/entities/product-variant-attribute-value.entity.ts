import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AttributeValue } from './attribute-value.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_variant_attribute_values')
export class ProductVariantAttributeValue {
  @PrimaryColumn({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @PrimaryColumn({ name: 'attribute_value_id', type: 'uuid' })
  attributeValueId: string;

  @ManyToOne(() => ProductVariant, (v) => v.attributeValueMaps, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @ManyToOne(() => AttributeValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_value_id' })
  attributeValue: AttributeValue;
}
