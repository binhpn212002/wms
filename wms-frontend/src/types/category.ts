import type { PageQuery } from './pagination'

export interface Category {
  id: string
  code: string
  name: string
  parent_id: string | null
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryTreeNode extends Omit<Category, 'deleted_at'> {
  children: CategoryTreeNode[]
}

export interface ListCategoriesQuery extends PageQuery {
  /** Lọc theo parent; truyền chuỗi `"null"` trên URL để chỉ danh mục gốc. */
  parent_id?: string | null
  active?: boolean
  includeDeleted?: boolean
}

export interface TreeCategoriesQuery {
  active?: boolean
  includeDeleted?: boolean
}

export interface CreateCategoryRequest {
  code: string
  name: string
  parent_id?: string | null
  active?: boolean
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>
