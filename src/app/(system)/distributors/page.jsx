import { BRAND } from "@/lib/branding";
import { DistributorsManagement } from "@/components/distributors/DistributorsManagement";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const page = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing Distributor Network...</p>
        </div>
      </div>
    }>
      <DistributorsManagement />
    </Suspense>
  );
};

export default page;

export const metadata = {
  title: `Distributor Network & Wholesale Partners | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Manage your wholesale distribution network, track partner performance, and audit distributor ledgers with ${BRAND.APP_NAME} POS centralized management tools.`,
};
