"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Package,
  Users,
  History,
  MoreHorizontal
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import axios from "axios";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/app/hooks/swr/useSettings";

// Helper for Number Animation
const AnimatedNumber = ({ value, isCurrency, formatCurrency, formatNumber, compact = true }) => {
  const spanRef = useRef(null);

  useGSAP(() => {
    const cleanValue = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
    const dummy = { val: 0 };

    gsap.to(dummy, {
      val: cleanValue,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        if (spanRef.current) {
          // If currency, use the hook, else use formatNumber
          spanRef.current.textContent = isCurrency
            ? formatCurrency(dummy.val, { compact })
            : formatNumber(dummy.val, { compact });
        }
      }
    });
  }, [value, compact]);

  return <span ref={spanRef}>0</span>;
};

export default function StatsGrid() {
  const { data: session } = useSession();
  const { formatCurrency, formatNumber } = useCurrency();
  const { useModularSettings } = useSettings();
  const { data: posSettings } = useModularSettings("pos");
  const settings = posSettings?.data || {};
  const router = useRouter();
  const containerRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/dashboard/summary`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        if (res.data.status === "success") {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Dashboard Stats Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  const stats = [
    {
      name: "Today Revenue",
      settingKey: "showWidgetRevenue",
      value: data?.todayRevenue?.value || 0,
      isCurrency: true,
      change: data?.todayRevenue?.change || "0%",
      trend: data?.todayRevenue?.trend || "up",
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-400",
      comparisonLabel: "vs Daily Avg",
      url: `/sales?from=${todayStr}&to=${todayStr}`
    },
    {
      name: "Today Sales",
      settingKey: "showWidgetTodaySales",
      value: data?.todaySales?.value || 0,
      isCurrency: false,
      change: "Transactions",
      trend: "stable",
      icon: TrendingUp,
      gradient: "from-cyan-500 to-blue-400",
      comparisonLabel: "Completed Today",
      url: `/sales?from=${todayStr}&to=${todayStr}`
    },
    {
      name: "Today Shifts",
      settingKey: "showWidgetTodayShifts",
      value: data?.todayShifts?.value || 0,
      isCurrency: false,
      change: "Shifts",
      trend: "stable",
      icon: Users,
      gradient: "from-violet-500 to-purple-400",
      comparisonLabel: "Opened Today",
      url: "/reports"
    },
    {
      name: "Pending Invoices",
      settingKey: "showWidgetInvoices",
      value: data?.pendingInvoices?.value || 0,
      isCurrency: false,
      change: data?.pendingInvoices?.change || "0%",
      trend: data?.pendingInvoices?.trend || "stable",
      icon: FileText,
      gradient: "from-blue-500 to-indigo-400",
      comparisonLabel: "of Active Files",
      url: "/sales"
    },
    {
      name: "Low Stock Items",
      settingKey: "showWidgetLowStock",
      value: data?.lowStockCount?.value || 0,
      isCurrency: false,
      change: data?.lowStockCount?.change || "0%",
      trend: data?.lowStockCount?.trend || "up",
      icon: Package,
      gradient: "from-amber-500 to-orange-400",
      comparisonLabel: "of Catalog",
      url: "/inventory-insights"
    },
    {
      name: "Expiring Soon",
      settingKey: "showWidgetExpiring",
      value: data?.expiringCount?.value || 0,
      isCurrency: false,
      change: data?.expiringCount?.change || "Alerts",
      trend: "stable",
      icon: History,
      gradient: "from-rose-500 to-pink-400",
      comparisonLabel: "Critical Batches",
      url: "/inventory-insights"
    },
    {
      name: "New Customers",
      settingKey: "showWidgetNewCustomers",
      value: data?.newCustomers?.value || 0,
      isCurrency: false,
      change: data?.newCustomers?.change || "0%",
      trend: data?.newCustomers?.trend || "up",
      icon: Users,
      gradient: "from-violet-500 to-purple-400",
      comparisonLabel: "Growth",
      url: "/customers"
    },
  ].filter(stat => settings[stat.settingKey] ?? true);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <div
          key={stat.name}
          id={
            stat.name === "Today Revenue" ? "stats-revenue" :
            stat.name === "Pending Invoices" ? "stats-invoices" :
            stat.name === "Low Stock Items" ? "stats-inventory" :
            stat.name === "Expiring Soon" ? "stats-expiring" :
            stat.name === "New Customers" ? "stats-customers" : undefined
          }
          onClick={() => stat.url && router.push(stat.url)}
          className={cn(
            "bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all duration-300 hover:shadow-md hover:border-emerald-500/30 group cursor-pointer",
            stat.name === "Expiring Soon" && stat.value > 0 && "border-rose-500/20 bg-rose-50/5"
          )}
        >
          <div className={cn(
            "p-3 rounded-lg bg-linear-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
            stat.gradient
          )}>
            <stat.icon className="w-5 h-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {stat.name}
            </p>
            <h3 className="text-2xl font-bold text-foreground tabular-nums">
              <AnimatedNumber
                value={stat.value}
                isCurrency={stat.isCurrency}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                compact={true}
              />
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}
