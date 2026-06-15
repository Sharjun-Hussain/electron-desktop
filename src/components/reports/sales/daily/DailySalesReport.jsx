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

  Settings2,
  CheckSquare,
  Square,
  Columns,
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

// Pagination completely removed

export default function DailySalesSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime, localization, pos } =
    useAppSettings();

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const defaultColumns = {
    executionDate: true,
    reference: true,
    source: true,
    customer: true,
    cost: true,
    mrp: true,
    wholesale: true,
    selling: true,
    netRevenue: true,
    profit: true,
    settlement: true,
    cashier: true,
  };

  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("dailySalesReportColumns");
    if (saved) {
      try {
        setSelectedColumns(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("dailySalesReportColumns", JSON.stringify(selectedColumns));
    }
  }, [selectedColumns, isClient]);

  const toggleColumn = (key) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const [paymentMethods, setPaymentMethods] = useState([]);

  const [date, setDate] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("today");

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
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchesOpen, setBatchesOpen] = useState(false);

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



  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [branchRes, sellerRes, mainCatRes, subCatRes, brandRes, paymentMethodsRes, supplierRes, batchRes] = await Promise.all([
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
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/payment-methods`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/batches/list`,
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
      const paymentMethodsData = await paymentMethodsRes.json();
      const supplierData = await supplierRes.json();
      const batchData = await batchRes.json();

      if (branchData.status === "success") setBranches(branchData.data || []);
      if (sellerData.status === "success") setSellers(sellerData.data || []);
      if (mainCatData.status === "success")
        setMainCategories(mainCatData.data || []);
      if (subCatData.status === "success")
        setSubCategories(subCatData.data || []);
      if (brandData.status === "success")
        setBrands(brandData.data || []);
      if (paymentMethodsData.status === "success")
        setPaymentMethods(paymentMethodsData.data || []);
      if (supplierData.status === "success")
        setSuppliers(supplierData.data || []);
      if (batchData.status === "success")
        setBatches(batchData.data || []);
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
        supplier_ids: selectedSuppliers.join(","),
        batch_ids: selectedBatches.join(","),
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
    if (isSetupComplete) {
      fetchData();
    }
  }, [fetchData, isSetupComplete]);

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
  const promiseResolveRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      const timer = setTimeout(() => {
        if (promiseResolveRef.current) {
          promiseResolveRef.current();
          promiseResolveRef.current = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_Report",
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        promiseResolveRef.current = resolve;
        setIsPrinting(true);
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      promiseResolveRef.current = null;
    },
  });

  const exportData = useMemo(() => {
    return (filteredData || []).map((item) => {
      let row = {};
      if (selectedColumns.reference) row["Reference"] = item.id;
      if (selectedColumns.source) row["Source"] = item.source === 'shopify' ? 'Shopify (Online)' : 'In-Store (POS)';
      if (selectedColumns.executionDate) row["Date"] = item.date ? formatDateTime(item.date) : "N/A";
      if (selectedColumns.customer) row["Customer"] = item.customer || "Walk-in Market";
      if (selectedColumns.cost) row["Cost"] = Number(item.total_cost || 0);
      if (selectedColumns.mrp) row["MRP"] = Number(item.total_mrp || 0);
      if (selectedColumns.wholesale) row["Wholesale"] = Number(item.total_wholesale || 0);
      if (selectedColumns.selling) row["Selling"] = Number(item.total_selling_base || 0);
      if (selectedColumns.netRevenue) {
         row["Gross Total"] = Number(item.subtotal || 0);
         row["Marketing Discount"] = Number(item.discount || 0);
         row["Revenue"] = Number(item.total || 0);
      }
      if (selectedColumns.profit) row["Profit"] = Number(item.total - (item.total_cost || 0));
      if (selectedColumns.settlement) {
         row["Payment Method"] = item.type || "N/A";
         row["Payment Status"] = item.payment_status || "N/A";
      }
      if (selectedColumns.cashier) row["Cashier"] = item.cashier || "N/A";
      
      row["Branch Location"] = branch === "all" ? "All" : branches.find((b) => String(b.id) === String(branch))?.name || "N/A";
      row["Organization"] = session?.organization?.name || "Inzeedo POS";
      row["Currency"] = currencySymbol;
      return row;
    });
  }, [filteredData, formatDateTime, branch, branches, session, currencySymbol, selectedColumns]);

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
        (item) => {
           if (item.payments && item.payments.length > 0) {
              return item.payments.some(p => p.payment_method?.toLowerCase() === paymentFilter);
           }
           return item.type?.toLowerCase() === paymentFilter;
        }
      );
    }
    result = result.filter(
      (item) =>
        Math.abs(item.total) >= amountRange[0] &&
        Math.abs(item.total) <= amountRange[1],
    );
    setFilteredData(result);
  }, [searchQuery, paymentFilter, amountRange, data]);



  const activeColCount = Object.values(selectedColumns).filter(Boolean).length;

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
    ...(stats.shopifyEnabled ? [{
      label: "Shopify Revenue",
      val: isLoading ? null : formatCurrency(stats.shopifySalesVolume || 0),
      desc: "Online store contributions",
      icon: Zap,
      gradient: "from-indigo-500 to-purple-400",
    }] : []),
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
            user: session?.user?.name || "Admin",
            email: session?.user?.email || "admin@example.com"
          }}
          formatDateTime={formatDateTime}
          selectedColumns={selectedColumns}
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
            {isSetupComplete && (
               <Button variant="outline" size="sm" className="h-9 border-dashed border-emerald-500/50 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 mr-2 gap-2" onClick={() => setIsSetupComplete(false)}>
                 <Settings2 className="w-4 h-4" /> Reconfigure
               </Button>
             )}
             <DataActions
              data={exportData}
              fileName="Sales_Report"
              onPrint={handlePrint}
              showPrint={true}
            />
            {isSetupComplete && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:text-emerald-600 gap-1.5"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 rounded-md border-border shadow-lg bg-card" align="end">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-xs px-2 py-1.5 border-b border-border text-foreground mb-1">
                      Toggle Columns
                    </h4>
                    <div className="space-y-0.5 max-h-60 overflow-y-auto">
                      {Object.keys(selectedColumns).map((key) => {
                        const labels = {
                          executionDate: "Date",
                          reference: "Reference",
                          source: "Source (POS/Shopify)",
                          customer: "Customer",
                          cost: "Cost",
                          mrp: "MRP",
                          wholesale: "Wholesale",
                          selling: "Selling",
                          netRevenue: "Revenue",
                          profit: "Profit",
                          settlement: "Payment Method",
                          cashier: "Cashier",
                        };
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => toggleColumn(key)}
                          >
                            <div
                              className={cn(
                                "flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary transition-all",
                                selectedColumns[key]
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "opacity-50 border-muted-foreground [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span className="text-[11px] font-medium text-foreground select-none">
                              {labels[key] || key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
        {isSetupComplete && (
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
        )}

        {/* ── Main Table Card Wrap ── */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Setup Wizard / Filters */}
          <div className={cn("p-4 transition-all duration-300", !isSetupComplete ? "p-8 bg-card" : "bg-muted/10 border-b border-border")}>
            
            {!isSetupComplete && (
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 mb-4">
                   <Settings2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Configure Your Report</h2>
                <p className="text-sm text-muted-foreground">Select your reporting parameters and choose the specific data columns you want to analyze before generating the report.</p>
              </div>
            )}
            
            {isSetupComplete && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                    {activePreset === "all" ? "All Time" : date?.from ? (date.to ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}` : format(date.from, "LLL dd, yyyy")) : "All Time"}
                  </Badge>
                  {branch !== "all" && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {branches.find((b) => String(b.id) === String(branch))?.name || "Branch"}
                    </Badge>
                  )}
                  {user !== "all" && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {sellers.find((u) => String(u.id) === String(user))?.name || "User"}
                    </Badge>
                  )}
                  {selectedMainCategories.length > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {selectedMainCategories.length === 1 ? mainCategories.find(c => String(c.id) === String(selectedMainCategories[0]))?.name || "1 Category" : `${selectedMainCategories.length} Categories`}
                    </Badge>
                  )}
                  {selectedSubCategories.length > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {selectedSubCategories.length === 1 ? subCategories.find(c => String(c.id) === String(selectedSubCategories[0]))?.name || "1 Sub-cat" : `${selectedSubCategories.length} Sub-cat`}
                    </Badge>
                  )}
                  {selectedBrands.length > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {selectedBrands.length === 1 ? brands.find(c => String(c.id) === String(selectedBrands[0]))?.name || "1 Brand" : `${selectedBrands.length} Brands`}
                    </Badge>
                  )}
                  {selectedSuppliers.length > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {selectedSuppliers.length === 1 ? suppliers.find(c => String(c.id) === String(selectedSuppliers[0]))?.name || "1 Supplier" : `${selectedSuppliers.length} Suppliers`}
                    </Badge>
                  )}
                  {selectedBatches.length > 0 && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {selectedBatches.length === 1 ? selectedBatches[0] : `${selectedBatches.length} Batches`}
                    </Badge>
                  )}
                  {paymentFilter !== "all" && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border capitalize">
                      <PaymentIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {paymentFilter === "credit" ? "Credit" : paymentFilter === "return" ? "Return" : paymentMethods.find(m => String(m.id).toLowerCase() === String(paymentFilter))?.name || paymentFilter}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <Search className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {searchQuery}
                    </Badge>
                  )}
                </div>
                <div className="w-full sm:w-72 relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                  <Input
                    placeholder="Search customers or invoices..."
                    className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className={cn("grid gap-4 items-end grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-5xl mx-auto", isSetupComplete && "hidden")}>
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

              
              {/* Supplier Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" /> Supplier
                </label>
                <Popover
                  open={suppliersOpen}
                  onOpenChange={setSuppliersOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {selectedSuppliers.length === 0
                          ? "All Suppliers"
                          : selectedSuppliers.length === 1
                            ? suppliers.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedSuppliers[0]),
                              )?.name || "1 Supplier"
                            : `${selectedSuppliers.length} Suppliers`}
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
                        placeholder="Search suppliers..."
                        className="h-9"
                      />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedSuppliers([]);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedSuppliers.length === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            All Suppliers
                          </CommandItem>
                          {suppliers.map((c) => {
                            const isSelected = selectedSuppliers.includes(
                              String(c.id),
                            );
                            return (
                              <CommandItem
                                key={c.id}
                                value={c.name}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedSuppliers(
                                      selectedSuppliers.filter(
                                        (id) => id !== String(c.id),
                                      ),
                                    );
                                  } else {
                                    setSelectedSuppliers([
                                      ...selectedSuppliers,
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


              {/* Batch Filter */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" /> Batch
                </label>
                <Popover
                  open={batchesOpen}
                  onOpenChange={setBatchesOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm"
                    >
                      <span className="truncate">
                        {selectedBatches.length === 0
                          ? "All Batches"
                          : selectedBatches.length === 1
                            ? selectedBatches[0]
                            : `${selectedBatches.length} Batches`}
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
                        placeholder="Search batches..."
                        className="h-9"
                      />
                      <CommandList className="max-h-60 overflow-y-auto">
                        <CommandEmpty>No batch found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setSelectedBatches([]);
                            }}
                            className="cursor-pointer font-medium"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selectedBatches.length === 0
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible",
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                            All Batches
                          </CommandItem>
                          {batches.map((batchString) => {
                            const isSelected = selectedBatches.includes(batchString);
                            return (
                              <CommandItem
                                key={batchString}
                                value={batchString}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedBatches(
                                      selectedBatches.filter(
                                        (b) => b !== batchString,
                                      ),
                                    );
                                  } else {
                                    setSelectedBatches([
                                      ...selectedBatches,
                                      batchString,
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
                                {batchString}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Settlement Channel */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <PaymentIcon className="h-3.5 w-3.5 text-emerald-600" /> Settlement
                </label>
                <Select
                  value={paymentFilter}
                  onValueChange={setPaymentFilter}
                >
                  <SelectTrigger className="h-9 rounded-md border-border font-normal text-sm bg-transparent hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-border shadow-lg">
                    <SelectItem value="all">Global (All Channels)</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem
                        key={method.id}
                        value={method.id.toLowerCase()}
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monetary Scope */}
              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" /> Value Scope
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-9 rounded-md border-border text-sm font-normal bg-transparent hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors justify-start"
                    >
                      <span className="truncate">
                        {amountRange[0] === 0 && amountRange[1] === 5000 ? (
                          "All Ranges"
                        ) : (
                          `${currencySymbol}${amountRange[0]} - ${currencySymbol}${amountRange[1]}`
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-6 rounded-md border-border shadow-xl" align="end">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 rounded-md text-xs font-medium text-rose-500 hover:bg-rose-50 mt-2"
                        onClick={() => setAmountRange([0, 5000])}
                      >
                        Reset Range
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {!isSetupComplete && (
              <div className="mt-8 flex justify-center max-w-5xl mx-auto">
                <Button
                  onClick={() => setIsSetupComplete(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
                >
                  <FileText className="w-5 h-5" /> Get Report
                </Button>
              </div>
            )}
          </div>

          {isSetupComplete && (
            <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  {selectedColumns.executionDate && (
                  <TableHead className="pl-6 py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Date
                  </TableHead>
                  )}
                  {selectedColumns.reference && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Reference
                  </TableHead>
                  )}
                  {selectedColumns.source && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Source
                  </TableHead>
                  )}
                  {selectedColumns.customer && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Customer
                  </TableHead>
                  )}

                  {selectedColumns.cost && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Cost
                  </TableHead>
                  )}
                  {selectedColumns.mrp && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    MRP
                  </TableHead>
                  )}
                  {selectedColumns.wholesale && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Wholesale
                  </TableHead>
                  )}
                  {selectedColumns.selling && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Selling
                  </TableHead>
                  )}
                  {selectedColumns.netRevenue && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Revenue
                  </TableHead>
                  )}
                  {selectedColumns.profit && (
                  <TableHead className="py-3.5 text-[13px] font-semibold text-muted-foreground text-right">
                    Profit
                  </TableHead>
                  )}
                  {selectedColumns.settlement && (
                  <TableHead className="text-center py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Payment Method
                  </TableHead>
                  )}
                  {selectedColumns.cashier && (
                  <TableHead className="text-right pr-6 py-3.5 text-[13px] font-semibold text-muted-foreground">
                    Cashier
                  </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-border animate-pulse">
                      {selectedColumns.executionDate && <TableCell className="pl-6 py-4">
                        <Skeleton className="h-4 w-32 bg-muted rounded" />
                      </TableCell>}
                      {selectedColumns.reference && <TableCell>
                        <Skeleton className="h-4 w-24 bg-muted/50 rounded" />
                      </TableCell>}
                      {selectedColumns.source && <TableCell>
                        <Skeleton className="h-4 w-16 bg-muted/50 rounded" />
                      </TableCell>}
                      {selectedColumns.customer && <TableCell>
                        <Skeleton className="h-4 w-40 bg-muted rounded" />
                      </TableCell>}

                      {selectedColumns.cost && <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.mrp && <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.wholesale && <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.selling && <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.netRevenue && <TableCell className="text-right"><Skeleton className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.profit && <TableCell className="text-right"><Skeleton className="h-4 w-28 bg-muted rounded ml-auto" /></TableCell>}
                      {selectedColumns.settlement && <TableCell className="text-center">
                        <Skeleton className="h-6 w-20 mx-auto rounded-md bg-muted/50" />
                      </TableCell>}
                      {selectedColumns.cashier && <TableCell className="text-right pr-6">
                        <Skeleton className="h-4 w-28 ml-auto bg-muted rounded" />
                      </TableCell>}
                    </TableRow>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((item) => {
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
                        {selectedColumns.executionDate && <TableCell className="pl-6 py-3.5 relative">
                          {isCredit && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.2)]" />
                          )}
                          <p className="text-[13px] font-semibold text-muted-foreground tabular-nums">
                            {formatDateTime(item.date)}
                          </p>
                        </TableCell>}
                        {selectedColumns.reference && <TableCell>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                            <Receipt className="size-3.5 opacity-40 text-muted-foreground group-hover:text-emerald-600" />
                            {item.id}
                          </div>
                        </TableCell>}
                        {selectedColumns.source && <TableCell>
                          <Badge variant="outline" className={cn("text-[11px] font-medium tracking-wide", item.source === 'shopify' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-700 border-slate-200')}>
                            {item.source === 'shopify' ? 'Shopify' : 'POS'}
                          </Badge>
                        </TableCell>}
                        {selectedColumns.customer && <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all border border-border">
                              {item.customer?.substring(0, 2)}
                            </div>
                            <span className="text-[13px] font-medium text-foreground">
                              {item.customer || "Walk-in Market"}
                            </span>
                          </div>
                        </TableCell>}
                        {selectedColumns.cost && <TableCell className="text-right">
                          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatCurrency(item.total_cost || 0)}</span>
                        </TableCell>}
                        {selectedColumns.mrp && <TableCell className="text-right">
                          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatCurrency(item.total_mrp || 0)}</span>
                        </TableCell>}
                        {selectedColumns.wholesale && <TableCell className="text-right">
                          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatCurrency(item.total_wholesale || 0)}</span>
                        </TableCell>}
                        {selectedColumns.selling && <TableCell className="text-right">
                          <span className="text-[13px] font-medium text-muted-foreground tabular-nums">{formatCurrency(item.total_selling_base || 0)}</span>
                        </TableCell>}
                        {selectedColumns.netRevenue && <TableCell className="text-right">
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
                        </TableCell>}
                        {selectedColumns.profit && <TableCell className="text-right">
                          <span className={cn("text-[13px] font-medium tabular-nums", (item.total - (item.total_cost || 0)) >= 0 ? "text-emerald-600" : "text-rose-600")}>
                             {(item.total - (item.total_cost || 0)) > 0 ? '+' : ''}{formatCurrency(item.total - (item.total_cost || 0))}
                          </span>
                        </TableCell>}
                        {selectedColumns.settlement && <TableCell className="text-center">
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
                        </TableCell>}
                        {selectedColumns.cashier && <TableCell className="text-right pr-6">
                          <p className="text-[13px] font-medium text-foreground">
                            {item.cashier}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground italic">
                            via POS Terminal
                          </p>
                        </TableCell>}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="py-24 text-center">
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


            </>
          )}
        </Card>
      </div>
    </div>
  );
}
