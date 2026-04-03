import type { PageQuery, SortOrder } from './pagination'

export type ProductSortField = 'code' | 'name' | 'created_at'

export interface CategoryEmbed {
  id: string
  code: string
  name: string
}

export interface UnitEmbed {
  id: string
  code: string
  name: string
  symbol: string | null
}

export interface AttributeValueOnVariant {
  id: string
  code: string
  name: string
  attribute_id: string
  attribute_code: string
  attribute_name: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  barcode: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  attribute_values: AttributeValueOnVariant[]
}

export interface Product {
  id: string
  code: string
  name: string
  category_id: string
  category: CategoryEmbed
  default_uom_id: string
  default_uom: UnitEmbed
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  variants?: ProductVariant[]
}

export interface ListProductsQuery extends PageQuery {
  sortBy?: ProductSortField
  sort?: SortOrder
  categoryId?: string
  active?: boolean
  includeDeleted?: boolean
  includeVariants?: boolean
}

export interface GetProductQuery {
  includeDeleted?: boolean
}

export interface CreateProductVariantRequest {
  sku: string
  barcode?: string
  attributeValueIds: string[]
}

export interface CreateProductRequest {
  code: string
  name: string
  categoryId: string
  defaultUomId: string
  active?: boolean
  variants: CreateProductVariantRequest[]
}

export interface UpdateProductRequest {
  code?: string
  name?: string
  categoryId?: string
  defaultUomId?: string
  active?: boolean
}

export interface UpdateProductVariantRequest {
  sku?: string
  barcode?: string | null
  attributeValueIds?: string[]
}
