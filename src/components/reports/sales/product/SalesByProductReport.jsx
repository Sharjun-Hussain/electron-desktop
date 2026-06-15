"use client";

import {
  format,
  startOfMonth,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";
import {
  BarChart3,
  CalendarDays,
  Calendar as CalendarIcon,
  Check,

  ChevronsUpDown,
  Download,
  FileText,
  Filter,
  Layers,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
  Target,
  TrendingUp,
  SlidersHorizontal,
  Settings2,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";
import { SalesByProductPrintTemplate } from "@/components/Template/sales/SalesByProductTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

// Pagination completely removed

const defaultColumns = {
  skuEntity: true,
  batch: true,
  quantity: true,
  cost: true,
  mrp: true,
  wholesale: true,
  sellingPrice: true,
  profit: true,
  revenue: true,
};

export default function SalesByProductPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSetupComplete = searchParams.get('view') === 'generated';
  const setIsSetupComplete = (val) => {
    if (val) {
      router.push(`${pathname}?view=generated`);
    } else {
      router.push(pathname);
    }
  };
  const [date, setDate] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("today");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalSold: 0,
    uniqueProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);
  const [isClient, setIsClient] = useState(false);
  const [isStateRestored, setIsStateRestored] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("productSalesReportColumns");
    if (saved) {
      try {
        setSelectedColumns(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }

    const savedParams = sessionStorage.getItem("productSalesReportParams");
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        if (parsed.date) {
            setDate({
                from: parsed.date.from ? new Date(parsed.date.from) : null,
                to: parsed.date.to ? new Date(parsed.date.to) : null,
            });
        }
        if (parsed.activePreset) setActivePreset(parsed.activePreset);
        if (parsed.store) setStore(parsed.store);
        if (parsed.user) setUser(parsed.user);
        if (parsed.selectedMainCategories) setSelectedMainCategories(parsed.selectedMainCategories);
        if (parsed.selectedSubCategories) setSelectedSubCategories(parsed.selectedSubCategories);
        if (parsed.selectedBrands) setSelectedBrands(parsed.selectedBrands);
        if (parsed.selectedSuppliers) setSelectedSuppliers(parsed.selectedSuppliers);
        if (parsed.selectedBatches) setSelectedBatches(parsed.selectedBatches);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
      } catch (e) {
        console.error("Failed to restore form params", e);
      }
    }
    setIsStateRestored(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        "productSalesReportColumns",
        JSON.stringify(selectedColumns)
      );
    }
  }, [selectedColumns, isClient]);



  const toggleColumn = (key) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [store, setStore] = useState("all");
  const [storeOpen, setStoreOpen] = useState(false);

  const [user, setUser] = useState("all");
  const [userOpen, setUserOpen] = useState(false);

  const [selectedMainCategories, setSelectedMainCategories] = useState([]);
  const [mainCategoriesOpen, setMainCategoriesOpen] = useState(false);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [subCategoriesOpen, setSubCategoriesOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchesOpen, setBatchesOpen] = useState(false);

  useEffect(() => {
    if (isStateRestored) {
      const stateToSave = {
        date, activePreset, store, user, selectedMainCategories, 
        selectedSubCategories, selectedBrands, selectedSuppliers, 
        selectedBatches, searchQuery
      };
      sessionStorage.setItem("productSalesReportParams", JSON.stringify(stateToSave));
    }
  }, [date, activePreset, store, user, selectedMainCategories, selectedSubCategories, selectedBrands, selectedSuppliers, selectedBatches, searchQuery, isStateRestored]);

  // --- METADATA STATES ---
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);

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

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [catRes, subCatRes, brandRes, branchRes, sellerRes, supplierRes, batchRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/active/list`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        ),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/batches/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
      ]);

      const catData = await catRes.json();
      const subCatData = await subCatRes.json();
      const brandData = await brandRes.json();
      const branchData = await branchRes.json();
      const sellerData = await sellerRes.json();
      const supplierData = await supplierRes.json();
      const batchData = await batchRes.json();

      if (catData.status === "success") setCategories(catData.data || []);
      if (subCatData.status === "success") setSubCategories(subCatData.data || []);
      if (brandData.status === "success") setBrands(brandData.data || []);
      if (branchData.status === "success") setBranches(branchData.data || []);
      if (sellerData.status === "success") setSellers(sellerData.data || []);
      if (supplierData.status === "success") setSuppliers(supplierData.data || []);
      if (batchData.status === "success") setBatches(batchData.data || []);
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(
    async (targetPage = 1) => {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          start_date: date?.from ? format(date.from, "yyyy-MM-dd") : "",
          end_date: date?.to ? format(date.to, "yyyy-MM-dd") : "",
          branch_id: store,
          user_id: user,
          main_category_ids: selectedMainCategories.join(","),
          sub_category_ids: selectedSubCategories.join(","),
          brand_ids: selectedBrands.join(","),
          supplier_ids: selectedSuppliers.join(","),
          batch_ids: selectedBatches.join(","),
          search: searchQuery,
          page: 1,
          limit: 1000000,
        });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/product?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        );
        const result = await response.json();
        if (result.status === "success") {
          const mappedData = result.data.data.map((item) => ({
            id:
              item.product_id +
              (item.product_variant_id || "") +
              (item.product_batch_id || ""),
            batch: item.batch?.batch_number || "N/A",
            expiry: item.batch?.expiry_date
              ? item.batch.expiry_date.split("T")[0]
              : "N/A",
            name:
              item.product.name +
              (item.variant ? ` (${item.variant.name})` : ""),
            sku: item.variant?.sku || item.product.code,
            sold: Number(item.total_quantity),
            sales: Number(item.total_revenue),
            price:
              Number(item.total_revenue) / (Number(item.total_quantity) || 1),
            cost_price: Number(item.variant?.cost_price || 0),
            mrp_price: Number(item.variant?.mrp_price || 0),
            wholesale_price: Number(item.variant?.wholesale_price || 0),
            selling_price: Number(item.variant?.price || 0),
            profit:
              Number(item.total_revenue) -
              Number(item.total_quantity) *
                Number(item.variant?.cost_price || 0),
          }));
          setData(mappedData);
          setSummary(result.data.summary);

        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch product sales report");
      } finally {
        setIsLoading(false);
      }
    },
    [
      session?.accessToken,
      date,
      store,
      user,
      selectedMainCategories,
      selectedSubCategories,
      selectedBrands,
      selectedSuppliers,
      selectedBatches,
      searchQuery,
    ],
  );

  // Export data from current state
  const exportData = useMemo(() => {
    return (data || []).map((item) => {
      const row = {};
      if (selectedColumns.skuEntity) {
        row["Product Name"] = item.name;
        row["SKU"] = item.sku;
      }
      if (selectedColumns.batch) {
        row["Batch Number"] = item.batch;
        row["Expiry Date"] = item.expiry;
      }
      if (selectedColumns.quantity) row["Quantity Sold"] = item.sold;
      if (selectedColumns.cost) row["Cost Price"] = item.cost_price;
      if (selectedColumns.mrp) row["MRP"] = item.mrp_price;
      if (selectedColumns.wholesale) row["Wholesale Price"] = item.wholesale_price;
      if (selectedColumns.sellingPrice) {
        row["Base Selling Price"] = item.selling_price;
        row["Average Unit Price"] = Number(item.price || 0);
      }
      if (selectedColumns.revenue) row["Total Revenue"] = Number(item.sales || 0);
      if (selectedColumns.profit) row["Total Profit"] = Number(item.profit || 0);

      row["Operational Unit"] =
        store === "all"
          ? "All Branches"
          : branches.find((b) => String(b.id) === String(store))?.name || store;
      row["Classification"] =
        selectedMainCategories.length > 0
          ? selectedMainCategories
              .map(
                (cid) =>
                  categories.find((c) => String(c.id) === String(cid))?.name,
              )
              .filter(Boolean)
              .join(", ")
          : "All Categories";
      row["Organization"] = session?.organization?.name || "Inzeedo POS";
      row["Horizon"] = date?.from
        ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}`
        : "Global";

      return row;
    });
  }, [
    data,
    store,
    branches,
    selectedMainCategories,
    categories,
    session,
    date,
    selectedColumns,
  ]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch report only if setup is complete
  useEffect(() => {
    if (isSetupComplete && isStateRestored) {
      const delayDebounceFn = setTimeout(() => {
        fetchData(1);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [isSetupComplete, isStateRestored, searchQuery, fetchData]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Product_Report",
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        setIsPrinting(true);
        setTimeout(() => resolve(), 300); // Allow DOM to render
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  const exportData = useMemo(() => {
    return (data || []).map((item) => {
      const row = {};
      if (selectedColumns.skuEntity) {
        row["Product Name"] = item.name;
        row["SKU"] = item.sku;
      }
      if (selectedColumns.batch) {
        row["Batch Number"] = item.batch;
        row["Expiry Date"] = item.expiry;
      }
      if (selectedColumns.quantity) row["Quantity Sold"] = item.sold;
      if (selectedColumns.cost) row["Cost Price"] = item.cost_price;
      if (selectedColumns.mrp) row["MRP"] = item.mrp_price;
      if (selectedColumns.wholesale) row["Wholesale Price"] = item.wholesale_price;
      if (selectedColumns.sellingPrice) {
        row["Base Selling Price"] = item.selling_price;
        row["Average Unit Price"] = Number(item.price || 0);
      }
      if (selectedColumns.revenue) row["Total Revenue"] = Number(item.sales || 0);
      if (selectedColumns.profit) row["Total Profit"] = Number(item.profit || 0);

      row["Operational Unit"] =
        store === "all"
          ? "All Branches"
          : branches.find((b) => String(b.id) === String(store))?.name || store;
      row["Classification"] =
        selectedMainCategories.length > 0
          ? selectedMainCategories
              .map(
                (cid) =>
                  categories.find((c) => String(c.id) === String(cid))?.name,
              )
              .filter(Boolean)
              .join(", ")
          : "All Categories";
      row["Organization"] = session?.organization?.name || "Inzeedo POS";
      row["Horizon"] = date?.from
        ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}`
        : "Global";

      return row;
    });
  }, [
    data,
    store,
    branches,
    selectedMainCategories,
    categories,
    session,
    date,
    selectedColumns,
  ]);

  const statsCards = [
    {
      label: "Gross Revenue",
      val: isLoading ? null : formatCurrency(summary.totalRevenue),
      desc: "Total matched revenue",
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Units Dispatched",
      val: isLoading ? null : summary.totalSold.toLocaleString(),
      desc: "Total physical items moved",
      icon: ShoppingBag,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Unique SKUs Sold",
      val: isLoading ? null : summary.uniqueProducts.toLocaleString(),
      desc: "Distinct product lines",
      icon: Package,
      gradient: "from-purple-500 to-fuchsia-400",
    },
    {
      label: "Top Performer",
      val: isLoading ? null : data[0]?.name || "N/A",
      desc: "Highest moving SKU",
      icon: MapPin,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Hidden Print Template */}
      <div style={{ display: "none" }}>
        <SalesByProductPrintTemplate
          ref={printRef}
          data={isPrinting ? data : []}
          selectedColumns={selectedColumns}
          stats={{
            totalSold: summary.totalSold,
            totalRevenue: summary.totalRevenue,
            totalProfit: 0,
            topSellingItem: data[0] || null,
            topRevenueItem: data[0] || null,
            ...summary.registerDetails,
          }}
          dateRange={date}
          filters={{
            store:
              store === "all"
                ? "All Branches"
                : branches.find((b) => String(b.id) === String(store))?.name ||
                  store,
            category:
              selectedMainCategories.length > 0
                ? selectedMainCategories
                    .map(
                      (cid) =>
                        categories.find((c) => String(c.id) === String(cid))
                          ?.name,
                    )
                    .filter(Boolean)
                    .join(", ")
                : "All Categories",
            brand:
              selectedBrands.length > 0
                ? selectedBrands
                    .map(
                      (bid) =>
                        brands.find((b) => String(b.id) === String(bid))?.name,
                    )
                    .filter(Boolean)
                    .join(", ")
                : "All Brands",
          }}
        />
      </div>

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Product Sales Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                High-density performance tracking across inventory
                classifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSetupComplete && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed border-emerald-500/50 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100 mr-2 gap-2"
                onClick={() => setIsSetupComplete(false)}
              >
                <Settings2 className="w-4 h-4" /> Reconfigure
              </Button>
            )}
            <DataActions
              data={exportData}
              fileName="Product_Sales_Performance_Report"
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
                          skuEntity: "SKU Entity",
                          batch: "Batch / Expiry",
                          quantity: "Quantity",
                          cost: "Cost",
                          mrp: "MRP",
                          wholesale: "Wholesale",
                          sellingPrice: "Selling Price",
                          profit: "Margin / Profit",
                          revenue: "Yield (Revenue)",
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
            {isSetupComplete && (
              <Button
                variant="outline"
                size="icon"
                className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 rounded-lg"
                onClick={() => fetchData(pagination.page)}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("size-3.5", isLoading && "animate-spin")}
                />
              </Button>
            )}
          </div>
        </div>

        {isSetupComplete ? (
          <>
            {/* Filter Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                {activePreset === "all"
                  ? "All Time"
                  : date?.from
                    ? date.to
                      ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}`
                      : format(date.from, "LLL dd, yyyy")
                    : "All Time"}
              </Badge>
              {store !== "all" && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {branches.find((b) => String(b.id) === String(store))?.name ||
                    "Branch"}
                </Badge>
              )}
              {user !== "all" && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <UserIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {sellers.find((u) => String(u.id) === String(user))?.name ||
                    "User"}
                </Badge>
              )}
              {selectedMainCategories.length > 0 && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {selectedMainCategories.length === 1
                    ? categories.find(
                        (c) =>
                          String(c.id) === String(selectedMainCategories[0]),
                      )?.name || "1 Category"
                    : `${selectedMainCategories.length} Categories`}
                </Badge>
              )}
              {selectedSubCategories.length > 0 && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {selectedSubCategories.length === 1
                    ? subCategories.find(
                        (c) =>
                          String(c.id) === String(selectedSubCategories[0]),
                      )?.name || "1 Sub-cat"
                    : `${selectedSubCategories.length} Sub-cat`}
                </Badge>
              )}
              {selectedBrands.length > 0 && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {selectedBrands.length === 1
                    ? brands.find(
                        (c) => String(c.id) === String(selectedBrands[0]),
                      )?.name || "1 Brand"
                    : `${selectedBrands.length} Brands`}
                </Badge>
              )}
              {selectedSuppliers.length > 0 && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {selectedSuppliers.length === 1
                    ? suppliers.find(
                        (c) => String(c.id) === String(selectedSuppliers[0]),
                      )?.name || "1 Supplier"
                    : `${selectedSuppliers.length} Suppliers`}
                </Badge>
              )}
              {selectedBatches.length > 0 && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {selectedBatches.length === 1
                    ? selectedBatches[0]
                    : `${selectedBatches.length} Batches`}
                </Badge>
              )}
              {searchQuery && (
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-medium border-border"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {searchQuery}
                </Badge>
              )}
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
                    {isLoading ? (
                      <Skeleton className="h-7 w-28 mt-1" />
                    ) : (
                      <h3 className="text-2xl font-bold text-foreground truncate">
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

            {/* Performance Visualization */}
            <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
              <CardHeader className="pb-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BarChart3 className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Volume Distribution
                    </h3>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Top 10 SKU Movement Velocity
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col justify-center min-h-[350px]">
                {isLoading ? (
                  <div className="space-y-4 w-full px-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-10 w-full rounded-md bg-muted"
                      />
                    ))}
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-center italic text-muted-foreground p-8 flex flex-col items-center gap-3">
                    <Package className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-semibold">
                      No movement detected in selected horizon
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[...data]
                        .sort((a, b) => b.sold - a.sold)
                        .slice(0, 10)
                        .map((item) => ({
                          name:
                            item.name.length > 20
                              ? item.name.substring(0, 18) + "..."
                              : item.name,
                          sold: item.sold,
                          fullName: item.name,
                        }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E2E8F0"
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        className="font-bold"
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{
                          fill: "rgba(226, 232, 240, 0.4)",
                          radius: 8,
                        }}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          fontSize: "13px",
                        }}
                        labelStyle={{
                          fontWeight: "700",
                          color: "#1E293B",
                          marginBottom: "4px",
                        }}
                        labelFormatter={(label, payload) =>
                          payload[0]?.payload?.fullName || label
                        }
                      />
                      <Bar
                        dataKey="sold"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      >
                        {[...data]
                          .sort((a, b) => b.sold - a.sold)
                          .slice(0, 10)
                          .map((entry, index) => (
                            <Cell
                              key={index}
                              fillOpacity={1 - index * 0.08}
                              fill="#10b981"
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Movement Ledger Table Card */}
            <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
              <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-sm text-foreground">
                    Movement Ledger
                  </h3>
                </div>
                <div className="w-full sm:w-72 relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                  <Input
                    placeholder="Search by SKU, product name, code..."
                    className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto flex-1 animate-in fade-in duration-300">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-border hover:bg-transparent">
                      {selectedColumns.skuEntity && (
                        <TableHead className="pl-6 py-4 text-xs font-semibold text-muted-foreground">
                          SKU Entity
                        </TableHead>
                      )}
                      {selectedColumns.batch && (
                        <TableHead className="text-left text-xs font-semibold text-muted-foreground">
                          Batch / Expiry
                        </TableHead>
                      )}
                      {selectedColumns.quantity && (
                        <TableHead className="text-center text-xs font-semibold text-muted-foreground">
                          Quantity
                        </TableHead>
                      )}
                      {selectedColumns.cost && (
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                          Cost
                        </TableHead>
                      )}
                      {selectedColumns.mrp && (
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                          MRP
                        </TableHead>
                      )}
                      {selectedColumns.wholesale && (
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                          Wholesale
                        </TableHead>
                      )}
                      {selectedColumns.sellingPrice && (
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                          Selling Price
                        </TableHead>
                      )}
                      {selectedColumns.profit && (
                        <TableHead className="text-right text-xs font-semibold text-muted-foreground">
                          Margin / Profit
                        </TableHead>
                      )}
                      {selectedColumns.revenue && (
                        <TableHead className="text-right pr-6 text-xs font-semibold text-muted-foreground">
                          Yield (Revenue)
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i} className="border-b border-border">
                          {selectedColumns.skuEntity && (
                            <TableCell className="pl-6 py-4">
                              <Skeleton className="h-4 w-48 mb-2 rounded bg-muted" />
                              <Skeleton className="h-3.5 w-24 rounded bg-muted/70" />
                            </TableCell>
                          )}
                          {selectedColumns.batch && (
                            <TableCell className="py-4">
                              <Skeleton className="h-4 w-28 rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.quantity && (
                            <TableCell className="py-4 text-center">
                              <Skeleton className="h-6 w-12 mx-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.cost && (
                            <TableCell className="py-4 text-right">
                              <Skeleton className="h-4 w-16 ml-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.mrp && (
                            <TableCell className="py-4 text-right">
                              <Skeleton className="h-4 w-16 ml-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.wholesale && (
                            <TableCell className="py-4 text-right">
                              <Skeleton className="h-4 w-16 ml-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.sellingPrice && (
                            <TableCell className="py-4 text-right">
                              <Skeleton className="h-4 w-16 ml-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.profit && (
                            <TableCell className="py-4 text-right">
                              <Skeleton className="h-4 w-20 ml-auto rounded bg-muted" />
                            </TableCell>
                          )}
                          {selectedColumns.revenue && (
                            <TableCell className="py-4 text-right pr-6">
                              <Skeleton className="h-4 w-24 ml-auto rounded bg-muted font-bold" />
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : data.length > 0 ? (
                      data.map((item, idx) => (
                        <TableRow
                          key={idx}
                          className="hover:bg-muted/30 transition-colors border-b border-border group"
                        >
                          {selectedColumns.skuEntity && (
                            <TableCell className="pl-6 py-3.5">
                              <p className="font-semibold text-sm text-foreground group-hover:text-emerald-600 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase mt-0.5 tracking-wider">
                                SKU: {item.sku}
                              </p>
                            </TableCell>
                          )}
                          {selectedColumns.batch && (
                            <TableCell className="text-left">
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-foreground">
                                  {item.batch !== "N/A" ? item.batch : "General"}
                                </span>
                                {item.expiry !== "N/A" && (
                                  <span className="text-[10px] font-medium text-muted-foreground">
                                    Exp: {item.expiry}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {selectedColumns.quantity && (
                            <TableCell className="text-center">
                              <span className="font-semibold text-sm bg-muted px-2.5 py-1 rounded-md text-foreground">
                                {item.sold}
                              </span>
                            </TableCell>
                          )}
                          {selectedColumns.cost && (
                            <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">
                              {formatCurrency(item.cost_price)}
                            </TableCell>
                          )}
                          {selectedColumns.mrp && (
                            <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">
                              {formatCurrency(item.mrp_price)}
                            </TableCell>
                          )}
                          {selectedColumns.wholesale && (
                            <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">
                              {formatCurrency(item.wholesale_price)}
                            </TableCell>
                          )}
                          {selectedColumns.sellingPrice && (
                            <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">
                              {formatCurrency(item.selling_price)}
                            </TableCell>
                          )}
                          {selectedColumns.profit && (
                            <TableCell
                              className={cn(
                                "text-right font-medium tabular-nums text-sm",
                                item.profit >= 0
                                  ? "text-emerald-600"
                                  : "text-rose-600",
                              )}
                            >
                              {item.profit > 0 ? "+" : ""}
                              {formatCurrency(item.profit)}
                            </TableCell>
                          )}
                          {selectedColumns.revenue && (
                            <TableCell className="text-right pr-6">
                              <p className="font-semibold text-foreground tabular-nums">
                                {formatCurrency(item.sales)}
                              </p>
                              <p className="text-[10px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                Total Revenue
                              </p>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={Object.values(selectedColumns).filter(Boolean).length}
                          className="py-24 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="size-14 rounded-full bg-gray-55 flex items-center justify-center text-gray-200">
                              <Layers className="size-8" />
                            </div>
                            <h4 className="font-bold text-foreground uppercase tracking-tight">
                              Zero movement in scope
                            </h4>
                            <p className="text-sm font-medium italic">
                              Adjust classifiers or store selection to expand
                              visibility
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                  </TableBody>
                </Table>
              </div>


            </Card>
          </>
        ) : (
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden bg-card p-8 animate-in fade-in duration-300">
            {/* Configure panel */}
            <div className="mb-8 text-center max-w-2xl mx-auto">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 mb-4">
                <Settings2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Configure Your Product Sales Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Select your reporting parameters and search filters before
                generating the high-density performance tracking sales report.
              </p>
            </div>

            <div className="grid gap-4 items-end grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto w-full">
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
                      className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent"
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
                <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {store === "all"
                          ? "All Branches"
                          : branches.find((b) => String(b.id) === String(store))
                              ?.name || "All Branches"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border border-border shadow-lg bg-card"
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
                              setStore("all");
                              setStoreOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-emerald-600",
                                store === "all" ? "opacity-100" : "opacity-0",
                              )}
                            />
                            All Branches
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem
                              key={b.id}
                              value={b.name}
                              onSelect={() => {
                                setStore(String(b.id));
                                setStoreOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-emerald-600",
                                String(store) === String(b.id) ? "opacity-100" : "opacity-0",
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
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {user === "all"
                          ? "All Cashiers"
                          : sellers.find((u) => String(u.id) === String(user))
                              ?.name || "All Cashiers"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full min-w-[200px] p-0 rounded-md border border-border shadow-lg bg-card"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Search cashiers..."
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No cashier found.</CommandEmpty>
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
                            All Cashiers
                          </CommandItem>
                          {sellers.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={u.name}
                              onSelect={() => {
                                setUser(String(u.id));
                                setUserOpen(false);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-emerald-600",
                                  String(user) === String(u.id)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {u.name}
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
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {selectedMainCategories.length === 0
                          ? "All Categories"
                          : selectedMainCategories.length === 1
                            ? categories.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedMainCategories[0]),
                              )?.name || "1 Category"
                            : `${selectedMainCategories.length} Categories`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                          {categories.map((c) => {
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
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {selectedSubCategories.length === 0
                          ? "All Sub-categories"
                          : selectedSubCategories.length === 1
                            ? subCategories.find(
                                (c) =>
                                  String(c.id) ===
                                  String(selectedSubCategories[0]),
                              )?.name || "1 Sub-cat"
                            : `${selectedSubCategories.length} Sub-categories`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  <Target className="h-3.5 w-3.5 text-emerald-600" /> Brand
                </label>
                <Popover open={brandsOpen} onOpenChange={setBrandsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {selectedBrands.length === 0
                          ? "All Brands"
                          : selectedBrands.length === 1
                            ? brands.find(
                                (c) =>
                                  String(c.id) === String(selectedBrands[0]),
                              )?.name || "1 Brand"
                            : `${selectedBrands.length} Brands`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                <Popover open={suppliersOpen} onOpenChange={setSuppliersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
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
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  <Layers className="h-3.5 w-3.5 text-emerald-600" /> Batch
                </label>
                <Popover open={batchesOpen} onOpenChange={setBatchesOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent"
                    >
                      <span className="truncate">
                        {selectedBatches.length === 0
                          ? "All Batches"
                          : selectedBatches.length === 1
                            ? selectedBatches[0]
                            : `${selectedBatches.length} Batches`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-in" />
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
                          {batches.map((c) => {
                            const isSelected = selectedBatches.includes(
                              String(c.batch_number),
                            );
                            return (
                              <CommandItem
                                key={c.id || c.batch_number}
                                value={c.batch_number}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedBatches(
                                      selectedBatches.filter(
                                        (id) => id !== String(c.batch_number),
                                      ),
                                    );
                                  } else {
                                    setSelectedBatches([
                                      ...selectedBatches,
                                      String(c.batch_number),
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
                                {c.batch_number}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-8 flex justify-center max-w-5xl mx-auto w-full">
              <Button
                onClick={() => setIsSetupComplete(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <FileText className="w-5 h-5" /> Get Report
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
