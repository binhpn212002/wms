import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Location } from './location.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';

@Entity('inventory_movements')
@Index('idx_inventory_movements_reference', ['referenceType', 'referenceId'])
@Index('idx_inventory_movements_variant_created', ['variantId', 'createdAt'])
export class InventoryMovement extends BaseEntity {
  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({
    name: 'quantity_delta',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  quantityDelta: string;

  @Column({ name: 'movement_type', type: 'varchar', length: 64 })
  movementType: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 32 })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'uuid' })
  referenceId: string;

  @Column({ name: 'reference_line_id', type: 'uuid', nullable: true })
  referenceLineId: string | null;
}
