import { lowStockQueue, schedulerInvocationDlq } from "./queues";
import { reportExportsBucket } from "./storage";

/**
 * EventBridge scheduled rule → Lambda — quét tồn thấp định kỳ.
 * @see specs/integrations/aws-low-stock-and-async.md §4
 *
 * Biến môi trường (cùng thư mục với sst.config.ts khi chạy SST):
 * - LOW_STOCK_SCHEDULER_ENABLED=true để bật lịch (mặc định tắt).
 * - LOW_STOCK_SCAN_SCHEDULE: biểu thức EventBridge (UTC). Mặc định ~08:00 Asia/Ho_Chi_Minh (UTC+7) = cron(0 1 * * ? *).
 * - WMS_INTERNAL_LOW_STOCK_SCAN_URL: URL đầy đủ POST …/api/v1/internal/low-stock/scan
 * - INTERNAL_API_KEY: trùng với Nest INTERNAL_API_KEY
 * - LOW_STOCK_SCHEDULE_TIMEZONE: IANA — lưu vào env cho handler; rule vẫn dùng UTC.
 * - LOW_STOCK_SCHEDULER_RETRIES: 0–2 (giới hạn async invoke của Lambda; mặc định 2).
 */
const schedule =
  process.env.LOW_STOCK_SCAN_SCHEDULE ?? "cron(0 1 * * ? *)";
const schedulerEnabled =
  process.env.LOW_STOCK_SCHEDULER_ENABLED === "true";
const scheduleTimezone =
  process.env.LOW_STOCK_SCHEDULE_TIMEZONE ?? "Asia/Ho_Chi_Minh";
const rawRetries = Number(process.env.LOW_STOCK_SCHEDULER_RETRIES ?? "2");
const schedulerRetries = Math.min(
  2,
  Math.max(0, Number.isFinite(rawRetries) ? rawRetries : 2),
);

export const lowStockScannerCron = new sst.aws.Cron("LowStockScanner", {
  schedule: "cron(0 1 * * ? *)",
  enabled: schedulerEnabled,
  event: {
    source: "wms.scheduler",
    job: "low-stock-scan",
  },
  function: {
    handler: "infra/functions/low-stock-scanner.handler",
    timeout: "2 minutes",
    memory: "512 MB",
    retries: schedulerRetries,
    link: [lowStockQueue, reportExportsBucket, schedulerInvocationDlq],
    transform: {
      eventInvokeConfig: (args) => {
        args.destinationConfig = {
          onFailure: { destination: schedulerInvocationDlq.arn },
        };
      },
    },
    environment: {
      LOW_STOCK_SCAN_SCHEDULE: schedule,
      LOW_STOCK_SCHEDULER_ENABLED: schedulerEnabled ? "true" : "false",
      LOW_STOCK_SCHEDULE_TIMEZONE: scheduleTimezone,
      LOW_STOCK_SCHEDULER_RETRIES: String(schedulerRetries),
      WMS_INTERNAL_LOW_STOCK_SCAN_URL:
        process.env.WMS_INTERNAL_LOW_STOCK_SCAN_URL ?? "",
      INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ?? "",
    },
  },
});
