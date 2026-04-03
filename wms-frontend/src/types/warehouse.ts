import type { ListResponse, PageQuery, SortOrder } from './pagination'

export type WarehouseSortField = 'code' | 'name' | 'created_at'

export interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  active: boolean
  defaultLocationId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ListWarehousesQuery extends PageQuery {
  sortBy?: WarehouseSortField
  sort?: SortOrder
  active?: boolean
  includeDeleted?: boolean
}

export interface GetWarehouseQuery {
  includeDeleted?: boolean
}

export interface CreateWarehouseRequest {
  code: string
  name: string
  address?: string
  active?: boolean
  defaultLocationId?: string | null
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest>

export type LocationsView = 'flat' | 'tree'

export type LocationSortField = 'code' | 'name' | 'created_at'

export interface ListLocationsQuery extends PageQuery {
  view?: LocationsView
  type?: string
  sortBy?: LocationSortField
  sort?: SortOrder
  includeDeleted?: boolean
}

export interface Location {
  id: string
  warehouseId: string
  parentId: string | null
  type: string
  code: string
  name: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  children?: Location[]
}

/** `GET /warehouses/:id/locations` — flat (phân trang) hoặc tree. */
export type WarehouseLocationsResult =
  | ListResponse<Location>
  | { view: 'tree'; data: Location[] }

export interface CreateLocationRequest {
  parentId?: string
  type: string
  code: string
  name?: string
}

export interface GetLocationQuery {
  includeDeleted?: boolean
}

export type UpdateLocationRequest = Partial<
  Pick<CreateLocationRequest, 'code' | 'name' | 'parentId' | 'type'>
>
