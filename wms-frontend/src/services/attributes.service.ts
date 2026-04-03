import type {
  Attribute,
  CreateAttributeRequest,
  ListAttributesQuery,
  ListResponse,
  UpdateAttributeRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

export const attributesService = {
  list(params?: ListAttributesQuery) {
    return getJson<ListResponse<Attribute>>('/master-data/attributes', {
      params,
    })
  },

  findOne(id: string, params?: { includeDeleted?: boolean }) {
    return getJson<Attribute>(`/master-data/attributes/${id}`, { params })
  },

  create(body: CreateAttributeRequest) {
    return postJson<Attribute, CreateAttributeRequest>(
      '/master-data/attributes',
      body,
    )
  },

  update(id: string, body: UpdateAttributeRequest) {
    return patchJson<Attribute, UpdateAttributeRequest>(
      `/master-data/attributes/${id}`,
      body,
    )
  },

  remove(id: string) {
    return deleteJson(`/master-data/attributes/${id}`)
  },
}
