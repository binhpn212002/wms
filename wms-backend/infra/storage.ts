/** Báo cáo / export lớn → S3 (xem specs/integrations/aws-low-stock-and-async.md §5). */
export const reportExportsBucket = new sst.aws.Bucket("ReportExports");
