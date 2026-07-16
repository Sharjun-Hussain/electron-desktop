"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useCallback, useMemo } from "react";
import { subDays } from "date-fns";
import { format } from "@/lib/date-utils";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Truck,
  ArrowRight,
  FileText,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Filter,
  Layers,
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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
          <SelectTrigger className="h-8 w-[70px] text-xs border-border">
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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
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
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50"
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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function StockTransferReportPage() {
  const { data: session } = useSession();
  const { formatDate } = useAppSettings();
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fromBranch, setFromBranch] = useState("all");
  const [toBranch, setToBranch] = useState("all");
  const [fromBranchOpen, setFromBranchOpen] = useState(false);
  const [toBranchOpen, setToBranchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        from_branch: fromBranch,
        to_branch: toBranch
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/transfers?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch transfer data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, fromBranch, toBranch]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 0 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, date, fromBranch, toBranch]);

  const handleExportCSV = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToCSV(exportData, "Stock_Transfer_Report");
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map((item) => ({
      "Transfer #": item.transfer_number,
      Date: item.transfer_date,
      From: item.from_branch?.name,
      To: item.to_branch?.name,
      Items: item.items?.length || 0,
      Status: item.status,
      "Processed By": item.user?.name,
    }));
    exportToExcel(exportData, "Stock_Transfer_Report");
  };

  const filteredData = useMemo(() => Array.isArray(data) ? data.filter((item) =>
    item.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.from_branch?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.to_branch?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [], [data, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(
    () => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredData, currentPage, pageSize]
  );

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // Stats Logic
  const totalTransfers = data.length;
  const pendingTransfers = data.filter(i => i.status === 'pending').length;
  const completedTransfers = data.filter(i => i.status === 'completed').length;
  const failedTransfers = data.filter(i => i.status === 'failed' || i.status === 'cancelled').length;

  const stats = [
    {
      label: "Total Transfers",
      val: isLoading ? null : totalTransfers.toLocaleString(),
      desc: "Transfers recorded in period",
      icon: Truck,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Completed",
      val: isLoading ? null : completedTransfers.toLocaleString(),
      desc: "Successfully moved",
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Pending Transit",
      val: isLoading ? null : pendingTransfers.toLocaleString(),
      desc: "Awaiting confirmation",
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      label: "Issues / Cancelled",
      val: isLoading ? null : failedTransfers.toLocaleString(),
      desc: "Transfers interrupted",
      icon: AlertTriangle,
      gradient: "from-rose-500 to-pink-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Transfer Ledger</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Chronology of internal stock distribution across branches</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
              onClick={handleExportCSV} 
            >
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
              onClick={handleExportExcel} 
            >
              <FileText className="h-4 w-4" /> Excel
            </Button>
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-border hover:border-emerald-200 hover:bg-emerald-50" 
              onClick={fetchData} 
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shrink-0`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
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

        {/* ── Intelligence Filters (Main Table Wrap) ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Card Config Header containing Filters */}
          <div className="bg-muted/10 border-b border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
               {/* Period Filter */}
               <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Period
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200">
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select period</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                      <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
              </div>

               {/* Origin Filter */}
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Origin
                  </label>
                  <Popover open={fromBranchOpen} onOpenChange={setFromBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200"
                      >
                        <span className="truncate text-sm">{fromBranch === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(fromBranch))?.name || "All Locations"}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search origins..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setFromBranch("all");
                                setFromBranchOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", fromBranch === "all" ? "opacity-100" : "opacity-0")} />
                              All Origin Locations
                            </CommandItem>
                            {branches.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => {
                                  setFromBranch(b.id);
                                  setFromBranchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(fromBranch) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                {b.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              </div>

               {/* Destination Filter */}
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <MapPin className="h-3.5 w-3.5 text-emerald-600 opacity-70" /> Destination
                  </label>
                  <Popover open={toBranchOpen} onOpenChange={setToBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200"
                      >
                        <span className="truncate text-sm">{toBranch === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(toBranch))?.name || "All Locations"}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg" align="start">
                      <Command>
                        <CommandInput placeholder="Search destinations..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No location found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setToBranch("all");
                                setToBranchOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", toBranch === "all" ? "opacity-100" : "opacity-0")} />
                              All Destination Locations
                            </CommandItem>
                            {branches.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.name}
                                onSelect={() => {
                                  setToBranch(b.id);
                                  setToBranchOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(toBranch) === String(b.id) ? "opacity-100" : "opacity-0")} />
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
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <Search className="h-3.5 w-3.5 text-emerald-600" /> Explorer
                  </label>
                  <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                      <Input 
                          placeholder="Transaction # or branch..." 
                          className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent" 
                          value={searchQuery}
                          onChange={(e)=>setSearchQuery(e.target.value)}
                      />
                  </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Transaction #</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">Execution Date</TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">Distribution Route</TableHead>
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">Payload</TableHead>
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right pr-6 py-3.5 text-[13px] font-semibold text-muted-foreground">Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-gray-100 animate-pulse">
                      <TableCell className="pl-6 py-4"><div className="h-4 w-24 rounded bg-gray-100 dark:bg-slate-800" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-gray-50 dark:bg-slate-900 rounded" /></TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="h-4 w-20 bg-gray-100 dark:bg-slate-800 rounded" /><div className="size-5 rounded-full bg-gray-50 dark:bg-slate-900" /><div className="h-4 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></div></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-16 mx-auto rounded-lg bg-gray-50 dark:bg-slate-900" /></TableCell>
                      <TableCell className="text-center"><div className="h-6 w-20 mx-auto rounded-lg bg-gray-100 dark:bg-slate-800" /></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-4 w-24 ml-auto bg-gray-50 dark:bg-slate-900 rounded" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-border group">
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                          <Layers className="size-3.5 opacity-40 text-muted-foreground group-hover:text-emerald-600" />
                          {item.transfer_number}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground font-medium tabular-nums">
                        {formatDate(item.transfer_date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-medium text-foreground">{item.from_branch?.name}</span>
                          <div className="p-1 rounded-full bg-muted text-muted-foreground group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all">
                            <ArrowRight className="h-3 w-3" />
                          </div>
                          <span className="text-[13px] font-medium text-emerald-600">{item.to_branch?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground border-none px-2.5 h-6 text-[11px] font-medium shadow-none rounded-md">
                          {item.items?.length || 0} Products
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-semibold h-6 px-3 shadow-none border-none rounded-md transition-all",
                          item.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                          item.status === 'pending' ? "bg-amber-500/10 text-amber-600" :
                          "bg-rose-500/10 text-rose-600"
                        )}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <p className="text-[12px] font-medium text-muted-foreground">via {item.user?.name}</p>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                          <div className="size-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                             <Truck className="size-8" />
                          </div>
                          <h4 className="font-bold text-foreground">No transfers mapped</h4>
                          <p className="text-sm font-medium text-muted-foreground italic">Refine date range or branch filters to trace logistics records</p>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </div>
    </div>
  );
}
