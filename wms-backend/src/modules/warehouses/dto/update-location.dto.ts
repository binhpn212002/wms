import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LOCATION_TYPES } from '../constants/location-types';

export class UpdateLocationDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'null = gốc kho (không có cha)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === '') {
      return null;
    }
    return value;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ enum: LOCATION_TYPES })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsIn(LOCATION_TYPES)
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const s = String(value).trim();
    return s === '' ? null : s;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(255)
  name?: string | null;
}
