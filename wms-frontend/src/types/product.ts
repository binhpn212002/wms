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

/** Embed giá trị thuộc tính trên biến thể (khớp backend). */
export interface AttributeValueEmbed {
  id: string
  attribute_id: string
  code: string
  name: string
}

/** Loại thuộc tính (nhãn biến thể: Size, Màu, …). */
export interface AttributeEmbed {
  id: string
  code: string
  name: string
}

export interface ProductMinimalEmbed {
  id: string
  code: string
  name: string
}

export interface ProductVariant {
  id: string
  product_id: string
  sku: string
  barcode: string | null
  active: boolean
  currency_code: string | null
  list_price: number | null
  cost_price: number | null
  image_urls: string[]
  min_stock: number | null
  max_stock: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  attribute_id: string | null
  value_id: string | null
  attribute: AttributeEmbed | null
  attribute_value: AttributeValueEmbed | null
  /** Chỉ có khi gọi GET /product-variants (lookup). */
  product?: ProductMinimalEmbed
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

export interface ListProductVariantsQuery extends PageQuery {
  active?: boolean
  includeDeleted?: boolean
  /** Lọc biến thể theo sản phẩm (lookup). */
  productId?: string
}

export interface GetProductQuery {
  includeDeleted?: boolean
  includeVariants?: boolean
}

export interface CreateProductVariantRequest {
  sku: string
  barcode?: string
  active?: boolean
  currencyCode?: string
  listPrice?: number
  costPrice?: number
  imageUrls?: string[]
  minStock?: number
  maxStock?: number
  /** Cùng có hoặc cùng bỏ với `valueId` (biến thể mặc định). */
  attributeId?: string | null
  valueId?: string | null
}

export interface CreateProductRequest {
  code: string
  name: string
  categoryId: string
  defaultUomId: string
  active?: boolean
  variants?: CreateProductVariantRequest[]
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
  active?: boolean
  currencyCode?: string | null
  listPrice?: number | null
  costPrice?: number | null
  imageUrls?: string[] | null
  minStock?: number | null
  maxStock?: number | null
  /** Gửi cả hai (kể cả null,null) để thay map; bỏ qua cả hai để giữ nguyên. */
  attributeId?: string | null
  valueId?: string | null
}
