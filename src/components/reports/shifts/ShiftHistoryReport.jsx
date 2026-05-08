"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    <div className="flex flex-col gap-6 selection:bg-emerald-500/30 selection:text-emerald-900 font-sans">
      <div className="flex justify-between items-center px-8 pt-6">
          <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 font-bold text-[10px] tracking-widest flex items-center gap-2 uppercase">
            <ShieldCheck className="size-3" /> Secure Session Audit
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-semibold text-xs uppercase tracking-tight rounded-lg px-4 h-9 shadow-sm">
            <Printer className="size-3.5" /> Print Audit
          </Button>
      </div>

      <div ref={printRef} className="px-8 pb-10 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <style type="text/css" media="print">
          {`@page { size: auto; margin: 10mm; } 
            body { -webkit-print-color-adjust: exact; }`}
        </style>

        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-slate-800 pb-10 mb-10 relative">
          <div className="flex flex-col text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10">
                <ClipboardList className="size-6" />
              </div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Audit Statement</h2>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
              <Activity className="size-3" /> Authorized Official Verification • Ledger Sync Enabled
            </p>
            
            <div className="flex items-center gap-3 mt-8">
               <div className="bg-gray-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Voucher Reference</span>
                  <span className="text-xs font-bold tabular-nums tracking-wider font-mono">#{shift.id.substring(0,12).toUpperCase()}</span>
               </div>
               <Badge className={cn(
                 "h-10 px-5 rounded-xl font-bold text-[11px] uppercase tracking-widest border-none shadow-sm",
                 shift.status === 'open' ? "bg-emerald-500 text-white animate-pulse" : "bg-slate-900 text-white"
               )}>
                 {shift.status}
               </Badge>
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end pt-2">
             <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 mb-4">
                <MapPin className="size-6 text-emerald-600" />
             </div>
             <p className="font-bold text-lg uppercase tracking-tight text-slate-900 dark:text-white leading-none">{shift.branch.name}</p>
             <p className="text-[10px] text-emerald-600 font-bold mt-2 uppercase tracking-[0.2em]">Operational Terminal Sector</p>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-none flex flex-col gap-4">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
               <UserIcon className="size-3 text-indigo-500" /> Authorized Personnel
             </span>
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-600/20 uppercase">
                   {shift.cashier.name.substring(0,1)}
                </div>
                <div className="flex flex-col">
                   <span className="text-base font-bold text-slate-900 dark:text-white leading-none mb-1.5">{shift.cashier.name}</span>
                   <span className="text-[10px] font-medium text-slate-500 lowercase tracking-tight">{shift.cashier.email}</span>
                </div>
             </div>
          </div>

          <div className="bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-none flex flex-col gap-4">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
               <CalendarIcon className="size-3 text-emerald-500" /> Temporal Chrono
             </span>
             <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="size-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inception</span>
                   </div>
                   <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">{formatDateTime(shift.opening_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="size-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Termination</span>
                   </div>
                   <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">{shift.closing_time ? formatDateTime(shift.closing_time) : 'Active Stream'}</span>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 dark:bg-emerald-900/20 border border-slate-900 dark:border-emerald-500/30 text-white p-7 rounded-2xl flex flex-col justify-between shadow-xl shadow-slate-900/10 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Receipt className="size-24" />
             </div>
             <div className="flex justify-between items-start relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Cleared Proceeds</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                   <TrendingUp className="size-4" />
                </div>
             </div>
             <div className="mt-8 relative z-10">
                <h4 className="text-3xl font-bold tabular-nums tracking-tighter">
                  {formatCurrency(stats.totalSales)}
                </h4>
                <p className="text-[10px] opacity-50 font-bold mt-2 uppercase tracking-[0.2em] leading-none flex items-center gap-1.5">
                  <Zap className="size-3 text-amber-400 fill-amber-400" /> Real-time Settlement Matrix
                </p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
           {/* Section 1: Yield Logic */}
           <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-900 dark:text-slate-200 flex items-center gap-2">
                   <Receipt className="size-4 text-indigo-500" /> Yield Analysis Ledger
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold border-gray-200 dark:border-slate-800 uppercase bg-gray-50/50 dark:bg-slate-900 text-muted-foreground">{stats.transactionCount} Events</Badge>
              </div>
              <div className="space-y-4 px-1 text-slate-900 dark:text-white">
                 <div className="flex justify-between items-center group">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest transition-colors">Gross Transaction Flow</span>
                    <span className="text-sm font-bold tabular-nums tracking-tight">{formatCurrency(stats.totalSales + stats.totalDiscount)}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest transition-colors">Operational Incentives</span>
                    <span className="text-sm font-bold tabular-nums text-rose-600 tracking-tight">- {formatCurrency(stats.totalDiscount)}</span>
                 </div>
                 <div className="flex justify-between items-center group">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest transition-colors">Fiscal Liability (Tax)</span>
                    <span className="text-sm font-bold tabular-nums tracking-tight">{formatCurrency(stats.totalTax)}</span>
                 </div>
                 <div className="pt-6 mt-4 border-t-2 border-slate-900 dark:border-white/20 flex justify-between items-center">
                    <span className="text-[13px] font-bold uppercase tracking-widest text-slate-900 dark:text-white underline decoration-emerald-500 decoration-2 underline-offset-8">Final Net Equity</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tighter">{formatCurrency(stats.totalSales)}</span>
                 </div>
              </div>
           </div>

           {/* Section 2: Settlement Breakdown */}
           <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-slate-800 pb-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-900 dark:text-slate-200 flex items-center gap-2">
                   <CreditCard className="size-4 text-emerald-500" /> Liquidity Channels
                </h3>
              </div>
              <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl p-6 space-y-4 border border-gray-100 dark:border-slate-800">
                 {Object.entries(paymentBreakdown || {}).map(([method, amount]) => (
                   <div key={method} className="flex justify-between items-center group text-slate-900 dark:text-white">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "size-2 rounded-full",
                           method.toLowerCase() === 'cash' ? "bg-emerald-500" :
                           method.toLowerCase() === 'card' ? "bg-indigo-500" : "bg-amber-500"
                         )} />
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{method}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums tracking-tight">{formatCurrency(amount)}</span>
                   </div>
                 ))}
                 {(!paymentBreakdown || Object.keys(paymentBreakdown || {}).length === 0) && (
                    <div className="flex flex-col items-center py-6 opacity-30 text-slate-900 dark:text-white">
                       <AlertCircle className="size-8 mb-2" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">No Channel Data Logged</span>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Reconciliation Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-8 rounded-2xl shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
              <Scale className="size-32" />
           </div>
           <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                 <Scale className="size-5" />
              </div>
              <div>
                <h3 className="text-[11px] uppercase font-bold tracking-[0.2em] text-slate-900 dark:text-white">Physical Reconciliation Matrix</h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Verification of physical drawer against digital ledger projection</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Search className="size-3 text-indigo-500" /> Digital Ledger Basis
                 </span>
                 <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-200 tracking-tighter">{formatCurrency(shift.expected_cash || 0)}</span>
                 <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase tracking-tight">Automated System Projection</p>
              </div>
              <div className="flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint className="size-3 text-emerald-500" /> User Counter Recon
                 </span>
                 <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-200 tracking-tighter">{formatCurrency(shift.closing_cash || 0)}</span>
                 <p className="text-[9px] text-muted-foreground mt-2 font-bold uppercase tracking-tight">Physically Counted Recognition</p>
              </div>
              <div className={cn(
                 "flex flex-col p-6 rounded-2xl border transition-all duration-500",
                 (shift.variance || 0) === 0 ? "bg-emerald-50/50 border-emerald-100/50 dark:bg-emerald-500/5 dark:border-emerald-500/20" : (shift.variance || 0) < 0 ? "bg-rose-50/50 border-rose-100/50 dark:bg-rose-500/5 dark:border-rose-500/20" : "bg-amber-50/50 border-amber-100/50 dark:bg-amber-500/5 dark:border-amber-500/20"
              )}>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
                    {(shift.variance || 0) < 0 ? <TrendingDown className="size-3 text-rose-500" /> : <TrendingUp className="size-3 text-emerald-500" />} 
                    Audit Divergence
                 </span>
                 <div className="flex flex-col">
                    <span className={cn(
                      "text-3xl font-bold tabular-nums tracking-tighter mb-4",
                      (shift.variance || 0) < 0 ? "text-rose-600" : (shift.variance || 0) > 0 ? "text-amber-500" : "text-emerald-600"
                    )}>
                       {(shift.variance || 0) > 0 ? "+" : ""}{formatCurrency(shift.variance || 0)}
                    </span>
                    <Badge className={cn(
                      "w-fit text-[9px] font-bold uppercase tracking-widest border-none px-3 py-1 shadow-sm",
                      (shift.variance || 0) === 0 ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
                    )}>
                       {(shift.variance || 0) === 0 ? "RECON STATUS: SECURE" : "RECON STATUS: ANOMALY"}
                    </Badge>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-20 pt-10 border-t border-gray-100 dark:border-slate-800 flex flex-col items-center gap-4 text-center">
           <div className="flex items-center gap-4 opacity-30 text-slate-900 dark:text-white font-mono scale-90">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Quantum POS Audit Engine</span>
              <div className="size-1 rounded-full bg-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Node-Hash: {shift.id.substring(0,8).toUpperCase()}</span>
           </div>
           <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.1em] mt-2 italic max-w-md mx-auto">
             This document is a confidential internal intelligence summary generated by the core financial node. Unauthorized duplication or distribution is strictly prohibited.
           </p>
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
      s.cashier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const statsProps = useMemo(() => {
    const closedShifts = (data || []).filter(s => s.status === 'closed');
    const totalSales = (data || []).reduce((acc, s) => acc + Number(s.expected_cash || 0), 0);
    const totalVariance = closedShifts.reduce((acc, s) => acc + Number(s.variance || 0), 0);

    const stats = [
      {
        label: "Expected Revenue",
        value: formatCurrency(totalSales),
        icon: BarChart3,
        gradient: "from-indigo-600 to-violet-500"
      },
      {
        label: "Audited Sessions",
        value: `${data.length} Shifts`,
        icon: ShieldCheck,
        gradient: "from-emerald-600 to-teal-500"
      },
      {
        label: "Average Velocity",
        value: formatCurrency(data.length > 0 ? totalSales / data.length : 0),
        icon: Zap,
        gradient: "from-amber-600 to-orange-500"
      },
      {
        label: "Cumulative Variance",
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
                card.label === "Cumulative Variance" && totalVariance < 0 && "text-rose-600"
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
      header: "Session Identification",
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
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-none bg-gray-100 dark:bg-slate-800 text-muted-foreground font-mono">
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
      header: "Temporal Scope",
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
      header: () => <div className="text-right">Ledger Data</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[13px] font-bold tabular-nums text-foreground">{formatCurrency(row.original.expected_cash || 0)}</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Expected Recognition</span>
        </div>
      )
    },
    {
      accessorKey: "closing_cash",
      header: () => <div className="text-right">Physical Recon</div>,
      cell: ({ row }) => (
        <div className="text-right flex flex-col items-end">
          <span className="text-[13px] font-bold tabular-nums text-foreground">
            {row.original.status === 'closed' ? formatCurrency(row.original.closing_cash || 0) : "-"}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Actual Verification</span>
        </div>
      )
    },
    {
      accessorKey: "variance",
      header: () => <div className="text-center">Audit Divergence</div>,
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
               {isVariance ? (item.variance > 0 ? "+" + formatCurrency(item.variance) : formatCurrency(item.variance)) : "STABLE"}
             </Badge>
          </div>
        );
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Operations</div>,
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
              <h1 className="text-xl font-bold tracking-tight text-foreground">Shift History & Audit</h1>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
                <Activity className="size-3.5 text-emerald-500/50" /> Professional verification of cashier sessions and cash reconciliation matrices.
              </p>
            </div>
          </div>
        }
        statCardsComponent={statsProps}
        searchColumn="cashier"
        searchPlaceholder="Search Personnel, IDs, or Branch..."
        exportFileName="Shift_History_Audit_Report"
        extraActions={
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-gray-200 hover:bg-emerald-50 hover:text-emerald-600" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
          </Button>
        }
        filterComponents={() => (
          <div className="flex flex-wrap items-center gap-2">
             {/* Time Horizon */}
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-[11px] font-bold uppercase tracking-wider gap-2.5">
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
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-[11px] font-bold uppercase tracking-wider gap-2.5">
                  <MapPin className="size-3.5 text-emerald-500" />
                  {branch === "all" ? "Whole organization" : branches.find((b) => String(b.id) === String(branch))?.name || "All Branches"}
                  <ChevronsUpDown className="ml-1 size-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 shadow-2xl border-gray-100" align="start">
                <Command className="rounded-lg shadow-xl border border-border">
                  <CommandInput placeholder="Audit locations..." className="h-10 text-xs font-bold" />
                  <CommandList>
                    <CommandEmpty className="text-xs p-4 font-bold text-muted-foreground text-center">No location discovered</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs font-bold" onSelect={() => { setBranch("all"); setBranchOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branch === "all" ? "opacity-100" : "opacity-0")} />
                        Global Aggregated
                      </CommandItem>
                      {branches.map((b) => (
                        <CommandItem key={b.id} className="text-xs font-bold" onSelect={() => { setBranch(b.id); setBranchOpen(false); }}>
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
                <Button variant="outline" className="h-9 px-3 border-border bg-background hover:bg-muted text-[11px] font-bold uppercase tracking-wider gap-2.5">
                  <UserIcon className="size-3.5 text-emerald-500" />
                  {user === "all" ? "All personnel" : sellers.find((s) => String(s.id) === String(user))?.name || "All Users"}
                  <ChevronsUpDown className="ml-1 size-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 shadow-2xl border-gray-100" align="start">
                <Command className="rounded-lg shadow-xl border border-border">
                  <CommandInput placeholder="Staff identification..." className="h-10 text-xs font-bold" />
                  <CommandList>
                    <CommandEmpty className="text-xs p-4 font-bold text-muted-foreground text-center">Unauthorized Identity</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs font-bold" onSelect={() => { setUser("all"); setUserOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4 text-emerald-600", user === "all" ? "opacity-100" : "opacity-0")} />
                        Authorized Roster
                      </CommandItem>
                      {sellers.map((s) => (
                        <CommandItem key={s.id} className="text-xs font-bold" onSelect={() => { setUser(s.id); setUserOpen(false); }}>
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

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShiftId} onOpenChange={(open) => !open && setSelectedShiftId(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl bg-white dark:bg-slate-950">
           <DialogHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <ClipboardList className="size-5 text-emerald-600" />
                 </div>
                 Session Intelligence Summary
              </DialogTitle>
           </DialogHeader>
           <ShiftDetailReport 
             shiftId={selectedShiftId} 
             onClose={() => setSelectedShiftId(null)} 
           />
        </DialogContent>
      </Dialog>
    </>
  );
}
