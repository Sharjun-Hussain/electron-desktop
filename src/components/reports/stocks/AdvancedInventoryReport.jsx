"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subDays, addDays } from "date-fns";
import {
  Printer,
  FileText,
  Download,
  Search,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  LayoutGrid,
  Package,
  CalendarDays,
  Truck,
  Layers,
  ChevronLeft,
  ChevronRight,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { DataActions } from "@/components/general/DataActions";

import { signOut, useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

const DEFAULT_COLUMNS = {
  item_code: true,
  item_name: true,
  sale_price: false,
  cost_price: false,
  quantity: true,
  total_value: true,
  supplier: false,
  batch_no: true,
  category: true,
  brand: false,
  expiry_date: false,
  net_qty: false,
  net_value: true,
};

export default function AdvancedInventoryReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();

  const [reportType, setReportType] = useState("summary");
  const [expireDate, setExpireDate] = useState({
    from: new Date(),
    to: addDays(new Date(), 30),
  });
  const [filters, setFilters] = useState({
    product_id: "all",
    supplier_id: "all",
    category_id: "all",
    brand_id: "all",
    user_id: "all",
    stock_from: "",
    stock_to: "",
  });

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metadata
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [prodRes, suppRes, catRes, brandRes, userRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        })
      ]);

      const [p, s, c, b, u] = await Promise.all([
        prodRes.json(), suppRes.json(), catRes.json(), brandRes.json(), userRes.json()
      ]);

      if (p.status === 'success') setProducts(Array.isArray(p.data?.data) ? p.data.data : (p.data?.products || []));
      if (s.status === 'success') setSuppliers(Array.isArray(s.data?.data) ? s.data.data : (s.data || []));
      if (c.status === 'success') setCategories(Array.isArray(c.data?.data) ? c.data.data : (c.data || []));
      if (b.status === 'success') setBrands(Array.isArray(b.data?.data) ? b.data.data : (b.data || []));
      if (u.status === 'success') setUsers(Array.isArray(u.data?.data) ? u.data.data : (u.data || []));
    } catch (err) {
      console.error("Failed to fetch metadata", err);
    }
  }, [session?.accessToken]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        report_type: reportType,
        start_date: expireDate?.from ? format(expireDate.from, 'yyyy-MM-dd') : '',
        end_date: expireDate?.to ? format(expireDate.to, 'yyyy-MM-dd') : '',
        product_id: filters.product_id,
        supplier_id: filters.supplier_id,
        main_category_id: filters.category_id,
        brand_id: filters.brand_id,
        user_id: filters.user_id,
        stock_from: filters.stock_from,
        stock_to: filters.stock_to,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/advanced/stocks?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (result.status === 'success') {
        setData(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch inventory data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, reportType, expireDate, filters]);

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
      if (visibleColumns.quantity) row["Quantity"] = item.quantity;
      if (visibleColumns.total_value) row["Total Value"] = item.total_value;
      if (visibleColumns.batch_no) row["Batch No"] = item.batch_no;
      if (visibleColumns.expiry_date) row["Expiry Date"] = item.expiry_date ? format(new Date(item.expiry_date), "yyyy-MM-dd") : "-";
      return row;
    });
  }, [data, visibleColumns]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Advanced_Inventory_Report",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Advanced Inventory Report</h1>
              <p className="text-sm text-muted-foreground mt-0.5">In-depth stock valuation, batch tracking and expiry analysis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Inventory_Report"
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
              {/* Report Type */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                   Report Type
                </h3>
                <RadioGroup value={reportType} onValueChange={setReportType} className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <RadioGroupItem value="summary" id="type-summary" />
                    <Label htmlFor="type-summary" className="text-xs font-bold cursor-pointer flex-1">Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <RadioGroupItem value="batches" id="type-batches" />
                    <Label htmlFor="type-batches" className="text-xs font-bold cursor-pointer flex-1">Batches</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <RadioGroupItem value="expire" id="type-expire" />
                    <Label htmlFor="type-expire" className="text-xs font-bold cursor-pointer flex-1">Expire</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <Filter className="size-4 text-emerald-600" /> Filters
                </h3>
                
                {/* Expire Date Range (Only for Expire type) */}
                {reportType === 'expire' && (
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Expire Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-10 border-border text-sm font-medium hover:bg-emerald-50">
                          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                          {expireDate?.from ? (expireDate.to ? <>{format(expireDate.from, "LLL dd")} - {format(expireDate.to, "LLL dd")}</> : format(expireDate.from, "LLL dd")) : <span>Select range</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-border" align="start">
                        <Calendar mode="range" selected={expireDate} onSelect={setExpireDate} numberOfMonths={2} />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Product Select */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Product</Label>
                  <Select value={filters.product_id} onValueChange={(v) => setFilters(f => ({ ...f, product_id: v }))}>
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

                {/* Supplier Select */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Supplier</Label>
                  <Select value={filters.supplier_id} onValueChange={(v) => setFilters(f => ({ ...f, supplier_id: v }))}>
                    <SelectTrigger className="h-10 border-border">
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {Array.isArray(suppliers) && suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Stock From</Label>
                    <Input type="number" placeholder="0" className="h-10" value={filters.stock_from} onChange={(e) => setFilters(f => ({ ...f, stock_from: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Stock To</Label>
                    <Input type="number" placeholder="9999" className="h-10" value={filters.stock_to} onChange={(e) => setFilters(f => ({ ...f, stock_to: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                   Display Options
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(visibleColumns).map((col) => (
                    <div key={col} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`col-${col}`} 
                        checked={visibleColumns[col]} 
                        onCheckedChange={() => toggleColumn(col)}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <label htmlFor={`col-${col}`} className="text-xs font-medium text-muted-foreground capitalize leading-none">
                        {col.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 font-bold" onClick={fetchData}>Submit</Button>
                <Button variant="outline" className="flex-1 h-10 font-bold" onClick={() => {
                  setReportType("summary");
                  setFilters({ product_id: "all", supplier_id: "all", category_id: "all", brand_id: "all", user_id: "all", stock_from: "", stock_to: "" });
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
                    {visibleColumns.item_code && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 pl-6">Item Code</TableHead>}
                    {visibleColumns.item_name && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Item Name</TableHead>}
                    {visibleColumns.category && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4">Category</TableHead>}
                    {visibleColumns.quantity && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Quantity</TableHead>}
                    {visibleColumns.batch_no && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Batch No</TableHead>}
                    {visibleColumns.expiry_date && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-center">Expiry</TableHead>}
                    {visibleColumns.sale_price && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Sale Price</TableHead>}
                    {visibleColumns.total_value && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right">Total Value</TableHead>}
                    {visibleColumns.net_value && <TableHead className="text-[12px] font-bold text-muted-foreground uppercase py-4 text-right pr-6">Net Value</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i} className="border-border animate-pulse">
                        <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell colSpan={7}></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors group">
                        {visibleColumns.item_code && <TableCell className="pl-6 py-4 text-[13px] font-bold text-foreground">{item.item_code}</TableCell>}
                        {visibleColumns.item_name && <TableCell className="text-[13px] font-semibold text-foreground group-hover:text-emerald-600 transition-colors">{item.item_name}</TableCell>}
                        {visibleColumns.category && <TableCell className="text-[13px] font-medium text-muted-foreground">{item.category || '-'}</TableCell>}
                        {visibleColumns.quantity && (
                          <TableCell className="text-center font-bold tabular-nums">
                            <span className={cn(item.quantity <= 5 ? "text-rose-600" : "text-foreground")}>
                              {item.quantity}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.batch_no && <TableCell className="text-center text-[13px] font-medium text-muted-foreground">{item.batch_no || '-'}</TableCell>}
                        {visibleColumns.expiry_date && (
                          <TableCell className="text-center text-[12px] font-bold">
                            {item.expiry_date ? (
                              <Badge variant="outline" className={cn(
                                "border-none",
                                new Date(item.expiry_date) < new Date() ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {format(new Date(item.expiry_date), "yyyy-MM-dd")}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                        )}
                        {visibleColumns.sale_price && <TableCell className="text-right font-bold text-foreground tabular-nums">{formatCurrency(item.sale_price)}</TableCell>}
                        {visibleColumns.total_value && <TableCell className="text-right font-bold text-emerald-600 tabular-nums">{formatCurrency(item.total_value)}</TableCell>}
                        {visibleColumns.net_value && <TableCell className="text-right pr-6 font-bold text-muted-foreground tabular-nums">{formatCurrency(item.net_value)}</TableCell>}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center">
                         <p className="text-sm font-semibold opacity-50">No inventory data matches your current filters</p>
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
