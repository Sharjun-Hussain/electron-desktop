"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Printer,
  Download,
  Search,
  Package,
  AlertTriangle,
  FileText,
  Check,
  ChevronsUpDown,
  Filter,
  RefreshCw,
  Box,
  Layers,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calculator,
  Calendar as CalendarIcon,
  CalendarDays,
  Barcode,
} from "lucide-react";
import { format } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Card, CardContent } from "@/components/ui/card";
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
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Pagination ─────────────────────────────────────────────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px] text-xs border-border rounded-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-md" onClick={() => onPageChange(0)} disabled={!canPrev}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-md" onClick={() => onPageChange(currentPage - 1)} disabled={!canPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p = totalPages <= 5 ? i : (currentPage <= 2 ? i : (currentPage >= totalPages - 2 ? totalPages - 5 + i : currentPage - 2 + i));
            if (p >= 0 && p < totalPages) return (
              <Button key={p} variant={currentPage === p ? "default" : "outline"} size="icon" className={cn("h-8 w-8 rounded-md", currentPage === p ? "bg-emerald-600 hover:bg-emerald-700" : "border-border")} onClick={() => onPageChange(p)}>{p + 1}</Button>
            );
            return null;
          })}
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-md" onClick={() => onPageChange(currentPage + 1)} disabled={!canNext}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-md" onClick={() => onPageChange(totalPages - 1)} disabled={!canNext}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default function StockSummaryReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [batchList, setBatchList] = useState([]);
  
  const [branch, setBranch] = useState("all");
  const [category, setCategory] = useState("all");
  const [batchNumber, setBatchNumber] = useState("all");
  const [expiryRange, setExpiryRange] = useState({ from: null, to: null });
  const [receivedRange, setReceivedRange] = useState({ from: null, to: null });
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [branchOpen, setBranchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, catRes, batchRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, { headers: { Authorization: `Bearer ${session.accessToken}` }}),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, { headers: { Authorization: `Bearer ${session.accessToken}` }}),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/batches/list`, { headers: { Authorization: `Bearer ${session.accessToken}` }})
      ]);
      const bData = await branchRes.json();
      const cData = await catRes.json();
      const batData = await batchRes.json();

      if (bData.status === 'success') setBranches(bData.data || []);
      if (cData.status === 'success') setCategories(cData.data || []);
      if (batData.status === 'success') setBatchList((batData.data || []).filter(Boolean));
    } catch (err) { console.error(err); }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        branch_id: branch,
        main_category_id: category,
        batch_number: batchNumber === 'all' ? '' : batchNumber,
        expiry_start: expiryRange?.from ? format(expiryRange.from, 'yyyy-MM-dd') : '',
        expiry_end: expiryRange?.to ? format(expiryRange.to, 'yyyy-MM-dd') : '',
        received_start: receivedRange?.from ? format(receivedRange.from, 'yyyy-MM-dd') : '',
        received_end: receivedRange?.to ? format(receivedRange.to, 'yyyy-MM-dd') : '',
        limit: 1000
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const resData = await res.json();
      if (resData.status === "success") {
        setData(resData.data.data || []);
        setAppliedFilters({
           branch: branch === 'all' ? 'All Branches' : branches.find(b => String(b.id) === String(branch))?.name,
           category: category === 'all' ? 'All Categories' : categories.find(c => String(c.id) === String(category))?.name,
           batch: batchNumber === 'all' ? 'All Batches' : batchNumber,
           expiry: expiryRange?.from ? `${format(expiryRange.from, 'MMM dd')} - ${expiryRange.to ? format(expiryRange.to, 'MMM dd') : ''}` : null,
           received: receivedRange?.from ? `${format(receivedRange.from, 'MMM dd')} - ${receivedRange.to ? format(receivedRange.to, 'MMM dd') : ''}` : null
        });
        setHasSearched(true);
      } else { toast.error("Failed to load stock data"); }
    } catch (err) { console.error(err); toast.error("Error fetching report"); }
    finally { setIsLoading(false); }
  }, [session?.accessToken, branch, category, batchNumber, expiryRange, receivedRange, branches, categories]);

  useEffect(() => { fetchMetadata(); }, [fetchMetadata]);

  useEffect(() => { setCurrentPage(0); }, [searchQuery, appliedFilters]);

  const filteredData = useMemo(() => Array.isArray(data) ? data.filter((item) =>
    item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.variant?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [], [data, searchQuery]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const paginatedData = useMemo(() => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize), [filteredData, currentPage, pageSize]);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToCSV(exportData, "Inventory_Summary_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      Branch: item.branch?.name,
      Category: item.product?.main_category?.name,
      Product: item.product?.name,
      Variant: item.variant?.name || "Standard",
      SKU: item.variant?.sku || item.product?.code,
      Quantity: item.quantity,
      "Reorder Level": item.product?.reorder_level || 0,
      Status: Number(item.quantity) <= Number(item.product?.reorder_level || 0) ? "Low Stock" : "OK",
    }));
    exportToExcel(exportData, "Inventory_Summary_Report");
  };

  const uniqueBranches = new Set(data.map(i => i.branch?.id)).size;
  const uniqueCategories = new Set(data.map(i => i.product?.main_category?.id)).size;
  const totalStockRows = data.length;
  const lowStockRows = data.filter(i => parseFloat(i.quantity) <= parseFloat(i.product?.reorder_level || 0)).length;

  const stats = [
    { label: "Branches Mapped", val: isLoading ? null : uniqueBranches.toLocaleString(), desc: "Storage locations", icon: Building2, gradient: "from-blue-500 to-indigo-400" },
    { label: "Categories Detected", val: isLoading ? null : uniqueCategories.toLocaleString(), desc: "Product classifications", icon: Layers, gradient: "from-emerald-500 to-teal-400" },
    { label: "Total Variant Records", val: isLoading ? null : totalStockRows.toLocaleString(), desc: "Active rows aggregated", icon: Box, gradient: "from-sky-500 to-cyan-400" },
    { label: "Low Stock Triggers", val: isLoading ? null : lowStockRows.toLocaleString(), desc: "Breaching threshold", icon: AlertTriangle, gradient: "from-amber-500 to-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-md">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Inventory Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Real-time inventory mapping across all branches and categories</p>
            </div>
          </div>
          {hasSearched && (
            <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2 border-border rounded-md" onClick={handleExportCSV}><Download className="h-4 w-4" /> CSV</Button>
                <Button variant="outline" className="gap-2 border-border rounded-md" onClick={handleExportExcel}><FileText className="h-4 w-4" /> Excel</Button>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            </div>
          )}
        </div>

        <Card className="border border-border/50 shadow-sm bg-card/50 rounded-md overflow-hidden">
           <div className="p-6">
              <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-500 pl-4">
                 <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Report Parameters</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Filter className="h-3 w-3 text-emerald-600" /> Branch</label>
                  <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border bg-background transition-all text-sm">{branch === "all" ? "All Branches" : branches.find((b) => String(b.id) === String(branch))?.name || "Select Branch"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search branch..." className="h-9" />
                        <CommandList><CommandEmpty>No branch found.</CommandEmpty><CommandGroup><CommandItem onSelect={() => { setBranch("all"); setBranchOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", branch === "all" ? "opacity-100" : "opacity-0")} />All Branches</CommandItem>{branches.map((b) => (<CommandItem key={b.id} value={b.name} onSelect={() => { setBranch(b.id); setBranchOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branch) === String(b.id) ? "opacity-100" : "opacity-0")} />{b.name}</CommandItem>))}</CommandGroup></CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Layers className="h-3 w-3 text-emerald-600" /> Category</label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border bg-background transition-all text-sm">{category === "all" ? "All Categories" : categories.find((c) => String(c.id) === String(category))?.name || "Select Category"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search category..." className="h-9" />
                        <CommandList><CommandEmpty>No category found.</CommandEmpty><CommandGroup><CommandItem onSelect={() => { setCategory("all"); setCategoryOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", category === "all" ? "opacity-100" : "opacity-0")} />All Categories</CommandItem>{categories.map((c) => (<CommandItem key={c.id} value={c.name} onSelect={() => { setCategory(c.id); setCategoryOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(category) === String(c.id) ? "opacity-100" : "opacity-0")} />{c.name}</CommandItem>))}</CommandGroup></CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Barcode className="h-3 w-3 text-emerald-600" /> Batch</label>
                  <Popover open={batchOpen} onOpenChange={setBatchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border bg-background transition-all text-sm">{batchNumber === "all" ? "All Batches" : batchNumber}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search batch..." className="h-9" />
                        <CommandList><CommandEmpty>No batch found.</CommandEmpty><CommandGroup><CommandItem onSelect={() => { setBatchNumber("all"); setBatchOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", batchNumber === "all" ? "opacity-100" : "opacity-0")} />All Batches</CommandItem>{batchList.map((b) => (<CommandItem key={b} value={b} onSelect={() => { setBatchNumber(b); setBatchOpen(false); }} className="cursor-pointer py-2"><Check className={cn("mr-2 h-4 w-4 text-emerald-600", batchNumber === b ? "opacity-100" : "opacity-0")} />{b}</CommandItem>))}</CommandGroup></CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-emerald-600" /> Expiry Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border bg-background transition-all text-sm">{expiryRange?.from ? (expiryRange.to ? <>{format(expiryRange.from, "MMM dd")} - {format(expiryRange.to, "MMM dd")}</> : format(expiryRange.from, "MMM dd")) : "Select Range"}<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-border shadow-lg" align="end"><Calendar initialFocus mode="range" defaultMonth={expiryRange?.from} selected={expiryRange} onSelect={setExpiryRange} numberOfMonths={2} className="rounded-md"/></PopoverContent>
                  </Popover>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Inward Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border bg-background transition-all text-sm">{receivedRange?.from ? (receivedRange.to ? <>{format(receivedRange.from, "MMM dd")} - {format(receivedRange.to, "MMM dd")}</> : format(receivedRange.from, "MMM dd")) : "Select Range"}<CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-border shadow-lg" align="end"><Calendar initialFocus mode="range" defaultMonth={receivedRange?.from} selected={receivedRange} onSelect={setReceivedRange} numberOfMonths={2} className="rounded-md"/></PopoverContent>
                  </Popover>
                </div>

                <div className="w-full">
                  <Button onClick={fetchData} disabled={isLoading} className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold transition-all gap-2">{isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Generate</Button>
                </div>
              </div>
           </div>
        </Card>

        {hasSearched && appliedFilters && (
           <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-2">Active:</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase">Branch: {appliedFilters.branch}</Badge>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase">Category: {appliedFilters.category}</Badge>
              {appliedFilters.batch !== 'All Batches' && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase">Batch: {appliedFilters.batch}</Badge>}
              {appliedFilters.expiry && <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase">Expiry: {appliedFilters.expiry}</Badge>}
              {appliedFilters.received && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1 rounded-full font-bold text-[10px] uppercase">Received: {appliedFilters.received}</Badge>}
              <Button variant="ghost" size="sm" onClick={() => { setHasSearched(false); setAppliedFilters(null); setExpiryRange({from:null, to:null}); setReceivedRange({from:null, to:null}); }} className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-rose-600 transition-colors">Clear All</Button>
           </div>
        )}

        {hasSearched ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((card, idx) => (
                <div key={idx} className="bg-card rounded-md p-6 border border-border shadow-xs flex items-center gap-4">
                  <div className={`p-3 rounded-md bg-gradient-to-br ${card.gradient} text-white shrink-0`}><card.icon className="w-5 h-5" /></div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    {isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : <h3 className="text-2xl font-bold text-foreground truncate">{card.val}</h3>}
                    <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Card className="border border-border shadow-sm rounded-md overflow-hidden flex flex-col bg-card">
              <div className="bg-muted/10 border-b border-border p-4 flex items-center justify-between gap-4">
                 <div className="relative group max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <Input placeholder="Search result set..." className="pl-9 h-9 rounded-md border-border/60 shadow-none focus-visible:ring-emerald-500 text-sm font-normal bg-background" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
                 </div>
                 <Button variant="ghost" size="sm" onClick={fetchData} className="h-9 px-3 gap-2 font-bold text-xs"><RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />Sync</Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-[25%]">Product Insight</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Category</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Branch</TableHead>
                      <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Batch Info</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Cost</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest">MRP</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Selling</TableHead>
                      <TableHead className="text-right pr-6 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-[10%]">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i} className="border-border animate-pulse">
                          <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-md bg-muted" /><div className="space-y-1.5"><div className="h-4 w-40 bg-muted rounded" /><div className="h-3 w-24 bg-muted/50 rounded" /></div></div></TableCell>
                          <TableCell><div className="h-5 w-24 bg-muted/50 rounded-md" /></TableCell>
                          <TableCell><div className="h-4 w-32 bg-muted rounded" /></TableCell>
                          <TableCell><div className="h-4 w-24 bg-muted rounded" /></TableCell>
                          <TableCell className="text-right"><div className="h-4 w-16 bg-muted/50 rounded ml-auto" /></TableCell>
                          <TableCell className="text-right"><div className="h-4 w-16 bg-muted/50 rounded ml-auto" /></TableCell>
                          <TableCell className="text-right"><div className="h-4 w-16 bg-muted/50 rounded ml-auto" /></TableCell>
                          <TableCell className="text-right pr-6"><div className="h-5 w-16 bg-muted rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    : paginatedData.length > 0 ? paginatedData.map((item) => {
                        const isLow = parseFloat(item.quantity) <= parseFloat(item.product?.reorder_level || 0);
                        const batches = item.batches && item.batches.length > 0 ? item.batches : [{ batch_number: "N/A", expiry_date: null, cost_price: item.variant?.cost_price || 0, selling_price: item.variant?.price || 0, mrp_price: item.variant?.price || 0, quantity: item.quantity }];
                        return batches.map((batch, bIdx) => (
                          <TableRow key={`${item.id}-${bIdx}`} className="hover:bg-muted/30 transition-colors border-border">
                            <TableCell className="pl-6 py-3.5"><div className="flex items-center gap-3"><div className={cn("size-8 rounded-md flex items-center justify-center border", isLow ? "bg-amber-500/10 text-amber-600 border-amber-200/50" : "bg-muted text-muted-foreground border-border")}><Package className="h-4 w-4" /></div><div><p className="font-semibold text-sm text-foreground">{item.product?.name}</p><p className="text-[11px] text-muted-foreground font-medium mt-0.5">{item.variant?.name || "Standard Unit"} • {item.variant?.sku || item.product?.code}</p></div></div></TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] font-medium bg-muted/30 text-muted-foreground border-border px-2 py-0.5 rounded-md shadow-none">{item.product?.main_category?.name || "General"}</Badge></TableCell>
                            <TableCell className="text-[13px] text-muted-foreground font-medium italic">{item.branch?.name}</TableCell>
                            <TableCell><div className="flex flex-col gap-0.5"><span className="text-[12px] font-bold text-foreground">#{batch.batch_number}</span><span className="text-[10px] text-muted-foreground">{batch.expiry_date ? format(new Date(batch.expiry_date), 'dd MMM yyyy') : 'No Expiry'}</span></div></TableCell>
                            <TableCell className="text-right text-[13px] font-medium tabular-nums text-muted-foreground">{parseFloat(batch.cost_price || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-[13px] font-medium tabular-nums text-muted-foreground">{parseFloat(batch.mrp_price || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-[13px] font-bold tabular-nums text-emerald-600">{parseFloat(batch.selling_price || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right pr-6"><div className="flex flex-col items-end"><span className={cn("text-[14px] font-semibold tabular-nums", (parseFloat(batch.quantity) <= (item.product?.reorder_level || 0)) ? "text-rose-600" : "text-foreground")}>{parseFloat(batch.quantity).toFixed(0)}</span>{parseFloat(batch.quantity) <= (item.product?.reorder_level || 0) && <div className="flex items-center gap-1 text-[10px] text-rose-600 font-bold tracking-tight mt-0.5"><AlertTriangle className="h-3 w-3" /> Low</div>}</div></TableCell>
                          </TableRow>
                        ));
                      })
                    : <TableRow><TableCell colSpan={8} className="py-24 text-center"><div className="flex flex-col items-center justify-center gap-3"><div className="size-14 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground"><Search className="size-8 opacity-20" /></div><h4 className="font-bold text-foreground">No records detected</h4><p className="text-sm text-muted-foreground italic">Adjust filters or search query to find specific stock records</p></div></TableCell></TableRow>
                    }
                  </TableBody>
                </Table>
              </div>
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
            </Card>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-32 bg-muted/5 rounded-md border-2 border-dashed border-border/50">
             <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"><Layers className="size-10 text-emerald-600 opacity-40" /></div>
             <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Ready to Analyze</h3>
             <p className="text-sm text-muted-foreground text-center max-w-sm px-8">Configure your report parameters above and click <b>Generate</b> to view your real-time inventory summary.</p>
          </div>
        )}
      </div>
    </div>
  );
}
