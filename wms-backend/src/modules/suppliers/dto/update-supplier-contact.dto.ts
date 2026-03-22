import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSupplierContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  name?: string;

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
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? null : s;
  })
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

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
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
