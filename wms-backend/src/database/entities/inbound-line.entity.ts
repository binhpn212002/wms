import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { InboundDocument } from './inbound-document.entity';
import { Location } from './location.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('inbound_lines')
@Index(['inboundDocumentId', 'lineNo'], { unique: true })
export class InboundLine extends BaseEntity {
  @Column({ name: 'inbound_document_id', type: 'uuid' })
  inboundDocumentId: string;

  @ManyToOne(() => InboundDocument, (d) => d.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_document_id' })
  inboundDocument: InboundDocument;

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

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 18,
    scale: 4,
    nullable: true,
  })
  unitPrice: string | null;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Location;
}
