/**
 * Scheduler hằng ngày: gọi API nội bộ WMS → API kiểm tra tồn thấp và đẩy SQS → Lambda notifier gửi mail.
 */
export async function handler() {
  const url = process.env.WMS_INTERNAL_LOW_STOCK_SCAN_URL;
  const apiKey = process.env.INTERNAL_API_KEY;

  if (!url?.trim() || !apiKey?.trim()) {
    console.error(
      "[wms] low-stock-scanner: missing WMS_INTERNAL_LOW_STOCK_SCAN_URL or INTERNAL_API_KEY",
    );
    throw new Error("Scanner misconfigured");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": apiKey,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[wms] low-stock-scanner: API error", res.status, text);
    throw new Error(`Internal API ${res.status}`);
  }

  try {
    const body = JSON.parse(text) as {
      belowThresholdCount?: number;
      enqueued?: boolean;
      recipientCount?: number;
    };
    console.info("[wms] low-stock-scanner: ok", body);
  } catch {
    console.info("[wms] low-stock-scanner: ok", text);
  }
}
