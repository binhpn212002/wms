import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LOCATION_TYPES } from '../constants/location-types';
import {
  LIMIT_DEFAULT,
  PAGE_DEFAULT,
  PAGE_LIMIT_MAX,
  QUERY_MAX_LENGTH,
  PageOptionDto,
  toInt,
} from '../../../common/dto/page-option.dto';

export enum LocationsView {
  FLAT = 'flat',
  TREE = 'tree',
}

export enum LocationSortField {
  CODE = 'code',
  NAME = 'name',
  CREATED_AT = 'created_at',
}

export class ListLocationsQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ enum: LocationsView, default: LocationsView.FLAT })
  @IsOptional()
  @IsEnum(LocationsView)
  view?: LocationsView;

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

  @ApiPropertyOptional({ enum: LOCATION_TYPES })
  @IsOptional()
  @IsIn(LOCATION_TYPES)
  type?: string;

  @ApiPropertyOptional({
    enum: LocationSortField,
    default: LocationSortField.CODE,
  })
  @IsOptional()
  @IsEnum(LocationSortField)
  sortBy?: LocationSortField;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (value === 'true' || value === true) {
      return true;
    }
    return false;
  })
  @IsBoolean()
  includeDeleted?: boolean;
}
