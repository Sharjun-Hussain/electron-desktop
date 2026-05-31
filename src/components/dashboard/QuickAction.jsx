"use client";

import {
  ShoppingCart,
  TrendingUp,
  WifiOff,
  FileText,
  Package,
  Users,
  BarChart3,
  PieChart,
  Barcode,
  CreditCard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

const quickActions = [
  {
    id: "pos",
    name: "Point of Sale",
    icon: ShoppingCart,
    description: "New Sale",
    href: "/pos",
    color: "blue",
  },
  {
    id: "sales",
    name: "Sales",
    icon: TrendingUp,
    description: "View History",
    href: "/sales",
    color: "indigo",
  },
  {
    id: "offline-sync",
    name: "Offline Sync",
    icon: WifiOff,
    description: "Monitor Queue",
    href: "/sales/offline",
    color: "indigo",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    description: "Manage Stock",
    href: "/products",
    color: "emerald",
  },
  {
    id: "reports",
    name: "Analytics",
    icon: BarChart3,
    description: "View Insights",
    href: "/reports",
    color: "amber",
  },
  {
    id: "financial-reports",
    name: "Financials",
    icon: PieChart,
    description: "Profit & Loss",
    href: "/accounting/reports",
    color: "rose",
  },
  {
    id: "purchase",
    name: "Purchase Orders",
    icon: CreditCard,
    description: "Create Order",
    href: "/purchase/purchase-orders",
    color: "violet",
  },
  {
    id: "grn",
    name: "GRN",
    icon: FileText,
    description: "Receive Stock",
    href: "/purchase/grn",
    color: "orange",
  },
  {
    id: "employee",
    name: "Staff",
    icon: Users,
    description: "Manage Team",
    href: "/employees",
    color: "cyan",
  },
  {
    id: "barcodes",
    name: "Barcodes",
    icon: Barcode,
    description: "Print Labels",
    href: "/barcode",
    color: "slate",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description: "App Config",
    href: "/settings",
    color: "gray",
  },
];

const colorVariants = {
  blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:border-blue-600/30 hover:text-blue-600",
  indigo: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:border-indigo-600/30 hover:text-indigo-600",
  emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:border-emerald-600/30 hover:text-emerald-600",
  amber: "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-600/30 hover:text-amber-600",
  rose: "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:border-rose-600/30 hover:text-rose-600",
  violet: "bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20 text-violet-600 dark:text-violet-400 hover:border-violet-600/30 hover:text-violet-600",
  orange: "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 hover:border-orange-600/30 hover:text-orange-600",
  cyan: "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:border-cyan-600/30 hover:text-cyan-600",
  slate: "bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20 text-slate-600 dark:text-slate-400 hover:border-slate-600/30 hover:text-slate-600",
  gray: "bg-gray-50 dark:bg-gray-500/10 border-gray-100 dark:border-gray-500/20 text-gray-600 dark:text-gray-400 hover:border-gray-600/30 hover:text-gray-600",
};

export default function QuickActions() {
  const { business } = useAppSettings();
  const isAccountingEnabled = business?.accounting_enabled !== false && business?.subscription_tier !== 'Essential';

  const visibleActions = quickActions.filter(action => {
    if (action.id === "financial-reports") {
      return isAccountingEnabled;
    }
    return true;
  });

  return (
    <div className="bg-background rounded-xl border border-border/60 shadow-sm p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {visibleActions.map((action) => (
          <Link
            key={action.id}
            id={`quick-${action.id}`}
            href={action.href}
            className={cn(
              "group relative flex flex-col items-center justify-center p-5 rounded-xl border border-border/60 bg-muted/20 hover:bg-background transition-all duration-150 hover:shadow-md hover:-translate-y-1",
              colorVariants[action.color].split(' ').filter(c => c.startsWith('hover:')).join(' ')
            )}
          >
            <div
              className={cn(
                "action-icon mb-4 p-3 rounded-lg border shadow-sm transition-transform duration-150 group-hover:scale-110",
                colorVariants[action.color].split(' ').filter(c => !c.startsWith('hover:')).join(' ')
              )}
            >
              <action.icon className="w-5 h-5" strokeWidth={2.5} />
            </div>

            <div className="text-center">
              <span className={cn(
                "block text-sm font-bold text-foreground transition-colors duration-300",
                colorVariants[action.color].split(' ').filter(c => c.startsWith('hover:text')).map(c => c.replace('hover:', '')).join(' ')
              )}>
                {action.name}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground mt-1 block opacity-70">
                {action.description}
              </span>
            </div>

            {action.soon && (
              <Badge className="absolute top-2 right-2 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0 rounded-md">
                Soon
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}