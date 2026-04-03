import type {
  InventoryBalancesResponse,
  InventoryMovementsResponse,
  InventorySummaryResponse,
  ListBalancesQuery,
  ListInventoryMovementsQuery,
  SummaryQuery,
} from '../types'
import { getJson } from './request'

export const inventoryService = {
  listBalances(params?: ListBalancesQuery) {
    return getJson<InventoryBalancesResponse>('/inventory/balances', {
      params,
    })
  },

  summaryByProduct(params?: SummaryQuery) {
    return getJson<InventorySummaryResponse>(
      '/inventory/summary/by-product',
      { params },
    )
  },

  summaryByWarehouse(params?: SummaryQuery) {
    return getJson<InventorySummaryResponse>(
      '/inventory/summary/by-warehouse',
      { params },
    )
  },

  listMovements(params?: ListInventoryMovementsQuery) {
    return getJson<InventoryMovementsResponse>('/inventory/movements', {
      params,
    })
  },
}
