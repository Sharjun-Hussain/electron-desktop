"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
import {
  RefreshCw,
  Filter,
  Calendar as CalendarIcon,
  Check,
  Package,
  LayoutGrid,
  Settings2,
  CalendarDays,
  MapPin,
  User as UserIcon,
  Tag,
  SlidersHorizontal,
  PlusSquare,
  MinusSquare,
  DollarSign
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { DataActions } from "@/components/general/DataActions";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

const DEFAULT_COLUMNS = {
  item_code: true,
  item_name: true,
  sale_price: false,
  cost_price: true,
  adjust_qty: true,
  type: true,
  date: true,
  category: false,
  brand: false,
  user: true,
};

export default function AdvancedTransactionsReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime, localization } = useAppSettings();

  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    product_id: "all",
    brand_id: "all",
    category_id: "all",
    user_id: "all",
    transaction_type: "all",
  });

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Metadata
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [prodRes, brandRes, catRes, userRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);

      const prodData = await prodRes.json();
      const brandData = await brandRes.json();
      const catData = await catRes.json();
      const userData = await userRes.json();

      if (prodData.status === 'success') setProducts(Array.isArray(prodData.data?.data) ? prodData.data.data : (prodData.data?.products || []));
      if (brandData.status === 'success') setBrands(Array.isArray(brandData.data?.data) ? brandData.data.data : (brandData.data || []));
      if (catData.status === 'success') setCategories(Array.isArray(catData.data?.data) ? catData.data.data : (catData.data || []));
      if (userData.status === 'success') setUsers(Array.isArray(userData.data?.data) ? userData.data.data : (userData.data || []));
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
        product_id: filters.product_id,
        brand_id: filters.brand_id,
        main_category_id: filters.category_id,
        user_id: filters.user_id,
        transaction_type: filters.transaction_type,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/advanced/transactions?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (res.status === 401) {
        signOut({ callbackUrl: "/login" });
        return;
      }

      if (result.status === 'success') {
        setData(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, filters]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    if (isSetupComplete) {
      fetchData();
    }
  }, [isSetupComplete, fetchData]);

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const exportData = useMemo(() => {
    return data.map(item => {
      const row = {};
      if (visibleColumns.date) row["Date"] = format(new Date(item.date), "yyyy-MM-dd HH:mm");
      if (visibleColumns.item_code) row["Item Code"] = item.item_code;
      if (visibleColumns.item_name) row["Item Name"] = item.item_name;
      if (visibleColumns.category) row["Category"] = item.category;
      if (visibleColumns.brand) row["Brand"] = item.brand;
      if (visibleColumns.adjust_qty) row["Adjust Qty"] = item.quantity;
      if (visibleColumns.type) row["Type"] = item.type;
      if (visibleColumns.cost_price) row["Cost Price"] = item.cost_price;
      if (visibleColumns.sale_price) row["Sale Price"] = item.sale_price;
      if (visibleColumns.user) row["User"] = item.user;
      return row;
    });
  }, [data, visibleColumns]);

  const stats = useMemo(() => {
    let additions = 0;
    let subtractions = 0;
    let netCostImpact = 0;

    data.forEach(item => {
      const qty = Number(item.quantity);
      const cost = Number(item.cost_price || 0);
      if (item.type === 'addition') {
        additions += qty;
        netCostImpact += (qty * cost);
      } else if (item.type === 'subtraction') {
        subtractions += qty;
        netCostImpact -= (qty * cost);
      }
    });

    return {
      totalTransactions: data.length,
      additions,
      subtractions,
      netCostImpact
    };
  }, [data]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Stock_Adjustments_Report",
  });

  const statsCards = [
    {
      label: "Total Adjustments",
      val: isLoading ? null : stats.totalTransactions,
      desc: "Number of stock adjustments",
      icon: Package,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Total Additions",
      val: isLoading ? null : `+${stats.additions}`,
      desc: "Quantity added to inventory",
      icon: PlusSquare,
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Total Subtractions",
      val: isLoading ? null : `-${stats.subtractions}`,
      desc: "Quantity removed from inventory",
      icon: MinusSquare,
      gradient: "from-rose-500 to-red-400",
    },
    {
      label: "Net Value Impact",
      val: isLoading ? null : formatCurrency(stats.netCostImpact),
      desc: "Net change in inventory value",
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <SlidersHorizontal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Adjustments Report</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Comprehensive audit of all inventory movements and adjustments</p>
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
              fileName="Stock_Adjustments_Report"
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
                      {Object.keys(visibleColumns).map((key) => {
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => toggleColumn(key)}
                          >
                            <div
                              className={cn(
                                "flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-primary transition-all",
                                visibleColumns[key]
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "opacity-50 border-muted-foreground [&_svg]:invisible"
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </div>
                            <span className="text-[11px] font-medium text-foreground select-none capitalize">
                              {key.replace('_', ' ')}
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
              disabled={isLoading || !isSetupComplete}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

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
        )}

        {/* Main Table Card Wrap */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Setup Wizard / Filters */}
          <div className={cn("p-4 transition-all duration-300", !isSetupComplete ? "p-8 bg-card" : "bg-muted/10 border-b border-border")}>
            
            {!isSetupComplete && (
              <div className="mb-8 text-center max-w-2xl mx-auto">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 mb-4">
                   <Settings2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Configure Your Report</h2>
                <p className="text-sm text-muted-foreground">Select your reporting parameters and filter by product, brand, or user before generating the report.</p>
              </div>
            )}

            {isSetupComplete ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                    {date?.from ? (date.to ? `${format(date.from, "LLL dd, yyyy")} - ${format(date.to, "LLL dd, yyyy")}` : format(date.from, "LLL dd, yyyy")) : "All Time"}
                  </Badge>
                  {filters.transaction_type !== "all" && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border capitalize">
                      <Tag className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      Type: {filters.transaction_type}
                    </Badge>
                  )}
                  {filters.user_id !== "all" && (
                    <Badge variant="outline" className="px-3 py-1.5 text-xs font-medium border-border">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      {users.find((u) => String(u.id) === String(filters.user_id))?.name || "User"}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {data.length} records found
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-10 border-border text-sm font-medium hover:bg-emerald-50">
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                          {date?.from ? (date.to ? <>{format(date.from, "LLL dd, yyyy")} - {format(date.to, "LLL dd, yyyy")}</> : format(date.from, "LLL dd, yyyy")) : <span>Select range</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-border" align="start">
                        <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Transaction Type</Label>
                    <Select value={filters.transaction_type} onValueChange={(val) => setFilters(f => ({ ...f, transaction_type: val }))}>
                      <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="addition">Addition (+)</SelectItem>
                        <SelectItem value="subtraction">Subtraction (-)</SelectItem>
                        <SelectItem value="set_to">Set To (=)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Product</Label>
                    <Select value={filters.product_id} onValueChange={(val) => setFilters(f => ({ ...f, product_id: val }))}>
                      <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="All Products" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {Array.isArray(products) && products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Adjusted By (User)</Label>
                    <Select value={filters.user_id} onValueChange={(val) => setFilters(f => ({ ...f, user_id: val }))}>
                      <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {Array.isArray(users) && users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Category (Department)</Label>
                    <Select value={filters.category_id} onValueChange={(val) => setFilters(f => ({ ...f, category_id: val }))}>
                      <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Array.isArray(categories) && categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Brand</Label>
                    <Select value={filters.brand_id} onValueChange={(val) => setFilters(f => ({ ...f, brand_id: val }))}>
                      <SelectTrigger className="h-10 border-border">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {Array.isArray(brands) && brands.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button 
                    className="w-full sm:w-auto min-w-[200px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium" 
                    onClick={() => setIsSetupComplete(true)}
                  >
                    Generate Report
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Table Area */}
          {isSetupComplete && (
            <div className="overflow-x-auto relative min-h-[400px]">
              <Table ref={printRef}>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    {visibleColumns.date && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 pl-6">Date</TableHead>}
                    {visibleColumns.item_code && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Item Code</TableHead>}
                    {visibleColumns.item_name && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Item Name</TableHead>}
                    {visibleColumns.category && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Category</TableHead>}
                    {visibleColumns.brand && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Brand</TableHead>}
                    {visibleColumns.adjust_qty && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Adjust Qty</TableHead>}
                    {visibleColumns.type && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Type</TableHead>}
                    {visibleColumns.cost_price && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Cost Price</TableHead>}
                    {visibleColumns.sale_price && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Sale Price</TableHead>}
                    {visibleColumns.user && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right pr-6">User</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="border-border animate-pulse">
                        <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell colSpan={7}></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors group">
                        {visibleColumns.date && <TableCell className="pl-6 py-4 text-[13px] font-medium text-muted-foreground tabular-nums">{format(new Date(item.date), "yyyy-MM-dd HH:mm")}</TableCell>}
                        {visibleColumns.item_code && <TableCell className="text-[13px] font-bold text-foreground">{item.item_code}</TableCell>}
                        {visibleColumns.item_name && <TableCell className="text-[13px] font-semibold text-foreground group-hover:text-emerald-600 transition-colors">{item.item_name}</TableCell>}
                        {visibleColumns.category && <TableCell className="text-[13px] font-medium text-muted-foreground">{item.category || '-'}</TableCell>}
                        {visibleColumns.brand && <TableCell className="text-[13px] font-medium text-muted-foreground">{item.brand || '-'}</TableCell>}
                        {visibleColumns.adjust_qty && (
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              "font-bold px-2 py-0.5",
                              item.type === 'addition' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              item.type === 'subtraction' ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                              {item.type === 'addition' ? '+' : item.type === 'subtraction' ? '-' : ''} {item.quantity}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.type && <TableCell className="text-center text-[12px] font-bold uppercase text-muted-foreground/60">{item.type}</TableCell>}
                        {visibleColumns.cost_price && <TableCell className="text-right font-bold text-muted-foreground">{formatCurrency(item.cost_price)}</TableCell>}
                        {visibleColumns.sale_price && <TableCell className="text-right font-bold text-foreground">{formatCurrency(item.sale_price)}</TableCell>}
                        {visibleColumns.user && <TableCell className="text-right pr-6 font-semibold text-foreground">{item.user}</TableCell>}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <Package className="size-12 mb-2 text-muted-foreground" />
                          <p className="text-sm font-semibold">No stock adjustments found for the selected period</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
