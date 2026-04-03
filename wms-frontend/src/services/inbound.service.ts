import type {
  CreateInboundRequest,
  InboundDocument,
  ListInboundQuery,
  ListResponse,
  ReplaceInboundLinesRequest,
  UpdateInboundRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson, putJson } from './request'

export const inboundService = {
  create(body: CreateInboundRequest) {
    return postJson<InboundDocument, CreateInboundRequest>('/inbound', body)
  },

  list(params?: ListInboundQuery) {
    return getJson<ListResponse<InboundDocument>>('/inbound', { params })
  },

  findOne(id: string) {
    return getJson<InboundDocument>(`/inbound/${id}`)
  },

  update(id: string, body: UpdateInboundRequest) {
    return patchJson<InboundDocument, UpdateInboundRequest>(
      `/inbound/${id}`,
      body,
    )
  },

  replaceLines(id: string, body: ReplaceInboundLinesRequest) {
    return putJson<InboundDocument, ReplaceInboundLinesRequest>(
      `/inbound/${id}/lines`,
      body,
    )
  },

  confirm(id: string) {
    return postJson<InboundDocument>(`/inbound/${id}/confirm`)
  },

  complete(id: string) {
    return postJson<InboundDocument>(`/inbound/${id}/complete`)
  },

  remove(id: string) {
    return deleteJson(`/inbound/${id}`)
  },
}
