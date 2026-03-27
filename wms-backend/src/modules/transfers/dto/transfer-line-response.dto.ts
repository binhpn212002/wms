import { ApiProperty } from '@nestjs/swagger';
import { TransferLine } from '../../../database/entities/transfer-line.entity';

export class TransferLineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  quantity: string;

  @ApiProperty()
  warehouseIdFrom: string;

  @ApiProperty()
  locationIdFrom: string;

  @ApiProperty()
  warehouseIdTo: string;

  @ApiProperty()
  locationIdTo: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(line: TransferLine): TransferLineResponseDto {
    const dto = new TransferLineResponseDto();
    dto.id = line.id;
    dto.variantId = line.variantId;
    dto.quantity = String(line.quantity);
    dto.warehouseIdFrom = line.warehouseIdFrom;
    dto.locationIdFrom = line.locationIdFrom;
    dto.warehouseIdTo = line.warehouseIdTo;
    dto.locationIdTo = line.locationIdTo;
    dto.createdAt = line.createdAt;
    dto.updatedAt = line.updatedAt;
    return dto;
  }
}

