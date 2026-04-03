import type {
  CreateUnitRequest,
  ListResponse,
  ListUnitsQuery,
  Unit,
  UpdateUnitRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const unitsService = {
  list(params?: ListUnitsQuery) {
    return getJson<ListResponse<Unit>>('/master-data/units', { params })
  },

  findOne(id: string, params?: { includeDeleted?: boolean }) {
    return getJson<Unit>(`/master-data/units/${id}`, { params })
  },

  create(body: CreateUnitRequest) {
    return postJson<Unit, CreateUnitRequest>('/master-data/units', body)
  },

  update(id: string, body: UpdateUnitRequest) {
    return patchJson<Unit, UpdateUnitRequest>(`/master-data/units/${id}`, body)
  },

  remove(id: string) {
    return deleteJson(`/master-data/units/${id}`)
  },
}
