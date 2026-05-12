"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays } from "date-fns";
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
  Package,
  Layers,
  LayoutGrid,
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
  trade_price: false,
  cost_price: false,
  actual_qty: false,
  adjust_qty: true,
  balance_qty: true,
  date: true,
  time: true,
  batch_no: false,
  department: true,
  category: false,
  brand: false,
  remarks: true,
  access_user: true,
  id: false,
  transaction: true,
};

export default function AdvancedTransactionsReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime, localization } = useAppSettings();

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
  const [isLoading, setIsLoading] = useState(true);

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
    fetchData();
  }, [fetchData]);

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const exportData = useMemo(() => {
    return data.map(item => {
      const row = {};
      if (visibleColumns.item_code) row["Item Code"] = item.item_code;
      if (visibleColumns.item_name) row["Item Name"] = item.item_name;
      if (visibleColumns.sale_price) row["Sale Price"] = item.sale_price;
      if (visibleColumns.cost_price) row["Cost Price"] = item.cost_price;
      if (visibleColumns.adjust_qty) row["Adjust Qty"] = item.quantity;
      if (visibleColumns.type) row["Type"] = item.type;
      if (visibleColumns.date) row["Date"] = format(new Date(item.date), "yyyy-MM-dd");
      if (visibleColumns.category) row["Category"] = item.category;
      if (visibleColumns.brand) row["Brand"] = item.brand;
      if (visibleColumns.user) row["User"] = item.user;
      return row;
    });
  }, [data, visibleColumns]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Transactions_Report",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Transactions Report</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Comprehensive audit of all inventory movements and adjustments</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Transactions_Report"
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
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="xl:col-span-1 border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <Filter className="size-4 text-emerald-600" /> Filters
                </h3>
                
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-10 border-border text-sm font-medium hover:bg-emerald-50">
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select range</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-border" align="start">
                      <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
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

                {/* Category (Department) */}
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

                {/* User */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">User</Label>
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
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <LayoutGrid className="size-4 text-emerald-600" /> Display Options
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(visibleColumns).map((col) => (
                    <div key={col} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`col-${col}`} 
                        checked={visibleColumns[col]} 
                        onCheckedChange={() => toggleColumn(col)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <label htmlFor={`col-${col}`} className="text-xs font-medium text-muted-foreground capitalize leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {col.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 font-bold" onClick={fetchData}>Submit</Button>
                <Button variant="outline" className="flex-1 h-10 font-bold" onClick={() => {
                  setDate({ from: subDays(new Date(), 7), to: new Date() });
                  setFilters({ product_id: "all", brand_id: "all", category_id: "all", user_id: "all", transaction_type: "all" });
                  setVisibleColumns(DEFAULT_COLUMNS);
                }}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Table Area */}
          <Card className="xl:col-span-3 border-border shadow-sm overflow-hidden flex flex-col bg-card">
            <div className="overflow-x-auto relative h-full">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    {visibleColumns.date && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 pl-6">Date</TableHead>}
                    {visibleColumns.item_code && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Item Code</TableHead>}
                    {visibleColumns.item_name && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Item Name</TableHead>}
                    {visibleColumns.category && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Category</TableHead>}
                    {visibleColumns.brand && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Brand</TableHead>}
                    {visibleColumns.adjust_qty && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Adjust Qty</TableHead>}
                    {visibleColumns.type && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Type</TableHead>}
                    {visibleColumns.sale_price && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Sale Price</TableHead>}
                    {visibleColumns.cost_price && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Cost Price</TableHead>}
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
                        <TableCell colSpan={6}></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors group">
                        {visibleColumns.date && <TableCell className="pl-6 py-4 text-[13px] font-medium text-muted-foreground tabular-nums">{format(new Date(item.date), "yyyy-MM-dd")}</TableCell>}
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
                        {visibleColumns.sale_price && <TableCell className="text-right font-bold text-foreground">{formatCurrency(item.sale_price)}</TableCell>}
                        {visibleColumns.cost_price && <TableCell className="text-right font-bold text-muted-foreground">{formatCurrency(item.cost_price)}</TableCell>}
                        {visibleColumns.user && <TableCell className="text-right pr-6 font-semibold text-foreground">{item.user}</TableCell>}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <Package className="size-12 mb-2 text-muted-foreground" />
                          <p className="text-sm font-semibold">No transactions found for the selected period</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
