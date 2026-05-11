"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Calendar as CalendarIcon,
  Download,
  AlertCircle,
  FileText,
  RefreshCw,
  Trophy,
  Target,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          className="h-8 w-8 border-border hover:border-emerald-500/20 hover:bg-muted/50 bg-transparent"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-500/20 hover:bg-muted/50 bg-transparent"
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
                      : "border-border hover:border-emerald-500/20 hover:bg-muted/50 bg-transparent"
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
          className="h-8 w-8 border-border hover:border-emerald-500/20 hover:bg-muted/50 bg-transparent"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-500/20 hover:bg-muted/50 bg-transparent"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function EmployeePerformancePage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalRevenue: 0, totalCustomers: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date Filters
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const fetchData = useCallback(async (targetPage = 1) => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        page: targetPage,
        limit: pageSize
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee-performance?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch performance data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setSummary(result.data.summary || { totalSales: 0, totalRevenue: 0, totalCustomers: 0 });
        setPagination({
          page: result.data.pagination?.page || 1,
          total: result.data.pagination?.total || 0,
          totalPages: result.data.pagination?.totalPages || 1
        });
      } else {
        throw new Error(result.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error("Failed to load performance data");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, pageSize]);

  const exportData = useMemo(() => {
    return data.map((emp, index) => ({
      Rank: (pagination.page - 1) * pageSize + index + 1,
      Employee: emp.name,
      Email: emp.email,
      "Sales Count": emp.total_sales,
      "Customers Reached": emp.totalCustomers || emp.total_customers,
      "Avg. Sale Value": emp.average_sale_value,
      "Total Revenue": emp.total_amount,
    }));
  }, [data, pagination.page, pageSize]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  const statsCards = [
    {
      label: "Aggregate Gross Revenue",
      val: isLoading ? null : formatCurrency(summary.totalRevenue || 0),
      desc: "Total value generated by team",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Gross Sales Distribution",
      val: isLoading ? null : (summary.totalSales || 0).toLocaleString(),
      desc: "Total transactions closed",
      icon: Target,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Customer Acquisition Reach",
      val: isLoading ? null : (summary.totalCustomers || 0).toLocaleString(),
      desc: "Unique clients served",
      icon: Users,
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
              <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Employee Performance Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Personnel distribution efficiency and individual sales velocity analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions
              data={exportData}
              fileName="Employee_Performance_Report"
              onPrint={() => window.print()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchData(1)}
              className="border-border hover:border-emerald-500/20 hover:bg-muted/50 text-emerald-600 h-9 w-9 bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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

        {/* Dynamic Leaderboard Card */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Main Filters inside Table Top */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-end max-w-xs">
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-emerald-600" /> Reporting Horizon
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-muted/50 hover:border-emerald-500/20 p-2 bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="truncate">
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select horizon</span>}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-md border-border bg-card shadow-xl" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {error ? (
              <div className="p-12 text-center text-destructive flex flex-col items-center justify-center gap-3">
                <AlertCircle className="h-10 w-10 opacity-40 mx-auto" />
                <h4 className="font-bold text-foreground uppercase tracking-tight">Synchronization Fault</h4>
                <p className="text-sm font-semibold">{error}</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[80px] pl-6 py-4 text-xs font-semibold text-muted-foreground">Position</TableHead>
                    <TableHead className="py-4 text-xs font-semibold text-muted-foreground">Authorized Personnel</TableHead>
                    <TableHead className="text-right py-4 text-xs font-semibold text-muted-foreground">Sales Velocity</TableHead>
                    <TableHead className="text-right py-4 text-xs font-semibold text-muted-foreground">Customer Reach</TableHead>
                    <TableHead className="text-right py-4 text-xs font-semibold text-muted-foreground">Avg. Transaction</TableHead>
                    <TableHead className="text-right pr-6 py-4 text-xs font-semibold text-muted-foreground">Net Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6"><Skeleton className="h-7 w-7 rounded-md bg-muted" /></TableCell>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-md bg-muted" /><div><Skeleton className="h-4 w-32 mb-1.5 bg-muted/50" /><Skeleton className="h-3 w-40 bg-muted/50" /></div></div></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto rounded bg-muted/50" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto rounded bg-muted" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto rounded bg-muted/50" /></TableCell>
                        <TableCell className="text-right pr-6"><Skeleton className="h-6 w-28 ml-auto rounded-md bg-muted" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-24 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                            <Trophy className="size-8" />
                          </div>
                          <h4 className="font-bold text-foreground uppercase tracking-tight">Zero personnel movement</h4>
                          <p className="text-sm font-medium italic text-muted-foreground">Adjust reporting horizon to expand visibility</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((emp, index) => {
                      const rank = (pagination.page - 1) * pageSize + index + 1;
                      return (
                        <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors border-b border-border group">
                          <TableCell className="pl-6 py-3.5">
                            <div className={cn(
                              "flex items-center justify-center w-7 h-7 rounded border font-semibold text-[11px] transition-transform group-hover:scale-105",
                              rank === 1 ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                rank === 2 ? "bg-slate-500/10 border-slate-500/20 text-slate-600" :
                                  rank === 3 ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
                                    "bg-muted border-border text-muted-foreground"
                            )}>
                              #{rank}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-md border border-border shadow-sm group-hover:border-emerald-500/30 transition-colors">
                                <AvatarImage src={emp.profile_image} />
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold text-xs rounded-md">
                                  {emp.name?.substring(0, 2).toUpperCase() || 'EMP'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-sm text-foreground leading-none group-hover:text-emerald-600 transition-colors">{emp.name}</p>
                                <p className="text-xs font-medium text-muted-foreground mt-1">{emp.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm text-foreground">
                            {emp.total_sales || 0}
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm text-muted-foreground">
                            {(emp.totalCustomers || emp.total_customers || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground font-medium text-sm tabular-nums">
                            {formatCurrency(emp.average_sale_value || 0)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <p className="font-semibold text-emerald-600 tabular-nums text-sm">{formatCurrency(emp.total_amount || 0)}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1"><TrendingUp className="size-2.5" /> Gross Yield</p>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!error && (
            <PaginationControls
              currentPage={pagination.page - 1}
              totalPages={pagination.totalPages}
              onPageChange={(pageIndex) => fetchData(pageIndex + 1)}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                // The setPageSize state variable is added to fetchData's dependency array. 
                // Since fetchData triggers on mount/change, this will auto-refetch the first page appropriately via the generic delayDebounceFn effect.
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
