/** Phiếu xuất — thống nhất với specs/outbound/detail-design.md */

export const TABLE_OUTBOUND_DOCUMENTS = 'outbound_documents';
export const TABLE_OUTBOUND_LINES = 'outbound_lines';

export enum OutboundDocumentStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
}
