import type { GetLocationQuery, Location, UpdateLocationRequest } from '../types'
import { deleteJson, getJson, patchJson } from './request'

export const locationsService = {
  findOne(id: string, params?: GetLocationQuery) {
    return getJson<Location>(`/locations/${id}`, { params })
  },

  update(id: string, body: UpdateLocationRequest) {
    return patchJson<Location, UpdateLocationRequest>(`/locations/${id}`, body)
  },

  remove(id: string) {
    return deleteJson(`/locations/${id}`)
  },
}
