import type { PageQuery } from './pagination'

export type OutboundDocumentStatus = 'draft' | 'confirmed' | 'completed'

export type OutboundSortField =
  | 'document_date'
  | 'document_no'
  | 'created_at'

export interface OutboundLine {
  id: string
  outboundDocumentId: string
  lineNo: number
  variantId: string
  quantity: string
  locationId: string
  createdAt?: string
  updatedAt?: string
  [k: string]: unknown
}

/** MVP fields + mở rộng (cho phép BE thêm field). */
export interface OutboundDocument {
  id: string
  documentNo: string
  documentDate: string
  warehouseId: string
  status: OutboundDocumentStatus
  reason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  lines?: OutboundLine[]
  [k: string]: unknown
}

export interface ListOutboundQuery extends PageQuery {
  sortBy?: OutboundSortField
  warehouseId?: string
  status?: OutboundDocumentStatus
  from?: string
  to?: string
}

export interface CreateOutboundRequest {
  warehouseId: string
  documentNo?: string
  documentDate?: string
  reason?: string | null
  notes?: string | null
}

export interface OutboundLineInput {
  lineNo: number
  variantId: string
  quantity: string
  locationId: string
}

export interface ReplaceOutboundLinesRequest {
  lines: OutboundLineInput[]
}

export type UpdateOutboundRequest = Partial<
  Pick<
    CreateOutboundRequest,
    'warehouseId' | 'documentNo' | 'documentDate' | 'reason' | 'notes'
  >
>
