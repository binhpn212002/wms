import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';

@Entity('units')
export class Unit extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'symbol', type: 'varchar', length: 64, nullable: true })
  symbol: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;
}
