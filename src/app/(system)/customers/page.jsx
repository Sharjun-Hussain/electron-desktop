import { CustomersManagement } from "@/components/customers/customers-management";
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";

const page = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Synchronizing Client Records...</p>
        </div>
      </div>
    }>
      <CustomersManagement />
    </Suspense>
  );
};

export default page;

export const metadata = {
  title: "Client Portfolios & Relationship Management | Inzeedo POS",
  description: "Track customer transactions, manage loyalty points, and audit client ledgers with Inzeedo POS centralized CRM and relationship management tools.",
};
