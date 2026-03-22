import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  validateSync,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/** Giới hạn tối đa số bản ghi mỗi trang (tránh query quá lớn). */
export const PAGE_LIMIT_MAX = 100;

/** Giá trị mặc định khi không truyền query. */
export const PAGE_DEFAULT = 1;
export const LIMIT_DEFAULT = 10;

/** Độ dài tối đa chuỗi tìm kiếm `q`. */
export const QUERY_MAX_LENGTH = 500;

/** Dùng chung cho query DTO (page/limit). */
export function toInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.floor(n);
}

/**
 * Tuỳ chọn phân trang (page/limit), dùng cho query và repository.
 * Dùng với `ValidationPipe({ transform: true })` hoặc `PageOptionDto.fromQuery()`.
 */
export class PageOptionDto {
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

  /** Từ khóa tìm kiếm (GET ?q=). */
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

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder;

  /** Số bản ghi bỏ qua (offset) cho TypeORM skip. */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  /** Chuẩn hoá an toàn khi không đi qua ValidationPipe (test / gọi trực tiếp). */
  normalize(): this {
    const p = toInt(this.page, PAGE_DEFAULT);
    this.page = p < 1 ? PAGE_DEFAULT : p;

    let l = toInt(this.limit, LIMIT_DEFAULT);
    if (l < 1) {
      l = LIMIT_DEFAULT;
    } else if (l > PAGE_LIMIT_MAX) {
      l = PAGE_LIMIT_MAX;
    }
    this.limit = l;

    if (this.q !== undefined && typeof this.q === 'string') {
      const t = this.q.trim();
      this.q = t === '' ? undefined : t.slice(0, QUERY_MAX_LENGTH);
    }
    return this;
  }

  /**
   * Parse từ query string (GET ?page=&limit=) — validate bằng class-validator.
   */
  static fromQuery(
    page?: string | number,
    limit?: string | number,
    q?: string,
  ): PageOptionDto {
    const dto = plainToInstance(
      PageOptionDto,
      { page, limit, q },
      { exposeDefaultValues: true },
    );
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length > 0) {
      const msg = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join('; ');
      throw new BadRequestException(msg || 'Invalid pagination options');
    }
    return dto;
  }
}
