"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import axios from "axios";
import { TrendingUp, PieChart as PieIcon, Loader2, ChevronDown } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardCharts() {
  const { data: session } = useSession();
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchCharts = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/dashboard/charts?days=${days}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        if (res.data.status === "success") {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Dashboard Charts Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharts();
  }, [session, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-card rounded-xl border border-border">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Trend Area Chart */}
      <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-xs">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Revenue Trend</h3>
              <p className="text-[11px] text-muted-foreground font-medium">Last {days} days performance</p>
            </div>
          </div>
          <div className="relative inline-flex items-center">
            <select 
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
              className="appearance-none text-xs font-medium bg-background border border-border rounded-lg pl-3 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-foreground shadow-sm hover:bg-muted/50"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueHistory || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600 }}
                tickFormatter={(val) => formatCurrency(val, { compact: true })}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                }}
                formatter={(value) => [formatCurrency(value), "Revenue"]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Mix Pie Chart */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-xs">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <PieIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Category Mix</h3>
            <p className="text-[11px] text-muted-foreground font-medium">Top 5 revenue drivers</p>
          </div>
        </div>

        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.categoryMix || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {(data?.categoryMix || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
