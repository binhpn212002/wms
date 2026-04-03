import type { ListResponse, PageQuery, SortOrder } from './pagination'

export type BalanceSortField = 'updatedAt' | 'quantity' | 'sku'

/** Một dòng tồn theo kho + vị trí + biến thể (GET /inventory/balances). */
export interface StockBalanceItem {
  id: string
  warehouseId: string
  warehouseCode?: string
  warehouseName?: string
  locationId: string
  locationCode?: string
  variantId: string
  sku: string
  productId: string
  productCode: string
  productName: string
  quantity: string
  updatedAt: string
}

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

/** GET /inventory/balances */
export type InventoryBalancesResponse = ListResponse<StockBalanceItem>
export type InventorySummaryResponse = Record<string, unknown>
export type InventoryMovementsResponse = Record<string, unknown>

/** GET /inventory-check/lookup */
export type InventoryCheckMode = 'summary' | 'details'

export interface InventoryCheckLookupQuery {
  q: string
  warehouseId?: string
  locationId?: string
  mode?: InventoryCheckMode
  page?: number
  pageSize?: number
}

export interface InventoryCheckVariantQuery {
  warehouseId?: string
  locationId?: string
  mode?: InventoryCheckMode
}

export interface InventoryCheckProductEmbed {
  id: string
  code: string
  name: string
}

export interface InventoryCheckBreakdownWarehouse {
  warehouseId: string
  code: string
  name: string
  quantity: number
}

export interface InventoryCheckLine {
  warehouseId: string
  warehouse: { id: string; code: string; name: string }
  locationId: string
  location: { id: string; code: string; name: string | null }
  quantity: number
  balanceUpdatedAt: string
}

export interface InventoryCheckItem {
  variantId: string
  productId: string
  sku: string
  barcode: string | null
  product: InventoryCheckProductEmbed
  defaultUomId: string
  quantity: number
  breakdownByWarehouse?: InventoryCheckBreakdownWarehouse[]
  lines?: InventoryCheckLine[]
}

export interface InventoryCheckLookupResponse {
  items: InventoryCheckItem[]
  page: number
  pageSize: number
  totalItems: number
}
