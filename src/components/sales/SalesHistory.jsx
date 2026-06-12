"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format, subDays, startOfMonth } from "date-fns";
import {
  Printer,
  Download,
  Search,
  Calendar as CalendarIcon,
  Eye,
  TrendingUp,
  Receipt,
  Users,
  RefreshCcw,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Check,
  ChevronsUpDown,
  Truck,
  Tag,
  Package2,
  Filter,
  FileText,
  WifiOff,
  RotateCcw
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

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
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportUtils";
import SaleDetailSheet from "@/components/pos/SaleDetailSheet";
import SalesReturnDialog from "@/components/pos/SalesReturnDialog";
import { StatusBadge } from "../ui/status-badge";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { Badge } from "@/components/ui/badge";
import { ReceiptTemplate } from "../pos/ReceiptTemplate";
import { SalesHistorySkeleton } from "./SalesHistorySkeleton";

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

export default function SalesHistory() {
  const { data: session } = useSession();
  const { formatCurrency, business, pos: posSettings, generateDocNumber } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000, // Large limit for instant local search
    total: 0,
    pages: 1
  });

  // The 'date' state drives the API fetch
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // The 'internalDate' is local to the Calendar UI to avoid jumping to loaders
  const [internalDate, setInternalDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // --- FILTER METADATA ---
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [supRes, catRes, subCatRes, brandRes, prodRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);

      const [supData, catData, subCatData, brandData, prodData] = await Promise.all([
        supRes.json(), catRes.json(), subCatRes.json(), brandRes.json(), prodRes.json()
      ]);

      if (supData.status === 'success') setSuppliers(supData.data);
      if (catData.status === 'success') setCategories(catData.data);
      if (subCatData.status === 'success') setSubCategories(subCatData.data);
      if (brandData.status === 'success') setBrands(brandData.data);
      if (prodData.status === 'success') setProducts(prodData.data);
    } catch (err) { console.error("Metadata fetch error", err); }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // --- HELPERS ---
  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const fetchSales = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: 1,
        size: 1000,
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        supplier_id: selectedSupplier,
        main_category_id: selectedCategory,
        sub_category_id: selectedSubCategory,
        brand_id: selectedBrand,
        product_id: selectedProduct,
        status: 'completed'
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') {
        const rawData = result.data.data || [];
        // Flatten data for instant multi-column search
        const flattenedData = rawData.map(item => ({
          ...item,
          searchText: `${item.invoice_number} ${item.customer?.name || ""} ${item.branch?.name || ""} ${item.payment_method} ${item.payment_status}`.toLowerCase()
        }));
        setData(flattenedData);
        if (result.data.pagination) {
          setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
      } else {
        toast.error(result.message || "Failed to fetch sales");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
    }
  }, [session, date, selectedSupplier, selectedCategory, selectedSubCategory, selectedBrand, selectedProduct]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Sync internal date when external date changes (e.g. on clear filters)
  useEffect(() => {
    if (date) setInternalDate(date);
  }, [date]);

  // Deep Link Handling
  useEffect(() => {
    const saleId = searchParams.get('saleId');
    if (saleId) {
      const sale = data.find(s => s.id == saleId);
      if (sale) {
        setSelectedSale(sale);
        setIsDetailOpen(true);
      } else {
        // Fallback: Fetch single if not in list
        const fetchSingle = async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${saleId}`, {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const rs = await res.json();
            if (rs.status === 'success') {
              setSelectedSale(rs.data);
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
  const handleViewDetails = (sale) => {
    router.push(pathname + '?' + createQueryString('saleId', sale.id), { scroll: false });
  };

  const handleCloseDetails = (open) => {
    if (!open) router.push(pathname, { scroll: false });
    setIsDetailOpen(open);
  };

  const handleOpenReturn = (sale) => {
    setSelectedReturnSale(sale);
    setIsReturnOpen(true);
  };

  // --- REPRINT LOGIC ---
  const [printableSale, setPrintableSale] = useState(null);
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt_${printableSale?.invoice_number || "Draft"}`,
    onAfterPrint: () => setPrintableSale(null),
  });

  useEffect(() => {
    if (printableSale) {
      const t = setTimeout(() => {
        if (printRef.current) handlePrint();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [printableSale, handlePrint]);

  const handleReprint = (sale) => {
    setPrintableSale(sale);
  };

  const exportData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((s) => ({
      Invoice: s.invoice_number,
      Date: format(new Date(s.created_at), "yyyy-MM-dd HH:mm:ss"),
      Customer: s.customer?.name || "Walk-in Customer",
      Branch: s.branch?.name || "Main Hub",
      Method: s.payment_method,
      Total: s.payable_amount,
      Status: s.payment_status?.toUpperCase(),
    }));
  }, [data]);

  const handleClearFilters = () => {
    setSearchQuery("");
    const defaultRange = { from: startOfMonth(new Date()), to: new Date() };
    setDate(defaultRange);
    setInternalDate(defaultRange);
    setSelectedSupplier("all");
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedBrand("all");
    setSelectedProduct("all");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = useCallback((v) => {
    setSearchQuery(v);
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  // --- COLUMNS ---
  const columns = useMemo(() => [
    {
      accessorKey: "invoice_number",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <button
            onClick={() => handleViewDetails(row.original)}
            className="text-left font-bold text-sm text-emerald-600 hover:text-emerald-700 hover:underline decoration-emerald-500/30 underline-offset-4"
          >
            {row.getValue("invoice_number")}
          </button>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">{row.original.branch?.name || 'Main Hub'}</span>
            <span className="text-[10px] opacity-20">•</span>
            <span className="text-[9px] font-black text-emerald-600/50 tabular-nums tracking-tighter">REF: {generateDocNumber('sale', row.original.id)}</span>
            {row.original.source === 'ecommerce' && (
              <>
                <span className="text-[10px] opacity-20">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-xs tracking-wider uppercase border border-indigo-400/20">
                  E-Commerce
                </span>
              </>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 opacity-50" />
          <span className="text-xs font-medium">
            {format(new Date(row.getValue("created_at")), 'MMM dd, yyyy • hh:mm a')}
          </span>
        </div>
      )
    },
    {
      accessorKey: "customer.name",
      header: "Customer",
      cell: ({ row }) => (
        <span className="font-bold text-foreground text-sm">
          {row.original.customer?.name || "Walk-in Customer"}
        </span>
      )
    },
    {
      accessorKey: "searchText",
      enableHiding: false,
    },
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => (
        <StatusBadge
          value={row.getValue("payment_method")}
          showIcon={false}
          className="bg-slate-500/5 text-slate-600 border-slate-200 dark:bg-slate-400/5 dark:text-slate-400 dark:border-slate-800"
        />
      )
    },
    {
      accessorKey: "payable_amount",
      header: () => <div className="text-right">Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-black text-foreground tabular-nums">
          {formatCurrency(row.getValue("payable_amount"))}
        </div>
      )
    },
    {
      accessorKey: "payment_status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <StatusBadge value={row.getValue("payment_status")} />
          {(row.original.return_status && row.original.return_status !== 'none' || row.original.returns?.length > 0) && (
            <StatusBadge
              value={row.original.return_status === 'full' ? 'returned' : 'partial return'}
              className="bg-orange-500/10 text-orange-600 border-orange-500/20"
            />
          )}
        </div>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
            onClick={() => handleOpenReturn(row.original)}
            title="Return Sale"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
            onClick={() => handleReprint(row.original)}
            title="Fast Reprint"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>
      )
    }
  ], [formatCurrency, generateDocNumber, pathname]);

  // --- STATS ---
  const stats = useMemo(() => {
    const totalRev = data.reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);
    return [
      { label: "Rev. (Page)", value: formatCurrency(totalRev), icon: TrendingUp, gradient: "from-emerald-500 to-teal-400" },
      { label: "Transactions", value: pagination.total, icon: Receipt, gradient: "from-blue-500 to-indigo-400" },
      { label: "Avg. (List)", value: formatCurrency(totalRev / (data.length || 1)), icon: ArrowUpRight, gradient: "from-violet-500 to-purple-400" },
      { label: "Unique Clients", value: new Set(data.map(s => s.customer_id)).size, icon: Users, gradient: "from-amber-500 to-orange-400" },
    ];
  }, [data, pagination.total, formatCurrency]);

  const statCards = useMemo(() => (
    <StatsSection stats={stats} />
  ), [stats]);

  return (
    <>
      <ResourceManagementLayout
        data={data}
        columns={columns}
        isLoading={loading}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Sales History</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Track and manage historical sales across all branches</p>
            </div>
          </div>
        }
        statCardsComponent={statCards}
        loadingSkeleton={<SalesHistorySkeleton />}
        searchPlaceholder="Filter by Invoice, Customer, or Branch..."
        searchColumn="searchText"
        initialColumnVisibility={{ searchText: false }}
        onSearchChange={handleSearchChange}
        onExportClick={null}
        exportData={exportData}
        exportFileName={`Sales_History_Export_${format(new Date(), "yyyyMMdd")}`}
        extraActions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/sales/offline")}
              variant="outline"
              className="gap-2 border-indigo-500/30 bg-indigo-500/5 text-indigo-700 hover:bg-indigo-500/10 transition-all font-bold text-xs h-9 px-4"
            >
              <WifiOff className="h-3.5 w-3.5" />
              Offline Sync Monitor
            </Button>
            <Button
              onClick={fetchSales}
              variant="outline"
              size="icon"
              className="h-9 w-9 p-0 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200"
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
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
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
              {/* Time Period */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Period</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200 hover:bg-gray-50">
                      <span className="truncate">
                        {internalDate?.from ? (
                          internalDate.to ? `${format(internalDate.from, "MMM dd")} - ${format(internalDate.to, "MMM dd")}` : format(internalDate.from, "MMM dd")
                        ) : "Select period"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
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

              {/* Supplier Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200">
                      <span className="truncate">{selectedSupplier === "all" ? "All Suppliers" : suppliers.find(s => s.id === selectedSupplier)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search supplier..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No supplier found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedSupplier("all"); setPagination(p => ({ ...p, page: 1 })) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedSupplier === "all" ? "opacity-100" : "opacity-0")} />
                            All Suppliers
                          </CommandItem>
                          {suppliers.map((s) => (
                            <CommandItem key={s.id} onSelect={() => { setSelectedSupplier(s.id); setPagination(p => ({ ...p, page: 1 })) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedSupplier === s.id ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Main Category</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200">
                      <span className="truncate">{selectedCategory === "all" ? "All Categories" : categories.find(c => c.id === selectedCategory)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedCategory("all"); setPagination(p => ({ ...p, page: 1 })) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedCategory === "all" ? "opacity-100" : "opacity-0")} />
                            All Categories
                          </CommandItem>
                          {categories.map((c) => (
                            <CommandItem key={c.id} onSelect={() => { setSelectedCategory(c.id); setPagination(p => ({ ...p, page: 1 })) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedCategory === c.id ? "opacity-100" : "opacity-0")} />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Sub-Category Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sub Category</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200">
                      <span className="truncate">{selectedSubCategory === "all" ? "All Sub-Cats" : subCategories.find(s => s.id === selectedSubCategory)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search sub-category..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No sub-category found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedSubCategory("all"); setPagination(p => ({ ...p, page: 1 })) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedSubCategory === "all" ? "opacity-100" : "opacity-0")} />
                            All Sub-Cats
                          </CommandItem>
                          {subCategories.filter(sc => selectedCategory === "all" || sc.main_category_id === selectedCategory).map((s) => (
                            <CommandItem key={s.id} onSelect={() => { setSelectedSubCategory(s.id); setPagination(p => ({ ...p, page: 1 })) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedSubCategory === s.id ? "opacity-100" : "opacity-0")} />
                              {s.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Brand Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Package2 className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Brand</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200">
                      <span className="truncate">{selectedBrand === "all" ? "All Brands" : brands.find(b => b.id === selectedBrand)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search brand..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedBrand("all"); setPagination(p => ({ ...p, page: 1 })) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedBrand === "all" ? "opacity-100" : "opacity-0")} />
                            All Brands
                          </CommandItem>
                          {brands.map((b) => (
                            <CommandItem key={b.id} onSelect={() => { setSelectedBrand(b.id); setPagination(p => ({ ...p, page: 1 })) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedBrand === b.id ? "opacity-100" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Product Filter */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-emerald-600" />
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Specific Item</label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs border-gray-200">
                      <span className="truncate">{selectedProduct === "all" ? "All Products" : products.find(p => p.id === selectedProduct)?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search product..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setSelectedProduct("all"); setPagination(p => ({ ...p, page: 1 })) }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedProduct === "all" ? "opacity-100" : "opacity-0")} />
                            All Products
                          </CommandItem>
                          {products.map((p) => (
                            <CommandItem key={p.id} onSelect={() => { setSelectedProduct(p.id); setPagination(p => ({ ...p, page: 1 })) }}>
                              <Check className={cn("mr-2 h-4 w-4", selectedProduct === p.id ? "opacity-100" : "opacity-0")} />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      />

      <SaleDetailSheet
        isOpen={isDetailOpen}
        onOpenChange={handleCloseDetails}
        sale={selectedSale}
        onReprint={handleReprint}
      />

      <SalesReturnDialog
        open={isReturnOpen}
        onOpenChange={setIsReturnOpen}
        sale={selectedReturnSale}
        onSuccess={() => fetchSales()}
      />

      {/* Hidden Reprint Template */}
      <div className="hidden">
        <ReceiptTemplate
          ref={printRef}
          sale={printableSale}
          business={business}
          settings={posSettings}
          branch={printableSale?.branch}
          terminalName={printableSale?.terminal_name || "REPRINT"}
        />
      </div>
    </>
  );
}
