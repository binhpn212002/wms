import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { SupplierContact } from './supplier-contact.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ name: 'code', type: 'varchar', length: 64 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 64, nullable: true })
  taxId: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'active', type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => SupplierContact, (c) => c.supplier)
  contacts: SupplierContact[];

  /** Gán khi query dùng loadRelationCountAndMap — không phải cột DB. */
  contactCount?: number;
}
