"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Search, 
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Printer,
  Info,
  Scale,
  Activity,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  TrendingUp,
  CreditCard,
  Receipt,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200">
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
                      : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function TaxLiabilityReportPage() {
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
        setBranches(result.data);
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/tax?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tax report");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.details || []);
        setSummary(result.data.summary || null);
        setCurrentPage(0); // Reset page on new data
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tax report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportData = useMemo(() => {
    return data.map((item) => ({
      "Invoice No": item.invoice_number,
      Date: format(new Date(item.created_at), "yyyy-MM-dd HH:mm"),
      "Taxable Amount": item.total_amount,
      "Tax Amount": item.tax_amount,
      "Total Amount": item.payable_amount,
    }));
  }, [data]);

  // Process data for pagination
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginatedData = useMemo(() => {
    return data.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const statsCards = [
    {
      label: "Aggregate Taxable Value",
      val: isLoading ? null : formatCurrency(summary?.totalTaxable || 0),
      desc: "Base taxable revenue",
      icon: Scale,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Total Tax Collected",
      val: isLoading ? null : formatCurrency(summary?.totalTax || 0),
      desc: "Recognized tax liability",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Revenue Recognition",
      val: isLoading ? null : formatCurrency(summary?.totalPayable || 0),
      desc: "Gross settled earnings",
      icon: CreditCard,
      gradient: "from-purple-500 to-fuchsia-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Tax Liability Statement</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Comprehensive itemized ledger of collected tax and taxable values</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions 
              data={exportData} 
              fileName="Tax_Report" 
              onPrint={() => window.print()}
            />
            <Button 
                onClick={() => window.print()} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Printer className="h-4 w-4" /> Print Ledger
            </Button>
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

        {/* Transaction Records Ledger / Filters */}
        <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
          {/* Filters Bar inside Table */}
          <div className="bg-white border-b border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              
              <div className="w-full space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                     <CalendarDays className="size-3.5 text-emerald-600" /> Reporting Horizon
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-gray-200 text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2">
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        <span className="truncate">
                          {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd, yyyy")}</> : format(date.from, "LLL dd, yyyy")) : <span>Select horizon</span>}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-gray-200 shadow-xl" align="start">
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
                      <Button variant="outline" className="w-full justify-between h-9 rounded-md border-gray-200 text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2">
                        <span className="truncate">{branchId === "all" ? "All Locations" : branches.find((b) => String(b.id) === String(branchId))?.name}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 rounded-md shadow-lg border-gray-200" align="start">
                      <Command>
                        <CommandInput placeholder="Search locations..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>No store found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => {setBranchId("all"); setIsBranchOpen(false)}} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branchId === "all" ? "opacity-100" : "opacity-0")} />
                              All Locations
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
                <Button variant="outline" onClick={() => fetchData()} className="h-9 w-9 p-0 rounded-md border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 shadow-sm" disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground">Invoice No</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground text-center">Audited Date</TableHead>
                  <TableHead className="text-right h-11 text-xs font-semibold text-muted-foreground">Taxable Capital</TableHead>
                  <TableHead className="text-right h-11 text-xs font-semibold text-muted-foreground">Tax Component</TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground">Recognition Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-24 bg-gray-100" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 mx-auto bg-gray-50" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto bg-gray-50" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto bg-gray-100" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-4 w-24 ml-auto bg-gray-50" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Receipt className="h-14 w-14 opacity-20" />
                        <p className="text-sm font-semibold italic">Zero Transactional Movement</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
                      <TableCell className="pl-6 py-3.5">
                         <span className="text-sm font-semibold text-foreground group-hover:text-emerald-600 transition-colors">{item.invoice_number}</span>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className="text-xs font-medium text-muted-foreground">{format(new Date(item.created_at), 'MMM dd, yyyy · HH:mm')}</span>
                      </TableCell>
                      <TableCell className="text-right">
                         <span className="text-sm font-medium text-muted-foreground tabular-nums">{formatCurrency(item.total_amount)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                         <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(item.tax_amount)}</span>
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

        {/* Audited Disclosure Bottom Card */}
        <Card className="border shadow-none bg-emerald-50/50 border-emerald-100 rounded-lg overflow-hidden">
          <CardContent className="p-6">
             <div className="flex gap-4">
                <div className="p-2.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                   <Info className="h-5 w-5" />
                </div>
                <div>
                   <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Audited Integrity Disclosure</h4>
                   <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                      This automated recapitulation is provided for informational VAT/NBT estimation benchmarks. Final fiscal liability and statutory compliance must be verified against primary tax records and regional regulatory frameworks.
                   </p>
                </div>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
