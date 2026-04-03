import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/** Một dòng giá trị khi đồng bộ qua PATCH thuộc tính: có `id` = cập nhật, không có = tạo mới. */
export class UpsertAttributeValueItemDto {
  @ApiPropertyOptional({
    description: 'Id giá trị đã có; bỏ trống để thêm mới.',
  })
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty({ example: 'S' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code chỉ gồm chữ, số, gạch dưới và gạch ngang',
  })
  code: string;

  @ApiProperty({ example: 'Nhỏ' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
