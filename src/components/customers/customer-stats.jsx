"use client";

import { Star, TrendingUp, Users, Activity } from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export function CustomerStats({ customers, totalTotal }) {
  const { formatCurrency, loyalty } = useAppSettings();
  const isLoyaltyEnabled = loyalty?.is_active ?? false;
  
  // Note: For server-side pagination, these ideally come from a summary API.
  // Using passed 'totalTotal' for the main count.
  const activeCustomers = (customers || []).filter((c) => c.is_active).length;
  const totalRevenue = (customers || []).reduce((sum, c) => sum + (parseFloat(c.totalSpent) || 0), 0);
  const vipCustomers = (customers || []).filter((c) => (c.loyaltyPoints || 0) >= 1000).length;

  const stats = [
    {
      label: "Total Base",
      value: totalTotal || customers?.length || 0,
      icon: Users,
      gradient: "from-emerald-500 to-teal-400"
    },
    {
      label: "Active Clients",
      value: activeCustomers,
      icon: Activity,
      gradient: "from-blue-500 to-indigo-400"
    },
    {
      label: "VIP Tier",
      value: vipCustomers,
      icon: Star,
      gradient: "from-amber-500 to-orange-400"
    },
    {
      label: "Lifetime Value",
      value: formatCurrency(totalRevenue || 0),
      icon: TrendingUp,
      gradient: "from-violet-500 to-purple-400"
    },
  ].filter(stat => stat.label !== "VIP Tier" || isLoyaltyEnabled);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((card, idx) => (
        <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className={`p-3 rounded-lg bg-linear-to-br ${card.gradient} text-white`}>
            <card.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col text-sm font-medium">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <h3 className="text-2xl font-bold text-foreground tabular-nums">{card.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
