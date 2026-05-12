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
  RefreshCw,
  LayoutGrid,
  Receipt,
  Tag,
  User as UserIcon,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
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
  invoice_no: true,
  date: true,
  item_name: true,
  unit_price: true,
  quantity: true,
  discount: true,
  total: true,
  cost_price: false,
  customer: true,
  cashier: true,
  netsale: true,
  category: false,
  brand: false,
  supplier: false,
};

export default function AdvancedSalesReport() {
  const { data: session } = useSession();
  const { formatCurrency, formatDateTime } = useAppSettings();

  const [reportType, setReportType] = useState("items");
  const [date, setDate] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    product_id: "all",
    supplier_id: "all",
    brand_id: "all",
    customer_id: "all",
    category_id: "all",
    user_id: "all",
    payment_cash: true,
    payment_card: true,
    payment_credit: true,
    invoice_from: "",
    invoice_to: "",
  });

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metadata
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  const fetchMetadata = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const [pRes, sRes, bRes, cRes, catRes, uRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=100`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/brands`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/main-categories`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      ]);

      const [p, s, b, c, cat, u] = await Promise.all([pRes.json(), sRes.json(), bRes.json(), cRes.json(), catRes.json(), uRes.json()]);

      if (p.status === 'success') setProducts(Array.isArray(p.data?.data) ? p.data.data : (p.data?.products || []));
      if (s.status === 'success') setSuppliers(Array.isArray(s.data?.data) ? s.data.data : (s.data || []));
      if (b.status === 'success') setBrands(Array.isArray(b.data?.data) ? b.data.data : (b.data || []));
      if (c.status === 'success') setCustomers(Array.isArray(c.data?.data) ? c.data.data : (c.data || []));
      if (cat.status === 'success') setCategories(Array.isArray(cat.data?.data) ? cat.data.data : (cat.data || []));
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
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        product_id: filters.product_id,
        supplier_id: filters.supplier_id,
        brand_id: filters.brand_id,
        customer_id: filters.customer_id,
        main_category_id: filters.category_id,
        user_id: filters.user_id,
        payment_cash: filters.payment_cash.toString(),
        payment_card: filters.payment_card.toString(),
        payment_credit: filters.payment_credit.toString(),
        invoice_from: filters.invoice_from,
        invoice_to: filters.invoice_to,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/advanced/sales?${queryParams}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();

      if (result.status === 'success') {
        setData(result.data || []);
      } else {
        toast.error(result.message || "Failed to fetch sales data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, reportType, date, filters]);

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
      Object.keys(visibleColumns).forEach(col => {
        if (visibleColumns[col]) row[col.replace('_', ' ').toUpperCase()] = item[col];
      });
      return row;
    });
  }, [data, visibleColumns]);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Advanced_Sales_Report",
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans">
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Advanced Sales Report</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Deep analytical view of sales performance and item-level details</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName="Sales_Report"
              onPrint={handlePrint}
              showPrint={true}
            />
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <Card className="xl:col-span-1 border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">Report Mode</h3>
                <RadioGroup value={reportType} onValueChange={setReportType} className="grid grid-cols-2 gap-2">
                  {['items', 'summary', 'refund', 'cancel', 'invoices'].map(type => (
                    <div key={type} className="flex items-center space-x-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                      <RadioGroupItem value={type} id={`type-${type}`} />
                      <Label htmlFor={`type-${type}`} className="text-[11px] font-bold cursor-pointer capitalize">{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-bold flex items-center gap-2 text-foreground uppercase tracking-wider">
                  <Filter className="size-4 text-emerald-600" /> Filters
                </h3>
                
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left h-10 border-border text-sm font-medium">
                        <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd")}</> : format(date.from, "LLL dd")) : <span>Select range</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-border" align="start">
                      <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Multi-Select Filters */}
                <div className="space-y-3">
                  {[
                    { label: "Product", key: "product_id", options: products },
                    { label: "Customer", key: "customer_id", options: customers },
                    { label: "Category (Dept)", key: "category_id", options: categories },
                    { label: "Brand", key: "brand_id", options: brands },
                  ].map(f => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{f.label}</Label>
                      <Select value={filters[f.key]} onValueChange={(v) => setFilters(prev => ({ ...prev, [f.key]: v }))}>
                        <SelectTrigger className="h-10 border-border">
                          <SelectValue placeholder={`All ${f.label}s`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {f.label}s</SelectItem>
                          {Array.isArray(f.options) && f.options.map(opt => (
                            <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Payment Types */}
                <div className="space-y-2 pt-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Payment Type</Label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {['Cash', 'Card', 'Credit'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`pay-${type}`} 
                          checked={filters[`payment_${type.toLowerCase()}`]} 
                          onCheckedChange={(v) => setFilters(f => ({ ...f, [`payment_${type.toLowerCase()}`]: !!v }))}
                        />
                        <label htmlFor={`pay-${type}`} className="text-xs font-bold text-muted-foreground">{type}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Display Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(visibleColumns).map((col) => (
                    <div key={col} className="flex items-center space-x-2">
                      <Checkbox id={`col-${col}`} checked={visibleColumns[col]} onCheckedChange={() => toggleColumn(col)} className="data-[state=checked]:bg-emerald-600" />
                      <label htmlFor={`col-${col}`} className="text-[11px] font-semibold text-muted-foreground capitalize leading-none">{col.replace('_', ' ')}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10 font-bold shadow-lg shadow-emerald-600/20" onClick={fetchData}>Generate Report</Button>
                <Button variant="outline" className="flex-1 h-10 font-bold" onClick={() => {
                  setDate({ from: subDays(new Date(), 7), to: new Date() });
                  setFilters({ product_id: "all", supplier_id: "all", brand_id: "all", customer_id: "all", category_id: "all", user_id: "all", payment_cash: true, payment_card: true, payment_credit: true, invoice_from: "", invoice_to: "" });
                  setVisibleColumns(DEFAULT_COLUMNS);
                }}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Table Area */}
          <Card className="xl:col-span-3 border-border shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    {visibleColumns.invoice_no && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 pl-6">Invoice #</TableHead>}
                    {visibleColumns.date && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4">Date</TableHead>}
                    {visibleColumns.item_name && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4">Item Name</TableHead>}
                    {visibleColumns.quantity && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-center">Qty</TableHead>}
                    {visibleColumns.unit_price && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-right">Price</TableHead>}
                    {visibleColumns.discount && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-right text-rose-500">Disc</TableHead>}
                    {visibleColumns.total && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-right">Total</TableHead>}
                    {visibleColumns.netsale && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-right text-emerald-600">Net Sale</TableHead>}
                    {visibleColumns.customer && <TableHead className="text-[11px] font-bold text-muted-foreground uppercase py-4 text-right pr-6">Customer</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={10} className="py-4 px-6"><Skeleton className="h-4 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors">
                        {visibleColumns.invoice_no && <TableCell className="pl-6 py-4 text-[13px] font-bold text-emerald-600">{item.invoice_no}</TableCell>}
                        {visibleColumns.date && <TableCell className="text-[13px] font-medium text-muted-foreground tabular-nums">{format(new Date(item.date), "LLL dd, HH:mm")}</TableCell>}
                        {item.item_name && <TableCell className="text-[13px] font-bold text-foreground max-w-[200px] truncate">{item.item_name || 'Sale Record'}</TableCell>}
                        {visibleColumns.quantity && <TableCell className="text-center font-bold text-foreground tabular-nums">{item.quantity || '-'}</TableCell>}
                        {visibleColumns.unit_price && <TableCell className="text-right font-medium text-foreground">{formatCurrency(item.unit_price)}</TableCell>}
                        {visibleColumns.discount && <TableCell className="text-right font-bold text-rose-600">-{formatCurrency(item.discount)}</TableCell>}
                        {visibleColumns.total && <TableCell className="text-right font-bold text-foreground">{formatCurrency(item.total)}</TableCell>}
                        {visibleColumns.netsale && <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(item.netsale || item.total)}</TableCell>}
                        {visibleColumns.customer && <TableCell className="text-right pr-6 font-semibold text-muted-foreground">{item.customer}</TableCell>}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-64 text-center opacity-50 font-bold">No sales data found</TableCell>
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
