import type {
  CreateOutboundRequest,
  ListOutboundQuery,
  ListResponse,
  OutboundDocument,
  ReplaceOutboundLinesRequest,
  UpdateOutboundRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson, putJson } from './request'

export const outboundService = {
  create(body: CreateOutboundRequest) {
    return postJson<OutboundDocument, CreateOutboundRequest>(
      '/outbound',
      body,
    )
  },

  list(params?: ListOutboundQuery) {
    return getJson<ListResponse<OutboundDocument>>('/outbound', { params })
  },

  findOne(id: string) {
    return getJson<OutboundDocument>(`/outbound/${id}`)
  },

  update(id: string, body: UpdateOutboundRequest) {
    return patchJson<OutboundDocument, UpdateOutboundRequest>(
      `/outbound/${id}`,
      body,
    )
  },

  replaceLines(id: string, body: ReplaceOutboundLinesRequest) {
    return putJson<OutboundDocument, ReplaceOutboundLinesRequest>(
      `/outbound/${id}/lines`,
      body,
    )
  },

  validate(id: string) {
    return postJson<unknown>(`/outbound/${id}/validate`)
  },

  confirm(id: string) {
    return postJson<OutboundDocument>(`/outbound/${id}/confirm`)
  },

  complete(id: string) {
    return postJson<OutboundDocument>(`/outbound/${id}/complete`)
  },

  remove(id: string) {
    return deleteJson(`/outbound/${id}`)
  },
}
