import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { InboundDocumentStatus } from '../../common/constants/inbound.constant';
import { Supplier } from './supplier.entity';
import { Warehouse } from './warehouse.entity';
import { InboundLine } from './inbound-line.entity';

@Entity('inbound_documents')
export class InboundDocument extends BaseEntity {
  @Column({ name: 'document_no', type: 'varchar', length: 64, unique: true })
  documentNo: string;

  @Column({ name: 'document_date', type: 'date' })
  documentDate: string;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: InboundDocumentStatus;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => InboundLine, (l) => l.inboundDocument, { cascade: ['insert'] })
  lines: InboundLine[];
}
