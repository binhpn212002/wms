import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';

@Entity('module_a')
export class ModuleAEntity extends BaseEntity {
  @Column()
  name: string;
}
