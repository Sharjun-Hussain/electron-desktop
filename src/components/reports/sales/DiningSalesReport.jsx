"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { format } from "@/lib/date-utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  FileText, 
  Filter, 
  Printer, 
  RefreshCw, 
  UtensilsCrossed, 
  Users, 
  Coins, 
  LayoutGrid, 
  Sparkles, 
  Clock, 
  Receipt,
  ArrowRight
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataActions } from "@/components/general/DataActions";

export function DiningSalesReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();

  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch All Sales Data
  const fetchSalesData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      // Fetch 100 recent sales to perform high-fidelity client-side aggregations
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?size=150`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (result.status === "success") {
        // Handle paginated responses or simple arrays
        const salesList = result.data?.data || result.data || [];
        setSales(salesList);
      } else {
        toast.error(result.message || "Failed to fetch restaurant transaction history");
      }
    } catch (error) {
      console.error("Error loading restaurant report sales:", error);
      toast.error("Failed to load restaurant sales logs");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  // Filter Sales list based on selected Date range
  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.createdAt || new Date());
      const start = date.from ? startOfDay(date.from) : startOfDay(new Date());
      const end = date.to ? endOfDay(date.to) : endOfDay(new Date());
      
      return isWithinInterval(saleDate, { start, end });
    });
  }, [sales, date]);

  // Compute Core Dining Analytics Summary
  const diningSummary = useMemo(() => {
    let totalRevenue = 0;
    let dineInRevenue = 0;
    let dineInCount = 0;
    let takeawayRevenue = 0;
    let takeawayCount = 0;
    
    // Groupings
    const tableSalesMap = {};
    const waiterSalesMap = {};
    const popularItemsMap = {};

    filteredSales.forEach(sale => {
      const isDineIn = sale.dining_type === "dine_in" || sale.diningType === "dine_in";
      const total = parseFloat(sale.payable_amount || sale.total || 0);
      
      totalRevenue += total;

      if (isDineIn) {
        dineInRevenue += total;
        dineInCount++;
        
        // Group by dining table ID
        const tableId = sale.dining_table_id || sale.diningTableId || "No Table Label";
        if (!tableSalesMap[tableId]) {
          tableSalesMap[tableId] = { id: tableId, amount: 0, orders: 0 };
        }
        tableSalesMap[tableId].amount += total;
        tableSalesMap[tableId].orders++;
      } else {
        takeawayRevenue += total;
        takeawayCount++;
      }

      // Group by Waiter
      const waiterId = sale.waiter_id || sale.waiterId;
      // Get waiter name (sometimes nested, fallback to Waiter #ID)
      const waiterName = sale.waiter?.name || sale.waiterName || (waiterId ? `Waiter #${waiterId}` : "Self Service");
      
      if (waiterId || sale.waiterName) {
        const key = waiterId || waiterName;
        if (!waiterSalesMap[key]) {
          waiterSalesMap[key] = { name: waiterName, amount: 0, orders: 0 };
        }
        waiterSalesMap[key].amount += total;
        waiterSalesMap[key].orders++;
      }

      // Group popular items (KOT line items)
      const itemsList = sale.items || sale.sale_items || [];
      itemsList.forEach(item => {
        const itemName = item.product?.name || item.name || "Special Dish";
        const qty = parseFloat(item.quantity || 1);
        const lineVal = parseFloat(item.total || item.price || 0) * qty;

        if (!popularItemsMap[itemName]) {
          popularItemsMap[itemName] = { name: itemName, qty: 0, salesVal: 0 };
        }
        popularItemsMap[itemName].qty += qty;
        popularItemsMap[itemName].salesVal += lineVal;
      });
    });

    const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
    
    // Sort tables by revenue
    const topTables = Object.values(tableSalesMap).sort((a, b) => b.amount - a.amount);
    
    // Sort waiters by revenue
    const topWaiters = Object.values(waiterSalesMap).sort((a, b) => b.amount - a.amount);

    // Sort popular dishes by quantity
    const topDishes = Object.values(popularItemsMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return {
      totalRevenue,
      dineInRevenue,
      dineInCount,
      takeawayRevenue,
      takeawayCount,
      averageOrderValue,
      topTables,
      topWaiters,
      topDishes
    };
  }, [filteredSales]);

  // Exportable raw data mapping
  const exportData = useMemo(() => {
    return filteredSales.map(sale => ({
      "INVOICE NO": sale.invoice_number || sale.invoice_no || sale.invoiceNo,
      "DATE": format(new Date(sale.created_at || sale.createdAt), "yyyy-MM-dd HH:mm"),
      "DINING TYPE": (sale.dining_type || "takeaway").toUpperCase(),
      "TABLE": sale.dining_table_id || "N/A",
      "WAITER": sale.waiter?.name || "Self",
      "SUBTOTAL": sale.subtotal || 0,
      "DISCOUNT": sale.discount_amount || 0,
      "NET DUE": sale.payable_amount || 0,
      "STATUS": sale.status || "Completed"
    }));
  }, [filteredSales]);

  // Printer handlers
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Restaurant_Dining_Analytics",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="flex flex-col gap-8 max-w-[1600px] mx-auto" ref={printRef}>
        
        {/* ─── MODULE HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0 bg-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 text-white">
              <UtensilsCrossed className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Restaurant Dining Analytics</h1>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold text-[10px]">Operations & Tables</Badge>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                Audit Dine-In vs. Takeaway breakdowns, check table revenue heatmaps, and monitor waiter leaders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-20">
            {/* Filter Popover Date selection */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 justify-start text-left border-slate-200 text-slate-700 bg-white font-semibold text-xs gap-2 shadow-sm rounded-xl">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" />
                  {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select Date Range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-slate-200 shadow-xl rounded-2xl bg-white" align="end">
                <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            <DataActions 
              data={exportData} 
              fileName="Restaurant_Dining_Report"
              onPrint={handlePrint}
              showPrint={true}
            />

            <Button 
              variant="outline" 
              size="icon" 
              className="h-10 w-10 border-slate-200 bg-white rounded-xl shadow-sm text-slate-700" 
              onClick={fetchSalesData} 
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-500", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ─── METRICS CARDS GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Restaurant Revenue</span>
              {isLoading ? (
                <Skeleton className="h-8 w-2/3 mt-2" />
              ) : (
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {formatCurrency(diningSummary.totalRevenue)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    Total settled tickets: <span className="text-slate-700">{filteredSales.length}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Dine-In Revenue
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-2/3 mt-2" />
              ) : (
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    {formatCurrency(diningSummary.dineInRevenue)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    Table order count: <span className="text-emerald-600">{diningSummary.dineInCount}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-indigo-500" /> Takeaway Sales
              </span>
              {isLoading ? (
                <Skeleton className="h-8 w-2/3 mt-2" />
              ) : (
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-indigo-600 font-mono">
                    {formatCurrency(diningSummary.takeawayRevenue)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    Takeaway order count: <span className="text-indigo-600">{diningSummary.takeawayCount}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Average Ticket Value (AOV)</span>
              {isLoading ? (
                <Skeleton className="h-8 w-2/3 mt-2" />
              ) : (
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {formatCurrency(diningSummary.averageOrderValue)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                    Average revenue per receipt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ─── DINE-IN VS TAKEAWAY RATIO VISUAL ─── */}
        <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> Revenue Ratio (Dine-In vs. Takeaway)
          </h3>
          
          {isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <div className="space-y-4">
              {/* Splitting progress bar */}
              <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/30">
                {diningSummary.totalRevenue > 0 ? (
                  <>
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ width: `${(diningSummary.dineInRevenue / diningSummary.totalRevenue) * 100}%` }}
                    >
                      {((diningSummary.dineInRevenue / diningSummary.totalRevenue) * 100).toFixed(0)}%
                    </div>
                    <div 
                      className="bg-gradient-to-r from-indigo-400 to-indigo-500 h-full flex items-center justify-center text-[10px] font-black text-white"
                      style={{ width: `${(diningSummary.takeawayRevenue / diningSummary.totalRevenue) * 100}%` }}
                    >
                      {((diningSummary.takeawayRevenue / diningSummary.totalRevenue) * 100).toFixed(0)}%
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">No active transactions in range</div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs font-bold px-1">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-emerald-500" />
                  <span className="text-slate-600 uppercase">Dine-In (Table Service): <span className="font-mono text-emerald-600 font-black">{formatCurrency(diningSummary.dineInRevenue)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded bg-indigo-500" />
                  <span className="text-slate-600 uppercase">Takeaway (Counter Order): <span className="font-mono text-indigo-600 font-black">{formatCurrency(diningSummary.takeawayRevenue)}</span></span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ─── DUAL ROW LAYOUT: Tables & Waiters Ratios ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* A. Table Occupancy Heatmap & Revenue Audit */}
          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm p-6 overflow-hidden flex flex-col h-[400px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-emerald-500" /> Table Revenue Audit
            </h3>
            
            <div className="flex-1 overflow-y-auto thin-scrollbar pr-1">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Table Identifier</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-center">Settled Orders</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Billed Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Popularity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : diningSummary.topTables.length > 0 ? (
                    diningSummary.topTables.map((table, idx) => {
                      const maxVal = diningSummary.topTables[0]?.amount || 1;
                      const percentage = (table.amount / maxVal) * 100;
                      return (
                        <TableRow key={table.id} className="hover:bg-slate-50/60 border-slate-100">
                          <TableCell className="font-bold text-slate-800">{table.id}</TableCell>
                          <TableCell className="text-center font-bold text-slate-600 tabular-nums">{table.orders}</TableCell>
                          <TableCell className="text-right font-black text-slate-900 font-mono">{formatCurrency(table.amount)}</TableCell>
                          <TableCell className="text-right pl-4 w-[120px]">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold opacity-60">No active Dine-In orders to display</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* B. Waiter Performance Leaderboard */}
          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm p-6 overflow-hidden flex flex-col h-[400px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" /> Waiter Performance Leaderboard
            </h3>

            <div className="flex-1 overflow-y-auto thin-scrollbar pr-1">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Server / Waiter Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-center">Tickets Served</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Total Sales</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Average Ticket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : diningSummary.topWaiters.length > 0 ? (
                    diningSummary.topWaiters.map((waiter) => {
                      const avg = waiter.orders > 0 ? waiter.amount / waiter.orders : 0;
                      return (
                        <TableRow key={waiter.name} className="hover:bg-slate-50/60 border-slate-100">
                          <TableCell className="font-bold text-slate-800 flex items-center gap-2">
                            <span className="size-2 rounded-full bg-indigo-400 shrink-0" />
                            {waiter.name}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-600 tabular-nums">{waiter.orders}</TableCell>
                          <TableCell className="text-right font-black text-slate-900 font-mono">{formatCurrency(waiter.amount)}</TableCell>
                          <TableCell className="text-right font-bold text-slate-500 font-mono">{formatCurrency(avg)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold opacity-60">No waiter performance records mapped</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

        </div>

        {/* ─── DUAL ROW LAYOUT: Dishes popularity & Recent Dining Tickets ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* C. Top Selling Dishes */}
          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm p-6 overflow-hidden flex flex-col lg:col-span-1 h-[420px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" /> Top Selling Dishes
            </h3>
            
            <div className="flex-1 flex flex-col justify-between py-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))
              ) : diningSummary.topDishes.length > 0 ? (
                <div className="space-y-4">
                  {diningSummary.topDishes.map((dish, index) => (
                    <div key={dish.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "size-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-sm",
                          index === 0 ? "bg-amber-100 text-amber-700" :
                          index === 1 ? "bg-slate-200 text-slate-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
                        )}>
                          #{index + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[140px]">{dish.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 tabular-nums">{dish.qty} Sold</span>
                        <p className="text-[9px] text-slate-400 font-bold font-mono mt-0.5">{formatCurrency(dish.salesVal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <Receipt className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold">No items found</span>
                </div>
              )}
            </div>
          </Card>

          {/* D. Recent Dining & Takeaway Tickets Audit List */}
          <Card className="rounded-2xl border-slate-200/60 bg-white shadow-sm p-6 overflow-hidden flex flex-col lg:col-span-2 h-[420px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Recent Restaurant Tickets
            </h3>

            <div className="flex-1 overflow-y-auto thin-scrollbar pr-1">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Invoice #</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Type</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Table</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3">Waiter</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase py-3 text-right">Net Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : filteredSales.length > 0 ? (
                    filteredSales.slice(0, 15).map((sale) => {
                      const isDineIn = sale.dining_type === "dine_in" || sale.diningType === "dine_in";
                      const waiterName = sale.waiter?.name || sale.waiterName || "Counter";
                      return (
                        <TableRow key={sale.id} className="hover:bg-slate-50/60 border-slate-100">
                          <TableCell className="font-bold text-indigo-600 text-xs py-3.5">
                            {sale.invoice_number || sale.invoice_no || `INV-${sale.id}`}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge className={cn(
                              "text-[9px] font-extrabold uppercase border-none hover:bg-opacity-80 px-2 py-0.5 rounded-md",
                              isDineIn ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {isDineIn ? "Dine-In" : "Takeaway"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-700 text-xs py-3.5">
                            {isDineIn ? (sale.dining_table_id || "Counter") : "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-600 text-xs py-3.5">
                            {waiterName}
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-900 font-mono py-3.5">
                            {formatCurrency(sale.payable_amount || sale.total || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-slate-400 font-bold opacity-60">No recent tickets logged</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
