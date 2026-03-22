import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'sku chỉ gồm chữ, số, gạch dưới, gạch ngang và dấu chấm',
  })
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? null : s;
  })
  @IsString()
  @MaxLength(128)
  barcode?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attributeValueIds?: string[];
}
