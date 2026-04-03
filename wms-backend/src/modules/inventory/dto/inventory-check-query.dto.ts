import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  QUERY_MAX_LENGTH,
  toInt,
} from '../../../common/dto/page-option.dto';

export enum InventoryCheckMode {
  SUMMARY = 'summary',
  DETAILS = 'details',
}

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export class InventoryCheckLookupQueryDto {
  @ApiProperty({ description: 'SKU hoặc barcode (khớp chính xác, có phân biệt hoa thường)' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(1)
  @MaxLength(QUERY_MAX_LENGTH)
  q: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @ApiPropertyOptional({
    enum: InventoryCheckMode,
    default: InventoryCheckMode.SUMMARY,
  })
  @IsOptional()
  @IsEnum(InventoryCheckMode)
  mode: InventoryCheckMode = InventoryCheckMode.SUMMARY;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Transform(({ value }) => {
    const n = toInt(value, 1);
    return n < 1 ? 1 : n;
  })
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: PAGE_SIZE_MAX, default: PAGE_SIZE_DEFAULT })
  @Transform(({ value }) => {
    const n = toInt(value, PAGE_SIZE_DEFAULT);
    if (n < 1) return PAGE_SIZE_DEFAULT;
    return Math.min(n, PAGE_SIZE_MAX);
  })
  @IsInt()
  @Min(1)
  @Max(PAGE_SIZE_MAX)
  pageSize: number = PAGE_SIZE_DEFAULT;
}

export class InventoryCheckVariantQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @ApiPropertyOptional({
    enum: InventoryCheckMode,
    default: InventoryCheckMode.SUMMARY,
  })
  @IsOptional()
  @IsEnum(InventoryCheckMode)
  mode: InventoryCheckMode = InventoryCheckMode.SUMMARY;
}
