/** Bảng & enum tồn kho — thống nhất với specs/inventory/detail-design.md */

export const TABLE_STOCK_BALANCES = 'stock_balances';
export const TABLE_INVENTORY_MOVEMENTS = 'inventory_movements';

export enum InventoryMovementType {
  INBOUND_RECEIPT = 'INBOUND_RECEIPT',
  OUTBOUND_ISSUE = 'OUTBOUND_ISSUE',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum InventoryReferenceType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

/** Khớp warehouses basic-design: zone / rack / bin */
export const LocationType = {
  ZONE: 'zone',
  RACK: 'rack',
  BIN: 'bin',
} as const;

export type LocationTypeValue =
  (typeof LocationType)[keyof typeof LocationType];
