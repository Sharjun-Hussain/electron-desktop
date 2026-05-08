"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DataActions } from "@/components/general/DataActions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  RotateCcw,
  FileText,
  Plus,
  User,
  Check,
  ChevronsUpDown,
  History,
  Wallet,
  Building2,
  CreditCard,
  ShieldCheck,
  Zap,
  Activity,
  Download,
  TrendingDown,
  X,
  Calendar as CalendarIcon,
  HelpCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CustomerLedgersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0); // Debits (Invoiced)
  const [totalPaid, setTotalPaid] = useState(0); // Credits (Paid)
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [startDate, setStartDate] = useState(
    format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      "yyyy-MM-dd",
    ),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [chequeDetails, setChequeDetails] = useState({
    bank_name: "",
    cheque_number: "",
    cheque_date: format(new Date(), "yyyy-MM-dd"),
    payee_payor_name: "",
  });

  useEffect(() => {
    if (session?.accessToken) {
      fetchCustomers();
    }
  }, [session?.accessToken]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        },
      );
      setCustomers(response.data.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchLedger = useCallback(
    async (customerId) => {
      if (!customerId) return;
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${customerId}/ledger`,
          {
            params: { start_date: startDate, end_date: endDate },
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        );
        setLedger(response.data.data.ledger);
        setBalance(response.data.data.current_balance);

        // Calculate totals
        let owed = 0;
        let paid = 0;
        response.data.data.ledger.forEach((item) => {
          if (item.type === "debit") owed += parseFloat(item.amount);
          else if (item.type === "credit") paid += parseFloat(item.amount);
        });
        setTotalOwed(owed);
        setTotalPaid(paid);
      } catch (error) {
        console.error("Error fetching ledger:", error);
        toast.error("Failed to fetch ledger");
      } finally {
        setLoading(false);
      }
    },
    [session?.accessToken, startDate, endDate],
  );

  const chartData = useMemo(() => {
    if (!ledger || ledger.length === 0) return [];

    const sorted = [...ledger].sort(
      (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date),
    );
    let runningBalance = 0;

    return sorted.map((item) => {
      const amount = parseFloat(item.amount);
      if (item.type === "debit")
        runningBalance += amount; // Invoicing increases owed balance
      else runningBalance -= amount; // Payment decreases owed balance

      return {
        date: format(new Date(item.transaction_date), "MMM dd"),
        balance: runningBalance,
        amount: amount,
        type: item.type,
      };
    });
  }, [ledger]);

  const stats = useMemo(() => {
    const collectionRatio = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;
    return {
      collectionRatio: collectionRatio.toFixed(1),
      health:
        collectionRatio > 80
          ? "Healthy"
          : collectionRatio > 50
            ? "Stable"
            : "Critical",
    };
  }, [totalOwed, totalPaid]);

  // Clear payment state on close
  useEffect(() => {
    if (!paymentOpen) {
      setPaymentAmount(0);
    } else {
      setPaymentAmount(Math.abs(balance));
    }
  }, [paymentOpen, balance]);

  const handlePaymentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const amount = parseFloat(formData.get("amount"));

      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const payload = {
        amount,
        payment_method: paymentMethod,
        description: formData.get("description"),
        transaction_date: new Date().toISOString(),
        cheque_details: paymentMethod === "cheque" ? chequeDetails : null,
      };

      try {
        setPaymentLoading(true);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${selectedCustomer}/payments`,
          payload,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );
        if (response.data.status === "success" || response.status === 201) {
          toast.success("Payment recorded successfully");
          setPaymentOpen(false);
          fetchLedger(selectedCustomer);
        }
      } catch (error) {
        console.error("Error recording payment:", error);
        toast.error(
          error.response?.data?.message || "Failed to record payment",
        );
      } finally {
        setPaymentLoading(false);
      }
    },
    [
      paymentMethod,
      chequeDetails,
      selectedCustomer,
      session?.accessToken,
      fetchLedger,
    ],
  );

  const exportData = useMemo(() => {
    if (!ledger || ledger.length === 0) return [];
    return ledger.map((item) => ({
      "Transaction Date": format(new Date(item.transaction_date), "dd MMM yyyy"),
      Reference: item.reference_type,
      Description: item.description,
      "Debit (Invoiced)": item.type === "debit" ? parseFloat(item.amount) : 0,
      "Credit (Paid)": item.type === "credit" ? parseFloat(item.amount) : 0,
      Balance: parseFloat(item.balance),
    }));
  }, [ledger]);

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen bg-transparent">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Customer Ledger</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyze receivables, collection history and credit performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataActions 
            data={exportData} 
            fileName={`Customer_Ledger_${customers.find((c) => String(c.id) === selectedCustomer)?.name?.replace(/\s+/g, "_") || "Export"}`} 
          />
          <Button className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 rounded-md shadow-sm" onClick={() => fetchLedger(selectedCustomer)} disabled={!selectedCustomer || loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Sync
          </Button>
        </div>
      </div>

      {/* Ledger Filter Workspace */}
      <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-sm">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            {/* Customer Selector */}
            <div className="flex-[2] space-y-1.5 w-full">
              <Label className="text-sm font-medium text-muted-foreground">Select Customer</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-9 justify-between bg-background border-border shadow-sm font-normal"
                  >
                    <div className="flex items-center gap-2 truncate text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      {selectedCustomer
                        ? customers.find(
                          (c) => String(c.id) === selectedCustomer,
                        )?.name
                        : "Search by Name or Phone..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 shadow-md" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." className="h-9" />
                    <CommandList className="max-h-[250px]">
                      <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.phone}`}
                            onSelect={() => { setSelectedCustomer(String(c.id)); fetchLedger(String(c.id)); setOpen(false); }}
                            className="py-2 px-3 flex items-center justify-between cursor-pointer text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.phone || "No phone recorded"}</span>
                            </div>
                            <Check className={cn("h-4 w-4 text-emerald-500", selectedCustomer === String(c.id) ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Filters */}
            <div className="flex-1 space-y-1.5 w-full text-left">
              <Label className="text-sm font-medium text-muted-foreground">Date From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal bg-background border-border shadow-sm",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {startDate ? format(parseISO(startDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate ? parseISO(startDate) : undefined}
                    onSelect={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 space-y-1.5 w-full text-left">
              <Label className="text-sm font-medium text-muted-foreground">Date To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal bg-background border-border shadow-sm",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {endDate ? format(parseISO(endDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate ? parseISO(endDate) : undefined}
                    onSelect={(date) => setEndDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCustomer && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* High-Impact Trend Chart */}
            <Card className="lg:col-span-3 border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl relative">
              <CardHeader className="p-5 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Receivable Dynamics
                      </p>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      Receivable Trend
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      Daily running balance for{" "}
                      {
                        customers.find((c) => String(c.id) === selectedCustomer)
                          ?.name
                      }
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-right">
                      <p className="text-xs font-medium text-emerald-600 mb-0.5">
                        Projected Outstanding
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        LKR {balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="h-[300px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorReceivable"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="currentColor"
                        opacity={0.05}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "currentColor",
                          opacity: 0.4,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "currentColor",
                          opacity: 0.4,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                        tickFormatter={(v) =>
                          `LKR ${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                        }
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border p-3 rounded-md shadow-md">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  {payload[0].payload.date}
                                </p>
                                <p className="text-sm font-bold text-emerald-600">
                                  LKR {payload[0].value.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReceivable)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Secondary KPI Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-md bg-muted/30 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Collection Ratio
                    </p>
                    <p className="text-lg font-bold">
                      {stats.collectionRatio}%
                    </p>
                  </div>
                  <div className="p-4 rounded-md bg-muted/30 border border-border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Total Collected
                    </p>
                    <p className="text-lg font-bold">
                      LKR {totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Side Action Column */}
            <div className="flex flex-col gap-6">
              {/* Settlement Status Card */}
              <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl relative">
                <CardContent className="p-5 space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Receivable Health
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          stats.health === "Healthy"
                            ? "bg-emerald-500"
                            : stats.health === "Stable"
                              ? "bg-amber-500"
                              : "bg-red-500",
                        )}
                      />
                      <p className="text-xl font-bold text-foreground">
                        {stats.health}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-md bg-muted/30 border border-border">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Invoiced
                      </p>
                      <p className="text-lg font-bold">
                        LKR {totalOwed.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => setPaymentOpen(true)}
                      className="w-full h-10 font-semibold shadow-sm"
                    >
                      Record Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Sidebar */}
              <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <History className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Receivable Audit</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      REF ID: CUST-{selectedCustomer}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 pt-3 border-t border-border/50">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-muted-foreground">
                        Collection Velocity
                      </span>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 border-none hover:text-emerald-500 transition-colors cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px] p-3 shadow-2xl border border-border/80 bg-popover text-popover-foreground animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                            <p className="text-[12px] leading-relaxed font-medium">
                              Measures the speed at which receivables are converted into cash from this customer. 
                              High velocity indicates efficient debt recovery and strong liquidity.
                            </p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        stats.health === "Healthy" ? "bg-emerald-500" : 
                        stats.health === "Stable" ? "bg-amber-500" : "bg-red-500"
                      )} 
                      style={{ width: `${stats.collectionRatio}%` }} 
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Ledger History Table */}
          <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-xl relative">
            <CardHeader className="p-5 border-b border-border/50 bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-bold text-foreground">
                    Financial Timeline
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Transaction audit & verification
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <DataActions 
                    data={exportData} 
                    fileName={`Customer_Ledger_${customers.find((c) => String(c.id) === selectedCustomer)?.name?.replace(/\s+/g, "_") || "Export"}`} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3 px-6">
                      Transaction Date
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3 px-4">
                      Reference
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3 px-4 text-right">
                      Debit (Invoiced)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3 px-4 text-right">
                      Credit (Paid)
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 py-3 px-6 text-right">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Synchronizing financial ledger...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : ledger.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No transactions found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.map((item, idx) => (
                      <TableRow
                        key={idx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="py-3 px-6 text-sm text-muted-foreground">
                          {format(
                            new Date(item.transaction_date),
                            "dd MMM yyyy",
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground capitalize">
                              {item.reference_type}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-medium text-sm text-amber-600 tabular-nums">
                          {item.type === "debit"
                            ? `LKR ${parseFloat(item.amount).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-medium text-sm text-emerald-600 tabular-nums">
                          {item.type === "credit"
                            ? `LKR ${parseFloat(item.amount).toLocaleString()}`
                            : "—"}
                        </TableCell>
                        <TableCell className="py-3 px-6 text-right font-bold text-sm text-foreground tabular-nums">
                          LKR {parseFloat(item.balance).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Sheet */}
      <Sheet open={paymentOpen} onOpenChange={setPaymentOpen}>
        <SheetContent
          side="right"
          className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl"
        >
          <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                    <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <SheetTitle className="text-xl font-bold text-foreground">
                    Record Payment
                  </SheetTitle>
                </div>
                <SheetDescription className="text-sm text-muted-foreground mt-2">
                  Ledger adjustment for{" "}
                  {
                    customers.find((c) => String(c.id) === selectedCustomer)
                      ?.name
                  }
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form
            id="payment-form"
            onSubmit={handlePaymentSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="amount"
                    className="text-sm font-semibold text-foreground"
                  >
                    Settlement Scope (LKR)
                  </Label>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Outstanding: LKR {Math.abs(balance).toLocaleString()}
                  </Badge>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    LKR
                  </div>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(parseFloat(e.target.value) || 0)
                    }
                    className="h-10 pl-12 text-base font-bold shadow-sm"
                    required
                  />
                </div>

                {/* Shortcuts */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(Math.abs(balance))}
                    className="h-8 shadow-sm text-xs"
                  >
                    Full Scope
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(Math.abs(balance) / 2)}
                    className="h-8 shadow-sm text-xs"
                  >
                    50% Impact
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(0)}
                    className="h-8 shadow-sm text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Projection Banner */}
              <div className="p-4 rounded-md bg-muted border border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-0.5">
                    Projected Balance
                  </p>
                  <p className="text-lg font-bold text-foreground tracking-tight">
                    LKR {(Math.abs(balance) - paymentAmount).toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Custom Method Selector */}
              <div className="space-y-3">
                <Label
                  htmlFor="payment_method"
                  className="text-sm font-semibold text-foreground"
                >
                  Sourcing Channel
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", icon: Wallet, label: "Cash" },
                    { id: "bank", icon: Building2, label: "Bank" },
                    { id: "cheque", icon: CreditCard, label: "Cheque" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 rounded-md border transition-all",
                        paymentMethod === m.id
                          ? "bg-primary border-primary text-primary-foreground shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <m.icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cheque" && (
                <div className="grid gap-3 p-4 bg-muted/30 rounded-md border border-border">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-foreground">
                        Issuing Institution
                      </Label>
                      <Input
                        value={chequeDetails.bank_name}
                        onChange={(e) =>
                          setChequeDetails({
                            ...chequeDetails,
                            bank_name: e.target.value,
                          })
                        }
                        placeholder="Bank Name (e.g. BOC)"
                        className="h-9 shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">
                          Instrument #
                        </Label>
                        <Input
                          value={chequeDetails.cheque_number}
                          onChange={(e) =>
                            setChequeDetails({
                              ...chequeDetails,
                              cheque_number: e.target.value,
                            })
                          }
                          placeholder="CX-0000"
                          className="h-9 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-foreground">
                          Due Date
                        </Label>
                        <Input
                          type="date"
                          value={chequeDetails.cheque_date}
                          onChange={(e) =>
                            setChequeDetails({
                              ...chequeDetails,
                              cheque_date: e.target.value,
                            })
                          }
                          className="h-9 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-foreground"
                >
                  Operational Memo
                </Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Internal tracking notes..."
                  className="h-9 shadow-sm"
                />
              </div>
            </div>

            <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentOpen(false)}
                className="w-full sm:w-auto font-semibold shadow-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                form="payment-form"
                disabled={paymentLoading}
                className="w-full sm:w-auto min-w-[140px] font-semibold shadow-sm"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
