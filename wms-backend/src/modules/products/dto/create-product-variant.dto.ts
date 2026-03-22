import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'SKU-001' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'sku chỉ gồm chữ, số, gạch dưới, gạch ngang và dấu chấm',
  })
  sku: string;

  @ApiPropertyOptional({ example: '893456789' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @MaxLength(128)
  barcode?: string;

  @ApiProperty({
    type: [String],
    description: 'Danh sách attribute_value_id (có thể rỗng cho SKU mặc định)',
    example: [],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  attributeValueIds: string[];
}
