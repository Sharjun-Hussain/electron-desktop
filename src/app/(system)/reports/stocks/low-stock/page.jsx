"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Package, 
  Download, 
  Search, 
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Info,
  Layers,
  CheckCircle2,
  TrendingDown,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200">
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        {/* Previous */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
                      : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {/* Last */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function LowStockSummaryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatDate } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/low-stock`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch low stock data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load low stock inventory");
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

  const filteredData = useMemo(() => 
    data.filter(item => 
      item.product?.toLowerCase().includes(searchQuery.toLowerCase())
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
    return filteredData.map(item => ({
      "Product": item.product,
      "Branch": item.branch,
      "Current Stock": item.quantity,
      "Threshold": item.threshold,
      "Status": item.status
    }));
  }, [filteredData]);

  const handleBulkPO = () => {
    if (filteredData.length === 0) return;
    const variantIds = filteredData
      .map(item => item.variant_id || item.product_id || item.id)
      .join(",");
    router.push(`/purchase/purchase-orders/create?variants=${variantIds}`);
  };

  // Derive stats dynamically from data
  const outOfStockCount = data.filter(item => item.quantity === 0).length;
  const lowStockCount = data.filter(item => item.quantity > 0).length;
  
  const stats = [
    {
      label: "Total At Risk",
      val: isLoading ? null : data.length.toLocaleString(),
      desc: "Variants below threshold",
      icon: AlertTriangle,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      label: "Out of Stock",
      val: isLoading ? null : outOfStockCount.toLocaleString(),
      desc: "Completely depleted items",
      icon: TrendingDown,
      gradient: "from-rose-500 to-pink-400",
    },
    {
      label: "Low Stock",
      val: isLoading ? null : lowStockCount.toLocaleString(),
      desc: "Items nearing depletion",
      icon: Box,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Procurement Action",
      val: isLoading ? null : data.length.toLocaleString(),
      desc: "Items ready for re-order",
      icon: ShoppingCart,
      gradient: "from-emerald-500 to-teal-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-foreground tracking-tight">Low Stock Alert</h1>
                {!isLoading && data.length > 0 && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none rounded-full px-2 py-0 h-5 text-[10px] font-bold flex items-center justify-center">
                    {data.length} Items at Risk
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Critical stock levels requiring immediate replenishment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions 
              data={exportData} 
              fileName="Low_Stock_Analysis_Report" 
              onPrint={() => window.print()}
            />
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold" 
              onClick={handleBulkPO} 
            >
              <ShoppingCart className="h-4 w-4" /> 
              Bulk PO
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-gray-200 hover:border-emerald-200 hover:bg-emerald-50" 
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
        <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-amber-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">Critical Stock Explorer</p>
                <p className="text-[12px] text-muted-foreground">
                  Variants requiring immediate attention across all branches
                </p>
              </div>
            </div>
            <div className="relative group w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
              <Input 
                placeholder="Find critical products..." 
                className="h-8 pl-8 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-gray-600 placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/80">
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="pl-6 font-semibold text-muted-foreground py-3 text-[13px]">Product & Identity</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-[13px]">Branch</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground text-[13px]">Current Stock</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground text-[13px]">Threshold</TableHead>
                  <TableHead className="text-center font-semibold text-muted-foreground text-[13px]">Risk Level</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-muted-foreground text-[13px]">Procurement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-gray-100 animate-pulse">
                      <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 bg-gray-100 dark:bg-slate-800 rounded-lg" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto bg-gray-100 dark:bg-slate-800 rounded" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto bg-gray-100 dark:bg-slate-800 rounded" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-lg bg-gray-100 dark:bg-slate-800" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-8 w-24 ml-auto rounded-xl bg-gray-100 dark:bg-slate-800" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-24 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                        <div className="size-14 rounded-full bg-gray-50 dark:bg-slate-900 text-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-foreground text-base">Perfect Inventory Levels</h4>
                        <p className="text-sm text-muted-foreground italic">{searchQuery ? "Try refining your search query" : "All products are currently above safety thresholds"}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors border-gray-100 group">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden shadow-sm">
                            <AvatarImage src={item.image} className="object-cover" />
                            <AvatarFallback className="bg-transparent text-muted-foreground"><Package className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm text-foreground leading-tight">{item.product}</div>
                            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Layers className="size-3" /> ID: {item.variant_id || item.product_id || item.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground bg-gray-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700 px-2.5 py-0.5 rounded-md shadow-none">
                          {item.branch}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600 tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-medium tabular-nums">
                        {item.threshold}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "px-2.5 py-0.5 rounded-md font-medium shadow-none text-[10px] border-none text-white",
                          item.quantity === 0 
                            ? "bg-rose-500 hover:bg-rose-600" 
                            : "bg-amber-500 hover:bg-amber-600"
                        )}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <Button asChild variant="outline" size="sm" className="h-8 px-4 rounded-md border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all font-medium text-[11px] shadow-sm">
                            <Link href={`/purchase/purchase-orders/create?variants=${item.variant_id || item.product_id || item.id}`}>
                              Restock <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>

      </div>
    </div>
  );
}
