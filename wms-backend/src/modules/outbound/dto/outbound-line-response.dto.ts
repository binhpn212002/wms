import { ApiProperty } from '@nestjs/swagger';
import { OutboundLine } from '../../../database/entities/outbound-line.entity';

export class OutboundLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lineNo: number;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  quantity: string;

  @ApiProperty()
  locationId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(line: OutboundLine): OutboundLineResponseDto {
    const dto = new OutboundLineResponseDto();
    dto.id = line.id;
    dto.lineNo = line.lineNo;
    dto.variantId = line.variantId;
    dto.quantity = String(line.quantity);
    dto.locationId = line.locationId;
    dto.createdAt = line.createdAt;
    dto.updatedAt = line.updatedAt;
    return dto;
  }
}
