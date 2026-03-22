import { IsArray, IsInt, Min } from 'class-validator';

/**
 * Response danh sách có phân trang (dữ liệu + meta).
 */
export class ListResponseDto<T> {
  @IsArray()
  data: T[];

  @IsInt()
  @Min(0)
  total: number;

  @IsInt()
  @Min(1)
  page: number;

  @IsInt()
  @Min(1)
  limit: number;

  @IsInt()
  @Min(0)
  totalPages: number;

  static create<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ListResponseDto<T> {
    const dto = new ListResponseDto<T>();
    dto.data = data;
    dto.total = total;
    dto.page = page;
    dto.limit = limit;
    dto.totalPages = limit > 0 ? Math.max(0, Math.ceil(total / limit)) : 0;
    return dto;
  }
}
