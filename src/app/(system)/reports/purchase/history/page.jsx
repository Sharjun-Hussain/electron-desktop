"use client";

import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  DollarSign,
  FileText,
  Hash,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// ── Pagination Controls ──────────────────────────────────────────────────────
const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
}) => {
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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent text-foreground"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent text-foreground"
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
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent text-foreground",
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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent text-foreground"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent text-foreground"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function PurchaseHistoryReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  const skeletonRows = useMemo(
    () => Array.from({ length: 100 }, (_, idx) => `skeleton-row-${idx}`),
    [],
  );

  // Data list & stats
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalOrdersCount: 0,
    statusBreakdown: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  // Expanded PO ID
  const [expandedPoId, setExpandedPoId] = useState(null);

  // Dynamic selector lists
  const [suppliers, setSuppliers] = useState([]);
  const [branches, setBranches] = useState([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Load auxiliary lists
  const loadAuxiliaryData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [suppliersRes, branchesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      if (suppliersRes.ok) {
        const res = await suppliersRes.json();
        if (res.status === "success") setSuppliers(res.data || []);
      }
      if (branchesRes.ok) {
        const res = await branchesRes.json();
        if (res.status === "success") setBranches(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load auxiliary filter options:", err);
    }
  }, [session?.accessToken]);

  // Main fetch function
  const fetchReport = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage + 1),
        limit: String(pageSize),
        supplier_id: selectedSupplier,
        branch_id: selectedBranch,
        status: selectedStatus,
        start_date: startDate,
        end_date: endDate,
        search: searchQuery,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/purchase/history?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );

      if (!response.ok)
        throw new Error("Failed to fetch purchase history report");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data.data || []);
        setStats(
          result.data.stats || {
            totalPurchases: 0,
            totalOrdersCount: 0,
            statusBreakdown: {},
          },
        );
        setTotalRecords(result.data.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load purchase history report");
    } finally {
      setIsLoading(false);
    }
  }, [
    session?.accessToken,
    currentPage,
    pageSize,
    selectedSupplier,
    selectedBranch,
    selectedStatus,
    startDate,
    endDate,
    searchQuery,
  ]);

  useEffect(() => {
    loadAuxiliaryData();
  }, [loadAuxiliaryData]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle filter changes (Reset page to 0)
  const handleFilterChange = () => {
    setCurrentPage(0);
    setExpandedPoId(null);
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  // Status Colors styling mapper
  const getStatusBadge = (status) => {
    const statusMap = {
      received: {
        label: "Received",
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
      },
      partially_received: {
        label: "Partially Received",
        className:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
      },
      ordered: {
        label: "Ordered",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
      },
      pending: {
        label: "Pending",
        className:
          "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200",
      },
      cancelled: {
        label: "Cancelled",
        className:
          "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200",
      },
    };
    const s = statusMap[status?.toLowerCase()] || {
      label: status,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <Badge
        variant="outline"
        className={cn(
          "px-2 py-0.5 rounded font-semibold text-[11px]",
          s.className,
        )}
      >
        {s.label}
      </Badge>
    );
  };

  // Preparation for CSV/Excel data actions export
  const exportData = useMemo(() => {
    return data.map((item) => ({
      "PO Number": item.po_number,
      Date: new Date(item.order_date).toLocaleDateString(),
      Supplier: item.supplier?.name || "-",
      "Supplier Code": item.supplier?.code || "-",
      Branch: item.branch?.name || "-",
      "Total Amount": item.total_amount,
      Status: item.status,
      "Created By": item.created_by_user?.name || "-",
    }));
  }, [data]);

  // Compute stats card indicators
  const displayStats = [
    {
      label: "Cumulative Procurement",
      value: formatCurrency(stats.totalPurchases || 0),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Invoices Filed",
      value: stats.totalOrdersCount || 0,
      icon: FileText,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Outstanding Shipments",
      value:
        (stats.statusBreakdown?.ordered || 0) +
        (stats.statusBreakdown?.pending || 0),
      icon: Truck,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Purchase History Report
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Comprehensive audit, lineage, and itemized breakdown of
                procurement files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions
              data={exportData}
              fileName="Purchase_History_Audit_Report"
              onPrint={() => window.print()}
              showPrint={true}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={fetchReport}
              className="h-9 w-9 p-0 border-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 bg-transparent rounded-lg"
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {/* ── Diagnostic Metrics ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shrink-0 self-start`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight mt-0.5">
                  {isLoading ? <Skeleton className="h-7 w-24" /> : stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        <Card className="border border-border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Search PO */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Search PO Number
                </span>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-emerald-500" />
                  <Input
                    placeholder="e.g. PO-001"
                    className="h-9 pl-9 pr-3 rounded-md border-border bg-transparent text-sm"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleFilterChange();
                    }}
                  />
                </div>
              </div>

              {/* Supplier Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Supplier
                </span>
                <Select
                  value={selectedSupplier}
                  onValueChange={(val) => {
                    setSelectedSupplier(val);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="h-9 border-border bg-transparent text-xs">
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Branch
                </span>
                <Select
                  value={selectedBranch}
                  onValueChange={(val) => {
                    setSelectedBranch(val);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="h-9 border-border bg-transparent text-xs">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Status
                </span>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => {
                    setSelectedStatus(val);
                    handleFilterChange();
                  }}
                >
                  <SelectTrigger className="h-9 border-border bg-transparent text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="partially_received">
                      Partially Received
                    </SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filters */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Start Date
                </span>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-9 pr-3 rounded-md border-border bg-transparent text-xs"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      handleFilterChange();
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  End Date
                </span>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-9 pr-3 rounded-md border-border bg-transparent text-xs"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      handleFilterChange();
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders Table */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          <CardHeader className="p-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <Activity className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Procurement History Ledger
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chronological log of registered and executed purchase files
                </p>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10 pl-6 h-11 border-b-0"></TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    PO Number / Agent
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    Supplier / Vendor Partner
                  </TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    Fulfillment Branch
                  </TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    Items Order Count
                  </TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    Fulfillment Status
                  </TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">
                    Grand Total Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  skeletonRows.slice(0, pageSize).map((key) => (
                    <TableRow key={key} className="border-b border-border">
                      <TableCell className="pl-6 py-4" colSpan={7}>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-6 w-full bg-muted/60" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  data.map((po) => {
                    const isExpanded = expandedPoId === po.id;
                    const itemsCount = po.items?.length || 0;
                    return (
                      <>
                        {/* Parent Row */}
                        <TableRow
                          key={po.id}
                          className="hover:bg-muted/30 transition-colors border-b border-border cursor-pointer group"
                          onClick={() =>
                            setExpandedPoId(isExpanded ? null : po.id)
                          }
                        >
                          <TableCell className="pl-6 py-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-background border border-border text-muted-foreground group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all duration-300">
                                <Hash className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-foreground mb-0.5 group-hover:text-emerald-600 transition-colors">
                                  {po.po_number}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                  <User className="h-3 w-3 text-muted-foreground/60" />
                                  {po.created_by_user?.name || "System Agent"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {po.supplier?.name || "Independent"}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                {po.supplier?.phone
                                  ? `Phone: ${po.supplier.phone}`
                                  : po.supplier?.email || "No contact"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {po.branch?.name || "Main Warehouse"}
                              </span>
                              <span className="text-[10px] text-muted-foreground/75 font-semibold mt-0.5 tracking-tight">
                                {new Date(po.order_date).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="bg-background text-muted-foreground border-border text-[11px] font-semibold px-2 py-0.5 rounded-md"
                            >
                              {itemsCount}{" "}
                              <span className="ml-1 text-[10px] font-medium uppercase text-muted-foreground/70">
                                SKUs
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(po.status)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <p className="text-sm font-bold text-emerald-600 tabular-nums tracking-tight">
                              {formatCurrency(po.total_amount || 0)}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 font-semibold tracking-wider uppercase mt-0.5">
                              Procured Flow
                            </p>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Line-item details */}
                        {isExpanded && (
                          <TableRow className="bg-muted/10 hover:bg-muted/15 border-b border-border">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-8 py-5 border-t border-b border-border bg-muted/5 flex flex-col gap-4 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                                      <Package className="h-4 w-4" />
                                    </div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                      Itemized Procurement Audit ({po.po_number}
                                      )
                                    </h4>
                                  </div>
                                  <span className="text-xs text-muted-foreground font-semibold">
                                    Expected:{" "}
                                    {po.expected_delivery_date
                                      ? new Date(
                                          po.expected_delivery_date,
                                        ).toLocaleDateString()
                                      : "Immediate delivery"}
                                  </span>
                                </div>
                                <div className="border border-border/80 rounded-lg overflow-hidden bg-card">
                                  <Table>
                                    <TableHeader className="bg-muted/30">
                                      <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="h-9 text-[11px] font-bold text-muted-foreground">
                                          Product Details
                                        </TableHead>
                                        <TableHead className="h-9 text-[11px] font-bold text-muted-foreground">
                                          SKU / Code
                                        </TableHead>
                                        <TableHead className="text-center h-9 text-[11px] font-bold text-muted-foreground">
                                          Qty Ordered
                                        </TableHead>
                                        <TableHead className="text-center h-9 text-[11px] font-bold text-muted-foreground">
                                          Qty Received
                                        </TableHead>
                                        <TableHead className="text-right h-9 text-[11px] font-bold text-muted-foreground">
                                          Unit Cost
                                        </TableHead>
                                        <TableHead className="text-right pr-6 h-9 text-[11px] font-bold text-muted-foreground">
                                          Subtotal
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {po.items && po.items.length > 0 ? (
                                        po.items.map((item) => (
                                          <TableRow
                                            key={item.id}
                                            className="border-border hover:bg-muted/10 transition-colors"
                                          >
                                            <TableCell className="py-2.5">
                                              <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-foreground">
                                                  {item.product?.name ||
                                                    "Unknown Product"}
                                                </span>
                                                {item.variant?.name && (
                                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    Variant: {item.variant.name}
                                                  </span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                              <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                  {item.variant?.sku ||
                                                    item.product?.code ||
                                                    "-"}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center py-2.5 font-semibold text-xs text-foreground tabular-nums">
                                              {Number(item.quantity).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-center py-2.5 font-semibold text-xs text-foreground tabular-nums">
                                              {Number(
                                                item.quantity_received,
                                              ).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right py-2.5 font-semibold text-xs text-foreground tabular-nums">
                                              {formatCurrency(item.unit_cost)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-2.5 font-bold text-emerald-600 tabular-nums">
                                              {formatCurrency(
                                                item.total_amount,
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell
                                            colSpan={6}
                                            className="text-center py-6 text-xs text-muted-foreground italic"
                                          >
                                            No individual product records
                                            registered for this purchase order.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-xl bg-muted text-muted-foreground opacity-50">
                          <ShoppingBag className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs leading-none">
                            No purchase records found
                          </h4>
                          <p className="text-[11px] text-muted-foreground/80 font-medium mt-2 italic leading-none">
                            Update search filters or date range parameters to
                            refresh the history ledger.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(0);
            }}
          />
        </Card>
      </div>
    </div>
  );
}
