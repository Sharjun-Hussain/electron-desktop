"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Package,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  FileText,
  Printer,
  RefreshCw,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>

      <div className="flex items-center gap-1">
        {/* First */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        {/* Previous */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers — show up to 5 around current */}
        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (currentPage <= 2) {
              pageNum = i;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            if (pageNum >= 0 && pageNum < totalPages) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    currentPage === pageNum
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            }
            return null;
          })}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {/* Last */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CurrentStockValuePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/value`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stock value data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details || []);
        setSummary(result.data.summary);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory valuation");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 0 whenever search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          item.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.variant?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [data, searchQuery]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(
    () => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredData, currentPage, pageSize]
  );

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const exportData = useMemo(() => {
    return filteredData.map((item) => ({
      Product: item.product,
      Variant: item.variant,
      Branch: item.branch,
      Quantity: item.quantity,
      "Unit Cost": item.unit_cost,
      "Unit Price": item.unit_price,
      "Total Cost": item.total_cost,
      "Total Retail": item.total_retail,
    }));
  }, [filteredData]);

  // Stats data — same shape as GRN page stats
  const stats = [
    {
      label: "Stock Quantity",
      val: summary?.totalItems?.toLocaleString() ?? 0,
      desc: "Total units on hand",
      icon: Box,
      gradient: "from-indigo-500 to-blue-400",
    },
    {
      label: "Total Capital Cost",
      val: formatCurrency(summary?.totalCostValue ?? 0),
      desc: "Inventory asset value",
      icon: TrendingDown,
      gradient: "from-rose-500 to-pink-400",
    },
    {
      label: "Total Retail Value",
      val: formatCurrency(summary?.totalRetailValue ?? 0),
      desc: "Potential market value",
      icon: TrendingUp,
      gradient: "from-sky-500 to-cyan-400",
    },
    {
      label: "Estimated Profit",
      val: formatCurrency(summary?.potentialProfit ?? 0),
      desc: "Net valuation margin",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Valuation</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Asset inventory overview and current capital assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions
              data={exportData}
              fileName="Stock_Valuation_Report"
              onPrint={() => window.print()}
            />
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white shrink-0`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground truncate">{card.val}</h3>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Table Card ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden bg-card">
          {/* Toolbar */}
          <div className="border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2 bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">Asset Inventory Explorer</p>
                <p className="text-[12px] text-muted-foreground">
                  Valuation breakdown by product and variant
                </p>
              </div>
            </div>
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
              <Input
                placeholder="Find product assets..."
                className="h-8 pl-8 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-600 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 font-semibold text-muted-foreground py-3 text-[13px]">
                    Product Details
                  </TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-[13px]">
                    Branch
                  </TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground text-[13px]">
                    Quantity
                  </TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground text-[13px]">
                    Cost Analysis
                  </TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-[13px]">
                    Retail Analysis
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-gray-100 animate-pulse">
                      <TableCell className="pl-6 py-4">
                        <div className="h-4 w-40 bg-gray-100 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-20 bg-gray-50 dark:bg-slate-900 rounded mt-2" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-24 bg-gray-100 dark:bg-slate-800 rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 w-12 bg-gray-100 dark:bg-slate-800 rounded ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-4 w-28 bg-gray-100 dark:bg-slate-800 rounded ml-auto" />
                        <div className="h-3 w-20 bg-gray-50 dark:bg-slate-900 rounded mt-2 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="h-4 w-28 bg-gray-100 dark:bg-slate-800 rounded ml-auto" />
                        <div className="h-3 w-20 bg-gray-50 dark:bg-slate-900 rounded mt-2 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="size-14 rounded-full bg-gray-50 dark:bg-slate-900 flex items-center justify-center text-gray-200 dark:text-slate-700">
                          <Search className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-foreground text-base">No matching assets</h4>
                        <p className="text-sm text-muted-foreground">
                          Try refining your search query
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow
                      className="hover:bg-muted/30 transition-colors border-border"
                    >
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-semibold text-sm text-foreground">{item.product}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Layers className="size-3" /> {item.variant}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium text-muted-foreground bg-gray-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md shadow-none"
                        >
                          {item.branch}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground tabular-nums">
                        {item.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="font-medium text-muted-foreground text-[13px]">
                          {formatCurrency(item.unit_cost || 0)}{" "}
                          <span className="text-[10px] text-muted-foreground/60 font-normal">
                            /unit
                          </span>
                        </div>
                        <div className="text-[12px] font-semibold text-rose-600 mt-0.5">
                          {formatCurrency(item.total_cost || 0)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 tabular-nums">
                        <div className="font-medium text-muted-foreground text-[13px]">
                          {formatCurrency(item.unit_price || 0)}{" "}
                          <span className="text-[10px] text-muted-foreground/60 font-normal">
                            /unit
                          </span>
                        </div>
                        <div className="text-[12px] font-semibold text-emerald-600 mt-0.5">
                          {formatCurrency(item.total_retail || 0)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination — identical to ResourceManagementLayout ── */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>

        {/* ── Intelligence Note ── */}
        <Card className="border border-border shadow-xs rounded-lg overflow-hidden border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="p-5">
            <div className="flex gap-4">
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-500 text-[13px] mb-1">
                  Intelligence Note
                </h4>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Stock Valuation is calculated based on current inventory quantities multiplied by
                  weighted average cost and active selling prices. This report provides a real-time
                  assessment of your organization&apos;s physical liquidity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
