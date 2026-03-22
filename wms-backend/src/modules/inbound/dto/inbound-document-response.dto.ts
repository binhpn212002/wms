import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InboundDocumentStatus } from '../../../common/constants/inbound.constant';
import { InboundDocument } from '../../../database/entities/inbound-document.entity';
import { InboundLineResponseDto } from './inbound-line-response.dto';

export class InboundDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentNo: string;

  @ApiProperty()
  documentDate: string;

  @ApiProperty()
  supplierId: string;

  @ApiPropertyOptional()
  supplierName?: string;

  @ApiProperty()
  warehouseId: string;

  @ApiPropertyOptional()
  warehouseCode?: string;

  @ApiProperty({ enum: InboundDocumentStatus })
  status: InboundDocumentStatus;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional({ type: [InboundLineResponseDto] })
  lines?: InboundLineResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(
    doc: InboundDocument,
    options?: { includeLines?: boolean },
  ): InboundDocumentResponseDto {
    const dto = new InboundDocumentResponseDto();
    dto.id = doc.id;
    dto.documentNo = doc.documentNo;
    dto.documentDate =
      typeof doc.documentDate === 'string'
        ? doc.documentDate
        : (doc.documentDate as unknown as Date).toISOString().slice(0, 10);
    dto.supplierId = doc.supplierId;
    dto.warehouseId = doc.warehouseId;
    dto.status = doc.status as InboundDocumentStatus;
    dto.notes = doc.notes;
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;

    if (doc.supplier) {
      dto.supplierName = doc.supplier.name;
    }
    if (doc.warehouse) {
      dto.warehouseCode = doc.warehouse.code;
    }

    if (options?.includeLines !== false && doc.lines?.length) {
      dto.lines = doc.lines.map((l) => InboundLineResponseDto.fromEntity(l));
    }
    return dto;
  }
}
