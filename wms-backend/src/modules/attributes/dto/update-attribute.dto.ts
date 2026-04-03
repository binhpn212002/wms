import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import {
  CREATE_ATTRIBUTE_VALUES_MAX,
  CreateAttributeDto,
} from './create-attribute.dto';
import { UpsertAttributeValueItemDto } from './upsert-attribute-value-item.dto';

export class UpdateAttributeDto extends PartialType(
  OmitType(CreateAttributeDto, ['values'] as const),
) {
  @ApiPropertyOptional({
    type: [UpsertAttributeValueItemDto],
    description:
      'Khi gửi: đồng bộ danh sách giá trị (có id = sửa, không id = thêm, bị thiếu so với hiện tại = xóa mềm nếu không đang dùng).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CREATE_ATTRIBUTE_VALUES_MAX)
  @ValidateNested({ each: true })
  @Type(() => UpsertAttributeValueItemDto)
  values?: UpsertAttributeValueItemDto[];
}
