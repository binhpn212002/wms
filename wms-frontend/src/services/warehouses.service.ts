import type {
  CreateLocationRequest,
  CreateWarehouseRequest,
  GetWarehouseQuery,
  ListLocationsQuery,
  ListResponse,
  ListWarehousesQuery,
  Location,
  UpdateWarehouseRequest,
  Warehouse,
  WarehouseLocationsResult,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const warehousesService = {
  list(params?: ListWarehousesQuery) {
    return getJson<ListResponse<Warehouse>>('/warehouses', { params })
  },

  create(body: CreateWarehouseRequest) {
    return postJson<Warehouse, CreateWarehouseRequest>('/warehouses', body)
  },

  findOne(id: string, params?: GetWarehouseQuery) {
    return getJson<Warehouse>(`/warehouses/${id}`, { params })
  },

  update(id: string, body: UpdateWarehouseRequest) {
    return patchJson<Warehouse, UpdateWarehouseRequest>(
      `/warehouses/${id}`,
      body,
    )
  },

  remove(id: string) {
    return deleteJson(`/warehouses/${id}`)
  },

  listLocations(warehouseId: string, params?: ListLocationsQuery) {
    return getJson<WarehouseLocationsResult>(
      `/warehouses/${warehouseId}/locations`,
      { params },
    )
  },

  createLocation(warehouseId: string, body: CreateLocationRequest) {
    return postJson<Location, CreateLocationRequest>(
      `/warehouses/${warehouseId}/locations`,
      body,
    )
  },
}
