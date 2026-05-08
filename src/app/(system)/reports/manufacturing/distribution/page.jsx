import DistributionReport from "@/components/reports/manufacturing/DistributionReport";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const page = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Aggregating Distribution Intelligence...</p>
        </div>
      </div>
    }>
      <DistributionReport />
    </Suspense>
  );
};

export default page;

export const metadata = {
  title: "Distribution Channel Analytics | Inzeedo POS",
  description: "Analyze your wholesale distribution performance, track partner shipments, and audit distributor network volumes with Inzeedo POS advanced manufacturing reports.",
};
