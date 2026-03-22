import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { OutboundDocumentStatus } from '../../common/constants/outbound.constant';
import { Warehouse } from './warehouse.entity';
import { OutboundLine } from './outbound-line.entity';

@Entity('outbound_documents')
export class OutboundDocument extends BaseEntity {
  @Column({ name: 'document_no', type: 'varchar', length: 64, unique: true })
  documentNo: string;

  @Column({ name: 'document_date', type: 'date' })
  documentDate: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: OutboundDocumentStatus;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => OutboundLine, (l) => l.outboundDocument, { cascade: ['insert'] })
  lines: OutboundLine[];
}
