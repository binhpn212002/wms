import type { PageQuery, SortOrder } from './pagination'

export type UnitSortField = 'code' | 'name' | 'created_at'

export interface Unit {
  id: string
  code: string
  name: string
  symbol: string | null
  active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ListUnitsQuery extends PageQuery {
  sortBy?: UnitSortField
  sort?: SortOrder
  active?: boolean
  includeDeleted?: boolean
}

export interface CreateUnitRequest {
  code: string
  name: string
  symbol?: string | null
  active?: boolean
}

export type UpdateUnitRequest = Partial<CreateUnitRequest>
