import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Location } from './location.entity';
import { ProductVariant } from './product-variant.entity';
import { Transfer } from './transfer.entity';
import { Warehouse } from './warehouse.entity';

@Entity('transfer_lines')
export class TransferLine extends BaseEntity {
  @Column({ name: 'transfer_id', type: 'uuid' })
  transferId: string;

  @ManyToOne(() => Transfer, (d) => d.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  quantity: string;

  @Column({ name: 'warehouse_id_from', type: 'uuid' })
  warehouseIdFrom: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id_from' })
  warehouseFrom: Warehouse;

  @Column({ name: 'location_id_from', type: 'uuid' })
  locationIdFrom: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id_from' })
  locationFrom: Location;

  @Column({ name: 'warehouse_id_to', type: 'uuid' })
  warehouseIdTo: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id_to' })
  warehouseTo: Warehouse;

  @Column({ name: 'location_id_to', type: 'uuid' })
  locationIdTo: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id_to' })
  locationTo: Location;
}

