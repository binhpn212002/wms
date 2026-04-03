import type { PageQuery } from './pagination'

export type InboundDocumentStatus = 'draft' | 'confirmed' | 'completed'

export type InboundSortField =
  | 'document_date'
  | 'document_no'
  | 'created_at'

export interface InboundLine {
  id: string
  inboundDocumentId: string
  lineNo: number
  variantId: string
  quantity: string
  unitPrice: string | null
  locationId: string
  createdAt?: string
  updatedAt?: string
  [k: string]: unknown
}

/** MVP fields + mở rộng (cho phép BE thêm field). */
export interface InboundDocument {
  id: string
  documentNo: string
  documentDate: string
  supplierId: string
  warehouseId: string
  status: InboundDocumentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  lines?: InboundLine[]
  [k: string]: unknown
}

export interface ListInboundQuery extends PageQuery {
  sortBy?: InboundSortField
  warehouseId?: string
  supplierId?: string
  status?: InboundDocumentStatus
  from?: string
  to?: string
}

export interface CreateInboundRequest {
  supplierId: string
  warehouseId: string
  documentNo?: string
  documentDate?: string
  notes?: string | null
}

export interface InboundLineInput {
  lineNo: number
  variantId: string
  quantity: string
  unitPrice?: string | null
  locationId?: string
}

export interface ReplaceInboundLinesRequest {
  lines: InboundLineInput[]
}

export type UpdateInboundRequest = Partial<
  Pick<
    CreateInboundRequest,
    'supplierId' | 'warehouseId' | 'documentNo' | 'documentDate' | 'notes'
  >
>
