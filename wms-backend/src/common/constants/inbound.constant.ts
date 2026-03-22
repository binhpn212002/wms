/** Phiếu nhập — thống nhất với specs/inbound/detail-design.md */

export const TABLE_INBOUND_DOCUMENTS = 'inbound_documents';
export const TABLE_INBOUND_LINES = 'inbound_lines';

export enum InboundDocumentStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
}
