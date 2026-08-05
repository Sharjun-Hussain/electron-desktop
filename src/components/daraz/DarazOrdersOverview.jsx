"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfDay, 
  endOfDay, 
  startOfYear, 
  endOfYear, 
  subDays 
} from "date-fns";
import { 
  Receipt, 
  Store,
  CreditCard,
  Banknote,
  Calendar as CalendarIcon,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  Pencil,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format as formatDateDateFns } from "date-fns";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { format } from "@/lib/date-utils";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChevronDown } from "lucide-react";
import SaleDetailSheet from "@/components/pos/SaleDetailSheet";

export function DarazOrdersOverview() {
  const { data: session } = useSession();
  const { formatCurrency, business, generateDocNumber } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ----- STATE -----
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darazStores, setDarazStores] = useState([]);

  // Filters State
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlingSale, setSettlingSale] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [settling, setSettling] = useState(false);
  const [internalDate, setInternalDate] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDarazStore, setSelectedDarazStore] = useState("all");
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    pages: 1
  });

  // Fetch Daraz Stores
  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/daraz-stores`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    })
    .then(res => res.json())
    .then(rs => {
      if(rs.status === 'success') {
        setDarazStores(rs.data);
      }
    })
    .catch(console.error);
  }, [session]);

  // Fetch Orders
  const fetchDarazOrders = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: 1,
        size: 1000,
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        source: 'daraz' 
      });

      // Filter by Daraz store if specific one selected (Assuming backend supports daraz_store_id or similar search)
      if (selectedDarazStore !== "all") {
         query.set("daraz_store_id", selectedDarazStore);
      }

      // Filter by payment method
      if (selectedPaymentOption !== "all") {
         query.set("payment_method", selectedPaymentOption);
      }

      // Filter by status
      if (selectedStatus !== "all") {
        if (selectedStatus === "pending") {
          query.set("payment_status", "unpaid,partially_paid");
          query.set("status", "completed,draft"); // exclude cancelled/returned
        } else if (selectedStatus === "completed") {
          query.set("payment_status", "paid");
          query.set("status", "completed,draft"); // allow daraz drafts that are already paid
        } else if (selectedStatus === "cancelled") {
          query.set("status", "cancelled");
        } else {
          query.set("status", selectedStatus);
        }
      }
      
      query.set("source", "daraz");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?${query}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      
      if (result.status === 'success') {
        const rawData = result.data.data || [];
        
        // Flatten text for instant search
        const flattened = rawData.map(item => {
          let embedded = {};
          try {
            if (item.notes && typeof item.notes === 'string' && item.notes.startsWith('{')) {
              embedded = JSON.parse(item.notes);
            }
          } catch(e) {}
          
          return {
            ...item,
            searchText: `${item.invoice_number} ${item.daraz_store?.name || ''} ${item.payment_method}`.toLowerCase(),
            daraz_store_name: item.daraz_store?.name || item.platform_store_name || "Unknown Store",
            delivery_fees: embedded.delivery_fees || item.delivery_fees || 0,
            ecommerce_order_id: embedded.order_number || item.ecommerce_order_id || null,
            parcel_barcode: embedded.parcel_barcode || null
          };
        });

        // Safety: apply status filter client-side as well (Daraz "Pending/Completed" is payment-driven)
        const normalizedStatus = String(selectedStatus || "all").toLowerCase();
        const statusFiltered = flattened.filter((s) => {
          const saleStatus = String(s.status || "").toLowerCase();
          const paymentStatus = String(s.payment_status || "").toLowerCase();

          if (normalizedStatus === "pending") return saleStatus !== "cancelled" && paymentStatus !== "paid";
          if (normalizedStatus === "completed") return saleStatus !== "cancelled" && paymentStatus === "paid";
          if (normalizedStatus === "cancelled") return saleStatus === "cancelled";
          return true;
        });

        setData(statusFiltered);
        if (result.data.pagination) setPagination(prev => ({ ...prev, ...result.data.pagination }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load Daraz orders.");
    } finally {
      setLoading(false);
    }
  }, [session, date, selectedDarazStore, selectedPaymentOption, selectedStatus]);

  useEffect(() => {
    fetchDarazOrders();
  }, [fetchDarazOrders]);

  const handleClearFilters = () => {
    setSearchQuery("");
    const defaultRange = { from: startOfMonth(new Date()), to: new Date() };
    setDate(defaultRange);
    setInternalDate(defaultRange);
    setSelectedDarazStore("all");
    setSelectedPaymentOption("all");
    setSelectedStatus("all");
    setPagination(p => ({ ...p, page: 1 }));
  };

  const setDateShortcut = useCallback((preset) => {
    const today = new Date();
    let range = { from: today, to: today };
    switch (preset) {
      case 'today': range = { from: startOfDay(today), to: endOfDay(today) }; break;
      case 'yesterday': range = { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) }; break;
      case 'last7': range = { from: startOfDay(subDays(today, 7)), to: endOfDay(today) }; break;
      case 'last30': range = { from: startOfDay(subDays(today, 30)), to: endOfDay(today) }; break;
      case 'thisMonth': range = { from: startOfMonth(today), to: endOfMonth(today) }; break;
      case 'thisYear': range = { from: startOfYear(today), to: endOfYear(today) }; break;
    }
    setInternalDate(range);
    setDate(range);
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val);
    setPagination(p => ({ ...p, page: 1 }));
  }, []);

  const filterComponents = () => (
    <div className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
        {/* Date Filter */}
        <div className="space-y-1.5 focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-9 text-xs focus:ring-0 focus-visible:ring-0 outline-none hover:shadow-none">
                <span className="truncate">
                  {internalDate?.from ? (
                    internalDate.to ? `${format(internalDate.from, "MMM dd")} - ${format(internalDate.to, "MMM dd")}` : format(internalDate.from, "MMM dd")
                  ) : "Select period"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row shadow-lg rounded-xl dark:border-border" align="start">
              <div className="flex flex-row sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-border p-3 bg-muted/20 dark:bg-muted/10 overflow-x-auto sm:min-w-[140px]">
                <Button variant="ghost" size="sm" className="justify-start text-xs font-medium h-8" onClick={() => setDateShortcut('today')}>Today</Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs font-medium h-8" onClick={() => setDateShortcut('yesterday')}>Yesterday</Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs font-medium h-8" onClick={() => setDateShortcut('last7')}>Last 7 Days</Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs font-medium h-8" onClick={() => setDateShortcut('last30')}>Last 30 Days</Button>
                <Button variant="ghost" size="sm" className="justify-start text-xs font-medium h-8" onClick={() => setDateShortcut('thisMonth')}>This Month</Button>
              </div>
              <Calendar
                initialFocus
                mode="range"
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
                className="p-4 bg-background rounded-r-xl"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Store Filter */}
        <div className="space-y-1.5 focus-visible:ring-0 gap-0">
          <div className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-blue-600" />
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Daraz Store</label>
          </div>
          <Select value={selectedDarazStore} onValueChange={(val) => { setSelectedDarazStore(val); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-9 text-xs w-full focus:ring-0 focus-visible:ring-0">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent className="dark:border-border">
              <SelectItem value="all">All Stores</SelectItem>
              {darazStores.map(ds => (
                <SelectItem key={ds.id} value={ds.id.toString()}>{ds.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Payment Filter */}
        <div className="space-y-1.5 focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 text-blue-600" />
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Option</label>
          </div>
          <Select value={selectedPaymentOption} onValueChange={(val) => { setSelectedPaymentOption(val); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-9 text-xs w-full focus:ring-0 focus-visible:ring-0">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent className="dark:border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="credit">Credit / Card</SelectItem>
              <SelectItem value="cash">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5 focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
          </div>
          <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPagination(p => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-9 text-xs w-full focus:ring-0 focus-visible:ring-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="dark:border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const handleViewDetails = async (sale) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${sale.id}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const rs = await res.json();
      if (rs.status === 'success') {
        setSelectedSaleDetail(rs.data);
        setIsDetailOpen(true);
      }
    } catch (e) {
      console.error("Failed to fetch sale details", e);
    }
  };

  // --- ACTIONS ---
  const handleMarkPaid = (sale) => {
    if (sale.payment_status === "paid") return;
    setSettlingSale(sale);
    setReceivedAmount(sale.payable_amount);
    setPaymentMethod("Bank Transfer");
    setSettleModalOpen(true);
  };
  
  const handleSettleSubmit = async () => {
    if (!settlingSale) return;
    setSettling(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${settlingSale.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(receivedAmount),
          payment_method: paymentMethod,
          notes: 'Settled via Daraz Orders panel'
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success("Daraz order settled successfully!");
        setSettleModalOpen(false);
        fetchDarazOrders(); // Reload list
      } else {
        toast.error(data.message || "Failed to settle order.");
      }
    } catch (e) {
      toast.error("Network error while settling order.");
    } finally {
      setSettling(false);
    }
  };

  const handleCancelOrder = async (saleId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This will restock the inventory.")) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${saleId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success("Daraz order cancelled and stock reverted.");
        fetchDarazOrders(); // Reload list
      } else {
        toast.error(data.message || "Failed to cancel order.");
      }
    } catch (e) {
      toast.error("Network error while cancelling order.");
    }
  };

  // --- COLUMNS ---
  const columns = useMemo(() => [
    {
      accessorKey: "invoice_number",
      header: "Invoice No",
      cell: ({ row }) => <span className="text-sm font-semibold">{row.getValue("invoice_number")}</span>
    },
    {
      accessorKey: "order_id", // Fake attribute mapped for Daraz Order NO
      header: "Order No",
      cell: ({ row }) => <span className="text-sm">{row.original.ecommerce_order_id || 'N/A'}</span>
    },
    {
      accessorKey: "parcel_barcode",
      header: "Parcel Barcode",
      cell: ({ row }) => <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.original.parcel_barcode || 'N/A'}</span>
    },
    {
      accessorKey: "daraz_store_name",
      header: "Daraz Store Name",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("daraz_store_name")}</span>
    },
    {
      accessorKey: "payable_amount",
      header: () => <div className="text-right">Product Total</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums text-foreground">
          {formatCurrency(row.getValue("payable_amount") - (row.original.delivery_fees || 0))}
        </div>
      )
    },
    {
      accessorKey: "delivery_fees",
      header: () => <div className="text-right">Delivery Fees</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm tabular-nums text-foreground">
          {formatCurrency(row.getValue("delivery_fees"))}
        </div>
      )
    },
    {
      id: "grand_total",
      header: () => <div className="text-right font-bold">Grand Total</div>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-bold tabular-nums text-emerald-700">
          {formatCurrency(row.getValue("payable_amount"))}
        </div>
      )
    },
    {
      accessorKey: "received_amount",
      header: () => <div className="text-right">Received Amount</div>,
      cell: ({ row }) => {
        const paid = parseFloat(row.original.paid_amount || 0);
        const payable = parseFloat(row.original.payable_amount || 0);
        const isCancelled = row.original.status === "cancelled";
        const isDaraz = (row.original.source || "daraz") === "daraz";
        const paymentStatus = String(row.original.payment_status || "").toLowerCase();

        const items = Array.isArray(row.original.items) ? row.original.items : [];
        const deliveryFees = parseFloat(row.original.delivery_fees || 0);
        const netProductRevenue = Math.max(0, paid - deliveryFees); // use cash received for paid sales
        const totalCost = items.reduce((sum, item) => {
          const qty = parseFloat(item?.quantity || 0);
          const unitCost = parseFloat(item?.batch?.cost_price ?? item?.variant?.cost_price ?? 0);
          return sum + qty * unitCost;
        }, 0);

        const profit = netProductRevenue - totalCost;
        const label = profit > 0 ? "Profit" : profit < 0 ? "Loss" : "P/L";
        const plClass =
          profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-500" : "text-muted-foreground";

        const showProfit = isDaraz && !isCancelled && paymentStatus === "paid";
        return (
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(paid)}</div>
            {showProfit && payable > 0 && (
              <div className={`text-xs font-semibold tabular-nums mt-1 ${plClass}`}>
                {profit > 0
                  ? `${label}: +${formatCurrency(profit)}`
                  : profit < 0
                    ? `${label}: ${formatCurrency(profit)}`
                    : `${label}: ${formatCurrency(0)}`}
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "payment_method",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const isCancelled = row.original.status === 'cancelled';
        const displayValue = isCancelled ? "cancelled" : (row.getValue("payment_method") || "N/A");
        
        return (
          <div className="flex justify-center text-xs">
            <StatusBadge value={displayValue} />
          </div>
        )
      }
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => <span className="text-sm whitespace-nowrap">{format(new Date(row.getValue("created_at")), "yyyy-MM-dd")}</span>
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          <Button 
            onClick={() => handleViewDetails(row.original)}
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    },
    {
      id: "confirmation",
      header: "Confirmation",
      cell: ({ row }) => {
        const isPaid = row.original.payment_status === "paid";
        const isCancelled = row.original.status === 'cancelled';
        if (isPaid) return null;
        return (
          <div className="flex flex-col gap-1.5 w-[120px]">
            <Button
               disabled={isCancelled}
               onClick={() => handleMarkPaid(row.original)} 
               size="sm" 
               className={
                 isCancelled
                   ? "h-7 rounded-md text-[11px] bg-muted/40 text-muted-foreground border border-border/60 cursor-not-allowed"
                   : isPaid
                     ? "h-7 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                     : "h-7 rounded-md text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 border border-emerald-200/60 dark:border-emerald-500/20"
               }
            >
               {isPaid ? "Paid" : "Mark Paid"}
            </Button>
            <Button
               disabled={isCancelled}
               onClick={() => handleCancelOrder(row.original.id)}
               size="sm" 
               className={
                 isCancelled
                   ? "h-7 rounded-md text-[11px] bg-muted/40 text-muted-foreground border border-border/60 cursor-not-allowed"
                   : "h-7 rounded-md text-[11px] font-semibold bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/70 dark:border-red-500/30"
               }
            >
               {isCancelled ? "Cancelled" : "Cancel Order"}
            </Button>
          </div>
        )
      }
    }
  ], [formatCurrency]);

  const stats = useMemo(() => {
    const totalRev = data.reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);
    const todaySalesData = data.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
    const todayRev = todaySalesData.reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);
    const todayCash = todaySalesData.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);
    const todayCredit = todaySalesData.filter(s => s.payment_method === 'credit').reduce((sum, s) => sum + parseFloat(s.payable_amount || 0), 0);

    return [
      { label: "Total Orders", value: pagination.total, icon: ShoppingCart, gradient: "from-blue-500 to-indigo-400" },
      { label: "Today's Orders", value: todaySalesData.length, icon: CalendarIcon, gradient: "from-violet-500 to-purple-400" },
      { label: "Total Profit", value: formatCurrency(totalRev), icon: TrendingUp, gradient: "from-emerald-500 to-teal-400" },
      { label: "Today's Cash", value: formatCurrency(todayCash), icon: Banknote, gradient: "from-amber-500 to-orange-400" },
      { label: "Today's Credit", value: formatCurrency(todayCredit), icon: CreditCard, gradient: "from-pink-500 to-rose-400" },
    ];
  }, [data, pagination.total, formatCurrency]);

  const statCards = useMemo(() => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((card, idx) => (
        <div key={idx} className="bg-card rounded-xl p-5 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className={`p-2.5 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-4 h-4 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-lg font-bold text-foreground leading-tight mt-0.5">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  ), [stats]);

  return (
    <>
      <ResourceManagementLayout
        data={data}
        columns={columns}
        isLoading={loading}
        headerTitle={
          <div className="flex flex-1 items-center gap-4">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20 mt-1 self-start">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Daraz Orders Overview</h1>
              <p className="text-muted-foreground text-[13px] mt-0.5">Comprehensive tracking and metrics for Daraz sales</p>
            </div>
          </div>
        }
        statCardsComponent={statCards}
        searchPlaceholder="Search by Order No or Invoice..."
        searchColumn="searchText"
        onSearchChange={handleSearchChange}
        exportFileName="Daraz_Orders_Report"
        isFiltered={searchQuery !== ""}
        onClearFilters={handleClearFilters}
        pageCount={pagination.pages}
        paginationState={{
          pageIndex: pagination.page - 1,
          pageSize: pagination.limit
        }}
        onPaginationChange={null} // Natively fallback to client side until backend implemented
        filterComponents={filterComponents}
        storageKey="daraz-orders-table-columns"
      />

      {/* Settle Modal */}
      <Dialog open={settleModalOpen} onOpenChange={setSettleModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">Settle Daraz Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-sm">Order Number</Label>
              <div className="text-lg font-bold text-foreground">
                {settlingSale?.ecommerce_order_id || 'N/A'}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-sm">Payable Amount</Label>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(settlingSale?.payable_amount)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="receivedAmount" className="text-muted-foreground">
                  Received Amount (Rs)
                </Label>
                <Input
                  id="receivedAmount"
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="h-11 text-base font-semibold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online / Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSettleSubmit} disabled={settling} className="bg-orange-600 hover:bg-orange-700 text-white">
              {settling ? "Processing..." : "Settle Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SaleDetailSheet
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        sale={selectedSaleDetail}
      />
    </>
  );
}
