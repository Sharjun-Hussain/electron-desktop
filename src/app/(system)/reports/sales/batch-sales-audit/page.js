import { BRAND } from "@/lib/branding";
import BatchWiseSalesReport from "@/components/reports/sales/BatchWiseSalesReport";

export const metadata = {
  title: `Batch-wise Sales Audit | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Detailed daily analysis of sales by products, categories, and batches.",
};

export default function BatchAuditPage() {
  return <BatchWiseSalesReport />;
}
