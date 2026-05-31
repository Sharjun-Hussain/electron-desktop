"use client";

import React from "react";
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Zap,
  ShieldCheck,
  Package,
  Phone
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SubscriptionDetails() {
  const { business, formatDate } = useAppSettings();
  const plan = business?.plan;
  const expiryDate = business?.subscription_expiry_date;
  
  const getDaysRemaining = () => {
    if (!expiryDate) return 0;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining <= 0;

  const getStatusColor = () => {
    if (isExpired) return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    if (daysRemaining <= 7) return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Plan Overview Card */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
          <Sparkles className="w-32 h-32" />
        </div>
        
        <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                {plan?.name || "Standard Plan"}
              </CardTitle>
              <CardDescription>Active subscription and usage metrics</CardDescription>
            </div>
            <Badge variant="outline" className={cn("px-3 py-1 font-semibold uppercase tracking-wider text-[10px]", getStatusColor())}>
              {business?.subscription_status || "Active"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expiry Date */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-tight">Expiry Date</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {business?.is_master ? "Lifetime" : (expiryDate ? formatDate(expiryDate) : "Never")}
              </p>
              <p className="text-[11px] text-muted-foreground">Renews on {business?.billing_cycle || "Monthly"} cycle</p>
            </div>

            {/* Time Remaining */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-tight">Time Remaining</span>
              </div>
              <div className="flex items-baseline gap-1">
                <p className={cn("text-2xl font-black", business?.is_master ? "text-emerald-500" : (daysRemaining <= 7 ? "text-amber-500" : "text-emerald-500"))}>
                  {business?.is_master ? "∞" : daysRemaining}
                </p>
                <span className="text-sm font-bold text-slate-500">{business?.is_master ? "Unlimited" : "Days"}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", business?.is_master ? "bg-emerald-500" : (daysRemaining <= 7 ? "bg-amber-500" : "bg-emerald-500"))}
                  style={{ width: business?.is_master ? "100%" : `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                />
              </div>
            </div>

            {/* Billing Basis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-tight">Billing Tier</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {business?.subscription_tier || "Essential"}
              </p>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
                {business?.is_multi_branch ? "Multi-Branch" : "Single Branch"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Core Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Maximum Branches", value: (business?.is_master || plan?.max_branches === -1) ? "Unlimited" : (plan?.max_branches || "1 Branch") },
              { label: "Active Users", value: business?.is_master ? "Unlimited" : (plan?.max_users || "5 Users") },
              { label: "Feature Access", value: "Standard Modules" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{feature.label}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{feature.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              Quick Support
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Need to upgrade your plan or add more users? Contact our support team for customized enterprise solutions.
            </p>
            <a 
              href="tel:+94785706441"
              className="mt-2 w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-black rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
              <Phone className="w-3.5 h-3.5" /> +94 785706441 CALL
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
