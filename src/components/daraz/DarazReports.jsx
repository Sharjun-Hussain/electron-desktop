import React, { useState, useEffect, useRef } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  ShoppingCart, 
  Clock, 
  XOctagon, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  CircleDollarSign,
  Calendar as CalendarIcon,
  Filter
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DataActions } from "@/components/general/DataActions";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DarazReportsPrintTemplate } from "@/components/Template/daraz/DarazReportsPrintTemplate";
import { format, subDays, startOfMonth, startOfYear, endOfDay, startOfDay, endOfMonth, endOfYear } from "date-fns";

export function DarazReports() {
  const { data: session } = useSession();
  const { formatCurrency, business } = useAppSettings();
  const printRef = useRef(null);

  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date()
  });

  const [stats, setStats] = useState({
    total_orders: 0,
    today_orders: 0,
    pending_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
    total_profit: 0,
    lost: 0,
    expenses: 0,
    final_profit: 0,
    top_products: []
  });

  const [loading, setLoading] = useState(true);

  // Fetch Report Data
  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);

    const query = new URLSearchParams();
    if (date?.from) query.set('start_date', format(date.from, 'yyyy-MM-dd'));
    if (date?.to) query.set('end_date', format(date.to, 'yyyy-MM-dd'));

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/reports/daraz?${query.toString()}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          setStats(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [session, date]);

  const setDateShortcut = (preset) => {
    const today = new Date();
    let range = { from: today, to: today };
    switch (preset) {
      case 'today': range = { from: startOfDay(today), to: endOfDay(today) }; break;
      case 'last7': range = { from: startOfDay(subDays(today, 7)), to: endOfDay(today) }; break;
      case 'last30': range = { from: startOfDay(subDays(today, 30)), to: endOfDay(today) }; break;
      case 'thisMonth': range = { from: startOfMonth(today), to: endOfMonth(today) }; break;
      case 'thisYear': range = { from: startOfYear(today), to: endOfYear(today) }; break;
      default: break;
    }
    setDate(range);
  };

  const buildExportData = () => {
    const summary = [
      { Section: "SUMMARY", Metric: "Total Orders", Value: stats.total_orders },
      { Section: "SUMMARY", Metric: "Today Orders", Value: stats.today_orders },
      { Section: "SUMMARY", Metric: "Pending Orders", Value: stats.pending_orders },
      { Section: "SUMMARY", Metric: "Cancelled Orders", Value: stats.cancelled_orders },
      { Section: "SUMMARY", Metric: "Gross Revenue", Value: stats.total_revenue },
      { Section: "SUMMARY", Metric: "Total Profit Margin", Value: stats.total_profit },
      { Section: "SUMMARY", Metric: "Daraz Deductions & Lost", Value: stats.lost },
      { Section: "SUMMARY", Metric: "Operating Expenses", Value: stats.expenses },
      { Section: "SUMMARY", Metric: "Final Net Profit", Value: stats.final_profit },
    ];
    const products = (stats.top_products || []).map(p => ({
      Section: "PRODUCTS",
      "Item Name": p.name,
      "Variant": p.variant || "Base",
      "SKU": p.sku,
      "Qty Sold": p.quantity_sold,
      "Revenue": p.revenue,
      "Est. Cost": p.cost,
      "Gross Profit": p.profit,
    }));
    return [...summary, ...products];
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daraz_Analytics_Report_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  return (
    <div className="flex flex-col gap-6 p-6 h-full min-h-[500px]">
      {/* Hidden Print Template */}
      <div style={{ display: "none" }}>
        <DarazReportsPrintTemplate
          ref={printRef}
          stats={stats}
          dateRange={date}
          formatCurrency={formatCurrency}
          orgName={business?.name}
        />
      </div>
      

      {/* HEADER & FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <LineChart className="text-orange-500" />
            Analytics & Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Measure your E-Commerce performance and absolute profitability.</p>
        </div>

        <div className="flex items-center gap-3">
          <DataActions
            data={buildExportData()}
            fileName="Daraz_Analytics_Report"
            onExportCSV={() => exportToCSV(buildExportData(), "Daraz_Analytics_Report", business?.name)}
            onExportExcel={() => exportToExcel(buildExportData(), "Daraz_Analytics_Report", business?.name)}
            showPrint
            onPrint={handlePrint}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-semibold border-orange-200 hover:bg-orange-50 dark:border-orange-900/40 dark:hover:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")
                ) : (
                  <span>Pick a date span</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
               <div className="p-3 border-b flex flex-wrap gap-2 bg-muted/20">
                  <Button variant="outline" size="sm" onClick={() => setDateShortcut('today')}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateShortcut('last7')}>Last 7 Days</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateShortcut('thisMonth')}>This Month</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateShortcut('thisYear')}>This Year</Button>
               </div>
               <Calendar
                 initialFocus
                 mode="range"
                 defaultMonth={date?.from}
                 selected={date}
                 onSelect={setDate}
                 numberOfMonths={2}
               />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* METRIC GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Orders Block */}
        <Card className="rounded-2xl shadow-xs border-border/60 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Total Orders</p>
                {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded-md" /> : <h3 className="text-3xl font-semibold text-foreground">{stats.total_orders}</h3>}
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-blue-600/80 bg-blue-500/5 py-1.5 px-3 rounded-lg inline-block">
              {stats.today_orders} orders recorded today
            </div>
          </CardContent>
        </Card>

        {/* Pending Block */}
        <Card className="rounded-2xl shadow-xs border-border/60 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Pending Escrow</p>
                {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded-md" /> : <h3 className="text-3xl font-semibold text-foreground">{stats.pending_orders}</h3>}
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-muted-foreground">
              Awaiting Daraz payout / settlement
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xs border-border/60 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Cancelled</p>
                {loading ? <div className="h-8 w-16 bg-muted animate-pulse rounded-md" /> : <h3 className="text-3xl font-semibold text-foreground">{stats.cancelled_orders}</h3>}
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
                <XOctagon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-muted-foreground">
              Failed delivery / customer returns
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xs border-border/60 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Gross Revenue</p>
                {loading ? <div className="h-8 w-24 bg-muted animate-pulse rounded-md" /> : <h3 className="text-2xl font-semibold text-emerald-600 truncate">{formatCurrency(stats.total_revenue)}</h3>}
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 text-xs font-medium text-muted-foreground">
              Invoice total before deductions
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-xs border-indigo-100 dark:border-indigo-900/50 bg-linear-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-700 dark:text-indigo-400"><TrendingUp size={20} /></div>
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">Total Profit margin</h4>
              </div>
              <p className="text-3xl font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {loading ? '...' : formatCurrency(stats.total_profit)}
              </p>
              <p className="text-xs text-indigo-600/70 mt-3 font-medium">Core profit (Selling price - Purchase cost) of completed orders</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-xs border-red-100 dark:border-red-900/50 bg-linear-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
            <CardContent className="p-6">
               <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-700 dark:text-red-400"><TrendingDown size={20} /></div>
                <h4 className="font-semibold text-red-900 dark:text-red-300">Daraz Deductions & Lost</h4>
              </div>
              <p className="text-3xl font-semibold text-red-600 dark:text-red-400 tabular-nums">
                {loading ? '...' : formatCurrency(stats.lost)}
              </p>
              <p className="text-xs text-red-600/70 mt-3 font-medium">Shortfall between billed invoice vs payout received</p>
            </CardContent>
          </Card>

          <Card className="col-span-1 border-2 border-orange-200 dark:border-orange-500/30 rounded-2xl shadow-sm bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/10">
             <CardContent className="p-6 h-full flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-2 opacity-80">
                <CircleDollarSign size={24} className="text-orange-700 dark:text-orange-400" />
                <h4 className="font-semibold text-orange-900 dark:text-orange-300 text-sm">Final Net Profit</h4>
              </div>
              <p className="text-4xl font-semibold text-orange-600 dark:text-orange-500 drop-shadow-sm tabular-nums">
                {loading ? '...' : formatCurrency(stats.final_profit)}
              </p>
              <div className="mt-6 flex justify-between items-center text-xs font-semibold text-orange-800/60 dark:text-orange-200/50 bg-orange-200/30 dark:bg-orange-800/30 py-2 px-3 rounded-lg">
                 <span>Operating Expenses</span>
                 <span className="text-orange-700 dark:text-orange-400 font-semibold">{formatCurrency(stats.expenses)}</span>
              </div>
             </CardContent>
          </Card>
      </div>

      {/* TOP PRODUCTS LIST */}
      <div className="mt-4">
         <Card className="rounded-2xl shadow-xs border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
               <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                 Products Sold Overview
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               {loading ? (
                  <div className="p-8 text-center text-muted-foreground animate-pulse">Loading products...</div>
               ) : (
                  <div className="overflow-x-auto">
                     <Table>
                        <TableHeader className="bg-muted/30">
                           <TableRow>
                              <TableHead className="font-semibold px-6 py-4">Item Name</TableHead>
                              <TableHead className="font-semibold px-6 py-4">Variant/SKU</TableHead>
                              <TableHead className="font-semibold px-6 py-4 text-right">Sold Qty</TableHead>
                              <TableHead className="font-semibold px-6 py-4 text-right">Revenue</TableHead>
                              <TableHead className="font-semibold px-6 py-4 text-right">Est. Cost</TableHead>
                              <TableHead className="font-semibold px-6 py-4 text-right">Gross Profit</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {!stats.top_products || stats.top_products.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products sold in this period.</TableCell>
                              </TableRow>
                           ) : (
                              stats.top_products.map((item, idx) => (
                                 <TableRow key={idx} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="px-6 py-4 font-medium">{item.name}</TableCell>
                                    <TableCell className="px-6 py-4 text-muted-foreground">
                                       {item.variant ? <span className="px-2 py-0.5 rounded bg-muted text-xs font-semibold">{item.variant}</span> : 'Base'}
                                       <div className="text-[10px] mt-1">{item.sku}</div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right font-semibold">{item.quantity_sold}</TableCell>
                                    <TableCell className="px-6 py-4 text-emerald-600 font-semibold text-right">{formatCurrency(item.revenue)}</TableCell>
                                    <TableCell className="px-6 py-4 text-muted-foreground text-right">{formatCurrency(item.cost)}</TableCell>
                                    <TableCell className="px-6 py-4 text-indigo-600 font-semibold text-right">{formatCurrency(item.profit)}</TableCell>
                                 </TableRow>
                              ))
                           )}
                        </TableBody>
                     </Table>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>

    </div>
  );
}
