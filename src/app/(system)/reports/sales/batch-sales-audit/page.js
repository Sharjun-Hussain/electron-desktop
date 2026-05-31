import BatchWiseSalesReport from "@/components/reports/sales/BatchWiseSalesReport";

export const metadata = {
  title: "Batch-wise Sales Audit | Inzeedo POS",
  description: "Detailed daily analysis of sales by products, categories, and batches.",
};

export default function BatchAuditPage() {
  return <BatchWiseSalesReport />;
}
