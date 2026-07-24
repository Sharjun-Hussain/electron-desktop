"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { subDays, startOfMonth } from "date-fns";
import { format } from "@/lib/date-utils";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  RotateCcw,
  Eye,
  FileText,
  TrendingUp,
  Users,
  RefreshCcw,
  Clock,
  ArrowUpRight,
  ChevronDown,
  User,
  Hash,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "../ui/status-badge";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Label } from "../ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// --- MEMOIZED STATS COMPONENT ---
const StatsSection = React.memo(({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((card, idx) => (
        <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
});

StatsSection.displayName = "StatsSection";

export default function SalesReturnHistoryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000, // Increase limit for smooth local filtering
    total: 0,
    pages: 1
  });

  // Date state for API fetch
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Internal date for smooth picker UX
  const [internalDate, setInternalDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- HELPERS ---
  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: 1,
        size: 1000,
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        const rawData = result.data.data || [];
        // Flatten data for instant multi-column search
        const flattenedData = rawData.map(item => ({
          ...item,
          searchText: `${item.return_number} ${item.sale?.invoice_number || ""} ${item.customer?.name || ""} ${item.status}`.toLowerCase()
        }));
        setData(flattenedData);
        if (result.data.pagination) {
          setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
      } else {
        toast.error(result.message || "Failed to fetch return data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [session, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync internal date when external date changes
  useEffect(() => {
    if (date) setInternalDate(date);
  }, [date]);

  // Deep Link Handling
  useEffect(() => {
    const returnId = searchParams.get("returnId");
    if (returnId) {
      const item = data.find((s) => s.id == returnId);
      if (item) {
        setSelectedReturn(item);
        setIsDetailOpen(true);
      } else {
        const fetchSingle = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/returns/${returnId}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const rs = await res.json();
            if (rs.status === "success") {
              setSelectedReturn(rs.data);
              setIsDetailOpen(true);
            }
          } catch (e) { }
        };
        fetchSingle();
      }
    } else {
      setIsDetailOpen(false);
    }
  }, [searchParams, data, session]);

  // --- HANDLERS ---
  const handleViewDetails = (item) => {
    router.push(pathname + "?" + createQueryString("returnId", item.id), { scroll: false });
  };

  const handleCloseDetails = (open) => {
    if (!open) router.push(pathname, { scroll: false });
    setIsDetailOpen(open);
  };

  const exportData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      "Return #": item.return_number,
      Date: item.return_date,
      "Invoice #": item.sale?.invoice_number || "N/A",
      Customer: item.customer?.name || item.distributor?.name || "Walk-in",
      "Return Value": item.total_amount,
      "Refund Amount": item.refund_amount,
      Status: item.status?.toUpperCase(),
    }));
  }, [data]);

  const handleClearFilters = () => {
    setSearchQuery("");
    const defaultRange = { from: startOfMonth(new Date()), to: new Date() };
    setDate(defaultRange);
    setInternalDate(defaultRange);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // --- COLUMNS ---
  const columns = [
    {
      accessorKey: "return_number",
      header: "Return Identity",
      cell: ({ row }) => (
        <span className="font-bold text-sm text-orange-600">
          {row.getValue("return_number")}
        </span>
      )
    },
    {
      accessorKey: "searchText",
      header: "Search",
      enableHiding: true,
      cell: () => null,
    },
    {
      accessorKey: "return_date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 opacity-50" />
          <span className="text-xs font-bold font-mono">
            {format(new Date(row.getValue("return_date")), 'MMM dd, yyyy')}
          </span>
        </div>
      )
    },
    {
      accessorKey: "sale.invoice_number",
      header: "Invoice Reference",
      cell: ({ row }) => (
        <span className="font-bold text-muted-foreground text-xs">
          {row.original.sale?.invoice_number || "N/A"}
        </span>
      )
    },
    {
      accessorKey: "customer.name",
      header: "Client Account",
      cell: ({ row }) => (
        <span className="font-bold text-foreground text-sm">
          {row.original.customer?.name || row.original.distributor?.name || "Walk-in Customer"}
        </span>
      )
    },
    {
      accessorKey: "total_amount",
      header: () => <div className="text-right">Value</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-muted-foreground/60 tabular-nums text-sm">
          {formatCurrency(row.getValue("total_amount"))}
        </div>
      )
    },
    {
      accessorKey: "refund_amount",
      header: () => <div className="text-right">Refund</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-emerald-600 tabular-nums text-sm">
          {formatCurrency(row.getValue("refund_amount"))}
        </div>
      )
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge value={row.getValue("status")} />
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Operations</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-4 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Button>
        </div>
      )
    }
  ];

  // --- STATS ---
  const stats = useMemo(() => {
    const totalReturnVal = data.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const totalRefunded = data.reduce((sum, item) => sum + parseFloat(item.refund_amount || 0), 0);

    return [
      { label: "Total Returns", value: pagination.total, icon: RotateCcw, gradient: "from-orange-500 to-red-400" },
      { label: "Return Value", value: formatCurrency(totalReturnVal), icon: TrendingUp, gradient: "from-blue-500 to-cyan-400" },
      { label: "Refunded Sum", value: formatCurrency(totalRefunded), icon: ArrowUpRight, gradient: "from-emerald-500 to-teal-400" },
      { label: "Unique Clients", value: new Set(data.map(s => s.customer_id)).size, icon: Users, gradient: "from-purple-500 to-violet-400" },
    ];
  }, [data, pagination.total, formatCurrency]);

  const statCards = useMemo(() => (
    <StatsSection stats={stats} />
  ), [stats]);

  const handleSearchChange = useCallback((v) => {
    setSearchQuery(v);
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  return (
    <>
      <ResourceManagementLayout
        data={data}
        columns={columns}
        isLoading={loading}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-md">
              <RotateCcw className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Returns History</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Track and manage customer refunds and stock reversals</p>
            </div>
          </div>
        }
        statCardsComponent={statCards}
        searchPlaceholder="Filter by Return #, Invoice, or Customer..."
        searchColumn="searchText"
        initialColumnVisibility={{ searchText: false }}
        onExportClick={null}
        exportData={exportData}
        exportFileName="Sales_Return_Audit_Log"
        extraActions={
          <Button onClick={fetchData} variant="outline" size="icon" className="h-9 w-9 p-0 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200">
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        }
        isFiltered={searchQuery !== ""}
        onClearFilters={handleClearFilters}
        pageCount={pagination.pages}
        paginationState={{
          pageIndex: pagination.page - 1,
          pageSize: pagination.limit
        }}
        onPaginationChange={(updater) => {
          if (typeof updater === 'function') {
            const newState = updater({
              pageIndex: pagination.page - 1,
              pageSize: pagination.limit
            });
            setPagination(prev => ({
              ...prev,
              page: newState.pageIndex + 1,
              limit: newState.pageSize
            }));
          }
        }}
        filterComponents={() => (
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="w-full md:w-[280px] space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-orange-600" />
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timeline</label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 text-sm font-medium border-gray-200 hover:bg-gray-50">
                    {internalDate?.from ? (
                      internalDate.to ? `${format(internalDate.from, "MMM dd")} - ${format(internalDate.to, "MMM dd, y")}` : format(internalDate.from, "MMM dd, y")
                    ) : "Select period"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    captionLayout="dropdown-buttons"
                    fromYear={2015}
                    toYear={new Date().getFullYear() + 10}
                    selected={internalDate}
                    onSelect={(d) => {
                      setInternalDate(d);
                      if (d?.from && d?.to) {
                        setDate(d);
                        setPagination(p => ({ ...p, page: 1 }));
                      } else if (!d) {
                        setDate(null);
                        setPagination(p => ({ ...p, page: 1 }));
                      }
                    }}
                    numberOfMonths={2}
                    className="p-4"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      />

      <Sheet open={isDetailOpen} onOpenChange={handleCloseDetails}>
        <SheetContent className="sm:max-w-xl flex flex-col h-full p-0 overflow-hidden border-l">
          <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-md">
                    <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <SheetTitle className="text-xl font-bold text-foreground">
                    {selectedReturn?.return_number}
                  </SheetTitle>
                </div>
                <SheetDescription className="text-sm font-medium text-muted-foreground mt-1">
                  Initiated on {selectedReturn && formatDate(selectedReturn.return_date)}
                </SheetDescription>
              </div>

              <div className="flex flex-col items-end gap-3">
                <StatusBadge value={selectedReturn?.status} />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Refund Value</p>
                  <span className="text-xl font-black text-foreground tabular-nums leading-none">
                    {selectedReturn && formatCurrency(selectedReturn.refund_amount)}
                  </span>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 bg-card">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> Client Account
                  </Label>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                    <p className="text-sm font-bold">{selectedReturn?.customer?.name || selectedReturn?.distributor?.name || "Walk-in Customer"}</p>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1">{selectedReturn?.customer?.phone || selectedReturn?.distributor?.phone || "No contact info"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Hash className="h-3 w-3" /> References
                  </Label>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                    <p className="text-xs font-bold text-orange-600">{selectedReturn?.sale?.invoice_number || 'N/A'}</p>
                    <Badge variant="outline" className="text-[10px] font-bold mt-2 uppercase px-2 py-0 border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
                      {selectedReturn?.refund_method || 'CASH'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reconciled Items</Label>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">
                    {selectedReturn?.items?.length || 0} Products
                  </span>
                </div>

                <div className="rounded-xl border shadow-sm overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="py-3 text-[10px] font-bold uppercase px-4">Product</TableHead>
                        <TableHead className="py-3 text-[10px] font-bold uppercase text-center w-16">Qty</TableHead>
                        <TableHead className="py-3 text-[10px] font-bold uppercase text-right px-4">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReturn?.items?.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/20">
                          <TableCell className="py-3 px-4">
                            <span className="text-xs font-bold leading-tight">
                              {item.product?.name}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <span className="text-xs font-black tabular-nums">
                              {parseFloat(item.quantity).toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 text-right px-4">
                            <span className="text-xs font-black tabular-nums">
                              {formatCurrency(item.total_amount)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedReturn?.notes && (
                <div className="bg-muted/30 rounded-xl p-4 border border-dashed">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3" /> Return Notes
                  </Label>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed italic border-l-2 border-orange-200 pl-3">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-6 bg-card border-t flex gap-3 shrink-0">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-xl font-bold gap-2 text-xs"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl border-border/40 hover:bg-muted transition-all"
              onClick={() => handleCloseDetails(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
