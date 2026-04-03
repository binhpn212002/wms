import type {
  AttributeValue,
  CreateAttributeValueRequest,
  ListAttributeValuesQuery,
  ListResponse,
  UpdateAttributeValueRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson } from './request'

const base = (attributeId: string) =>
  `/master-data/attributes/${attributeId}/values`

export const attributeValuesService = {
  list(attributeId: string, params?: ListAttributeValuesQuery) {
    return getJson<ListResponse<AttributeValue>>(base(attributeId), {
      params,
    })
  },

  findOne(
    attributeId: string,
    id: string,
    params?: { includeDeleted?: boolean },
  ) {
    return getJson<AttributeValue>(`${base(attributeId)}/${id}`, { params })
  },

  create(attributeId: string, body: CreateAttributeValueRequest) {
    return postJson<AttributeValue, CreateAttributeValueRequest>(
      base(attributeId),
      body,
    )
  },

  update(
    attributeId: string,
    id: string,
    body: UpdateAttributeValueRequest,
  ) {
    return patchJson<AttributeValue, UpdateAttributeValueRequest>(
      `${base(attributeId)}/${id}`,
      body,
    )
  },

  remove(attributeId: string, id: string) {
    return deleteJson(`${base(attributeId)}/${id}`)
  },
}
