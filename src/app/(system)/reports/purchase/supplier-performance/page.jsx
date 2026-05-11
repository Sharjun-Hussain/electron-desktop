"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  ShoppingBag, 
  Search, 
  Download,
  Calendar,
  Building2,
  Package,
  ArrowUpRight,
  TrendingDown,
  Award,
  Truck,
  FileText,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          <SelectTrigger className="h-8 w-[70px] text-xs border-border bg-transparent">
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
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

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
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
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

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function SupplierPerformancePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    setCurrentPage(0);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/purchase/supplier-performance`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch supplier performance");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load supplier performance");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const filteredData = useMemo(() => {
    return data.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    } else if (totalPages === 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const exportData = useMemo(() => {
    return filteredData.map((item) => ({
      "Supplier Name": item.name,
      Company: item.company || "-",
      "Active Products": item.productCount,
      "Total Orders": item.orderCount,
      "Total Purchase Value": item.totalPurchase,
    }));
  }, [filteredData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPurchase = data.reduce((s,i) => s + (i.totalPurchase || 0), 0);

  const displayStats = [
    {
      label: "Active Entities",
      value: data.length,
      icon: Building2,
      gradient: "from-blue-500 to-indigo-400"
    },
    {
      label: "Total Capital Flow",
      value: formatCurrency(totalPurchase),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400"
    },
    {
      label: "Top Supplier Volume",
      value: formatCurrency(data.length > 0 ? data[0].totalPurchase || 0 : 0),
      icon: TrendingUp,
      gradient: "from-purple-500 to-fuchsia-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Supplier Performance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Procurement Analysis and Vendor Reliability Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Supplier_Performance_Audit_Report" 
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

        {/* ── Procurement Diagnostics Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayStats.map((stat, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shrink-0 self-start`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight mt-0.5">
                  {isLoading ? <Skeleton className="h-7 w-24" /> : stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Performance Ledger */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          <CardHeader className="p-4 border-b border-border bg-card">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Vendor Performance Ledger</h3>
                    <p className="text-xs text-muted-foreground">Comparative intelligence on procurement metrics and fulfillment volumes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or company..." 
                            className="h-9 pl-9 pr-4 rounded-md border-border bg-transparent text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                            value={searchQuery}
                            onChange={(e)=>setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Supplier Identity</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">Affiliated Organization</TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground border-b-0">SKU Diversity</TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground border-b-0">Transaction Volume</TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Cumulative Exposure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-48 bg-muted" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-muted" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-md bg-muted" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-md bg-muted" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-4 w-32 ml-auto bg-muted" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border group">
                        <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-background border border-border text-muted-foreground group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all duration-300">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-foreground mb-0.5 tracking-tight group-hover:text-emerald-600 transition-colors">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-tight">SUPPLIER ID: #{item.id?.toString().padStart(4, '0')}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">{item.company || "Independent Entity"}</span>
                                <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Verified Corporate Partner</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className="bg-background text-muted-foreground border-border text-[11px] font-semibold tracking-tight px-2 py-0.5 rounded-md shadow-sm whitespace-nowrap">
                                {item.productCount} <span className="ml-1 font-medium capitalize text-[10px]">SKUs</span>
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <span className="text-sm font-semibold text-foreground tabular-nums">
                                {item.orderCount} <span className="text-[11px] text-muted-foreground font-medium capitalize ml-1">Orders</span>
                            </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                            <p className="text-sm font-bold text-emerald-600 tabular-nums tracking-tight">{formatCurrency(item.totalPurchase || 0)}</p>
                            <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-widest mt-0.5 tabular-nums">Fiscal Assessment Complete</p>
                        </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-xl bg-muted text-muted-foreground opacity-50">
                           <Building2 className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs leading-none">No vendor records found</h4>
                          <p className="text-[11px] text-muted-foreground/80 font-medium mt-2 italic leading-none">Clear search terms to refresh the performance ledger.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(0);
            }}
          />

        </Card>
      </div>
    </div>
  );
}
