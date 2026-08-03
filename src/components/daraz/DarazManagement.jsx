"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Store,
  Users,
  ShoppingCart,
  ClipboardList,
  Wallet,
  PieChart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DarazSalesEntry } from "./DarazSalesEntry";
import { DarazOrdersOverview } from "./DarazOrdersOverview";
import { DarazReports } from "./DarazReports";
import { CustomersManagement } from "@/components/customers/customers-management";
import ExpenseManagement from "@/components/expenses/expense-management";

export function DarazManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "active-pos");

  // Keep state in sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("active-pos");
    }
  }, [searchParams]);

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }, [searchParams, pathname]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Module Header */}
      <div className="px-6 py-6 border-b border-border bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20 dark:shadow-orange-500/5">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Daraz E-Commerce Manager</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Process external sales and synchronize your storefront customers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex-1 flex flex-col w-full h-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
          <div className="px-6 pt-6 max-w-[1600px] mx-auto w-full">
            <TabsList className="bg-card border border-border p-1 rounded-xl shadow-xs h-12 flex flex-wrap max-w-fit pb-0">
              <TabsTrigger value="active-pos" className="rounded-lg border-none data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-transparent dark:data-[state=active]:border-transparent px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
                <ShoppingCart className="h-4 w-4" />
                Sales Entry
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg border-none data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-transparent dark:data-[state=active]:border-transparent px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
                <ClipboardList className="h-4 w-4" />
                Orders Overview
              </TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg border-none data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-transparent dark:data-[state=active]:border-transparent px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="expenses" className="rounded-lg border-none data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-transparent dark:data-[state=active]:border-transparent px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
                <Wallet className="h-4 w-4" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg border-none data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:text-white data-[state=active]:border-transparent dark:data-[state=active]:border-transparent px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
                <PieChart className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reports" className="mt-0 border-none p-0 focus-visible:ring-0 flex-1 flex flex-col">
            <div className="max-w-[1600px] mx-auto w-full flex-1">
              <DarazReports />
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-0 border-none p-0 focus-visible:ring-0 flex-1 flex flex-col">
            <div className="max-w-[1600px] mx-auto w-full flex-1">
              <DarazOrdersOverview />
            </div>
          </TabsContent>

          <TabsContent value="active-pos" className="mt-0 border-none p-0 focus-visible:ring-0">
            <div className="px-6 pb-6 max-w-[1600px] mx-auto w-full">
              <DarazSalesEntry />
            </div>
          </TabsContent>

          <TabsContent value="customers" className="mt-0 border-none p-0 focus-visible:ring-0 flex-1 flex flex-col">
            <div className="max-w-[1600px] mx-auto w-full flex-1">
              <CustomersManagement />
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-0 border-none p-0 focus-visible:ring-0 flex-1 flex flex-col">
            <div className="max-w-[1600px] mx-auto w-full flex-1">
              <ExpenseManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
