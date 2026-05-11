"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useCallback } from "react";
import {
  Printer,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Scale,
  Landmark,
  RefreshCw,
  Info,
  Activity,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CapitalBalancePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState({
    assets: [],
    liabilities: [],
    equity: [],
    summary: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/capital-balance`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data || { assets: [], liabilities: [], equity: [], summary: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 } });
      } else {
        toast.error(result.message || "Failed to fetch financial data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const exportData = useMemo(() => {
    const allAccounts = [
      ...(data.assets || []).map(a => ({ ...a, Category: 'Asset' })),
      ...(data.liabilities || []).map(a => ({ ...a, Category: 'Liability' })),
      ...(data.equity || []).map(a => ({ ...a, Category: 'Equity' }))
    ];
    return allAccounts.map(item => ({
      "Account Name": item.name,
      "Account Code": item.code,
      "Category": item.Category,
      "Ledger Balance": Number(item.balance || 0),
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Timestamp": new Date().toLocaleString()
    }));
  }, [data, session]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Capital Balance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Clinical verification of organizational net worth and equity attribution</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Capital_Balance_Audit_Report"
              onPrint={() => window.print()}
              showPrint={true}
            />
            <Button 
                variant="outline" 
                size="icon"
                onClick={fetchData} 
                className="h-9 w-9 p-0 border-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 bg-transparent rounded-lg" 
                disabled={isLoading}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Net Worth Diagnostics Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Assets */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-400 text-white shrink-0 self-start">
                  <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total Assets</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold text-foreground truncate">{formatCurrency(data.summary?.totalAssets || 0)}</h3>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">Cash · Reserve · Assets</p>
              </div>
          </div>

          {/* Total Liabilities */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-rose-500 to-red-400 text-white shrink-0 self-start">
                  <TrendingDown className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total Liabilities</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold text-foreground truncate">{formatCurrency(data.summary?.totalLiabilities || 0)}</h3>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">Debt · Payables · Tax</p>
              </div>
          </div>

          {/* Net Worth */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 text-white shrink-0 self-start">
                  <Scale className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Net Worth</p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold text-foreground truncate">{formatCurrency(data.summary?.netWorth || 0)}</h3>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-widest">Equity · Earnings</p>
              </div>
          </div>
        </div>

        {/* Account Ledgers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ASSETS REGISTRY */}
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
            <CardHeader className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100">
                  <Activity className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Assets Category Ledger</h3>
                  <p className="text-xs text-muted-foreground">Recognition of controlled economic resources</p>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Account Identifier</TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">Code</TableHead>
                    <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Ledger Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6 py-3.5"><Skeleton className="h-4 w-40 bg-gray-100" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 bg-gray-100" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-4 w-24 ml-auto bg-gray-100" /></TableCell>
                      </TableRow>
                    ))
                  ) : (data.assets || []).length > 0 ? data.assets.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors border-b border-border group">
                      <TableCell className="pl-6 py-3.5">
                         <span className="text-sm font-semibold text-foreground tracking-tight">{acc.name}</span>
                      </TableCell>
                      <TableCell>
                         <span className="text-xs font-medium font-mono py-0.5 px-2 rounded-md bg-muted text-muted-foreground">{acc.code}</span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <span className="text-sm font-semibold text-blue-600 tabular-nums">
                            {formatCurrency(acc.balance || 0)}
                         </span>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="py-12 text-center">
                         <div className="flex flex-col items-center justify-center gap-2 opacity-30 text-muted-foreground">
                            <History className="size-10" />
                            <p className="text-xs font-bold uppercase tracking-widest">Zero Asset Visibility</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="px-6 py-4 flex justify-between items-center border-t border-border bg-muted/30">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Aggregate Assets Value</span>
              <span className="text-sm font-bold text-blue-600 tabular-nums">{isLoading ? <Skeleton className="h-5 w-28 bg-gray-200" /> : formatCurrency(data.summary?.totalAssets || 0)}</span>
            </div>
          </Card>

          {/* LIABILITIES + EQUITY REGISTRY */}
          <div className="space-y-6">

            {/* Liabilities Registry */}
            <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
              <CardHeader className="p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Liabilities Category Ledger</h3>
                    <p className="text-xs text-muted-foreground">Recognition of outstanding financial obligations</p>
                  </div>
                </div>
              </CardHeader>
              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Account Identifier</TableHead>
                      <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">Code</TableHead>
                      <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Ledger Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="border-b border-border">
                          <TableCell className="pl-6 py-3.5"><Skeleton className="h-4 w-40 bg-gray-100" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12 bg-gray-100" /></TableCell>
                          <TableCell className="pr-6"><Skeleton className="h-4 w-24 ml-auto bg-gray-100" /></TableCell>
                        </TableRow>
                      ))
                    ) : (data.liabilities || []).length > 0 ? data.liabilities.map((acc) => (
                      <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors border-b border-border group">
                        <TableCell className="pl-6 py-3.5">
                           <span className="text-sm font-semibold text-foreground tracking-tight">{acc.name}</span>
                        </TableCell>
                        <TableCell>
                           <span className="text-xs font-medium font-mono py-0.5 px-2 rounded-md bg-muted text-muted-foreground">{acc.code}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <span className="text-sm font-semibold text-rose-600 tabular-nums">
                              {formatCurrency(acc.balance || 0)}
                           </span>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={3} className="py-12 text-center">
                           <div className="flex flex-col items-center justify-center gap-2 opacity-30 text-muted-foreground">
                              <History className="size-10" />
                              <p className="text-xs font-bold uppercase tracking-widest">Zero Liability Visibility</p>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="px-6 py-4 flex justify-between items-center border-t border-border bg-muted/30">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Aggregate Liabilities Value</span>
                <span className="text-sm font-bold text-rose-600 tabular-nums">{isLoading ? <Skeleton className="h-5 w-28 bg-gray-200" /> : formatCurrency(data.summary?.totalLiabilities || 0)}</span>
              </div>
            </Card>

            {/* Business Equity Matrix */}
            <Card className="border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm rounded-lg overflow-hidden transition-all hover:-translate-y-0.5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 leading-none">Total Retained Capital</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5"><Activity className="size-3" /> Cumulative Growth Recognition</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums tracking-tighter">
                      {isLoading ? <Skeleton className="h-8 w-36 bg-emerald-200" /> : formatCurrency(data.summary?.netWorth || 0)}
                    </h2>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Capital Balance Intelligence Disclaimer */}
        <Card className="border shadow-none bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="p-2.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Capital Balance Intelligence</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                  The Capital Balance (or Net Worth) represents the structural financial health of the organization. A positive net worth indicates that assets exceed liabilities, signifying cumulative stability and retained equity over the audit period.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
