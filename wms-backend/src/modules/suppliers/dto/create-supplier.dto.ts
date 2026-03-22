import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateSupplierContactDto } from './create-supplier-contact.dto';

export class CreateSupplierDto {
  @ApiProperty({ example: 'NCC-001' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code chỉ gồm chữ, số, gạch dưới và gạch ngang',
  })
  code: string;

  @ApiProperty({ example: 'Công ty ABC' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? null : s;
  })
  @IsString()
  @MaxLength(64)
  taxId?: string | null;

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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    type: [CreateSupplierContactDto],
    description: 'Liên hệ kèm theo khi tạo (tùy chọn)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierContactDto)
  contacts?: CreateSupplierContactDto[];
}
