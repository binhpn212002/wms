import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'PCS' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code chỉ gồm chữ, số, gạch dưới và gạch ngang',
  })
  code: string;

  @ApiProperty({ example: 'Cái' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'cái' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @MaxLength(64)
  symbol?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
