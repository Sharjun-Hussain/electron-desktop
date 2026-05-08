"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import {
  Search,
  Calendar as CalendarIcon,
  RefreshCw,
  MapPin,
  Truck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  PackageCheck,
  Check,
  CalendarDays,
  ChevronsUpDown,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DataActions } from "@/components/general/DataActions";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

// --- PAGINATION ---
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3 border-t border-border bg-card/50">
      <div className="flex items-center gap-4 order-2 sm:order-1">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
          Page <span className="text-foreground">{currentPage + 1}</span> of <span className="text-foreground">{totalPages}</span>
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border" onClick={() => onPageChange(0)} disabled={currentPage === 0}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border" onClick={() => onPageChange(totalPages - 1)} disabled={currentPage >= totalPages - 1}><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex items-center gap-3 order-1 sm:order-2">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[70px] rounded-lg border-border bg-background text-[11px] font-bold">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border shadow-xl">
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)} className="text-[11px] font-bold">{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DistributionReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();

  const [date, setDate] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [branches, setBranches] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchBranches = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await res.json();
      if (result.status === "success") setBranches(result.data);
    } catch (e) { console.error(e); }
  }, [session]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: branch,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/manufacturing/distribution?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data.transactions || []);
        setSummary(result.data.summary);
      } else {
        toast.error(result.message || "Failed to fetch distribution data");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching report");
    } finally {
      setIsLoading(false);
    }
  }, [session, date, branch]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter(item =>
      item.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.distributor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize), [filteredData, currentPage, pageSize]);

  const exportData = useMemo(() => filteredData.map(item => ({
    "Invoice #": item.invoice_number,
    "Date": formatDateTime(item.created_at),
    "Distributor": item.distributor?.name,
    "Phone": item.distributor?.phone || "N/A",
    "Branch": item.branch?.name,
    "Total Amount": item.payable_amount,
    "Status": item.status
  })), [filteredData, formatDateTime]);

  const statsCards = [
    { label: "Total Distributed", val: isLoading ? null : summary?.totalDistributed || 0, desc: "Cumulative wholesale value", icon: Truck, gradient: "from-blue-500 to-indigo-400", isCurrency: true },
    { label: "Partner Network", val: isLoading ? null : summary?.uniqueDistributors || 0, desc: "Active distribution entities", icon: UserCheck, gradient: "from-emerald-500 to-teal-400" },
    { label: "Total Shipments", val: isLoading ? null : summary?.totalShipments || 0, desc: "Completed distribution runs", icon: PackageCheck, gradient: "from-amber-500 to-orange-400" },
    { label: "Distribution Growth", val: isLoading ? null : "12.5%", desc: "Volume increase vs last period", icon: TrendingUp, gradient: "from-violet-500 to-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">Distribution Channel Report</h1>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Wholesale Performance & Logistics Audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions
              data={exportData}
              fileName="Distribution_Channel_Report"
            />
            <Button
              variant="outline"
              size="icon"
              className="border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <div key={idx} className="relative group overflow-hidden bg-card rounded-2xl border border-border shadow-xs transition-all hover:shadow-md hover:border-emerald-500/20">
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-linear-to-br ${card.gradient} text-white shadow-sm`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{card.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight tabular-nums">
                      {card.val === null ? <Skeleton className="h-8 w-24" /> : card.isCurrency ? formatCurrency(card.val) : card.val}
                    </h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-none">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Date Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Distribution Period
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-gray-200 text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2">
                      <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="truncate">
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select range</span>}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-md border-gray-200 shadow-xl" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Branch Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Distribution Point
                </label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-gray-200 font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">{branch === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(branch))?.name || "All Locations"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-gray-200 shadow-lg" align="start">
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
                  <Search className="h-3.5 w-3.5 text-emerald-600" /> Filter Log
                </label>
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <Input
                      placeholder="Invoice # or Distributor Name..."
                      className="pl-9 h-9 rounded-md border-gray-200 shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-y border-border">
                  <TableHead className="w-[180px] pl-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction Info</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Distributor Partner</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Logistics Point</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Items Count</TableHead>
                  <TableHead className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-emerald-600">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array.from({ length: 6 }).map((__, i) => (
                        <TableCell key={i}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Truck className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No distribution records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors border-gray-100 group">
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                          {item.invoice_number}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(item.created_at)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-foreground">{item.distributor?.name}</span>
                          <span className="text-[11px] text-muted-foreground">{item.distributor?.phone || "No Phone"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] font-medium text-foreground">{item.branch?.name}</TableCell>
                      <TableCell className="text-right text-[13px] font-bold tabular-nums">1</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                             item.payment_status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                           )}>
                             {item.payment_status}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-bold tabular-nums text-emerald-600">
                        {formatCurrency(item.payable_amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && filteredData.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>
    </div>
  );
}
