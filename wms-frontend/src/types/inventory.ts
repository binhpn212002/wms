import type { PageQuery, SortOrder } from './pagination'

export type BalanceSortField = 'updatedAt' | 'quantity' | 'sku'

export interface ListBalancesQuery extends PageQuery {
  warehouseId?: string
  locationId?: string
  variantId?: string
  productId?: string
  sortBy?: BalanceSortField
  sortOrder?: SortOrder
}

export interface SummaryQuery extends PageQuery {
  warehouseId?: string
  productId?: string
}

export interface ListInventoryMovementsQuery extends PageQuery {
  variantId?: string
  warehouseId?: string
  referenceType?: string
  referenceId?: string
  from?: string
  to?: string
}

/** Các endpoint summary/movements/balances trả về cấu trúc list/meta từ BE. */
export type InventoryBalancesResponse = Record<string, unknown>
export type InventorySummaryResponse = Record<string, unknown>
export type InventoryMovementsResponse = Record<string, unknown>
