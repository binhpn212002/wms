import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { Supplier } from './supplier.entity';

@Entity('supplier_contacts')
export class SupplierContact extends BaseEntity {
  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, (s) => s.contacts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 32, nullable: true })
  phone: string | null;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ name: 'title', type: 'varchar', length: 128, nullable: true })
  title: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;
}
