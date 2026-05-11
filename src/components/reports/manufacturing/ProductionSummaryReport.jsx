"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  MapPin,
  Factory,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Package,
  Layers,
  Activity,
  ChevronsUpDown,
  Check,
  CalendarDays,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataActions } from "@/components/general/DataActions";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// --- PAGINATION ---
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-[70px] text-xs border-border bg-transparent"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-transparent" onClick={() => onPageChange(0)} disabled={!canPrev}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-transparent" onClick={() => onPageChange(currentPage - 1)} disabled={!canPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-transparent" onClick={() => onPageChange(currentPage + 1)} disabled={!canNext}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border bg-transparent" onClick={() => onPageChange(totalPages - 1)} disabled={!canNext}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default function ProductionSummaryReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();

  const [date, setDate] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branch, setBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchBranches = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') setBranches(result.data || []);
    } catch (err) { console.error("Failed to fetch branches", err); }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branch,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/manufacturing/summary?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (res.status === 401) { signOut({ callbackUrl: '/login' }); return; }

      if (result.status === 'success') {
        setData(result.data.details || []);
        setSummary(result.data.summary || null);
      } else {
        toast.error(result.message || "Failed to fetch production data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load production report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branch]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    let result = Array.isArray(data) ? data : [];
    if (searchQuery) {
      result = result.filter(item =>
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredData(result);
    setCurrentPage(0);
  }, [searchQuery, data]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize), [filteredData, currentPage, pageSize]);

  const exportData = useMemo(() => filteredData.map(item => ({
    "Order #": item.order_number,
    "Completion Date": formatDateTime(item.end_date),
    "Product Name": item.product?.name,
    "Variant": item.variant?.name || "Standard Variant",
    "Planned Qty": item.quantity_planned,
    "Produced Qty": item.quantity_produced,
    "Efficiency (%)": ((item.quantity_produced / item.quantity_planned) * 100).toFixed(2),
    "Total Cost": item.total_cost,
    "Branch": item.branch?.name
  })), [filteredData, formatDateTime]);

  const statsCards = [
    { label: "Total Batches", val: isLoading ? null : summary?.totalBatches || 0, desc: "Completed production runs", icon: Layers, gradient: "from-blue-500 to-indigo-400" },
    { label: "Total Produced", val: isLoading ? null : summary?.totalProduced || 0, desc: "Finished goods added to stock", icon: Package, gradient: "from-emerald-500 to-teal-400" },
    { label: "Avg Efficiency", val: isLoading ? null : (summary?.efficiency || 0).toFixed(1) + "%", desc: "Produced vs Planned yield", icon: Activity, gradient: "from-amber-500 to-orange-400" },
    { label: "Production Cost", val: isLoading ? null : formatCurrency(summary?.totalCost || 0), desc: "Total value of raw materials", icon: TrendingUp, gradient: "from-rose-500 to-pink-400" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Factory className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Production Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Overview of manufacturing yields, batch efficiency and costs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions
              data={exportData}
              fileName="Production_Summary_Report"
            />
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 bg-transparent"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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

        {/* ── Main Table Card Wrap ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Filters Bar */}
          <div className="bg-card border-b border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Date Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Completion Period
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

              {/* Branch Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Facility / Branch
                </label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">{branch === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(branch))?.name || "All Locations"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                    <Command>
                      <CommandInput placeholder="Search branches..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setBranch("all");
                              setBranchOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branch === "all" ? "opacity-100" : "opacity-0")} />
                            All Global Locations
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setBranch(b.id);
                                setBranchOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branch) === String(b.id) ? "opacity-100" : "opacity-0")} />
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
              <div className="w-full space-y-1.5 lg:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-600" /> Explorer
                </label>
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <Input
                      placeholder="Order # or Product..."
                      className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Order Ref</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">Product Specification</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">Planned</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">Produced</TableHead>
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">Efficiency</TableHead>
                  <TableHead className="text-right pr-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-border animate-pulse">
                        <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-24 bg-muted rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48 bg-muted/50 rounded" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-md bg-muted/50" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-4 w-28 ml-auto bg-muted rounded" /></TableCell>
                      </TableRow>
                    ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const efficiency = (item.quantity_produced / item.quantity_planned) * 100;
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border group">
                        <TableCell className="pl-6 py-3.5">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                            {item.order_number}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(item.end_date)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-foreground">{item.product?.name}</span>
                            <span className="text-[11px] text-muted-foreground">{item.variant?.name || "Standard Variant"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-[13px] tabular-nums">{item.quantity_planned}</TableCell>
                        <TableCell className="text-right text-[13px] font-bold text-emerald-600 tabular-nums">{item.quantity_produced}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={efficiency >= 95 ? "success" : efficiency >= 80 ? "warning" : "destructive"} className="text-[10px] font-bold">
                            {efficiency.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-bold tabular-nums">
                          {formatCurrency(item.total_cost)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">No production records found for the selected criteria.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(0); }} />
        </Card>
      </div>
    </div>
  );
}
