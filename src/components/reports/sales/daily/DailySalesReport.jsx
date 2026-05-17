"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import {
  format,
  subDays,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  ArrowRight,
  SlidersHorizontal,
  RefreshCw,
  Check,
  ChevronsUpDown,
  DollarSign,
  Receipt,
  Tag,
  CreditCard as PaymentIcon,
  CalendarDays,
  MapPin,
  User as UserIcon,
  Zap,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SalesSummaryPrintTemplate } from "@/components/Template/sales/SalesSummaryPrintTemplate";
import { Skeleton } from "@/components/ui/skeleton";
import { DataActions } from "@/components/general/DataActions";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
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
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50",
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

export default function DailySalesSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime, localization, pos } =
    useAppSettings();

  const currencySymbol = useMemo(() => {
    const currencies = [
      { code: "LKR", symbol: "Rs" },
      { code: "USD", symbol: "$" },
      { code: "EUR", symbol: "€" },
      { code: "GBP", symbol: "£" },
      { code: "INR", symbol: "₹" },
    ];
    return (
      currencies.find((c) => c.code === localization?.currency)?.symbol || "Rs"
    );
  }, [localization]);

  const paymentMethods = useMemo(() => {
    const baseMethods = pos?.paymentMethods || [
      "Cash",
      "Card",
      "Cheque",
      "Voucher",
    ];
    return [...baseMethods, "Credit", "Return"];
  }, [pos]);

  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("");

  const handlePresetClick = (preset) => {
    let from, to;
    const now = new Date();

    switch (preset) {
      case "today":
        from = startOfDay(now);
        to = endOfDay(now);
        break;
      case "week":
        from = startOfWeek(now, { weekStartsOn: 1 });
        to = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "year":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case "lastYear":
        from = startOfYear(subYears(now, 1));
        to = endOfYear(subYears(now, 1));
        break;
      case "all":
        from = null;
        to = null;
        break;
      default:
        return;
    }

    setDate({ from, to });
    setActivePreset(preset);
    setDateOpen(false);
  };
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [branch, setBranch] = useState("all");
  const [user, setUser] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [amountRange, setAmountRange] = useState([0, 5000]);
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedMainCategories, setSelectedMainCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [mainCategoriesOpen, setMainCategoriesOpen] = useState(false);
  const [subCategoriesOpen, setSubCategoriesOpen] = useState(false);
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandsOpen, setBrandsOpen] = useState(false);

  const filteredSubCategories = useMemo(() => {
    if (selectedMainCategories.length === 0) return subCategories;
    return subCategories.filter((sub) =>
      selectedMainCategories.includes(String(sub.main_category_id)),
    );
  }, [subCategories, selectedMainCategories]);

  useEffect(() => {
    if (selectedMainCategories.length > 0) {
      setSelectedSubCategories((prev) =>
        prev.filter((subId) => {
          const sub = subCategories.find((s) => String(s.id) === String(subId));
          return (
            sub && selectedMainCategories.includes(String(sub.main_category_id))
          );
        }),
      );
    }
  }, [selectedMainCategories, subCategories]);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, sellerRes, mainCatRes, subCatRes, brandRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/active/list`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/active/list`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        ),
      ]);

      const branchData = await branchRes.json();
      const sellerData = await sellerRes.json();
      const mainCatData = await mainCatRes.json();
      const subCatData = await subCatRes.json();
      const brandData = await brandRes.json();

      if (branchData.status === "success") setBranches(branchData.data || []);
      if (sellerData.status === "success") setSellers(sellerData.data || []);
      if (mainCatData.status === "success")
        setMainCategories(mainCatData.data || []);
      if (subCatData.status === "success")
        setSubCategories(subCatData.data || []);
      if (brandData.status === "success")
        setBrands(brandData.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        branch_id: branch,
        user_id: user,
        main_category_ids: selectedMainCategories.join(","),
        sub_category_ids: selectedSubCategories.join(","),
        brand_ids: selectedBrands.join(","),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/daily?${queryParams}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );
      const result = await res.json();

      if (res.status === 401) {
        signOut({ callbackUrl: "/login" });
        return;
      }

      if (result.status === "success") {
        setData(result.data.transactions || []);
        setApiStats(result.data.stats || null);
      } else {
        toast.error(result.message || "Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [
    session?.accessToken,
    date,
    branch,
    user,
    selectedMainCategories,
    selectedSubCategories,
    selectedBrands,
  ]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data.length > 0) {
      const amounts = data.map((item) => Math.abs(item.total || 0));
      const maxAmount = Math.max(...amounts);
      const minAmount = Math.min(...amounts);
      if (maxAmount > amountRange[1] || minAmount < amountRange[0]) {
        setAmountRange([0, Math.ceil(maxAmount / 1000) * 1000 + 1000]);
      }
    }
  }, [data]);

  const stats = apiStats || {
    totalSales: filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0),
    totalTransactions: filteredData.length,
    avgValue: (
      filteredData.reduce((acc, curr) => acc + (curr.total || 0), 0) /
      (filteredData.length || 1)
    ).toFixed(2),
    totalDiscounts: filteredData.reduce(
      (acc, curr) => acc + (curr.discount || 0),
      0,
    ),
    paymentBreakdown: { cash: 0, card: 0, credit: 0 },
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Report",
  });

  const exportData = useMemo(() => {
    return (filteredData || []).map((item) => ({
      "Invoice No": item.id,
      Date: item.date ? formatDateTime(item.date) : "N/A",
      "Customer Profile": item.customer || "Walk-in Market",
      "Gross Total": Number(item.subtotal || 0),
      "Marketing Discount": Number(item.discount || 0),
      "Net Revenue": Number(item.total || 0),
      "Settlement Channel": item.type || "N/A",
      "Payment Status": item.payment_status || "N/A",
      "Authorized Personnel": item.cashier || "N/A",
      "Branch Location":
        branch === "all"
          ? "All"
          : branches.find((b) => String(b.id) === String(branch))?.name ||
            "N/A",
      Organization: session?.organization?.name || "Inzeedo POS",
      Currency: currencySymbol,
    }));
  }, [filteredData, formatDateTime, branch, branches, session, currencySymbol]);

  useEffect(() => {
    let result = Array.isArray(data) ? data : [];
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.id?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (paymentFilter === "credit") {
      result = result.filter(
        (item) =>
          item.payment_status === "unpaid" ||
          item.payment_status === "partially_paid",
      );
    } else if (paymentFilter === "return") {
      result = result.filter((item) => item.status === "Return");
    } else if (paymentFilter !== "all") {
      result = result.filter(
        (item) => item.type?.toLowerCase() === paymentFilter,
      );
    }
    result = result.filter(
      (item) =>
        Math.abs(item.total) >= amountRange[0] &&
        Math.abs(item.total) <= amountRange[1],
    );
    setFilteredData(result);
  }, [searchQuery, paymentFilter, amountRange, data]);

  // Reset to page 0 whenever filters or search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, date, branch, user, paymentFilter, amountRange]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(
    () =>
      filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [filteredData, currentPage, pageSize],
  );

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const PaymentBar = () => {
    const breakdown = stats.paymentBreakdown || {};
    const methods = Object.keys(breakdown).sort(
      (a, b) => breakdown[b] - breakdown[a],
    );

    const getColor = (method) => {
      const colors = {
        cash: "bg-emerald-500",
        card: "bg-blue-500",
        credit: "bg-amber-500",
        cheque: "bg-purple-500",
        bank: "bg-teal-500",
      };
      return colors[method.toLowerCase()] || "bg-slate-400";
    };

    return (
      <div className="w-full flex flex-col justify-center gap-3">
        <div className="h-2 w-full flex rounded-full bg-muted shadow-inner overflow-hidden">
          {methods.map(
            (method) =>
              breakdown[method] > 0 && (
                <div
                  key={method}
                  style={{ width: `${breakdown[method]}%` }}
                  className={cn(
                    getColor(method),
                    "h-full transition-all duration-700",
                  )}
                />
              ),
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground max-h-12 overflow-y-auto">
          {methods.map(
            (method) =>
              breakdown[method] > 0 && (
                <div
                  key={method}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <div
                    className={cn("size-2 rounded-full", getColor(method))}
                  />
                  <span className="capitalize">{method}</span>{" "}
                  {breakdown[method]}%
                </div>
              ),
          )}
        </div>
      </div>
    );
  };

  const statsCards = [
    {
      label: "Net Revenue",
      val: isLoading ? null : formatCurrency(stats.totalSales || 0),
      desc: "Total cleared period revenue",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Transactions",
      val: isLoading ? null : stats.totalTransactions || 0,
      desc: "Invoices & receipts generated",
      icon: Receipt,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Marketing Discounts",
      val: isLoading
        ? null
        : formatCurrency(Math.abs(stats.totalDiscounts || 0)),
      desc: "Promotional value removed",
      icon: Tag,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      label: "Payment Velocity",
      val: isLoading ? null : "",
      desc: "",
      icon: PaymentIcon,
      gradient: "from-slate-500 to-gray-400",
      customRender: <PaymentBar />,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Print Template */}
      <div style={{ display: "none" }}>
        <SalesSummaryPrintTemplate
          ref={printRef}
          data={filteredData}
          dateRange={date}
          stats={{
            ...stats,
            branchName:
              branch === "all"
                ? "All Branches"
                : branches.find((b) => String(b.id) === String(branch))?.name ||
                  "Branch",
          }}
          formatDateTime={formatDateTime}
        />
      </div>

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <SlidersHorizontal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Sales Report
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Audited chronological list of business events and revenue
                streams
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions
              data={exportData}
              fileName="Sales_Report"
              onPrint={handlePrint}
              showPrint={true}
            />
            <Button
              variant="outline"
              size="icon"
              className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 rounded-lg"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div
                className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shrink-0 self-start`}
              >
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                {isLoading && !card.customRender ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : card.customRender ? (
                  <div className="mt-1 w-full">{card.customRender}</div>
                ) : (
                  <h3 className="text-2xl font-bold text-foreground truncate">
                    {card.val}
                  </h3>
                )}
                {!card.customRender && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {card.desc}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Table Card Wrap ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Filters Bar */}
          <div className="bg-muted/10 border-b border-border p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
              {/* Date Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-600" /> Date
                  Range
                </label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="truncate">
                        {activePreset === "all" ? (
                          <span>All Time</span>
                        ) : date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd")} -{" "}
                              {format(date.to, "LLL dd")}
                            </>
                          ) : (
                            format(date.from, "LLL dd")
                          )
                        ) : (
                          <span>All Time</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 flex flex-col md:flex-row rounded-md border border-border bg-card shadow-xl"
                    align="start"
                  >
                    <div className="flex flex-col border-b md:border-b-0 md:border-r border-border p-3 space-y-1.5 shrink-0 w-full md:w-40 bg-muted/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        Shortcuts
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "today"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("today")}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "week"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("week")}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "month"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("month")}
                      >
                        This Month
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "year"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("year")}
                      >
                        This Year
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "lastYear"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("lastYear")}
                      >
                        Last Year
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start text-xs font-semibold h-8 px-2 rounded-md w-full transition-colors",
                          activePreset === "all"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => handlePresetClick("all")}
                      >
                        All Time
                      </Button>
                    </div>
                    <div className="p-1">
                      <Calendar
                        mode="range"
                        selected={date}
                        onSelect={(val) => {
                          setDate(val);
                          setActivePreset("");
                        }}
                        numberOfMonths={2}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Branch Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Branch
                </label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {branch === "all"
                          ? "All Branches"
                          : branches.find(
                              (b) => String(b.id) === String(branch),
                            )?.name || "All Branches"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search branches..."
                        className="h-9"
                      />
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
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-emerald-600",
                                branch === "all" ? "opacity-100" : "opacity-0",
                              )}
                            />
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

              {/* Cashier Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-emerald-600" /> Cashier
                </label>
                <Popover open={userOpen} onOpenChange={setUserOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {user === "all"
                          ? "All Users"
                          : sellers.find((s) => String(s.id) === String(user))
                              ?.name || "All Users"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border-border shadow-lg"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No user found.</CommandEmpty>
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
                            All System Users
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

              {/* Main Category Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" /> Main Category
                </label>
                <Popover
                  open={mainCategoriesOpen}
                  onOpenChange={setMainCategoriesOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {selectedMainCategories.length === 0
                          ? "All Categories"
                          : selectedMainCategories.length === 1
                            ? mainCategories.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedMainCategories[0]),
                              )?.name || "1 Category"
                            : `${selectedMainCategories.length} Categories`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border border-border shadow-lg bg-card"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search categories..."
                        className="h-9"
                      />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedMainCategories([]);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedMainCategories.length === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            All Categories
                          </CommandItem>
                          {mainCategories.map((c) => {
                            const isSelected = selectedMainCategories.includes(
                              String(c.id),
                            );
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedMainCategories(
                                      selectedMainCategories.filter(
                                        (id) => id !== String(c.id),
                                      ),
                                    );
                                  } else {
                                    setSelectedMainCategories([
                                      ...selectedMainCategories,
                                      String(c.id),
                                    ]);
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible",
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                                {c.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sub Category Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" /> Sub Category
                </label>
                <Popover
                  open={subCategoriesOpen}
                  onOpenChange={setSubCategoriesOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {selectedSubCategories.length === 0
                          ? "All Sub-categories"
                          : selectedSubCategories.length === 1
                            ? filteredSubCategories.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedSubCategories[0]),
                              )?.name || "1 Sub-category"
                            : `${selectedSubCategories.length} Sub-categories`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border border-border shadow-lg bg-card"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search sub-categories..."
                        className="h-9"
                      />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No sub-category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedSubCategories([]);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedSubCategories.length === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            All Sub-categories
                          </CommandItem>
                          {filteredSubCategories.map((c) => {
                            const isSelected = selectedSubCategories.includes(
                              String(c.id),
                            );
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedSubCategories(
                                      selectedSubCategories.filter(
                                        (id) => id !== String(c.id),
                                      ),
                                    );
                                  } else {
                                    setSelectedSubCategories([
                                      ...selectedSubCategories,
                                      String(c.id),
                                    ]);
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible",
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                                {c.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Brand Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" /> Brand
                </label>
                <Popover
                  open={brandsOpen}
                  onOpenChange={setBrandsOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {selectedBrands.length === 0
                          ? "All Brands"
                          : selectedBrands.length === 1
                            ? brands.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedBrands[0]),
                              )?.name || "1 Brand"
                            : `${selectedBrands.length} Brands`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-colors" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border border-border shadow-lg bg-card"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search brands..."
                        className="h-9"
                      />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedBrands([]);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedBrands.length === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            All Brands
                          </CommandItem>
                          {brands.map((c) => {
                            const isSelected = selectedBrands.includes(
                              String(c.id),
                            );
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedBrands(
                                      selectedBrands.filter(
                                        (id) => id !== String(c.id),
                                      ),
                                    );
                                  } else {
                                    setSelectedBrands([
                                      ...selectedBrands,
                                      String(c.id),
                                    ]);
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <div
                                  className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible",
                                  )}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                                {c.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Advanced Filters */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 opacity-0 pointer-events-none">
                  Placeholder
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-md border border-border text-muted-foreground text-sm font-normal gap-2 hover:bg-muted focus:ring-0 bg-transparent"
                    >
                      <SlidersHorizontal className="size-4" /> Advanced
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-6 rounded-md border-border shadow-xl"
                    align="center"
                  >
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                          Monetary Scope ({currencySymbol})
                        </Label>
                        <Slider
                          defaultValue={[0, 1000]}
                          max={5000}
                          step={10}
                          value={amountRange}
                          onValueChange={setAmountRange}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs font-semibold tabular-nums text-muted-foreground">
                          <span className="bg-muted/50 px-2 py-1 rounded-md">
                            {currencySymbol} {amountRange[0]}
                          </span>
                          <span className="bg-muted/50 px-2 py-1 rounded-md">
                            {currencySymbol} {amountRange[1]}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-foreground">
                          Settlement Channel
                        </Label>
                        <Select
                          value={paymentFilter}
                          onValueChange={setPaymentFilter}
                        >
                          <SelectTrigger className="h-9 rounded-md border-border font-normal text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-md border-border shadow-lg">
                            <SelectItem value="all">
                              Global (All Channels)
                            </SelectItem>
                            {paymentMethods.map((method) => (
                              <SelectItem
                                key={method.toLowerCase()}
                                value={method.toLowerCase()}
                              >
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          setPaymentFilter("all");
                          setAmountRange([0, 5000]);
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick Search */}
              <div className="w-full space-y-1.5 xl:col-span-1 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-emerald-600" /> Explorer
                </label>
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <Input
                      placeholder="Customers or invoices..."
                      className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Execution Date
                  </TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Reference #
                  </TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Customer Profile
                  </TableHead>
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Net Revenue
                  </TableHead>
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Settlement
                  </TableHead>
                  <TableHead className="text-right pr-6 py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Auth Personnel
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-border animate-pulse">
                      <TableCell className="pl-6 py-4">
                        <Skeleton className="h-4 w-32 bg-muted rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 bg-muted/50 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40 bg-muted rounded" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-28 bg-muted rounded ml-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-20 mx-auto rounded-md bg-muted/50" />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Skeleton className="h-4 w-28 ml-auto bg-muted rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const isReturn = item.status === "Return";
                    const isCredit =
                      item.payment_status === "unpaid" ||
                      item.payment_status === "partially_paid";
                    const unpaidAmount = item.total - (item.paid_amount || 0);

                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/30 transition-colors border-border group relative overflow-hidden",
                          isCredit && "bg-amber-500/[0.02]",
                        )}
                      >
                        <TableCell className="pl-6 py-3.5 relative">
                          {isCredit && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.2)]" />
                          )}
                          <p className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                            {formatDateTime(item.date)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                            <Receipt className="size-3.5 opacity-40 text-muted-foreground group-hover:text-emerald-600" />
                            {item.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all border border-border">
                              {item.customer?.substring(0, 2)}
                            </div>
                            <span className="text-[13px] font-medium text-foreground">
                              {item.customer || "Walk-in Market"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "text-[14px] font-semibold tabular-nums",
                                isReturn ? "text-rose-600" : "text-foreground",
                              )}
                            >
                              {formatCurrency(item.total || 0)}
                            </span>
                            {isCredit && (
                              <span className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                                Due: {formatCurrency(unpaidAmount)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center flex-wrap gap-1 max-w-[120px] mx-auto">
                            {item.payments && item.payments.length > 0 ? (
                              item.payments.map((pmt, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] font-bold h-5 px-2 shadow-none border-none rounded-md transition-all",
                                    pmt.payment_method?.toLowerCase() === "card"
                                      ? "bg-blue-50 text-blue-600"
                                      : pmt.payment_method?.toLowerCase() ===
                                          "cash"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : pmt.payment_method?.toLowerCase() ===
                                            "cheque"
                                          ? "bg-purple-50 text-purple-600"
                                          : "bg-gray-100 text-muted-foreground",
                                  )}
                                >
                                  {pmt.payment_method}
                                </Badge>
                              ))
                            ) : (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-bold h-5 px-2 shadow-none border-none rounded-md transition-all",
                                  item.type?.toLowerCase() === "card"
                                    ? "bg-blue-50 text-blue-600"
                                    : item.type?.toLowerCase() === "cash"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : item.type?.toLowerCase() === "cheque"
                                        ? "bg-purple-50 text-purple-600"
                                        : "bg-gray-100 text-muted-foreground",
                                )}
                              >
                                {item.type}
                              </Badge>
                            )}

                            {isCredit && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold h-5 px-2 bg-amber-50 text-amber-600 border-none rounded-md"
                              >
                                {unpaidAmount > 0 ? "Credit" : "Partial"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <p className="text-[13px] font-medium text-foreground">
                            {item.cashier}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground italic">
                            via POS Terminal
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="size-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                          <Receipt className="size-8" />
                        </div>
                        <h4 className="font-bold text-foreground uppercase tracking-tight">
                          No transaction records mapped
                        </h4>
                        <p className="text-sm font-medium text-muted-foreground italic">
                          Clear quick search or adjust advanced filters to
                          expand visibility
                        </p>
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
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </div>
    </div>
  );
}
