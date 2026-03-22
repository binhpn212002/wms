import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  LIMIT_DEFAULT,
  PAGE_DEFAULT,
  PAGE_LIMIT_MAX,
  QUERY_MAX_LENGTH,
  PageOptionDto,
  toInt,
} from '../../../common/dto/page-option.dto';

/**
 * Ghi đè page/limit/q kèm @ApiPropertyOptional để Swagger hiển thị query
 * (class-transformer + class-validator kế thừa DTO cha đôi khi không map đúng với GET ?).
 */
export class ListCategoriesQueryDto extends PageOptionDto {
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

  @ApiPropertyOptional({ maxLength: QUERY_MAX_LENGTH })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  })
  @IsString()
  @MaxLength(QUERY_MAX_LENGTH)
  q?: string;

  /**
   * Lọc theo cha. Omit = không lọc; `parent_id=null` = chỉ nút gốc.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Lọc theo parent; truyền null để chỉ danh mục gốc',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (String(value).toLowerCase() === 'null') {
      return null;
    }
    return String(value);
  })
  @ValidateIf((o) => o.parent_id !== null && o.parent_id !== undefined)
  @IsUUID('4')
  parent_id?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return undefined;
  })
  @IsBoolean()
  active?: boolean;

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

  @ApiPropertyOptional({ enum: ['code', 'name', 'created_at'] })
  @IsOptional()
  @IsEnum(['code', 'name', 'created_at'])
  sort?: 'code' | 'name' | 'created_at';
}
