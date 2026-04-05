/**
 * Hàng đợi giai đoạn mở rộng: Scanner → SQS → Notifier (retry + DLQ).
 * @see specs/integrations/aws-low-stock-and-async.md
 */
export const lowStockDlq = new sst.aws.Queue("LowStockDlq");

export const lowStockQueue = new sst.aws.Queue("LowStockQueue", {
  dlq: lowStockDlq.arn,
  visibilityTimeout: "1 minute",
});

/** DLQ cho EventBridge Scheduler khi invoke Lambda thất bại (không trộn với DLQ tin SQS nghiệp vụ). */
export const schedulerInvocationDlq = new sst.aws.Queue(
  "SchedulerInvocationDlq",
);
