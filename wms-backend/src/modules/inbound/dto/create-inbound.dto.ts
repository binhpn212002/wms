import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateInboundDto {
  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({
    description: 'Bỏ trống để hệ thống sinh mã (INB-...)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  documentNo?: string;

  @ApiPropertyOptional({ example: '2025-03-22' })
  @IsOptional()
  @IsDateString()
  documentDate?: string;

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
  @MaxLength(5000)
  notes?: string | null;
}
