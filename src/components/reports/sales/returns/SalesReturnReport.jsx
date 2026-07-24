"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import { subDays } from "date-fns";
import { format } from "@/lib/date-utils";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  RotateCcw,
  TrendingUp,
  Users,
  RefreshCcw,
  Check,
  ChevronsUpDown,
  Filter,
  RefreshCw,
  CalendarDays,
  MapPin,
  User as UserIcon,
  Receipt,
  ArrowDownLeft,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SalesReturnReportTemplate } from "@/components/Template/sales/SalesReturnReportTemplate";
import { Skeleton } from "@/components/ui/skeleton";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

// ── Standardized Column Definition ──────────────────────────────────────────
const getColumns = (formatCurrency, formatDateTime) => [
  {
    accessorKey: "return_number",
    header: "Return Reference",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 group-hover:text-orange-600 transition-all">
          <Receipt className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground group-hover:text-emerald-600 transition-colors">
            {row.getValue("return_number")}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {format(new Date(row.original.return_date), "MMM dd")} • Inv:{" "}
            {row.original.sale?.invoice_number || "N/A"}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "customer.name",
    header: "Customer Entity",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">
          {row.original.customer?.name || row.original.distributor?.name || "Physical Walk-in"}
        </span>
        <span className="text-xs font-medium text-muted-foreground italic">
          Identified Client
        </span>
      </div>
    ),
  },
  {
    accessorKey: "refund_amount",
    header: "Financial Impact",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formatCurrency(row.getValue("refund_amount"))}
        </span>
        <span className="text-xs font-medium text-muted-foreground line-through opacity-70 tabular-nums">
          Original: {formatCurrency(row.original.total_amount)}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "refund_method",
    header: () => <div className="text-center">Refund Method</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="bg-muted/30 text-muted-foreground border-border px-2.5 py-1 text-[10px] font-semibold rounded-md shadow-none group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all"
        >
          {row.getValue("refund_method")?.charAt(0).toUpperCase() +
            row.getValue("refund_method")?.slice(1)}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "cashier.name",
    header: () => <div className="text-right">Authorized By</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">
          {row.original.cashier?.name || "System"}
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          Authenticated Ledger
        </p>
      </div>
    ),
  },
];

