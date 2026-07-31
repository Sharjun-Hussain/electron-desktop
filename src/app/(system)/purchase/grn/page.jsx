import { BRAND } from "@/lib/branding";
import GRNReportPage from "@/components/purchase/grn/GRNReportPage";

export const metadata = {
  title: `GRN History | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "View and analyze Good Received Notes",
};

export default function Page() {
  return <GRNReportPage />;
}
