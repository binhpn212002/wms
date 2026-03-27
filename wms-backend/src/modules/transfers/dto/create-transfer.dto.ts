import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TransferLineInputDto } from './transfer-line-input.dto';

export class CreateTransferDto {
  @ApiPropertyOptional({
    description: 'Bỏ trống để hệ thống sinh mã (TRF-...)',
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
  note?: string | null;

  @ApiPropertyOptional({ type: [TransferLineInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferLineInputDto)
  lines?: TransferLineInputDto[];
}

