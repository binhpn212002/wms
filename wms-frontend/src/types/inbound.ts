import type { PageQuery } from './pagination'

export type InboundDocumentStatus = 'draft' | 'confirmed' | 'completed'

export type InboundSortField =
  | 'document_date'
  | 'document_no'
  | 'created_at'

/** Kiểu phiếu nhập chi tiết — giữ mở vì BE có thể mở rộng trường. */
export type InboundDocument = Record<string, unknown>

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
