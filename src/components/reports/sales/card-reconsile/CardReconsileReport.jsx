"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Printer,
  FileText,
  Download,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Receipt,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  Scale,
  Info,
  CalendarDays,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { format, startOfMonth, endOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";
import { useReactToPrint } from "react-to-print";
import { CardReconcilePrintTemplate } from "@/components/Template/sales/CardReconsileReportTemplate";
import { useRef } from "react";

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

export default function CardReconciliationPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()) 
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // Pagination states for client-side rendering
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchBranches = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setBranches(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branchId
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/card-reconciliation?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch report");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details || []);
        setSummary(result.data.summary || null);
        setCurrentPage(0);
      }
    } catch (err) {
      console.error(err);
      setData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportData = useMemo(() => {
    return data.map(item => ({
      "Invoice No": item.invoice_number,
      "Date": format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      "Store": item.branch?.name || 'N/A',
      "Payment Method": item.payment_method,
      "Amount": item.payable_amount
    }));
  }, [data]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Card_Reconciliation_Report",
  });

  const printData = useMemo(() => {
    return data.map(item => ({
      date: format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      invoice: item.invoice_number,
      cardType: item.payment_method || "Card",
      last4: "****",
      authCode: "N/A",
      amount: item.payable_amount,
      status: "Settled"
    }));
  }, [data]);

  const printStats = useMemo(() => ({
    totalSales: summary?.totalSales || 0,
    totalCount: summary?.count || 0,
    totalRefunds: 0,
    netAmount: summary?.totalSales || 0
  }), [summary]);

  const printFilters = useMemo(() => ({
    store: branchId === "all" ? "Whole Organization" : branches.find((b) => String(b.id) === String(branchId))?.name || "All Branches",
    cardType: "All Cards"
  }), [branchId, branches]);

  // Process data for pagination
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = useMemo(() => {
    return data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const chartData = [
    { name: 'Card Settlement', value: summary?.totalSales || 0 },
  ];
  const COLORS = ['#10b981'];

  const statsCards = [
    {
      label: "Aggregate Card Sales",
      val: isLoading ? null : formatCurrency(summary?.totalSales || 0),
      desc: "Total settlement base",
      icon: Scale,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Settled Transactions",
      val: isLoading ? null : (summary?.count || 0),
      desc: "Recognized payments",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Settlement Integrity",
      val: isLoading ? null : ((summary?.discrepancyCount > 0) ? "Correction" : "Synchronized"),
      desc: (summary?.discrepancyCount > 0) ? "Discrepancy found" : "Fully balanced ledger",
      icon: AlertTriangle,
      gradient: (summary?.discrepancyCount > 0) ? "from-rose-500 to-red-400" : "from-emerald-400 to-teal-300",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Card Reconciliation Statement</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Audited verification of card-based transaction settlements and store recognition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData}
              fileName="Card_Reconciliation_Report"
              onPrint={handlePrint}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Table + Filters */}
          <Card className="lg:col-span-3 border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
            {/* Embedded Filter Bar */}
            <div className="bg-card border-b border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-8 items-end">
                
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <CalendarDays className="size-3.5 text-emerald-600" /> Settlement Period
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                          <span className="truncate">
                            {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd, yyyy")}</> : format(date.from, "LLL dd, yyyy")) : <span>Select horizon</span>}
                          </span>
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                        <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                </div>

                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Store className="size-3.5 text-emerald-600" /> Store Facility
                    </label>
                    <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                          <span className="truncate">{branchId === "all" ? "Whole Organization" : branches.find((b) => String(b.id) === String(branchId))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search locations..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No facility found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setBranchId("all"); setIsBranchOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branchId === "all" ? "opacity-100" : "opacity-0")} />
                                Whole Organization
                              </CommandItem>
                              {branches.map((b) => (
                                <CommandItem key={b.id} onSelect={() => {setBranchId(b.id); setIsBranchOpen(false)}} className="cursor-pointer">
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

                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => fetchData()} className="h-9 w-9 p-0 rounded-md border-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 shadow-sm bg-transparent" disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground">Invoice No</TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-muted-foreground text-center">Settlement Date</TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-muted-foreground">Administrative Store</TableHead>
                    <TableHead className="h-11 text-xs font-semibold text-muted-foreground text-center">Settlement Status</TableHead>
                    <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground">Finalized Settlement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6"><Skeleton className="h-4 w-24 bg-muted rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 mx-auto bg-muted/50 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 bg-muted/50 rounded" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-4 w-20 mx-auto bg-muted/50 rounded" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto bg-muted rounded" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                          <Receipt className="h-14 w-14 opacity-20" />
                          <p className="text-sm font-semibold italic">Zero Fiscal Movement</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/30 transition-colors border-b border-border group">
                        <TableCell className="pl-6 py-3.5">
                           <span className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors underline underline-offset-4 decoration-gray-200">{item.invoice_number}</span>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="text-xs font-medium text-muted-foreground">{format(new Date(item.created_at), 'MMM dd, yyyy · HH:mm')}</span>
                        </TableCell>
                        <TableCell>
                           <span className="text-sm font-medium text-foreground">{item.branch?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-[10px] py-1 px-2.5 rounded-md">Settled_Success</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(item.payable_amount)}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </Card>

          {/* Side Charts / Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-border shadow-sm bg-card rounded-lg overflow-hidden flex flex-col h-fit">
              <CardHeader className="pb-4 border-b border-border bg-muted/30">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-3">
                   <Activity className="size-4 text-emerald-500" /> Settlement Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" className="hover:opacity-85 transition-opacity cursor-crosshair" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                       contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))', 
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'hsl(var(--foreground))'
                       }} 
                       formatter={(value) => formatCurrency(value)}
                       itemStyle={{ color: 'hsl(var(--foreground))' }}
                       labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border shadow-none bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20 rounded-lg overflow-hidden">
              <CardContent className="p-6">
                 <div className="flex gap-3">
                    <div className="p-2 w-8 h-8 flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                       <Info className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                       <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Audited Integrity Disclosure</h4>
                       <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                          This reconciliation ledger verifies card transactions recorded within the POS environment. Final bank settlement figures may fluctuate due to processing merchant fees.
                       </p>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      
      {/* Hidden Print Template */}
      <CardReconcilePrintTemplate 
        ref={printRef}
        data={printData}
        filters={printFilters}
        stats={printStats}
      />
    </div>
  );
}