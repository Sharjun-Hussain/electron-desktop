"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Printer,
  Download,
  Calendar as CalendarIcon,
  PackageOpen,
  FileText,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  Activity,
  Receipt,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Layers,
  ShoppingBag,
  LucideLayoutDashboard,
  Box,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";
import { toast } from "sonner";

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

export default function NonStockSalesPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ 
    totalItems: 0, 
    grandTotalRevenue: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const [productId, setProductId] = useState("all");
  const [products, setProducts] = useState([]);
  const [isProductOpen, setIsProductOpen] = useState(false);

  // Fetch branches and products (non-stock only) for filters
  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, productRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);
      
      const branchResult = await branchRes.json();
      const productResult = await productRes.json();
      
      if (branchResult.status === 'success') setBranches(branchResult.data);
      if (productResult.status === 'success') {
        const nonStockProducts = productResult.data.filter(p => !p.is_stock_managed);
        setProducts(nonStockProducts);
      }
      
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: branchId,
        product_id: productId === "all" ? "" : productId,
        page: currentPage,
        size: pageSize
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/non-stock?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setSummary({
          totalItems: result.data.pagination?.total || 0,
          grandTotalRevenue: result.data.pagination?.grandTotalRevenue || 0
        });
        setPagination({
            total: result.data.pagination?.total || 0,
            totalPages: result.data.pagination?.totalPages || 1
        });
      } else {
        toast.error(result.message || "Failed to fetch non-stock sales data");
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branchId, productId, currentPage, pageSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const exportData = useMemo(() => {
    return (data || []).map((item) => ({
      "Invoice #": item.sale?.invoice_number || "N/A",
      "Engagement Date": item.sale?.created_at ? formatDate(item.sale.created_at) : "N/A",
      "Service Logic": item.product?.name || "N/A",
      "Service Code": item.product?.code || "N/A",
      "Quantity": Number(item.quantity || 0),
      "Unit Recognition": Number(item.unit_price || 0),
      "Total Recognition": Number(item.total_amount || 0),
      "Store Facility": branchId === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(branchId))?.name || "N/A",
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Horizon": date?.from ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}` : "Global"
    }));
  }, [data, formatDate, branchId, branches, session, date]);

  const statsCards = [
    {
      label: "Total Service Instances",
      val: isLoading ? null : (pagination?.total || 0),
      desc: "Distinct engagements logged",
      icon: Activity,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Total Service Revenue",
      val: isLoading ? null : formatCurrency(summary?.grandTotalRevenue || 0),
      desc: "Aggregate fiscal recognition",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Average Token Size",
      val: isLoading ? null : formatCurrency((summary?.grandTotalRevenue || 0) / (pagination?.total || 1)),
      desc: "Mean service fulfillment value",
      icon: Receipt,
      gradient: "from-purple-500 to-fuchsia-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Service & Non-Stock Analysis</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Chronological verification of service-level engagements and recognition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Service_NonStock_Analysis_Report"
              onPrint={() => window.print()}
              showPrint={true}
            />
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shrink-0 self-start`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
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

        {/* Extended Filters & Table Card */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Main Filters Top Header Bar */}
          <div className="bg-card border-b border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              
              <div className="w-full space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <CalendarDays className="size-3.5 text-emerald-600" /> Analysis Horizon
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        <span className="truncate">
                          {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd, yyyy")}</> : format(date.from, "LLL dd, yyyy")) : <span>Select period</span>}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                      <Calendar mode="range" selected={date} onSelect={(d) => {setDate(d); setCurrentPage(1);}} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
              </div>

              <div className="w-full space-y-1.5 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Store className="size-3.5 text-emerald-600" /> Store Facility
                  </label>
                  <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                        <span className="truncate">{branchId === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(branchId))?.name}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-md shadow-lg border-border" align="start">
                      <Command>
                        <CommandInput placeholder="Search locations..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => {setBranchId("all"); setCurrentPage(1); setIsBranchOpen(false)}} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branchId === "all" ? "opacity-100" : "opacity-0")} />
                              All Locations
                            </CommandItem>
                            {branches.map((b) => (
                              <CommandItem key={b.id} onSelect={() => {setBranchId(b.id); setCurrentPage(1); setIsBranchOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branchId) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                {b.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

              <div className="w-full space-y-1.5 lg:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Box className="size-3.5 text-emerald-600" /> Service Filter
                  </label>
                  <Popover open={isProductOpen} onOpenChange={setIsProductOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                        <span className="truncate">{productId === "all" ? "All Non-Stock Logic" : products.find((p) => String(p.id) === String(productId))?.name}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-md shadow-lg border-border" align="start">
                      <Command>
                        <CommandInput placeholder="Search service items..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No service identified.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => {setProductId("all"); setCurrentPage(1); setIsProductOpen(false)}} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", productId === "all" ? "opacity-100" : "opacity-0")} />
                              All Non-Stock Logic
                            </CommandItem>
                            {products.map((p) => (
                              <CommandItem key={p.id} onSelect={() => {setProductId(p.id); setCurrentPage(1); setIsProductOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(productId) === String(p.id) ? "opacity-100" : "opacity-0")} />
                                {p.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

              <div className="flex justify-start lg:col-span-1">
                <Button variant="outline" onClick={() => { setCurrentPage(1); fetchData(); }} className="h-9 w-9 p-0 rounded-md border-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 shadow-sm bg-transparent" disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground">Invoice / Date</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground">Service / Logic Unit</TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground">Quantity</TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground">Recognition Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32 bg-gray-100 mb-1" /><Skeleton className="h-3 w-20 bg-gray-50" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48 bg-gray-100 mb-1" /><Skeleton className="h-3 w-20 bg-gray-50" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto bg-gray-50" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-4 w-16 ml-auto bg-gray-100" /></TableCell>
                    </TableRow>
                  ))
                ) : (data?.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <ShoppingBag className="h-14 w-14 opacity-20" />
                        <p className="text-sm font-semibold italic capitalize">Zero Service Attribution</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors border-b border-border group">
                      <TableCell className="pl-6 py-3.5">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-foreground tracking-tight">{item.sale?.invoice_number}</span>
                            <span className="text-xs font-medium text-muted-foreground lowercase leading-none">{formatDate(item.sale?.created_at)}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-3.5">
                            <div className="p-1.5 rounded-md border border-gray-200 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all text-muted-foreground group-hover:text-emerald-600">
                               <PackageOpen className="size-4" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-sm font-medium text-foreground tracking-tight leading-none">{item.product?.name}</span>
                               <span className="text-xs font-medium font-mono text-muted-foreground tracking-tight mt-1">{item.product?.code}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge variant="outline" className="bg-white border-gray-200 text-muted-foreground font-semibold text-[10px] px-2.5 py-0.5 rounded-md shadow-sm tabular-nums">
                            {parseFloat(item.quantity || 0).toFixed(0)}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <span className="text-sm font-semibold text-foreground tabular-nums tracking-tight">
                            {formatCurrency(item.total_amount || 0)}
                         </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <PaginationControls
            currentPage={currentPage - 1}
            totalPages={pagination.totalPages || 0}
            onPageChange={(p) => setCurrentPage(p + 1)}
            pageSize={pageSize}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(1);
            }}
          />
        </Card>

        {/* Audited Disclosure Bottom Card */}
        <Card className="border shadow-none bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20 rounded-lg overflow-hidden">
          <CardContent className="p-6">
             <div className="flex gap-4">
                <div className="p-2.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                   <Info className="h-5 w-5" />
                </div>
                <div>
                   <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Service Performance Intelligence</h4>
                   <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                      Monitoring revenue attribution from non-stock logic units like labor, structural consulting, or digital recognitions helps isolate high-margin structural utility from core product turnover metrics.
                   </p>
                </div>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
