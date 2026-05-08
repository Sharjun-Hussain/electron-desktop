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
  title: "Sales History & Transaction Audits | Inzeedo POS",
  description: "Monitor and audit all historical transactions across your business locations with the Inzeedo POS centralized sales history module.",
};
