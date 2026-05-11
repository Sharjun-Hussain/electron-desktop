"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { toast } from "sonner";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Check,
  ChevronsUpDown,
  Building2,
  CalendarDays,
  Store,
  BadgePercent,
  Warehouse,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { format, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SalesBySupplierPrintTemplate } from "@/components/Template/sales/SalesBySupplierTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";

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

export default function SalesBySupplierPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATE ---
  const [date, setDate] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [store, setStore] = useState("all");
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalProfit: 0, activeSuppliers: 0, topSupplier: null });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchData = useCallback(async (targetPage = 1) => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: store,
        search: searchQuery, // If backend supports it on this endpoint (it might not be utilized here but good to pass if possible)
        page: targetPage,
        limit: pageSize
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/supplier-profit?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setSummary(result.data.summary || { totalSales: 0, totalProfit: 0, activeSuppliers: 0, topSupplier: null });
        setPagination({
          page: result.data.pagination?.page || 1,
          total: result.data.pagination?.total || 0,
          totalPages: result.data.pagination?.totalPages || 1
        });
      } else {
        toast.error(result.message || "Failed to fetch report data");
      }
    } catch (error) {
      toast.error("An error occurred while loading the report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, store, searchQuery, pageSize]);

  const fetchBranches = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setBranches(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Supplier_Report",
  });

  const exportData = useMemo(() => {
    return (data || []).map(item => ({
      "Supplier Name": item.supplier_name,
      "Items Sold": item.sold || 0,
      "Gross Sales": Number(item.totalSales || 0),
      "Discount Value": Number(item.discount || 0),
      "Net Revenue": Number(item.netSales || 0),
      "Net Profit": Number(item.profit || 0),
      "Margin Yield (%)": Number((item.margin || 0).toFixed(2)),
      "Avg Revenue per Item": Number((item.netSales / (item.sold || 1)).toFixed(2)),
      "Operational Unit": store === 'all' ? 'All Global Units' : branches.find(b => String(b.id) === String(store))?.name || 'Unit',
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Horizon": date?.from ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}` : "Global"
    }));
  }, [data, store, branches, session, date]);

  const statsCards = [
    {
      label: "Total Sales",
      val: isLoading ? null : formatCurrency(summary.totalSales || 0),
      desc: "Total revenue from all suppliers",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Top Supplier",
      val: isLoading ? null : summary.topSupplier?.supplier_name || "-",
      desc: "Supplier with the most sales",
      icon: Building2,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Active Suppliers",
      val: isLoading ? null : (summary.activeSuppliers || 0).toLocaleString(),
      desc: "Total suppliers with recorded sales",
      icon: Warehouse,
      gradient: "from-purple-500 to-fuchsia-400",
    },
    {
      label: "Total Profit",
      val: isLoading ? null : formatCurrency(summary.totalProfit || 0),
      desc: "Total profit earned from these sales",
      icon: BadgePercent,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      {/* Hidden Print Template */}
      <div style={{ display: "none" }}>
        <SalesBySupplierPrintTemplate 
            ref={printRef} 
            data={data} 
            stats={summary} 
            filters={{ store: store === 'all' ? 'All Global Units' : branches.find(b => String(b.id) === String(store))?.name || 'Unit', category: "All Classifications" }}
        />
      </div>

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Supplier Performance Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Audited cross-vendor revenue analysis and distribution efficiency</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Supplier_Performance_Audit_Report"
              onPrint={handlePrint}
              showPrint={true}
            />
            <Button 
                variant="outline" 
                size="icon" 
                className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 rounded-lg" 
                onClick={() => fetchData(pagination.page)} 
                disabled={isLoading}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Visualization */}
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col min-h-[420px] bg-card">
            <CardHeader className="pb-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                    <Briefcase className="size-4" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-foreground">Revenue Distribution</h3>
                    <p className="text-xs font-semibold text-muted-foreground">Top 5 Performing Vendor Channels</p>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              {isLoading ? (
                <div className="space-y-4 w-full px-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-md bg-gray-100" />)}
                </div>
              ) : data.length === 0 ? (
                <div className="text-center italic text-muted-foreground p-8 flex flex-col items-center gap-3">
                   <Building2 className="h-10 w-10 opacity-20" />
                   <p className="text-sm font-semibold">No performance data in selected horizon</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    data={[...data].sort((a,b) => b.totalSales - a.totalSales).slice(0, 5).map(item => ({ 
                      name: (item.supplier_name || "N/A").split(' ')[0], 
                      sales: item.totalSales || 0,
                      fullName: item.supplier_name || "N/A"
                    }))} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={80} className="font-bold" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(226, 232, 240, 0.4)', radius: 8 }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px' }}
                      labelStyle={{ fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}
                      formatter={(value) => [formatCurrency(value), "Net Revenue"]}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                      {data.slice(0, 5).map((entry, index) => (
                        <Cell key={index} fillOpacity={1 - (index * 0.12)} fill="#10b981" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Movement Ledger + Filters embedded */}
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden lg:col-span-2 flex flex-col bg-card">
            {/* Filters Bar inside standard Table Layout */}
            <div className="bg-card border-b border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                
                {/* Time Horizon */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <CalendarDays className="size-3.5 text-emerald-600" /> Reporting Period
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                          <span className="truncate">
                            {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select range</span>}
                          </span>
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                        <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Store */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Store className="size-3.5 text-emerald-600" /> Branch Facility
                    </label>
                    <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent">
                          <span className="truncate">{store === "all" ? "All Global Units" : branches.find((b) => String(b.id) === String(store))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search branches..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setStore("all"); setIsBranchOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", store === "all" ? "opacity-100" : "opacity-0")} />
                                All Global Units
                              </CommandItem>
                              {branches.map((b) => (
                                <CommandItem key={b.id} onSelect={() => {setStore(b.id); setIsBranchOpen(false)}} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(store) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                  {b.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Quick Search */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Search className="size-3.5 text-emerald-600" /> Vendor Explorer
                    </label>
                    <div className="relative group flex gap-2">
                       <div className="relative flex-1">
                         <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                         <Input 
                             placeholder="Find supplier..." 
                             className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent" 
                             value={searchQuery}
                             onChange={(e)=>setSearchQuery(e.target.value)}
                         />
                       </div>
                    </div>
                </div>

              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 py-4 text-xs font-semibold text-muted-foreground">Vendor Entity</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">Qty Sold</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Net Revenue</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Yield</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-semibold text-muted-foreground">Margin (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6 py-4">
                          <Skeleton className="h-4 w-40 mb-2 rounded bg-gray-100" />
                          <Skeleton className="h-3 w-20 rounded bg-gray-50" />
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-10 mx-auto rounded bg-gray-100" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-6 w-16 ml-auto rounded-md bg-gray-100" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.filter(item => item.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-b border-border group">
                        <TableCell className="pl-6 py-3.5">
                          <p className="font-semibold text-sm text-foreground group-hover:text-emerald-600 transition-colors">{item.supplier_name}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase tracking-tighter italic">Vendor Partner</p>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-medium text-sm text-foreground bg-muted px-2 py-1 rounded border border-border">{item.sold || 0}</span>
                        </TableCell>
                        <TableCell className="text-right text-foreground font-semibold tabular-nums text-sm">{formatCurrency(item.netSales || 0)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 tabular-nums text-sm">{formatCurrency(item.profit || 0)}</TableCell>
                        <TableCell className="text-right pr-6">
                             <Badge variant="outline" className={cn(
                               "h-6 px-2 text-[10px] font-semibold border-none transition-all shadow-none rounded-md",
                               (item.margin || 0) >= 0 
                                 ? "bg-emerald-50 text-emerald-600" 
                                 : "bg-rose-50 text-rose-600"
                             )}>
                               {(item.margin || 0).toFixed(1)}%
                             </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center text-muted-foreground">
                         <div className="flex flex-col items-center gap-3">
                            <div className="size-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                               <Search className="size-8" />
                            </div>
                            <h4 className="font-bold text-foreground uppercase tracking-tight">Zero vendor distribution records</h4>
                            <p className="text-sm font-medium italic">Broaden reporting horizon or unit filters to expand visibility</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <PaginationControls
              currentPage={pagination.page - 1}
              totalPages={pagination.totalPages}
              onPageChange={(pageIndex) => fetchData(pageIndex + 1)}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => setPageSize(newSize)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}