import { registerAs } from '@nestjs/config';

export default registerAs('lowStockAlert', () => ({
  queueUrl: process.env.LOW_STOCK_QUEUE_URL ?? '',
}));
