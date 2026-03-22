import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Product } from './product.entity';
import { ProductVariantAttributeValue } from './product-variant-attribute-value.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'sku', type: 'varchar', length: 128 })
  sku: string;

  @Column({ name: 'barcode', type: 'varchar', length: 128, nullable: true })
  barcode: string | null;

  @OneToMany(() => ProductVariantAttributeValue, (m) => m.variant)
  attributeValueMaps: ProductVariantAttributeValue[];
}
