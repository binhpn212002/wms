import { ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import {
  LIMIT_DEFAULT,
  PAGE_DEFAULT,
  PAGE_LIMIT_MAX,
  QUERY_MAX_LENGTH,
  PageOptionDto,
  SortOrder,
  toInt,
} from '../../../common/dto/page-option.dto';

export enum BalanceSortField {
  UPDATED_AT = 'updatedAt',
  QUANTITY = 'quantity',
  SKU = 'sku',
}

export class ListBalancesQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ minimum: 1, default: PAGE_DEFAULT, example: 1 })
  @Transform(({ value }) => {
    const n = toInt(value, PAGE_DEFAULT);
    return n < 1 ? PAGE_DEFAULT : n;
  })
  @IsInt()
  @Min(1)
  page: number = PAGE_DEFAULT;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGE_LIMIT_MAX,
    default: LIMIT_DEFAULT,
    example: 10,
  })
  @Transform(({ value }) => {
    const n = toInt(value, LIMIT_DEFAULT);
    if (n < 1) {
      return LIMIT_DEFAULT;
    }
    return Math.min(n, PAGE_LIMIT_MAX);
  })
  @IsInt()
  @Min(1)
  @Max(PAGE_LIMIT_MAX)
  limit: number = LIMIT_DEFAULT;

  @ApiPropertyOptional({ maxLength: QUERY_MAX_LENGTH })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @MaxLength(QUERY_MAX_LENGTH)
  q?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  locationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({
    enum: BalanceSortField,
    default: BalanceSortField.UPDATED_AT,
  })
  @IsOptional()
  @IsEnum(BalanceSortField)
  sortBy?: BalanceSortField;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
