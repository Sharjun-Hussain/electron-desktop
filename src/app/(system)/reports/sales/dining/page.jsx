import { DiningSalesReport } from "@/components/reports/sales/DiningSalesReport";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Restaurant & Dining Analytics | Inzeedo ERP",
  description: "Track Dine-In vs Takeaway splits, analyze table occupancy, and review waiter performance ratios.",
};

export default function DiningReportRoute() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Dining Analytics...</p>
        </div>
      </div>
    }>
      <DiningSalesReport />
    </Suspense>
  );
}
