import { lowStockQueue } from "./queues";
import { reportExportsBucket } from "./storage";

/**
 * Consumer SQS → Lambda gửi email (stub). Lịch quét nằm ở `schedulers.ts`.
 */
lowStockQueue.subscribe({
  handler: "infra/functions/low-stock-email-notifier.handler",
  timeout: "1 minute",
  memory: "256 MB",
  link: [reportExportsBucket],
  environment: {
    SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ?? "",
    SES_REGION:
      process.env.SES_REGION ??
      process.env.AWS_REGION ??
      process.env.AWS_DEFAULT_REGION ??
      "",
  },
  permissions: [
    {
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    },
  ],
});
