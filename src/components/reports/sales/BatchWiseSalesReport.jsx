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
  LayoutGrid,
  Receipt,
  Tag,
  User as UserIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Box,
  Building2,
  Barcode,
  Truck,
  DollarSign,
  PieChart,
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
import { BatchWiseSalesAuditTemplate } from "@/components/Template/sales/BatchWiseSalesAuditTemplate";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

export default function BatchWiseSalesReport() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  const [date, setDate] = useState({
    from: subDays(new Date(), 0),
    to: new Date(),
  });
  
  const [filters, setFilters] = useState({
    branch_id: "all",
    supplier_id: "all",
    category_id: "all",
  });

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Metadata
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [brRes, sRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      ]);

      const [br, s, cat] = await Promise.all([brRes.json(), sRes.json(), catRes.json()]);

      if (br.status === 'success') setBranches(br.data || []);
      if (s.status === 'success') setSuppliers(Array.isArray(s.data?.data) ? s.data.data : (s.data || []));
      if (cat.status === 'success') setCategories(Array.isArray(cat.data?.data) ? cat.data.data : (cat.data || []));
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: filters.branch_id,
        supplier_id: filters.supplier_id,
        category_id: filters.category_id,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/advanced/batch-sales?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (result.status === 'success') {
        setData(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch audit data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load audit report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  const filteredItems = useMemo(() => {
    return data.filter(item => 
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const stats = useMemo(() => {
    return filteredItems.reduce((acc, curr) => ({
      totalSales: acc.totalSales + curr.total_sale,
      totalCost: acc.totalCost + curr.total_cost,
      totalProfit: acc.totalProfit + curr.profit,
      itemCount: acc.itemCount + curr.quantity,
    }), { totalSales: 0, totalCost: 0, totalProfit: 0, itemCount: 0 });
  }, [filteredItems]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "BatchWise_Sales_Audit",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Print Template */}
      <div style={{ display: "none" }}>
        <BatchWiseSalesAuditTemplate
          ref={printRef}
          data={filteredItems}
          dateRange={date}
          stats={stats}
          formatCurrency={formatCurrency}
        />
      </div>

      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Batch-wise Sales Audit</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Comprehensive daily analysis of sales, batch costs, and profit margins</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasSearched && (
              <DataActions 
                data={filteredItems} 
                fileName={`Batch_Sales_Audit_${format(new Date(), 'yyyy-MM-dd')}`}
                onPrint={handlePrint}
                showPrint={true}
              />
            )}
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <Card className="border-border shadow-sm bg-card/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><CalendarIcon className="h-3 w-3 text-indigo-600" /> Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-10 border-border bg-background">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select range</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl border-border shadow-2xl" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Building2 className="h-3 w-3 text-indigo-600" /> Branch</label>
                <Select value={filters.branch_id} onValueChange={(v) => setFilters(f => ({...f, branch_id: v}))}>
                  <SelectTrigger className="h-10 border-border"><SelectValue placeholder="All Branches" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Truck className="h-3 w-3 text-indigo-600" /> Supplier</label>
                <Select value={filters.supplier_id} onValueChange={(v) => setFilters(f => ({...f, supplier_id: v}))}>
                  <SelectTrigger className="h-10 border-border"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Layers className="h-3 w-3 text-indigo-600" /> Category</label>
                <Select value={filters.category_id} onValueChange={(v) => setFilters(f => ({...f, category_id: v}))}>
                  <SelectTrigger className="h-10 border-border"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 gap-2" onClick={fetchData} disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Generate Audit
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasSearched ? (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Sales", val: stats.totalSales, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10", desc: "Total revenue generated" },
                { label: "Total Cost", val: stats.totalCost, icon: Box, color: "text-rose-600", bg: "bg-rose-500/10", desc: "Batch-level acquisition cost" },
                { label: "Gross Profit", val: stats.totalProfit, icon: PieChart, color: "text-blue-600", bg: "bg-blue-500/10", desc: "Revenue minus cost" },
                { label: "Units Sold", val: stats.itemCount, icon: Tag, color: "text-amber-600", bg: "bg-amber-500/10", desc: "Total quantity moved" },
              ].map((s, i) => (
                <div key={i} className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl shrink-0", s.bg)}><s.icon className={cn("w-6 h-6", s.color)} /></div>
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                    <h3 className="text-2xl font-black text-foreground mt-0.5">{typeof s.val === 'number' && s.label !== 'Units Sold' ? formatCurrency(s.val) : s.val.toLocaleString()}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Area */}
            <Card className="border-border shadow-md overflow-hidden bg-card">
              <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="relative group w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                    <Input placeholder="Quick search product, invoice or batch..." className="pl-10 h-10 border-border bg-background focus-visible:ring-indigo-500" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
                 </div>
                 <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-7 px-3 border-indigo-200 text-indigo-700 font-bold bg-indigo-50/50">{filteredItems.length} Records Found</Badge>
                 </div>
              </div>
              
              <div className="overflow-x-auto" ref={printRef}>
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6 py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Transaction</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Product Insight</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Category</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">Batch/Supplier</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Cost</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Sale</TableHead>
                      <TableHead className="py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Qty</TableHead>
                      <TableHead className="pr-6 py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={8} className="py-8 px-6"><Skeleton className="h-6 w-full rounded-md" /></TableCell>
                      </TableRow>
                    )) : filteredItems.length > 0 ? filteredItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border">
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-foreground">#{item.invoice}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">{format(new Date(item.date), 'dd MMM yyyy, HH:mm')}</span>
                            <span className="text-[10px] font-medium text-indigo-600/70 mt-1">{item.branch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-foreground">{item.product}</span>
                            <span className="text-[11px] text-muted-foreground font-medium">{item.variant} • {item.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] font-bold bg-muted text-muted-foreground border-border px-2 py-0.5 rounded-md">{item.category || 'General'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Barcode className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[12px] font-black text-foreground">{item.batch}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">{item.supplier || 'Direct Store'}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[13px] font-medium text-rose-600 tabular-nums">{formatCurrency(item.total_cost)}</span>
                            <span className="text-[10px] text-muted-foreground">@{formatCurrency(item.unit_cost)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[13px] font-bold text-emerald-600 tabular-nums">{formatCurrency(item.total_sale)}</span>
                            <span className="text-[10px] text-muted-foreground">@{formatCurrency(item.unit_price)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[15px] font-black text-foreground tabular-nums">{parseFloat(item.quantity).toFixed(0)}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex flex-col items-end">
                            <span className="text-[14px] font-black text-indigo-600 tabular-nums">{formatCurrency(item.profit)}</span>
                            <span className="text-[10px] font-bold text-emerald-600">
                              {((item.profit / item.total_sale) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-24 text-center">
                          <div className="flex flex-col items-center justify-center opacity-40">
                            <Box className="w-16 h-16 mb-4" />
                            <h4 className="text-lg font-bold">No sales data found</h4>
                            <p className="text-sm">Try adjusting your filters or date range</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-40 border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
             <div className="p-6 rounded-full bg-indigo-500/10 mb-6">
                <PieChart className="w-16 h-16 text-indigo-600 opacity-20" />
             </div>
             <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Audit Intelligence</h2>
             <p className="text-sm text-muted-foreground text-center max-w-sm px-8">Select your reporting parameters above and click <b>Generate Audit</b> to analyze batch-level sales performance and margins.</p>
          </div>
        )}
      </div>
    </div>
  );
}
