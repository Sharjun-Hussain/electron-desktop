"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar as CalendarIcon,
  Download,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  FileText,
  Store,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Wallet,
  Scale,
  Activity,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { DataActions } from "@/components/general/DataActions";

export default function ProfitLossReportPage() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();

  // --- STATES ---
  const [date, setDate] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branchId, setBranchId] = useState("all");
  const [branches, setBranches] = useState([]);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  const fetchBranches = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await response.json();
      if (result.status === 'success') {
        setBranches(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch branches", err);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
        branch_id: branchId
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/profit-loss?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch profit loss data");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profit loss data");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, date, branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- EXPORT LOGIC ---
  const exportData = useMemo(() => {
    if (!data) return [];
    return [
      { Metric: "Total Revenue", Value: data.revenue },
      { Metric: "Cost of Goods Sold (COGS)", Value: data.cogs },
      { Metric: "Gross Profit", Value: data.grossProfit },
      { Metric: "Total Operating Expenses", Value: data.expenses },
      { Metric: "Net Profit", Value: data.netProfit },
      { Metric: "Net Margin (%)", Value: data.margin },
    ];
  }, [data]);

  // --- CHART DATA ---
  const chartData = data ? [
    { name: 'Cost of Sales', value: data.cogs, color: '#f59e0b' },
    { name: 'Operating Expenses', value: data.expenses, color: '#ef4444' },
    { name: 'Net Yield', value: Math.max(0, data.netProfit), color: '#10b981' },
  ].filter(item => item.value > 0) : [];

  const MetricItem = ({ label, value, color, tooltip, icon: Icon, isBold = false }) => (
    <div className={cn(
      "flex items-center justify-between py-4 border-b border-border last:border-0 group transition-all px-3 rounded-md hover:bg-muted/50",
      isBold && "bg-muted/50 my-2 py-5 border-none"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn("p-2.5 rounded-md shrink-0", color.replace('bg-', 'bg-') + "/[0.15]", color.replace('bg-', 'text-'))}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium text-muted-foreground", isBold && "text-foreground font-bold")}>{label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help"><Info className="h-3.5 w-3.5 text-muted-foreground opacity-60" /></div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-xs font-semibold leading-relaxed p-3 rounded-lg border-border bg-card shadow-xl text-foreground" side="right">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs font-medium text-muted-foreground italic">Financial Categorical Ledger</span>
        </div>
      </div>
      <div className="text-right tabular-nums">
        <span className={cn(
          "font-semibold tracking-tight",
          isBold ? "text-lg text-foreground" : "text-sm text-foreground"
        )}>
          {formatCurrency(value || 0)}
        </span>
      </div>
    </div>
  );

  const statsCards = [
    {
      label: "Aggregate Gross Sales",
      val: isLoading ? null : formatCurrency(data?.revenue || 0),
      desc: "Total revenue generation",
      icon: Wallet,
      gradient: "from-blue-500 to-indigo-400",
    },
    {
      label: "Operational Gross Margin",
      val: isLoading ? null : formatCurrency(data?.grossProfit || 0),
      desc: "Revenue minus direct costs",
      icon: BarChart3,
      gradient: "from-amber-500 to-orange-400",
    },
    {
      label: "Net Fiscal Yield",
      val: isLoading ? null : formatCurrency(data?.netProfit || 0),
      desc: "Final retained earnings",
      icon: (data?.netProfit >= 0 || isLoading) ? TrendingUp : TrendingDown,
      gradient: (data?.netProfit >= 0 || isLoading) ? "from-emerald-500 to-teal-400" : "from-rose-500 to-red-400",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">

      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Scale className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Statements of Profit and Loss</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Audited fiscal overview of revenue generation and operational outflows</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions
              data={exportData}
              fileName="Profit_Loss_Report"
              onPrint={() => window.print()}
            />
            <Button
              onClick={() => window.print()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Activity className="h-4 w-4" /> Generate Statement
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Embedded Filters and Dashboards Wrapper */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          {/* Main Filters Top Header Bar */}
          <div className="bg-card border-b border-border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-emerald-600" /> Reporting Period
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-500/5 hover:border-emerald-500/20 p-2">
                      <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="truncate">
                        {date?.from ? (date.to ? <>{format(date.from, "LLL dd")} - {format(date.to, "LLL dd, yyyy")}</> : format(date.from, "LLL dd, yyyy")) : <span>Select horizon</span>}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-md border-border bg-card shadow-xl" align="start">
                    <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="w-full space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="size-3.5 text-emerald-600" /> Administrative Entity
                </label>
                <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 rounded-md border-border text-sm font-normal hover:bg-emerald-500/5 hover:border-emerald-500/20 p-2">
                      <span className="truncate">{branchId === "all" ? "Whole Organization" : branches.find((b) => String(b.id) === String(branchId))?.name}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-md shadow-lg border-border bg-card" align="start">
                    <Command>
                      <CommandInput placeholder="Search administrative units..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No entity found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { setBranchId("all"); setIsBranchOpen(false) }} className="cursor-pointer">
                            <Check className={cn("mr-2 h-4 w-4 text-emerald-600", branchId === "all" ? "opacity-100" : "opacity-0")} />
                            Whole Organization
                          </CommandItem>
                          {branches.map((b) => (
                            <CommandItem key={b.id} onSelect={() => { setBranchId(b.id); setIsBranchOpen(false) }} className="cursor-pointer">
                              <Check className={cn("mr-2 h-4 w-4 text-emerald-600", String(branchId) === String(b.id) ? "opacity-100" : "opacity-0")} />
                              {b.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-start">
                <Button variant="outline" onClick={() => fetchData()} className="h-9 w-9 p-0 rounded-md border-border hover:border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 shadow-sm" disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="p-6 bg-muted/20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Financial Recapitulation Statement */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border border-border shadow-sm bg-card rounded-lg overflow-hidden h-full">
                  <CardHeader className="pb-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                          <Activity className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">Audited Financial Statement</h3>
                          <p className="text-xs font-medium text-muted-foreground">Detailed Categorical Recapitulation Ledger</p>
                        </div>
                      </div>
                      {!isLoading && (
                        <Badge variant="outline" className={cn(
                          "px-2 py-1 text-[10px] font-semibold border-none shadow-none rounded-md",
                          (data?.netProfit || 0) >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>
                          {(data?.netProfit || 0) >= 0 ? 'Surplus Equilibrium' : 'Fiscal Deficit Warning'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-md bg-muted opacity-40" />)}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <MetricItem
                          label="Aggregate Gross Sales"
                          value={data?.revenue}
                          color="bg-emerald-500"
                          icon={ArrowUpRight}
                          tooltip="Cumulative income generated from all verified retail and commercial channels within the reporting segment."
                        />
                        <MetricItem
                          label="Inventory Cost Basis (COGS)"
                          value={data?.cogs}
                          color="bg-amber-500"
                          icon={TrendingDown}
                          tooltip="Direct procurement cost of inventory correlated to units sold. Includes manufacturer landing price."
                        />

                        <MetricItem
                          label="Operational Merchant Margin"
                          value={data?.grossProfit}
                          color="bg-blue-500"
                          icon={DollarSign}
                          isBold
                          tooltip="Fiscal surplus remaining after inventory cost deduction, prior to fixed administrative overhead allocation."
                        />

                        <MetricItem
                          label="Secondary Operational Outflows"
                          value={data?.expenses}
                          color="bg-rose-500"
                          icon={ArrowDownRight}
                          tooltip="Combined secondary costs including human capital, utilities, rent, and miscellaneous administrative outlays."
                        />

                        <div className="mt-8 pt-6 border-t border-border">
                          <div className="flex justify-between items-end mb-2 px-1">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 italic">Fiscal Efficiency Index</p>
                              <p className="text-xl font-bold text-foreground tabular-nums tracking-tight">{(data?.margin || 0).toFixed(2)}% <span className="text-xs font-semibold text-muted-foreground uppercase ml-1">NET MARGIN YIELD</span></p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm border",
                                (data?.margin || 0) > 15 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              )}>
                                {(data?.margin || 0) > 15 ? 'High Capital Efficiency' : 'Resource Optimization Required'}
                              </span>
                            </div>
                          </div>
                          <Progress value={Math.max(0, Math.min(100, data?.margin || 0))} className="h-2 rounded-full bg-muted [&>div]:bg-emerald-500" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Visual Fiscal Distribution */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="border border-border shadow-sm bg-card rounded-lg overflow-hidden flex flex-col min-h-[420px]">
                  <CardHeader className="pb-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <PieChartIcon className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Yield Attribution Visualizer</h3>
                        <p className="text-xs font-medium text-muted-foreground">Recapitulation of Operational Outflows</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col justify-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-64 w-64 rounded-full bg-muted opacity-40 animate-pulse" />
                      </div>
                    ) : chartData.length > 0 ? (
                      <div className="w-full flex flex-col items-center">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={8}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" className="hover:opacity-85 transition-opacity cursor-crosshair" />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'hsl(var(--foreground))'
                              }}
                              itemStyle={{ padding: '2px 0' }}
                              formatter={(value) => formatCurrency(value)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
                          {chartData.map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-tight">{item.name}</span>
                              <span className="text-xs font-semibold text-foreground tabular-nums">
                                {((item.value / (data?.revenue || 1)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 opacity-30 py-20 text-center text-muted-foreground">
                        <PieChartIcon className="h-14 w-14" />
                        <h4 className="text-xs font-bold uppercase tracking-widest">Zero Categorical Movement</h4>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-none bg-emerald-500/5 border-emerald-500/10 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                        <Info className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Audited Integrity Disclosure</h4>
                        <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                          Calculated metrics derived from real-time sales aggregation. Final audited accuracy may fluctuate based on inventory variances or miscellaneous administrative adjustments.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
