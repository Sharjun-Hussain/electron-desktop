import { BRAND } from "@/lib/branding";
import SalesHistory from "@/components/sales/SalesHistory";
import { Suspense } from "react";
import { SalesHistorySkeleton } from "@/components/sales/SalesHistorySkeleton";

const page = () => {
  return (
    <Suspense fallback={<SalesHistorySkeleton />}>
      <SalesHistory />
    </Suspense>
  );
};

export default page;

export const metadata = {
  title: `Sales History & Transaction Audits | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Monitor and audit all historical transactions across your business locations with the ${BRAND.APP_NAME} POS centralized sales history module.`,
};
