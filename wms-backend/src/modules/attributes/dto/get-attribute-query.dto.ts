import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetAttributeQueryDto {
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

  @ApiPropertyOptional({
    default: false,
    description: 'Nếu true, trả kèm danh sách giá trị thuộc tính.',
  })
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
  includeValues?: boolean;
}
