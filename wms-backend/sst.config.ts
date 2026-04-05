/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "wms-backend",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region:
            process.env.AWS_DEFAULT_REGION ??
            process.env.AWS_REGION ??
            "ap-southeast-1",
        },
      },
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    const queues = await import("./infra/queues");
    await import("./infra/schedulers");
    await import("./infra/low-stock");

    return {
      reportExportsBucket: storage.reportExportsBucket.name,
      lowStockQueueUrl: queues.lowStockQueue.url,
      lowStockDlqUrl: queues.lowStockDlq.url,
      schedulerInvocationDlqUrl: queues.schedulerInvocationDlq.url,
    };
  },
});
