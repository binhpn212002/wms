import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { UserStatus } from '../../common/constants/user.constant';
import { BaseEntity } from '../../shared/base.entity';
import { Role } from './role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  phone: string;

  @Column({ name: 'firebase_id', type: 'varchar', length: 128, nullable: true })
  firebaseId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'date', nullable: true })
  dob: string | null;

  @Column({ type: 'varchar', length: 16 })
  status: UserStatus;

  @ManyToMany(() => Role, (r) => r.users, { eager: false })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
