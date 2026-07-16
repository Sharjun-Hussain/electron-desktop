"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { subDays } from "date-fns";
import { format } from "@/lib/date-utils";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  RefreshCw,
  Gift,
  ArrowUpRight,
  TrendingUp,
  Users,
  Wallet,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { LoyaltyReportPrintTemplate } from "@/components/Template/loyalty/LoyaltyReportPrintTemplate";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/5">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</p>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px] text-xs border-border"><SelectValue /></SelectTrigger>
          <SelectContent>{[10, 20, 50].map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(0)} disabled={!canPrev}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={!canPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={!canNext}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages - 1)} disabled={!canNext}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export default function LoyaltyReportPage() {
  const { data: session } = useSession();
  const { formatDateTime } = useAppSettings();

  const [date, setDate] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [data, setData] = useState({ transactions: [], topCustomers: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [branch, setBranch] = useState("all");
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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
    } catch (err) { console.error(err); }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branch
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/customers/loyalty?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') setData(result.data);
      else toast.error(result.message);
    } catch (err) {
      toast.error("Failed to load loyalty report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branch]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    let result = data.transactions || [];
    if (searchQuery) {
      result = result.filter(tx => 
        tx.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [data.transactions, searchQuery]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: "Loyalty_Report" });

  const handleExportCSV = () => {
    const exportData = filteredTransactions.map(tx => ({
      "Date": formatDateTime(tx.created_at),
      "Invoice": tx.invoice_number,
      "Customer": tx.customer?.name,
      "Earned": tx.earned_points,
      "Redeemed": tx.redeemed_points,
      "Net": (tx.earned_points || 0) - (tx.redeemed_points || 0)
    }));
    exportToCSV(exportData, "Loyalty_Report");
  };

  const statsCards = [
    { label: "Points Earned", val: data.summary?.totalEarned || 0, desc: "New points issued", icon: TrendingUp, color: "emerald" },
    { label: "Points Redeemed", val: data.summary?.totalRedeemed || 0, desc: "Value claimed by customers", icon: Gift, color: "rose" },
    { label: "Active Members", val: data.summary?.activeCustomers || 0, desc: "Unique point holders", icon: Users, color: "blue" },
    { label: "Liability Value", val: data.summary?.totalOutstanding || 0, desc: "Points currently outstanding", icon: Wallet, color: "slate" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div style={{ display: "none" }}>
        <LoyaltyReportPrintTemplate
          ref={printRef}
          transactions={filteredTransactions}
          topCustomers={data.topCustomers}
          summary={data.summary}
          dateRange={date}
          formatDateTime={formatDateTime}
        />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Loyalty Points Ledger</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Comprehensive audit of customer rewards and redemption behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
            <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"><Printer className="h-4 w-4" /> Print</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <Card key={idx} className="border border-border shadow-xs">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-lg text-white", `bg-${card.color}-500`)}>
                  <card.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{card.label}</p>
                  <h3 className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="h-8 w-20" /> : card.val.toLocaleString()}</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">{card.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Logs */}
          <Card className="xl:col-span-2 border border-border shadow-sm flex flex-col min-h-[600px]">
            <div className="p-4 border-b border-border bg-muted/5 flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-auto space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" /> Period
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-[240px] justify-start text-left h-9 border-border text-xs bg-transparent"><CalendarIcon className="mr-2 h-4 w-4" /> {date?.from ? (date.to ? <>{format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}</> : format(date.from, "MMM dd")) : "Select Range"}</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-border"><Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} /></PopoverContent>
                </Popover>
              </div>
              <div className="w-full md:w-[200px] space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Location</label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="h-9 border-border text-xs bg-transparent"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{id:'all', name:'Global View'}, ...branches].map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-full md:flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter flex items-center gap-1.5"><Search className="h-3 w-3" /> Explorer</label>
                <Input placeholder="Search members or invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 border-border text-xs pl-8 bg-transparent" />
              </div>
              <Button size="icon" variant="outline" className="h-9 w-9 border-border" onClick={fetchData} disabled={isLoading}><RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} /></Button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold uppercase py-4">Timestamp</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase">Reference</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase">Customer</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase text-right">Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx, idx) => (
                      <TableRow key={idx} className="border-border hover:bg-muted/5 transition-colors">
                        <TableCell className="text-xs font-medium tabular-nums">{formatDateTime(tx.created_at)}</TableCell>
                        <TableCell className="text-xs font-bold text-foreground">{tx.invoice_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{tx.customer?.name}</span>
                            <span className="text-[10px] text-muted-foreground">{tx.customer?.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1">
                             {tx.earned_points > 0 && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">+{tx.earned_points} pts</Badge>}
                             {tx.redeemed_points > 0 && <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-none font-bold text-[10px]">-{tx.redeemed_points} pts</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center text-muted-foreground text-sm font-medium">No loyalty activity found for this period.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
          </Card>

          {/* Top Customers */}
          <Card className="border border-border shadow-sm flex flex-col">
            <div className="p-5 border-b border-border bg-emerald-50/10">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground"><TrendingUp className="h-4 w-4 text-emerald-600" /> Leaderboard</h4>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Top point holders across the organization</p>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {data.topCustomers?.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.topCustomers.map((customer, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-600">{idx + 1}</div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{customer.name}</p>
                          <p className="text-[10px] text-muted-foreground">{customer.phone || 'No phone'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{customer.loyalty_points.toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">Total pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground text-xs font-medium">No ranked members yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
