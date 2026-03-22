import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';

@Entity('attributes')
export class Attribute extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder: number | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
}
