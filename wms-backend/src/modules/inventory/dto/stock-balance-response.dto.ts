import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockBalanceItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  warehouseId: string;

  @ApiPropertyOptional()
  warehouseCode?: string;

  @ApiPropertyOptional()
  warehouseName?: string;

  @ApiProperty({ format: 'uuid' })
  locationId: string;

  @ApiPropertyOptional()
  locationCode?: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ description: 'Số lượng (decimal string)' })
  quantity: string;

  @ApiProperty()
  updatedAt: Date;
}
