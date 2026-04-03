import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateAttributeValueItemDto } from './create-attribute-value-item.dto';

/** Tối đa số giá trị gửi kèm khi tạo thuộc tính (tránh payload quá lớn). */
export const CREATE_ATTRIBUTE_VALUES_MAX = 200;

export class CreateAttributeDto {
  @ApiProperty({ example: 'SIZE' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code chỉ gồm chữ, số, gạch dưới và gạch ngang',
  })
  code: string;

  @ApiProperty({ example: 'Kích cỡ' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    type: [CreateAttributeValueItemDto],
    description:
      'Danh sách giá trị tuỳ chọn tạo cùng lúc (vd: S, M, L cho thuộc tính SIZE).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CREATE_ATTRIBUTE_VALUES_MAX)
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueItemDto)
  values?: CreateAttributeValueItemDto[];
}
