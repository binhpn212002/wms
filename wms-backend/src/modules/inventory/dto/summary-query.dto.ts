import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  LIMIT_DEFAULT,
  PAGE_DEFAULT,
  PAGE_LIMIT_MAX,
  PageOptionDto,
  toInt,
} from '../../../common/dto/page-option.dto';

/** Query chung cho summary by-product / by-warehouse */
export class SummaryQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ minimum: 1, default: PAGE_DEFAULT, example: 1 })
  @Transform(({ value }) => {
    const n = toInt(value, PAGE_DEFAULT);
    return n < 1 ? PAGE_DEFAULT : n;
  })
  @IsInt()
  @Min(1)
  page: number = PAGE_DEFAULT;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: PAGE_LIMIT_MAX,
    default: LIMIT_DEFAULT,
    example: 10,
  })
  @Transform(({ value }) => {
    const n = toInt(value, LIMIT_DEFAULT);
    if (n < 1) {
      return LIMIT_DEFAULT;
    }
    return Math.min(n, PAGE_LIMIT_MAX);
  })
  @IsInt()
  @Min(1)
  @Max(PAGE_LIMIT_MAX)
  limit: number = LIMIT_DEFAULT;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;
}
