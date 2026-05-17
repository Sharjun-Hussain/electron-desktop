"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  BarChart3,
  Check,
  ChevronsUpDown,
  ShoppingBag,
  TrendingUp,
  Package,
  Layers,
  Store,
  CalendarDays,
  Target,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { format, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { SalesByProductPrintTemplate } from "@/components/Template/sales/SalesByProductTemplate";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
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
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
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
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function SalesByProductPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({ from: startOfMonth(new Date()), to: new Date() });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalSold: 0, uniqueProducts: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [subCategory, setSubCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [store, setStore] = useState("all");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subCategoryOpen, setSubCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  // --- METADATA STATES ---
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [branches, setBranches] = useState([]);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [catRes, subCatRes, brandRes, branchRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sub-categories/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);

      const catData = await catRes.json();
      const subCatData = await subCatRes.json();
      const brandData = await brandRes.json();
      const branchData = await branchRes.json();

      if (catData.status === 'success') setCategories(catData.data);
      if (subCatData.status === 'success') setSubCategories(subCatData.data);
      if (brandData.status === 'success') setBrands(brandData.data);
      if (branchData.status === 'success') setBranches(branchData.data);

    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(async (targetPage = 1) => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: store,
        main_category_id: category,
        sub_category_id: subCategory,
        brand_id: brand,
        search: searchQuery,
        page: targetPage,
        limit: pageSize
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/sales/product?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        const mappedData = result.data.data.map(item => ({
             id: item.product_id + (item.product_variant_id || ''),
             name: item.product.name + (item.variant ? ` (${item.variant.name})` : ''),
             sku: item.variant?.sku || item.product.code,
             sold: Number(item.total_quantity),
             sales: Number(item.total_revenue),
             price: Number(item.total_revenue) / (Number(item.total_quantity) || 1),
             cost_price: Number(item.variant?.cost_price || 0),
             mrp_price: Number(item.variant?.mrp_price || 0),
             wholesale_price: Number(item.variant?.wholesale_price || 0),
             selling_price: Number(item.variant?.price || 0),
             profit: 0
        }));
        setData(mappedData);
        setSummary(result.data.summary);
        setPagination({
          page: result.data.pagination.page,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch product sales report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, store, category, subCategory, brand, searchQuery, pageSize]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Debounced fetch when filters change (resets to page 1)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(1);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  // Reset sub-category if main category changes
  useEffect(() => {
    if (category !== "all" && subCategory !== "all") {
      const currentSub = subCategories.find(sc => String(sc.id) === String(subCategory));
      if (currentSub && String(currentSub.main_category_id) !== String(category)) {
        setSubCategory("all");
      }
    }
  }, [category, subCategories]);

  // --- PRINT ENGINE ---
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Sales_By_Product_Report",
  });

  const exportData = useMemo(() => {
    return (data || []).map(item => ({
      "Product Name": item.name,
      "SKU": item.sku,
      "Quantity Sold": item.sold,
      "Cost Price": item.cost_price,
      "MRP": item.mrp_price,
      "Wholesale Price": item.wholesale_price,
      "Base Selling Price": item.selling_price,
      "Average Unit Price": Number(item.price || 0),
      "Total Revenue": Number(item.sales || 0),
      "Total Profit": Number(item.profit || 0),
      "Operational Unit": store === 'all' ? 'All Branches' : branches.find(b => b.id === store)?.name || store,
      "Classification": category === 'all' ? 'All Categories' : categories.find(c => c.id === category)?.name || category,
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Horizon": date?.from ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}` : "Global"
    }));
  }, [data, store, branches, category, categories, session, date]);

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
            data={data} 
            stats={{
            totalSold: summary.totalSold,
            totalRevenue: summary.totalRevenue,
            totalProfit: 0,
            topSellingItem: data[0] || null,
            topRevenueItem: data[0] || null
            }}
            filters={{ 
            store: store === 'all' ? 'All Branches' : branches.find(b => b.id === store)?.name || store,
            category: category === 'all' ? 'All Categories' : categories.find(c => c.id === category)?.name || category,
            brand: brand === 'all' ? 'All Brands' : brands.find(b => b.id === brand)?.name || brand
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
              <h1 className="text-xl font-bold text-foreground tracking-tight">Product Sales Analytics</h1>
              <p className="text-sm text-muted-foreground mt-0.5">High-density performance tracking across inventory classifications</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Product_Sales_Performance_Report"
              onPrint={handlePrint}
              showPrint={true}
            />
            <Button 
                variant="outline" 
                size="icon" 
                className="border-border hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 rounded-lg" 
                onClick={() => fetchData(pagination.page)} 
                disabled={isLoading}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Visualization */}
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col min-h-[450px] bg-card">
            <CardHeader className="pb-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BarChart3 className="size-4" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold text-foreground">Volume Distribution</h3>
                    <p className="text-xs font-semibold text-muted-foreground">Top 5 SKU Movement Velocity</p>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              {isLoading ? (
                <div className="space-y-4 w-full px-2">
                  {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full rounded-md bg-gray-100" />)}
                </div>
              ) : data.length === 0 ? (
                <div className="text-center italic text-muted-foreground p-8 flex flex-col items-center gap-3">
                   <Package className="h-10 w-10 opacity-20" />
                   <p className="text-sm font-semibold">No movement detected in selected horizon</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    data={[...data].sort((a,b) => b.sold - a.sold).slice(0, 5).map(item => ({ 
                      name: item.name.length > 20 ? item.name.substring(0, 18) + "..." : item.name, 
                      sold: item.sold,
                      fullName: item.name
                    }))} 
                    layout="vertical" 
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={120} className="font-bold" />
                    <Tooltip 
                      cursor={{ fill: 'rgba(226, 232, 240, 0.4)', radius: 8 }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px' }}
                      labelStyle={{ fontWeight: '700', color: '#1E293B', marginBottom: '4px' }}
                      labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="sold" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                      {data.slice(0, 5).map((entry, index) => (
                        <Cell key={index} fillOpacity={1 - (index * 0.12)} fill="#10b981" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Movement Ledger + Filters embedded */}
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden lg:col-span-2 flex flex-col bg-card">
            {/* Filters Bar inside standard Table Layout */}
            <div className="bg-card border-b border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                
                {/* Time Horizon */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <CalendarDays className="size-3.5 text-emerald-600" /> Horizon
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                          <span className="truncate">
                            {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select horizon</span>}
                          </span>
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-md border-border shadow-xl" align="start">
                        <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Main Category */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Layers className="size-3.5 text-emerald-600" /> Classification
                    </label>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent">
                          <span className="truncate">{category === "all" ? "All Categories" : categories.find((c) => String(c.id) === String(category))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search category..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No category found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setCategory("all"); setCategoryOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", category === "all" ? "opacity-100" : "opacity-0")} />
                                All Categories
                              </CommandItem>
                              {categories.map((cat) => (
                                <CommandItem key={cat.id} onSelect={() => {setCategory(cat.id); setCategoryOpen(false)}} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(category) === String(cat.id) ? "opacity-100" : "opacity-0")} />
                                  {cat.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Sub Category */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Filter className="size-3.5 text-emerald-600" /> Sub-Class
                    </label>
                    <Popover open={subCategoryOpen} onOpenChange={setSubCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent">
                          <span className="truncate">{subCategory === "all" ? "All Sub-Classes" : subCategories.find((sc) => String(sc.id) === String(subCategory))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search sub-category..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No sub-category found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setSubCategory("all"); setSubCategoryOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", subCategory === "all" ? "opacity-100" : "opacity-0")} />
                                All Sub-Classes
                              </CommandItem>
                              {subCategories.filter(sc => category === "all" || String(sc.main_category_id) === String(category)).map((sc) => (
                                <CommandItem key={sc.id} onSelect={() => {setSubCategory(sc.id); setSubCategoryOpen(false)}} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(subCategory) === String(sc.id) ? "opacity-100" : "opacity-0")} />
                                  {sc.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Brand */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Target className="size-3.5 text-emerald-600" /> Brand Authority
                    </label>
                    <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent">
                          <span className="truncate">{brand === "all" ? "Global Brands" : brands.find((b) => String(b.id) === String(brand))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search brand..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setBrand("all"); setBrandOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", brand === "all" ? "opacity-100" : "opacity-0")} />
                                Global Brands
                              </CommandItem>
                              {brands.map((b) => (
                                <CommandItem key={b.id} onSelect={() => {setBrand(b.id); setBrandOpen(false)}} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(brand) === String(b.id) ? "opacity-100" : "opacity-0")} />
                                  {b.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                </div>

                {/* Store */}
                <div className="w-full space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                       <Store className="size-3.5 text-emerald-600" /> Operational Unit
                    </label>
                    <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border font-normal hover:bg-emerald-50 hover:border-emerald-200 p-2 text-sm bg-transparent">
                          <span className="truncate">{store === "all" ? "All Global Units" : branches.find((b) => String(b.id) === String(store))?.name}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                        <PopoverContent className="w-full min-w-[200px] p-0 rounded-md shadow-lg border-border" align="start">
                        <Command>
                          <CommandInput placeholder="Search store..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No store found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => {setStore("all"); setStoreOpen(false)}} className="cursor-pointer">
                                <Check className={cn("mr-2 h-4 w-4 text-emerald-600", store === "all" ? "opacity-100" : "opacity-0")} />
                                All Global Units
                              </CommandItem>
                              {branches.map((b) => (
                                <CommandItem key={b.id} onSelect={() => {setStore(b.id); setStoreOpen(false)}} className="cursor-pointer">
                                  <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(store) === String(b.id) ? "opacity-100" : "opacity-0")} />
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
                       <Search className="size-3.5 text-emerald-600" /> Explorer
                    </label>
                    <div className="relative group">
                       <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                       <Input 
                           placeholder="Refine by SKU or content..." 
                           className="pl-9 h-9 rounded-md border-border shadow-none focus-visible:ring-emerald-500 focus-visible:border-emerald-500 text-sm font-normal bg-transparent" 
                           value={searchQuery}
                           onChange={(e)=>setSearchQuery(e.target.value)}
                       />
                    </div>
                </div>

              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="pl-6 py-4 text-xs font-semibold text-muted-foreground">SKU Entity</TableHead>
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">Quantity</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Cost</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">MRP</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Wholesale</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground">Selling</TableHead>
                    <TableHead className="text-right pr-6 text-xs font-semibold text-muted-foreground">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6 py-4">
                          <Skeleton className="h-4 w-48 mb-2 rounded bg-gray-100" />
                          <Skeleton className="h-3 w-24 rounded bg-gray-50" />
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-10 mx-auto rounded bg-gray-100" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto rounded bg-gray-50" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-5 w-28 ml-auto rounded bg-gray-100" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-b border-border group">
                        <TableCell className="pl-6 py-3.5">
                          <p className="font-semibold text-sm text-foreground group-hover:text-emerald-600 transition-colors">{item.name}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                             <Badge variant="outline" className="h-5 px-1.5 pointer-events-none rounded text-[10px] font-semibold bg-muted border-border text-muted-foreground">{item.sku}</Badge>
                             <span className="italic">Stock Keeping Unit</span>
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-semibold text-sm bg-muted px-2.5 py-1 rounded-md text-foreground">{item.sold}</span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">{formatCurrency(item.cost_price)}</TableCell>
                        <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">{formatCurrency(item.mrp_price)}</TableCell>
                        <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">{formatCurrency(item.wholesale_price)}</TableCell>
                        <TableCell className="text-right text-muted-foreground font-medium tabular-nums text-sm">{formatCurrency(item.selling_price)}</TableCell>
                        <TableCell className="text-right pr-6">
                           <p className="font-semibold text-foreground tabular-nums">{formatCurrency(item.sales)}</p>
                           <p className="text-[10px] font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Total Revenue</p>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="py-24 text-center text-muted-foreground">
                         <div className="flex flex-col items-center gap-3">
                            <div className="size-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                               <Layers className="size-8" />
                            </div>
                            <h4 className="font-bold text-foreground uppercase tracking-tight">Zero movement in scope</h4>
                            <p className="text-sm font-medium italic">Adjust classifiers or store selection to expand visibility</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <PaginationControls
              currentPage={pagination.page - 1}
              totalPages={pagination.totalPages}
              onPageChange={(pageIndex) => fetchData(pageIndex + 1)}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => setPageSize(newSize)}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}