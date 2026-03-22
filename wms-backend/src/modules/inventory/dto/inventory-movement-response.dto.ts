import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryMovementItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  warehouseId: string;

  @ApiProperty({ format: 'uuid' })
  locationId: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty()
  quantityDelta: string;

  @ApiProperty()
  movementType: string;

  @ApiProperty()
  referenceType: string;

  @ApiProperty({ format: 'uuid' })
  referenceId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  referenceLineId: string | null;

  @ApiProperty()
  createdAt: Date;
}
