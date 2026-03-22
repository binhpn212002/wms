import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Location } from './location.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  /** FK logic tới `locations.id` — không khai báo ManyToOne để tránh circular import; validate ở service. */
  @Column({ name: 'default_location_id', type: 'uuid', nullable: true })
  defaultLocationId: string | null;

  @OneToMany(() => Location, (l) => l.warehouse)
  locations: Location[];
}
