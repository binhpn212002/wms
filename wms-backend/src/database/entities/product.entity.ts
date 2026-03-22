import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Category } from './category.entity';
import { Unit } from './unit.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'default_uom_id', type: 'uuid' })
  defaultUomId: string;

  @ManyToOne(() => Unit, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'default_uom_id' })
  defaultUom: Unit;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];
}
