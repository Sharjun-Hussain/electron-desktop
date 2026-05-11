"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useGSAP } from "@gsap/react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  PieChart,
  RefreshCcw,
  Activity,
  Box,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import gsap from "gsap";

const InventoryInsightsDashboard = () => {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [stockItems, setStockItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
    totalQty: 0
  });

  // Pagination & Filtering States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, low, out, healthy
  
  const containerRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async (page = 1) => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      // Build Dashboard Data URL
      const dashboardUrl = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/summary`);
      dashboardUrl.searchParams.append("page", page);
      dashboardUrl.searchParams.append("size", 20);
      if (debouncedSearch) dashboardUrl.searchParams.append("search", debouncedSearch);
      if (filterStatus !== "all") dashboardUrl.searchParams.append("status", filterStatus);

      const [summaryRes, lowStockRes, expiringRes] = await Promise.all([
        fetch(dashboardUrl.toString(), {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/low-stock`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/expiring`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const summaryData = await summaryRes.json();
      const lowStockData = await lowStockRes.json();
      const expiringData = await expiringRes.json();

      if (summaryData.status === "success") {
        setStockItems(summaryData.data.data || []); // Access the actual array
        if (summaryData.data.pagination) {
          setTotalPages(summaryData.data.pagination.pages || 1);
          // Check for stats in the metadata
          if (summaryData.data.pagination.stats) {
            setSummaryStats(prev => ({
              ...prev,
              ...summaryData.data.pagination.stats
            }));
          }
        }
      }
      
      if (lowStockData.status === "success") {
        setLowStockItems(lowStockData.data);
      }

      if (expiringData.status === "success") {
        setExpiringItems(expiringData.data);
        setSummaryStats(prev => ({
          ...prev,
          expiringSoon: expiringData.data.filter(i => i.expiration_status !== 'normal').length
        }));
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to load inventory intelligence");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1); // Reset to page 1 on filter
  };

  useGSAP(() => {
    if (!loading && stockItems.length > 0) {
      gsap.from(".insight-card", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
        clearProps: "all",
      });
    }
  }, { dependencies: [loading, stockItems.length], scope: containerRef });

  const getStatusInfo = (qty, threshold) => {
    if (qty <= 0) return { label: "Out of Stock", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" };
    const stockThreshold = Number(threshold || 10);
    if (qty <= stockThreshold) return { label: "Low Stock", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" };
    return { label: "Healthy", color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50" };
  };

  return (
    <div className="w-full space-y-6 p-4 md:px-8 max-w-[1600px] mx-auto pb-8" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Inventory Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time stock status & predictive intelligence center
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchData(currentPage)} 
            disabled={loading}
            className="h-9 px-4 font-semibold shadow-sm"
          >
            <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Sync Status
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <InsightCard 
          title="Total Products" 
          value={summaryStats.totalItems} 
          icon={Package} 
          gradient="from-indigo-500 to-violet-400" 
          description="Tracked variants"
        />
        <InsightCard 
          title="Out of Stock" 
          value={summaryStats.outOfStock} 
          icon={TrendingDown} 
          gradient="from-red-500 to-orange-400" 
          description="Critical items"
          isAlert={summaryStats.outOfStock > 0}
        />
        <InsightCard 
          title="Low Stock" 
          value={summaryStats.lowStock} 
          icon={AlertTriangle} 
          gradient="from-amber-500 to-orange-400" 
          description="Below threshold"
          isAlert={summaryStats.lowStock > 0}
        />
        <InsightCard 
          title="Expiring Soon" 
          value={summaryStats.expiringSoon} 
          icon={History} 
          gradient="from-orange-500 to-amber-400" 
          description="Near end-of-life"
          isAlert={summaryStats.expiringSoon > 0}
        />
         <InsightCard 
          title="Total On-Hand" 
          value={Number(summaryStats.totalQty).toFixed(0)} 
          icon={Box} 
          gradient="from-emerald-500 to-teal-400" 
          description="Units in inventory"
        />
      </div>

      <div className="space-y-6">
        {/* Main Status Table - Full Width */}
        <Card className="border border-border shadow-xs bg-card overflow-hidden">
          <CardHeader className="border-b border-border py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                Product Status Explorer
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search SKU or Name..." 
                    className="h-10 pl-10 w-72 bg-background border-border focus-visible:ring-emerald-500 shadow-sm font-medium text-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Status Filters */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                <FilterButton active={filterStatus === 'all'} onClick={() => handleFilterChange('all')} label="All Status" />
                <FilterButton active={filterStatus === 'healthy'} onClick={() => handleFilterChange('healthy')} label="Healthy" color="emerald" />
                <FilterButton active={filterStatus === 'low'} onClick={() => handleFilterChange('low')} label="Low Stock" color="amber" />
                <FilterButton active={filterStatus === 'out'} onClick={() => handleFilterChange('out')} label="Out of Stock" color="red" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-3 pl-6">Product Details</TableHead>
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Branch</TableHead>
                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground pr-6">On Hand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <StatusShimmer rows={10} />
                  ) : stockItems.length > 0 ? (
                    stockItems.map((item) => {
                      const status = getStatusInfo(parseFloat(item.quantity), parseFloat(item.variant?.low_stock_threshold || 10));
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40">
                          <TableCell className="pl-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2.5 rounded-xl", status.bg, status.text)}>
                                <Package className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="font-bold text-foreground text-sm leading-tight">{item.product?.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold border border-transparent dark:border-slate-700">
                                        {item.variant?.sku || item.product?.code}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {item.variant?.name || "Standard"}
                                    </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {item.branch?.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border-none shadow-none", status.color, "text-white")}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end">
                              <span className={cn("text-base font-bold", status.text)}>
                                {parseFloat(item.quantity).toFixed(0)}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">Units</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium italic bg-muted/20">
                        No products match your current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
                <p className="text-[13px] text-slate-500 font-medium">
                  Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-10 w-10 p-0 rounded-xl border-border disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 p-0 rounded-xl border-border disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiration Watchlist */}
        <Card className="border border-border shadow-xs bg-card overflow-hidden">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              Expiration Watchlist
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Batches approaching or past their expiration date</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-3 pl-6">Batch Details</TableHead>
                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Expiry Date</TableHead>
                    <TableHead className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground pr-6">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <StatusShimmer rows={5} />
                  ) : expiringItems.length > 0 ? (
                    expiringItems.map((item) => {
                      const getExpiryStatus = (status) => {
                        switch(status) {
                          case 'expired': return { label: 'Expired', color: 'bg-red-600', bg: 'bg-red-50', text: 'text-red-600' };
                          case 'critical': return { label: 'Critical', color: 'bg-orange-600', bg: 'bg-orange-50', text: 'text-orange-600' };
                          case 'warning': return { label: 'Warning', color: 'bg-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' };
                          default: return { label: 'Normal', color: 'bg-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' };
                        }
                      };
                      const status = getExpiryStatus(item.expiration_status);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border/40">
                          <TableCell className="pl-6 py-3">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.product?.name}</h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-1">
                                {item.variant?.name || "Standard"} • Batch: {item.batch_number || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-lg px-2.5 py-0.5 text-[10px] font-bold border-none shadow-none", status.color, "text-white")}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {parseFloat(item.quantity).toFixed(0)} Units
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium italic">
                        No expiring batches detected. Your inventory is healthy!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Actionable Alerts & Health Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 insight-card">
            <Card className="border border-border shadow-xs bg-card overflow-hidden h-full">
              <CardHeader className="pb-2 border-b border-border py-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Urgent Restock Action
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">High-priority items requiring immediate replenishment</p>
              </CardHeader>
              <CardContent className="pt-4 px-6 pb-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lowStockItems.length > 0 ? (
                      lowStockItems.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border hover:bg-muted/30 transition-all group cursor-default">
                          <div className="flex items-center gap-3.5">
                            <div className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse" />
                            <div>
                              <p className="text-sm font-bold text-foreground leading-tight truncate w-32 md:w-36 transition-colors group-hover:text-emerald-600">{item.product}</p>
                              <p className="text-[12px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                                {item.branch} 
                                <span className="text-border">•</span>
                                <span className="text-red-500 font-bold">{item.quantity} Left</span>
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg h-8 w-8 transition-all group-hover:translate-x-0.5">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-10 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                        <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-bold text-foreground">Perfect Levels!</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">No low stock alerts discovered</p>
                      </div>
                    )}
                  </div>
                  {lowStockItems.length > 6 && (
                    <Button variant="link" className="w-full text-emerald-600 hover:text-emerald-700 text-sm font-bold gap-2 mt-5 h-auto py-2 group">
                      View all {lowStockItems.length} critical alerts 
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 insight-card h-full">
            <Card className="border border-border shadow-xs bg-card overflow-hidden h-full flex flex-col justify-center relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl" />
              <CardContent className="p-7">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-md shadow-sm transition-transform group-hover:scale-105 duration-500">
                       <Activity className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-bold text-lg">Inventory Health</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                          {summaryStats.totalItems > 0 ? (((summaryStats.totalItems - summaryStats.lowStock - summaryStats.outOfStock) / summaryStats.totalItems) * 100).toFixed(0) : 0}% Items healthy
                      </p>
                    </div>
                 </div>
                 <div className="mt-7 w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner border border-border/30">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
                      style={{ width: `${summaryStats.totalItems > 0 ? (((summaryStats.totalItems - summaryStats.lowStock - summaryStats.outOfStock) / summaryStats.totalItems) * 100) : 0}%` }}
                    />
                 </div>
                 <div className="flex items-center justify-between mt-5">
                    <p className="text-xs text-muted-foreground font-bold flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       {summaryStats.totalItems - summaryStats.lowStock - summaryStats.outOfStock} Healthy
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-bold">
                       Target 100%
                    </p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, icon: Icon, gradient, description, isAlert }) => {
  return (
    <div className={cn(
        "bg-card rounded-xl p-5 border border-border shadow-xs flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group",
        isAlert && "border-red-500/30 bg-red-50/10"
    )}>
      <div className={cn("p-3 rounded-lg text-white bg-gradient-to-br shadow-sm transition-transform duration-500 group-hover:scale-110", gradient)}>
        <Icon className="w-5 h-5 shadow-sm" />
      </div>
      <div className="flex flex-col">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-foreground tabular-nums leading-tight">
          {value}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5 opacity-80 font-medium">
           {description}
        </p>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, label, count, color = "indigo" }) => {
    const variants = {
        indigo: active ? "bg-indigo-600 text-white border-indigo-600" : "bg-background text-muted-foreground border-border hover:bg-muted/50",
        emerald: active ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-emerald-600 border-emerald-500/20 dark:border-emerald-500/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5",
        amber: active ? "bg-amber-600 text-white border-amber-600" : "bg-background text-amber-600 border-amber-500/20 dark:border-amber-500/10 hover:bg-amber-50/50 dark:hover:bg-amber-500/5",
        red: active ? "bg-red-600 text-white border-red-600" : "bg-background text-red-600 border-red-500/20 dark:border-red-500/10 hover:bg-red-50/50 dark:hover:bg-red-500/5",
    };

    return (
        <button 
            onClick={onClick}
            className={cn(
                "h-8 px-4 rounded-lg text-[12px] font-bold transition-all duration-300 border flex items-center gap-2 shrink-0 whitespace-nowrap",
                variants[color]
            )}
        >
            {label}
            {count !== undefined && (
                <span className={cn(
                    "min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
};

const StatusShimmer = ({ rows }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <TableRow key={i} className="animate-pulse border-slate-50 dark:border-slate-800">
        <TableCell colSpan={4} className="py-5">
          <div className="flex items-center gap-4 px-4 w-full">
             <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
             <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-2 bg-slate-50 dark:bg-slate-900 rounded w-1/4" />
             </div>
             <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24 mx-auto" />
             <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12 ml-auto" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export default InventoryInsightsDashboard;
