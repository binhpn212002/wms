import type { PageQuery, SortOrder } from './pagination'

export interface Attribute {
  id: string
  code: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  values?: AttributeValueEmbed[]
}

export interface AttributeValueEmbed {
  id: string
  code: string
  name: string
  active: boolean
  deleted_at: string | null
}

export interface ListAttributesQuery extends PageQuery {
  sort?: SortOrder
  active?: boolean
  includeDeleted?: boolean
  includeValues?: boolean
}

export interface CreateAttributeValueItemRequest {
  code: string
  name: string
  active?: boolean
}

export interface CreateAttributeRequest {
  code: string
  name: string
  active?: boolean
  /** Giá trị tuỳ chọn tạo cùng lúc khi tạo thuộc tính. */
  values?: CreateAttributeValueItemRequest[]
}

/** Giá trị khi PATCH thuộc tính: có `id` = cập nhật, không có = thêm mới. */
export interface UpsertAttributeValueItemRequest {
  id?: string
  code: string
  name: string
  active?: boolean
}

export type UpdateAttributeRequest = Partial<
  Omit<CreateAttributeRequest, 'values'>
> & {
  values?: UpsertAttributeValueItemRequest[]
}

export interface AttributeValue {
  id: string
  attribute_id: string
  code: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type AttributeValueSortField = 'code' | 'name' | 'created_at'

export interface ListAttributeValuesQuery extends PageQuery {
  sort?: SortOrder
  active?: boolean
  includeDeleted?: boolean
}

export interface CreateAttributeValueRequest {
  code: string
  name: string
  active?: boolean
}

export type UpdateAttributeValueRequest =
  Partial<CreateAttributeValueRequest>