export default function SalesReturnReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();
  
  const [date, setDate] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refundMethod, setRefundMethod] = useState("all");
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo(
    () => getColumns(formatCurrency, formatDateTime),
    [formatCurrency, formatDateTime],
  );

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

           const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns?${queryParams}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
          });
          const result = await res.json();

          if (res.status === 401) {
              signOut({ callbackUrl: '/login' });
              return;
          }

          if (result.status === 'success') {
              setData(result.data.data || []);
              setApiStats(result.data.stats || null);
          } else {
              toast.error(result.message || "Failed to fetch data");
          }
      } catch (error) {
          console.error("Error fetching report:", error);
          toast.error("Failed to load report");
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

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Return_Report",
  });

  const exportData = useMemo(() => {
    return filteredData.map((item) => ({
      "Return No": item.return_number,
      Date: formatDateTime(item.return_date),
      "Original Invoice": item.sale?.invoice_number || "N/A",
      Customer: item.customer?.name || item.distributor?.name || "Walk-in",
      "Total Value": item.total_amount,
      "Refund Amount": item.refund_amount,
      Method: item.refund_method,
      Cashier: item.cashier?.name || "Unknown",
    }));
  }, [filteredData, formatDateTime]);

  useEffect(() => {
    let result = Array.isArray(data) ? data : [];

    if (searchQuery) {
      result = result.filter(item => 
        item.return_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.distributor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sale?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (refundMethod !== 'all') {
      result = result.filter(item => item.refund_method?.toLowerCase() === refundMethod.toLowerCase());
    }

    setFilteredData(result);
  }, [searchQuery, refundMethod, data]);

  // Reset to page 0 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, refundMethod, date, branch, user]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(
    () => filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredData, currentPage, pageSize]
  );

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const statsCards = [
    {
      label: "Total Returns",
      val: isLoading ? null : apiStats?.totalReturns || 0,
      desc: "Processed reverse logistics",
      icon: RotateCcw,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-500/20",
    },
    {
      label: "Return Value",
      val: isLoading ? null : formatCurrency(apiStats?.totalReturnAmount || 0),
      desc: "Gross reversal value",
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    {
      label: "Refunded Capital",
      val: isLoading ? null : formatCurrency(apiStats?.totalRefundAmount || 0),
      desc: "Capital issued back",
      icon: ArrowDownLeft,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-100 dark:bg-rose-500/20",
    },
    {
      label: "Analysis Period",
      val: isLoading ? null : data.length > 0 ? "Active" : "Idle",
      desc: "Ledger status",
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Printer Template */}
      <div style={{ display: "none" }}>
        <SalesReturnReportTemplate
          ref={printRef}
          data={filteredData}
          dateRange={date}
          stats={apiStats || {}}
          formatDateTime={formatDateTime}
        />
      </div>

      <ResourceManagementLayout
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        headerTitle={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Sales Return Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Comprehensive audit log of reverse logistics events
              </p>
            </div>
          </div>
        }
        statCardsComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl p-5 border border-border shadow-xs flex items-center gap-4 group hover:border-emerald-500/30 transition-colors"
              >
                <div
                  className={`p-3 rounded-md ${card.iconBg} ${card.iconColor} shrink-0 self-start`}
                >
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {card.label}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-28 mt-1" />
                  ) : (
                    <h3 className="text-2xl font-bold text-foreground truncate mt-0.5 tabular-nums">
                      {card.val}
                    </h3>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        }
        extraActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9"
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        }
        onPrint={handlePrint}
        showPrint={true}
        exportData={exportData}
        exportFileName="Sales_Return_Analytics_Report"
        searchColumn="return_number"
        searchPlaceholder="Ref #, invoice or client..."
        searchLabel="Explorer"
        isFiltered={branch !== "all" || user !== "all" || refundMethod !== "all"}
        onClearFilters={() => {
          setBranch("all");
          setUser("all");
          setRefundMethod("all");
          setDate({ from: subDays(new Date(), 30), to: new Date() });
        }}
        filterComponents={() => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end w-full">
            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-emerald-500" /> Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                    <span className="truncate">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, "LLL dd")} -{" "}
                            {format(date.to, "LLL dd")}
                          </>
                        ) : (
                          format(date.from, "LLL dd")
                        )
                      ) : (
                        <span>Select range</span>
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-emerald-500" /> Branch
              </label>
              <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent"
                  >
                    <span className="truncate">
                      {branch === "all"
                        ? "All Branches"
                        : branches.find((b) => String(b.id) === String(branch))
                            ?.name || "All Branches"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search branches..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No branch found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setBranch("all");
                            setBranchOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-emerald-600",
                              branch === "all" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All Branches
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-emerald-600",
                                String(branch) === String(b.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {b.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserIcon className="size-3.5 text-emerald-500" /> Handler
              </label>
              <Popover open={userOpen} onOpenChange={setUserOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                  >
                    <span className="truncate">
                      {user === "all"
                        ? "All Personnel"
                        : sellers.find((s) => String(s.id) === String(user))
                            ?.name || "All Cashiers"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search personnel..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No staff member found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setUser("all");
                            setUserOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-emerald-600",
                              user === "all" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All Personnel
                        </CommandItem>
                        {sellers.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => {
                              setUser(s.id);
                              setUserOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-emerald-600",
                                String(user) === String(s.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Filter className="size-3.5 text-emerald-600" /> Refund Protocol
              </label>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger className="h-9 rounded-md border-border font-normal text-sm hover:bg-emerald-50 hover:border-emerald-200 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md border-border shadow-lg">
                  <SelectItem value="all">All Protocols</SelectItem>
                  <SelectItem value="cash">Fiscal: Cash</SelectItem>
                  <SelectItem value="card">Digital: Card</SelectItem>
                  <SelectItem value="credit">Internal: Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      />
    </div>
  );
}
