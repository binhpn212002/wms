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

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, nullable: true })
  currencyCode: string | null;

  @Column({
    name: 'list_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null | undefined) => v ?? null,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  listPrice: number | null;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null | undefined) => v ?? null,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  costPrice: number | null;

  @Column({ name: 'image_urls', type: 'jsonb', default: [] })
  imageUrls: string[];

  @Column({
    name: 'min_stock',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
    transformer: {
      to: (v: number | null | undefined) => v ?? null,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  minStock: number | null;

  @Column({
    name: 'max_stock',
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
    transformer: {
      to: (v: number | null | undefined) => v ?? null,
      from: (v: string | null) => (v == null ? null : Number(v)),
    },
  })
  maxStock: number | null;

  @OneToMany(() => ProductVariantAttributeValue, (m) => m.variant)
  attributeValueMaps: ProductVariantAttributeValue[];
}
