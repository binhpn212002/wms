import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { OutboundDocument } from './outbound-document.entity';
import { Location } from './location.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('outbound_lines')
@Index(['outboundDocumentId', 'lineNo'], { unique: true })
export class OutboundLine extends BaseEntity {
  @Column({ name: 'outbound_document_id', type: 'uuid' })
  outboundDocumentId: string;

  @ManyToOne(() => OutboundDocument, (d) => d.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outbound_document_id' })
  outboundDocument: OutboundDocument;

  @Column({ name: 'line_no', type: 'int' })
  lineNo: number;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 18,
    scale: 4,
  })
  quantity: string;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Location;
}
