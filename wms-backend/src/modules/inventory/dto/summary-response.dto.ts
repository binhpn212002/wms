import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SummaryByProductItemDto {
  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty()
  productCode: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  quantity: string;
}

export class SummaryByWarehouseItemDto {
  @ApiProperty({ format: 'uuid' })
  warehouseId: string;

  @ApiProperty()
  warehouseCode: string;

  @ApiPropertyOptional()
  warehouseName?: string;

  @ApiProperty({ format: 'uuid' })
  variantId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  quantity: string;
}
