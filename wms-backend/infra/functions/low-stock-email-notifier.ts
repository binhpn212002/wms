import {
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";

type LowStockLine = {
  variantId: string;
  warehouseId: string;
  sku: string;
  productName: string;
  warehouseName: string;
  quantity: string;
  minStock: string;
};

type QueueBody = {
  subject: string;
  recipientEmails: string[];
  items: LowStockLine[];
  generatedAt: string;
};

function buildHtml(items: LowStockLine[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.sku)}</td><td>${escapeHtml(i.productName)}</td><td>${escapeHtml(i.warehouseName)}</td><td>${escapeHtml(i.quantity)}</td><td>${escapeHtml(i.minStock)}</td></tr>`,
    )
    .join("");
  return `<!DOCTYPE html><html><body>
<p>Các dòng tồn kho ≤ ngưỡng tối thiểu (min_stock):</p>
<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>SKU</th><th>Sản phẩm</th><th>Kho</th><th>Tồn</th><th>Min</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function handler(event: { Records?: { body?: string }[] }) {
  const from = process.env.SES_FROM_EMAIL?.trim();
  if (!from) {
    console.error("[wms] notifier: SES_FROM_EMAIL is not set");
    throw new Error("SES_FROM_EMAIL missing");
  }

  const region =
    process.env.SES_REGION?.trim() ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION;
  const client = new SESv2Client(region ? { region } : {});

  const records = event.Records ?? [];
  for (const rec of records) {
    if (!rec.body) continue;
    let payload: QueueBody;
    try {
      payload = JSON.parse(rec.body) as QueueBody;
    } catch {
      console.error("[wms] notifier: invalid JSON body");
      continue;
    }

    const to = payload.recipientEmails?.filter(Boolean) ?? [];
    if (to.length === 0) {
      console.warn("[wms] notifier: no recipients");
      continue;
    }

    const html = buildHtml(payload.items ?? []);
    const text = (payload.items ?? [])
      .map(
        (i) =>
          `${i.sku} | ${i.productName} | ${i.warehouseName} | tồn ${i.quantity} | min ${i.minStock}`,
      )
      .join("\n");

    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        Content: {
          Simple: {
            Subject: { Data: payload.subject || "WMS — Tồn thấp" },
            Body: {
              Html: { Data: html },
              Text: { Data: text || "(no lines)" },
            },
          },
        },
      }),
    );

    console.info(
      "[wms] notifier: sent",
      to.length,
      "recipient(s),",
      payload.items?.length ?? 0,
      "line(s)",
    );
  }
}
