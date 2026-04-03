import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  Min,
  Validate,
  ValidateIf,
} from 'class-validator';
import { CreateVariantAttributePairConstraint } from './create-variant-attribute-pair.constraint';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'SKU-001' })
  @Validate(CreateVariantAttributePairConstraint)
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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: 'VND' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return String(value).trim().toUpperCase();
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currencyCode phải là mã ISO-4217 3 ký tự' })
  currencyCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  listPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf(
    (o) => o.attributeId !== undefined && o.attributeId !== null,
  )
  @IsUUID('4')
  attributeId?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((o) => o.valueId !== undefined && o.valueId !== null)
  @IsUUID('4')
  valueId?: string | null;
}
