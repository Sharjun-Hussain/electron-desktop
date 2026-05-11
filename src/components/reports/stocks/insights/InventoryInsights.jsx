"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Package,
  TrendingUp,
  Clock,
  Zap,
  ArrowUpRight,
  TrendingDown,
  AlertCircle,
  Activity,
  History,
  Scale,
  MapPin,
  RefreshCw,
  LayoutGrid,
  PieChart as PieIcon,
  ShoppingBag,
  BarChart3
} from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InventoryInsights() {
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branch, setBranch] = useState("all");
  const [branches, setBranches] = useState([]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/stocks/insights?branch_id=${branch}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data);
      }
    } catch (err) {
      toast.error("Failed to load stock reports");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === 'success') setBranches(result.data || []);
    } catch (err) { }
  };

  useEffect(() => {
    fetchBranches();
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [session, branch]);

  const agingData = useMemo(() => {
    if (!data?.agingDistribution) return [];
    return Object.entries(data.agingDistribution).map(([key, value]) => ({
      name: key.replace("_", " ").replace("days", ""),
      value: value,
    }));
  }, [data]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (isLoading && !data) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 md:p-8 space-y-8 font-sans transition-all duration-500 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-xl border border-border shadow-xs relative">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Stock Performance Insights</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyze inventory valuation, turnover, and performance ROI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="w-[220px] h-10 border-border bg-background shadow-none">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-lg">
              <SelectItem value="all">Aggregated View</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData} className="h-10 w-10 border-border">
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Inventory Valuation",
            value: formatCurrency(data?.summary?.totalStockValue || 0),
            icon: Scale,
            gradient: "from-indigo-600 to-indigo-400",
            sub: "Total Capital Asset"
          },
          {
            label: "Turnover Ratio",
            value: `${data?.summary?.inventoryTurnover || 0} / mo`,
            icon: Zap,
            gradient: "from-emerald-600 to-emerald-400",
            sub: "Sales Velocity"
          },
          {
            label: "Monthly COGS",
            value: formatCurrency(data?.summary?.monthlyCogs || 0),
            icon: ShoppingBag,
            gradient: "from-blue-600 to-blue-400",
            sub: "Recirculation Rate"
          },
          {
            label: "Potential Profit",
            value: formatCurrency(data?.summary?.potentialProfit || 0),
            icon: TrendingUp,
            gradient: "from-amber-600 to-amber-400",
            sub: "Retail Projection"
          }
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-100 dark:border-slate-800 shadow-xs flex items-center gap-4 transition-all hover:shadow-md group">
            <div className={cn("p-3 rounded-lg bg-gradient-to-br text-white shadow-sm ring-4 ring-offset-0 transition-all group-hover:ring-offset-2",
              idx === 0 ? "from-indigo-600 to-indigo-400 ring-indigo-500/10" :
                idx === 1 ? "from-emerald-600 to-emerald-400 ring-emerald-500/10" :
                  idx === 2 ? "from-blue-600 to-blue-400 ring-blue-500/10" : "from-amber-600 to-amber-400 ring-amber-500/10"
            )}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">{card.label}</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums truncate tracking-tight">{card.value}</h3>
              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Aging Analysis */}
        <Card className="rounded-[2.5rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Clock className="size-5 text-slate-900 dark:text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Stock Aging Analysis</h3>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-1 bg-gray-50/50">Valuation Breakdown</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(val) => [formatCurrency(val), 'Value']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-50 dark:border-slate-800">
            {agingData.map((d, i) => (
              <div key={d.name} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }} /> {d.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top ROI Performers */}
        <Card className="rounded-[2.5rem] border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Top Performance ROI</h3>
            </div>
            <div className="flex items-center gap-2">
              <History className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last 30 Days</span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-slate-800/30 rounded-xl overflow-hidden">
                <TableRow className="border-none font-sans">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-4 h-10">Asset Identification</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-10 text-right">Sold</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-10 text-right">Profit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground h-10 text-center">ROI %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.topPerformers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center text-muted-foreground italic font-medium">No performance data available for this range.</TableCell>
                  </TableRow>
                ) : data?.topPerformers?.map((p, i) => (
                  <TableRow key={i} className="border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 group h-14">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={getImageUrl(p.image)}
                            alt={p.name}
                            className="size-8 rounded-lg object-cover bg-gray-50 border border-gray-100 shadow-xs"
                          />
                        ) : (
                          <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </div>
                        )}
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-[12px] tabular-nums text-slate-900 dark:text-white">{p.soldQty}</TableCell>
                    <TableCell className="text-right font-bold text-[12px] tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(p.profit)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-bold text-[10px] tracking-tight hover:scale-105 transition-transform">
                        {p.roi.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ── Operational Insights Footer ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-5 group">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
            <AlertCircle className="size-6" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Aging Warning</h4>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {formatCurrency(data?.agingDistribution?.['90+_days'] || 0)}
              <span className="text-xs text-muted-foreground ml-1.5 font-medium tracking-normal">locked in  90 day stock</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-5 group">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
            <TrendingUp className="size-6" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active Velocity</h4>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
              {((data?.summary?.inventoryTurnover || 0) * 100).toFixed(0)}%
              <span className="text-xs text-muted-foreground ml-1.5 font-medium tracking-normal">Monthly inventory turnover rate</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-5 group">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
            <LayoutGrid className="size-6" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">ROI Distribution</h4>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight underline decoration-indigo-500 decoration-2 underline-offset-4">
              Top 10 items
              <span className="text-xs text-muted-foreground ml-1.5 font-medium tracking-normal">driving primary profitability</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
