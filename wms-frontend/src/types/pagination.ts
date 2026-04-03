/** `@nestjs/common` `SortOrder` — dùng chung query phân trang. */
export type SortOrder = 'asc' | 'desc'

export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Query phân trang/lọc cơ bản (khớp `PageOptionDto` backend). */
export interface PageQuery {
  page?: number
  limit?: number
  q?: string
  sort?: SortOrder
}
