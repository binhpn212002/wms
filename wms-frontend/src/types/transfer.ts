import type { PageQuery } from './pagination'

export type TransferStatus = 'draft' | 'completed'

export type TransferSortField =
  | 'document_date'
  | 'document_no'
  | 'created_at'

export type TransferDocument = Record<string, unknown>

export interface TransferLineInput {
  variantId: string
  quantity: string
  warehouseIdFrom: string
  locationIdFrom: string
  warehouseIdTo: string
  locationIdTo: string
}

export interface ListTransfersQuery extends PageQuery {
  sortBy?: TransferSortField
  status?: TransferStatus
  from?: string
  to?: string
}

export interface CreateTransferRequest {
  documentNo?: string
  documentDate?: string
  note?: string | null
  lines?: TransferLineInput[]
}

export interface ReplaceTransferLinesRequest {
  lines: TransferLineInput[]
}

export type UpdateTransferRequest = Partial<
  Pick<CreateTransferRequest, 'documentNo' | 'documentDate' | 'note'>
>
