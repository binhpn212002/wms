import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutboundDocumentStatus } from '../../../common/constants/outbound.constant';
import { OutboundDocument } from '../../../database/entities/outbound-document.entity';
import { OutboundLineResponseDto } from './outbound-line-response.dto';

export class OutboundDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentNo: string;

  @ApiProperty()
  documentDate: string;

  @ApiProperty()
  warehouseId: string;

  @ApiPropertyOptional()
  warehouseCode?: string;

  @ApiProperty({ enum: OutboundDocumentStatus })
  status: OutboundDocumentStatus;

  @ApiPropertyOptional()
  reason: string | null;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional({ type: [OutboundLineResponseDto] })
  lines?: OutboundLineResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(
    doc: OutboundDocument,
    options?: { includeLines?: boolean },
  ): OutboundDocumentResponseDto {
    const dto = new OutboundDocumentResponseDto();
    dto.id = doc.id;
    dto.documentNo = doc.documentNo;
    dto.documentDate =
      typeof doc.documentDate === 'string'
        ? doc.documentDate
        : (doc.documentDate as unknown as Date).toISOString().slice(0, 10);
    dto.warehouseId = doc.warehouseId;
    dto.status = doc.status as OutboundDocumentStatus;
    dto.reason = doc.reason;
    dto.notes = doc.notes;
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;

    if (doc.warehouse) {
      dto.warehouseCode = doc.warehouse.code;
    }

    if (options?.includeLines !== false && doc.lines?.length) {
      dto.lines = doc.lines.map((l) => OutboundLineResponseDto.fromEntity(l));
    }
    return dto;
  }
}
