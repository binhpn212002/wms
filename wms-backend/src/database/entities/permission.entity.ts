import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  resource: string;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToMany(() => Role, (r) => r.permissions)
  roles: Role[];
}
