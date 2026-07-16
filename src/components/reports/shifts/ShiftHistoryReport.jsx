"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { subDays } from "date-fns";
import { format } from "@/lib/date-utils";
import {
  Printer,
  Calendar as CalendarIcon,
  RefreshCw,
  Check,
  ChevronsUpDown,
  User as UserIcon,
  Clock,
  ClipboardList,
  Search,
  MapPin,
  Eye,
  Activity,
  Zap,
  TrendingDown,
  TrendingUp,
  Fingerprint,
  BarChart3,
  Receipt,
  CreditCard,
  Scale,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";

// ── Shift Detail View Component ─────────────────────────────────────────────
const ShiftDetailReport = ({ shiftId, onClose }) => {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const printRef = useRef(null);
  
  const handlePrint = useReactToPrint({
      contentRef: printRef,
      documentTitle: `Shift_Report_${shiftId}`,
  });

  useEffect(() => {
    const fetchDetail = async () => {
      if (!session?.accessToken || !shiftId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/shifts/${shiftId}/detail`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const result = await res.json();
        if (result.status === 'success') {
          setData(result.data);
        }
      } catch (err) {
        toast.error("Failed to load shift details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [session, shiftId]);

  if (isLoading) return <div className="p-12"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!data) return <div className="p-12 text-center text-muted-foreground font-semibold italic">Audit data not found for reference {shiftId}</div>;

  const { shift, stats, paymentBreakdown } = data;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex justify-between items-center px-1 pt-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-[11px] font-medium flex items-center gap-2">
            <ShieldCheck className="size-3.5" /> Shift Audit
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-border hover:bg-muted text-sm font-medium rounded-lg h-9">
            <Printer className="size-4" /> Print Report
          </Button>
      </div>

      <div ref={printRef} className="px-1 pb-10 bg-card text-foreground font-sans">
        <style type="text/css" media="print">
          {`@page { size: auto; margin: 10mm; } 
            body { -webkit-print-color-adjust: exact; }`}
        </style>

        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-border pb-8 mb-8 relative">
          <div className="flex flex-col text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/10">
                <ClipboardList className="size-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Shift Summary</h2>
            </div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2 pl-1">
              <Activity className="size-3.5" /> Verified Shift Record
            </p>
            
            <div className="flex items-center gap-3 mt-6">
               <div className="bg-muted/50 px-3 py-2 rounded-lg border border-border">
                  <span className="text-[10px] font-medium text-muted-foreground block mb-0.5">Shift ID</span>
                  <span className="text-sm font-mono font-bold tracking-tight">#{shift.id.substring(0,12).toUpperCase()}</span>
               </div>
               <Badge className={cn(
                 "h-9 px-4 rounded-lg font-bold text-[11px] border-none shadow-sm uppercase",
                 shift.status === 'open' ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-900 text-white"
               )}>
                 {shift.status}
               </Badge>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end pt-1">
             <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-3">
                <MapPin className="size-5 text-emerald-600" />
             </div>
             <p className="font-bold text-lg tracking-tight text-foreground leading-none">{shift.branch.name}</p>
             <p className="text-xs text-emerald-600 font-medium mt-2">Location</p>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 gap-5 mb-8">
          <div className="bg-muted/30 border border-border rounded-xl p-6 shadow-none flex flex-col gap-4">
             <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
               <UserIcon className="size-4 text-indigo-500" /> Cashier
             </span>
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-600/20">
                   {shift.cashier.name.substring(0,1)}
                </div>
                <div className="flex flex-col">
                   <span className="text-base font-bold text-foreground leading-none mb-1.5">{shift.cashier.name}</span>
                   <span className="text-[11px] font-medium text-muted-foreground lowercase">{shift.cashier.email}</span>
                </div>
             </div>
          </div>

          <div className="bg-muted/30 border border-border rounded-xl p-6 shadow-none flex flex-col gap-4">
             <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
               <CalendarIcon className="size-4 text-emerald-500" /> Shift Time
             </span>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-muted-foreground">Opened At</span>
                   </div>
                   <span className="text-sm font-bold tabular-nums text-foreground">{formatDateTime(shift.opening_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="size-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-xs font-medium text-muted-foreground">Closed At</span>
                   </div>
                   <span className="text-sm font-bold tabular-nums text-foreground">{shift.closing_time ? formatDateTime(shift.closing_time) : 'Currently Open'}</span>
                </div>
             </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 text-foreground p-6 rounded-xl flex flex-col justify-between shadow-none overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Receipt className="size-16" />
             </div>
             <div className="flex justify-between items-start relative z-10">
                <span className="text-[11px] font-medium opacity-70">Total Sales</span>
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                   <TrendingUp className="size-5" />
                </div>
             </div>
             <div className="mt-6 relative z-10">
                <h4 className="text-3xl font-bold tabular-nums tracking-tighter">
                   {formatCurrency(stats.totalSales)}
                </h4>
                <p className="text-[11px] opacity-60 font-medium mt-1.5 flex items-center gap-2">
                   <Zap className="size-4 text-amber-500 fill-amber-500" /> Live Sales Total
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
           {/* Section 1: Yield Logic */}
           <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                   <Receipt className="size-4 text-indigo-500" /> Financial Breakdown
                </h3>
                <Badge variant="outline" className="text-[10px] font-medium border-border bg-muted/50 text-muted-foreground">{stats.transactionCount} Transactions</Badge>
              </div>
              <div className="space-y-4 text-foreground">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Gross Sales</span>
                    <span className="text-base font-bold tabular-nums">{formatCurrency(stats.totalSales + stats.totalDiscount)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Discounts</span>
                    <span className="text-base font-bold tabular-nums text-rose-500">- {formatCurrency(stats.totalDiscount)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Tax</span>
                    <span className="text-base font-bold tabular-nums">{formatCurrency(stats.totalTax)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Expenses Added</span>
                    <span className="text-base font-bold tabular-nums text-rose-500">- {formatCurrency(stats.totalExpense || 0)}</span>
                 </div>
                 <div className="pt-5 mt-2 border-t border-border flex justify-between items-center">
                    <span className="text-base font-bold text-foreground">Net Shift Sales</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-emerald-600">{formatCurrency(stats.totalSales - (stats.totalExpense || 0))}</span>
                 </div>
              </div>
           </div>

           {/* Section 2: Settlement Breakdown */}
           <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                   <CreditCard className="size-4 text-emerald-500" /> Payment Methods
                </h3>
              </div>
              <div className="bg-muted/30 rounded-xl p-6 space-y-4 border border-border">
                 {Object.entries(paymentBreakdown || {}).map(([method, amount]) => (
                   <div key={method} className="flex justify-between items-center group text-foreground">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "size-2 rounded-full",
                           method.toLowerCase() === 'cash' ? "bg-emerald-500" :
                           method.toLowerCase() === 'card' ? "bg-indigo-500" : "bg-amber-500"
                         )} />
                         <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{method}</span>
                      </div>
                      <span className="text-base font-bold tabular-nums">{formatCurrency(amount)}</span>
                   </div>
                 ))}
                 {(!paymentBreakdown || Object.keys(paymentBreakdown || {}).length === 0) && (
                    <div className="flex flex-col items-center py-6 opacity-30 text-foreground">
                       <AlertCircle className="size-8 mb-2" />
                       <span className="text-xs font-medium">No Channel Data Logged</span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Reconciliation Matrix */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-none relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 pointer-events-none">
              <Scale className="size-24" />
           </div>
           <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                 <Scale className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Cash Drawer Reconciliation</h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Comparing expected cash against the actual cash counted</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 gap-8 relative z-10">
              <div className="flex justify-between items-center px-1">
                 <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                       <Search className="size-3.5 text-indigo-500" /> Expected Cash
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(shift.expected_cash || 0)}</span>
                 </div>
                 <div className="flex flex-col gap-1.5 text-right">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2 justify-end">
                       <Fingerprint className="size-3.5 text-emerald-500" /> Actual Cash
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(shift.closing_cash || 0)}</span>
                 </div>
              </div>

              <div className={cn(
                 "flex flex-col p-6 rounded-xl border transition-all duration-500",
                 (shift.variance || 0) === 0 ? "bg-emerald-500/5 border-emerald-500/10" : (shift.variance || 0) < 0 ? "bg-rose-500/5 border-rose-500/10" : "bg-amber-500/5 border-amber-500/10"
              )}>
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                       {(shift.variance || 0) < 0 ? <TrendingDown className="size-4 text-rose-500" /> : <TrendingUp className="size-4 text-emerald-500" />} 
                       Difference
                    </span>
                    <Badge variant="outline" className={cn(
                       "text-[10px] font-bold border-none px-3 py-1 shadow-none",
                       (shift.variance || 0) === 0 ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                    )}>
                       {(shift.variance || 0) === 0 ? "BALANCED" : "DISCREPANCY"}
                    </Badge>
                 </div>
                 <span className={cn(
                   "text-3xl font-bold tabular-nums tracking-tighter",
                   (shift.variance || 0) < 0 ? "text-rose-600" : (shift.variance || 0) > 0 ? "text-amber-600" : "text-emerald-600"
                 )}>
                    {(shift.variance || 0) > 0 ? "+" : ""}{formatCurrency(shift.variance || 0)}
                 </span>
              </div>
           </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-3 text-center">
           <p className="text-[10px] text-muted-foreground font-medium italic max-w-sm mx-auto">
             This is an internal shift summary report. Confidential.
           </p>
           <div className="flex items-center gap-3 opacity-30 text-foreground font-mono scale-90">
              <span className="text-xs font-medium">Shift ID: {shift.id.substring(0,8).toUpperCase()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};


// ── Main History Page ────────────────────────────────────────────────────────
export default function ShiftHistoryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();
  
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const [selectedShiftId, setSelectedShiftId] = useState(null);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, sellerRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);

      const branchData = await branchRes.json();
      const sellerData = await sellerRes.json();

      if (branchData.status === 'success') setBranches(branchData.data || []);
      if (sellerData.status === 'success') setSellers(sellerData.data || []);

    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
          const queryParams = new URLSearchParams({
              start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
              end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
              branch_id: branch,
              user_id: user
          });

           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/shifts/history?${queryParams}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();

          if (result.status === 'success') {
              setData(result.data || []);
          } else {
              toast.error(result.message || "Failed to fetch shift history");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load shift history");
      } finally {
          setIsLoading(false);
      }
  }, [session?.accessToken, date, branch, user]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(s => 
      s.cashier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const exportData = useMemo(() => {
    return (filteredData || []).map((item) => ({
      "Shift Reference": item.id.toUpperCase(),
      "Personnel Name": item.cashier?.name || "N/A",
      "Staff ID": item.cashier?.id || "N/A",
      "Branch Location": item.branch?.name || "N/A",
      "Branch ID": item.branch?.id || "N/A",
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Opening Time": item.opening_time ? formatDateTime(item.opening_time) : "N/A",
      "Closing Time": item.closing_time ? formatDateTime(item.closing_time) : (item.status === "open" ? "Active" : "N/A"),
      "Status": item.status?.toUpperCase() || "UNKNOWN",
      "Expected Revenue": Number(item.expected_cash || 0),
      "Physical Recognition": item.status === "closed" ? Number(item.closing_cash || 0) : 0,
      "Audit Divergence": item.status === "closed" ? Number(item.variance || 0) : 0,
      "Currency": session?.currency || "Rs"
    }));
  }, [filteredData, session, formatDateTime]);

  const statsProps = useMemo(() => {
    const closedShifts = (data || []).filter(s => s.status === 'closed');
    const totalSales = (data || []).reduce((acc, s) => acc + Number(s.expected_cash || 0), 0);
    const totalVariance = closedShifts.reduce((acc, s) => acc + Number(s.variance || 0), 0);

    const stats = [
      {
        label: "Expected Total",
        value: formatCurrency(totalSales),
        icon: BarChart3,
        gradient: "from-indigo-600 to-violet-500"
      },
      {
        label: "Total Shifts",
        value: `${data.length} Shifts`,
        icon: ShieldCheck,
        gradient: "from-emerald-600 to-teal-500"
      },
      {
        label: "Avg Sales per Shift",
        value: formatCurrency(data.length > 0 ? totalSales / data.length : 0),
        icon: Zap,
        gradient: "from-amber-600 to-orange-500"
      },
      {
        label: "Total Difference",
        value: (totalVariance > 0 ? "+" : "") + formatCurrency(totalVariance),
        icon: Scale,
        gradient: totalVariance === 0 ? "from-blue-600 to-blue-400" : (totalVariance < 0 ? "from-rose-600 to-red-400" : "from-amber-600 to-yellow-400")
      }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((card, idx) => (
          <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
            <div className={cn("p-3 rounded-lg bg-gradient-to-br text-white", card.gradient)}>
              <card.icon className="w-5 h-5 shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider truncate">{card.label}</p>
              <h3 className={cn(
                "text-2xl font-bold text-foreground tabular-nums truncate",
                card.label === "Total Difference" && totalVariance < 0 && "text-rose-600"
              )}>
                {card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>
    );
  }, [data, formatCurrency]);

  const columns = [
    {
      accessorKey: "cashier",
      header: "Cashier & Location",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "size-2 rounded-full ring-2 ring-offset-2",
              item.status === 'open' ? "bg-emerald-500 animate-pulse ring-emerald-500/20" : "bg-gray-300 ring-transparent"
            )} />
            <div className="flex flex-col">
               <span className="text-[13px] font-bold text-foreground tracking-tight">{item.cashier?.name}</span>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-widest">
                    <MapPin className="size-2.5" /> {item.branch?.name}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-none bg-muted text-muted-foreground font-mono">
                    #{item.id.substring(0,8).toUpperCase()}
                  </Badge>
               </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "opening_time",
      header: "Shift Duration",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-[12px] font-bold text-foreground tabular-nums">{formatDateTime(item.opening_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 flex items-center justify-center">
                 <div className="size-1 rounded-full bg-muted-foreground/30" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {item.closing_time ? `Closed: ${format(new Date(item.closing_time), 'HH:mm')}` : "Session Active"}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "expected_cash",
      header: () => <div className="text-right">Expected Cash</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[13px] font-bold tabular-nums text-foreground">{formatCurrency(row.original.expected_cash || 0)}</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">System Total</span>
        </div>
      )
    },
    {
      accessorKey: "closing_cash",
      header: () => <div className="text-right">Actual Cash</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[13px] font-bold tabular-nums text-foreground">
            {row.original.status === 'closed' ? formatCurrency(row.original.closing_cash || 0) : "-"}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Counted in Drawer</span>
        </div>
      )
    },
    {
      accessorKey: "variance",
      header: () => <div className="text-center">Difference</div>,
      cell: ({ row }) => {
        const item = row.original;
        if (item.status !== 'closed') return <div className="text-center text-[10px] font-bold text-muted-foreground opacity-30 tracking-widest uppercase">Ongoing</div>;
        const isVariance = Number(item.variance || 0) !== 0;
        return (
          <div className="flex justify-center">
             <Badge className={cn(
               "text-[10px] px-2.5 py-0.5 border shadow-none font-bold tracking-tight rounded-md uppercase",
               !isVariance ? "bg-emerald-50 text-emerald-600 border-emerald-100" : (item.variance < 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100")
             )}>
               {isVariance ? (item.variance > 0 ? "+" + formatCurrency(item.variance) : formatCurrency(item.variance)) : "BALANCED"}
             </Badge>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end pr-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            onClick={() => setSelectedShiftId(row.original.id)}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <ResourceManagementLayout
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Shift History</h1>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                <Activity className="size-3.5 text-emerald-500/50" /> View and manage past cashier shifts and cash drawer reports.
              </p>
            </div>
          </div>
        }
        statCardsComponent={statsProps}
        searchColumn="cashier"
        searchPlaceholder="Search Personnel, IDs, or Branch..."
        exportFileName="Shift_History_Audit_Report"
        exportData={exportData}
        extraActions={
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border hover:bg-emerald-50 hover:text-emerald-600" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          </Button>
        }
        filterComponents={() => (
          <div className="flex flex-wrap items-center gap-2">
             {/* Time Horizon */}
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-xs font-normal gap-2.5">
                  <CalendarIcon className="size-3.5 text-emerald-500" />
                  {date?.from ? (date.to ? <>{format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}</> : format(date.from, "MMM dd")) : <span>Select range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            {/* Branch Selection */}
            <Popover open={branchOpen} onOpenChange={setBranchOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-xs font-normal gap-2.5">
                  <MapPin className="size-3.5 text-emerald-500" />
                  {branch === "all" ? "Whole organization" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}
                  <ChevronsUpDown className="ml-1 size-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 shadow-2xl border-border" align="start">
                <Command className="rounded-lg shadow-xl border border-border">
                  <CommandInput placeholder="Audit locations..." className="h-10 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs p-4 text-muted-foreground text-center">No branches found</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs" onSelect={() => { setBranch("all"); setBranchOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branch === "all" ? "opacity-100" : "opacity-0")} />
                        All Branches
                      </CommandItem>
                      {branches.map((b) => (
                        <CommandItem key={b.id} className="text-xs" onSelect={() => { setBranch(b.id); setBranchOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branch) === String(b.id) ? "opacity-100" : "opacity-0")} />
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Cashier Selection */}
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-xs font-normal gap-2.5">
                  <UserIcon className="size-3.5 text-emerald-500" />
                  {user === "all" ? "All personnel" : sellers.find((s) => String(s.id) === String(user))?.name || "All Users"}
                  <ChevronsUpDown className="ml-1 size-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 shadow-2xl border-border" align="start">
                <Command className="rounded-lg shadow-xl border border-border">
                  <CommandInput placeholder="Staff identification..." className="h-10 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs p-4 text-muted-foreground text-center">No cashiers found</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs" onSelect={() => { setUser("all"); setUserOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 text-emerald-600", user === "all" ? "opacity-100" : "opacity-0")} />
                        All Cashiers
                      </CommandItem>
                      {sellers.map((s) => (
                        <CommandItem key={s.id} className="text-xs" onSelect={() => { setUser(s.id); setUserOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(user) === String(s.id) ? "opacity-100" : "opacity-0")} />
                          {s.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      />

      {/* Shift Detail Sheet */}
      <Sheet open={!!selectedShiftId} onOpenChange={(open) => !open && setSelectedShiftId(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto p-6 border-l border-border bg-card shadow-2xl">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-xl font-bold flex items-center gap-3">
                 <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <ClipboardList className="size-5 text-emerald-600" />
                 </div>
                 Shift Details
              </SheetTitle>
           </SheetHeader>
           <ShiftDetailReport 
             shiftId={selectedShiftId} 
             onClose={() => setSelectedShiftId(null)} 
           />
        </SheetContent>
      </Sheet>
    </>
  );
}
