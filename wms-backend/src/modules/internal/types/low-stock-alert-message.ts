/** Payload một message SQS → Lambda gửi email */
export interface LowStockAlertLine {
  variantId: string;
  warehouseId: string;
  sku: string;
  productName: string;
  warehouseName: string;
  quantity: string;
  minStock: string;
}

export interface LowStockAlertQueueMessage {
  subject: string;
  recipientEmails: string[];
  items: LowStockAlertLine[];
  generatedAt: string;
}
