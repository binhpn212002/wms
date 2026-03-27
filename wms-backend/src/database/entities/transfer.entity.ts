import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { TransferStatus } from '../../common/constants/transfers.constant';
import { TransferLine } from './transfer-line.entity';

@Entity('transfers')
export class Transfer extends BaseEntity {
  @Column({ name: 'document_no', type: 'varchar', length: 64, unique: true })
  documentNo: string;

  @Column({ name: 'document_date', type: 'date' })
  documentDate: string;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status: TransferStatus;

  @Column({ name: 'note', type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => TransferLine, (l) => l.transfer, { cascade: ['insert'] })
  lines: TransferLine[];
}

