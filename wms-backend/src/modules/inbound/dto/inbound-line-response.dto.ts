import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InboundLine } from '../../../database/entities/inbound-line.entity';

export class InboundLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lineNo: number;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  quantity: string;

  @ApiPropertyOptional()
  unitPrice: string | null;

  @ApiProperty()
  locationId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(line: InboundLine): InboundLineResponseDto {
    const dto = new InboundLineResponseDto();
    dto.id = line.id;
    dto.lineNo = line.lineNo;
    dto.variantId = line.variantId;
    dto.quantity = String(line.quantity);
    dto.unitPrice = line.unitPrice != null ? String(line.unitPrice) : null;
    dto.locationId = line.locationId;
    dto.createdAt = line.createdAt;
    dto.updatedAt = line.updatedAt;
    return dto;
  }
}
