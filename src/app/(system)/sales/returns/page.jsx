import { BRAND } from "@/lib/branding";

import SalesReturnHistoryPage from "@/components/sales/SalesReturnHistory";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const page = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading Return History...</p>
        </div>
      </div>
    }>
      <SalesReturnHistoryPage />
    </Suspense>
  );
};

export default page;

export const metadata = {
  title: `Sales Returns & Refund Audits | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Manage and audit customer returns, track refund history, and maintain inventory accuracy with the ${BRAND.APP_NAME} POS centralized sales return module.`,
};
