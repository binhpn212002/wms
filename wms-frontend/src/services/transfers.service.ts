import type {
  CreateTransferRequest,
  ListResponse,
  ListTransfersQuery,
  ReplaceTransferLinesRequest,
  TransferDocument,
  UpdateTransferRequest,
} from '../types'
import { deleteJson, getJson, patchJson, postJson, putJson } from './request'

export const transfersService = {
  create(body: CreateTransferRequest) {
    return postJson<TransferDocument, CreateTransferRequest>(
      '/transfers',
      body,
    )
  },

  list(params?: ListTransfersQuery) {
    return getJson<ListResponse<TransferDocument>>('/transfers', { params })
  },

  findOne(id: string) {
    return getJson<TransferDocument>(`/transfers/${id}`)
  },

  update(id: string, body: UpdateTransferRequest) {
    return patchJson<TransferDocument, UpdateTransferRequest>(
      `/transfers/${id}`,
      body,
    )
  },

  replaceLines(id: string, body: ReplaceTransferLinesRequest) {
    return putJson<TransferDocument, ReplaceTransferLinesRequest>(
      `/transfers/${id}/lines`,
      body,
    )
  },

  validate(id: string) {
    return postJson<unknown>(`/transfers/${id}/validate`)
  },

  complete(id: string) {
    return postJson<TransferDocument>(`/transfers/${id}/complete`)
  },

  remove(id: string) {
    return deleteJson(`/transfers/${id}`)
  },
}
