"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Box,
  TrendingUp,
  Boxes,
  Calendar,
  User,
  ClipboardList,
  CheckCircle2,
  PlayCircle
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function ProductionDetailView({ orderId }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for session to fully initialize before making any decisions
    if (sessionStatus === "loading") return;

    const fetchOrder = async () => {
      if (!session?.accessToken) {
        setError("Authentication required");
        setLoading(false);
        return;
      }
      if (!orderId) {
        setError("No batch ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/production/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const data = await res.json();
        if (data.status === "success") {
          setOrder(data.data);
        } else {
          setError(data.message || "Batch not found");
          toast.error(data.message || "Failed to load batch detail");
        }
      } catch (err) {
        setError("Network error loading batch");
        toast.error("Failed to load production batch detail");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, session?.accessToken, sessionStatus]);

  if (sessionStatus === "loading" || loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground font-medium">Loading batch specifications...</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="p-4 rounded-full bg-red-50 text-red-600">
        <Box className="w-8 h-8" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground">Production Batch Not Found</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
          {error || "The batch reference might be incorrect or you don't have permission to view it."}
        </p>
      </div>
      </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Batch Protocol</h1>
            <p className="text-sm text-muted-foreground font-medium">{order.order_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {order.status === 'pending' && (
            <Button 
              onClick={() => router.push(`/production/orders/${order.id}/complete`)}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 px-8 transition-all hover:scale-105 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finalize Production
            </Button>
          )}
          <Badge className={cn(
            "px-4 py-1.5 rounded-full font-semibold text-xs shadow-none border-none capitalize",
            order.status === 'completed' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white animate-pulse"
          )}>
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-600" /> Production Item Specification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">{order.product?.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">Recipe: {order.recipe?.name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Planned Yield</p>
                    <p className="text-2xl font-bold text-emerald-600">{order.quantity_planned} Units</p>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* BOM Items */}
          <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card overflow-hidden">
            <CardHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 py-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" /> Allocated Materials (BOM)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Ingredient</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-center">Planned Usage</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-center">Actual Consumption</th>
                      <th className="px-6 py-4 text-xs font-semibold text-muted-foreground text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {order.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{item.raw_material?.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{item.raw_material?.code}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-sm font-bold text-slate-600">{item.quantity_planned}</td>
                        <td className="px-6 py-4 text-center font-mono text-sm font-bold text-emerald-600">
                          {order.status === 'completed' ? item.quantity_consumed : "-"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-muted-foreground">
                           {formatCurrency(item.cost_per_unit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-white dark:bg-card">
             <CardHeader className="border-b border-gray-100 dark:border-white/10 py-4">
                <CardTitle className="text-sm font-semibold">Manufacturing Context</CardTitle>
             </CardHeader>
             <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 text-gray-500"><Calendar className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 leading-none">Initialized At</span>
                    <span className="text-sm font-semibold">{format(new Date(order.created_at), "PPP p")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 text-gray-500"><PlayCircle className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 leading-none">Target Start</span>
                    <span className="text-sm font-semibold">{format(new Date(order.start_date), "PPP")}</span>
                  </div>
                </div>

                {order.end_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 leading-none">Completed At</span>
                      <span className="text-sm font-semibold">{format(new Date(order.end_date), "PPP p")}</span>
                    </div>
                  </div>
                )}

                {order.expiry_date && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600"><Calendar className="w-4 h-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 leading-none">Batch Expiry Date</span>
                      <span className="text-sm font-bold text-red-600">{format(new Date(order.expiry_date), "PPP")}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 text-gray-500"><User className="w-4 h-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60 leading-none">Supervisor</span>
                      <span className="text-sm font-semibold">{order.user?.name || "System Automated"}</span>
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>

          {order.status === 'completed' && (
            <Card className="border-none shadow-lg bg-emerald-600 text-white relative overflow-hidden">
               <div className="absolute -top-6 -right-6 p-4 opacity-10"><TrendingUp className="w-32 h-32" /></div>
               <CardHeader>
                  <CardTitle className="text-sm font-bold opacity-90">Performance Metrics</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="flex justify-between items-baseline border-b border-white/20 pb-4">
                    <span className="text-sm font-medium opacity-70">Total Batch Cost</span>
                    <span className="text-2xl font-bold tabular-nums">{formatCurrency(order.total_cost)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium opacity-70">Actual Yield</span>
                    <span className="text-lg font-bold tabular-nums">{order.quantity_produced} Units</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-medium opacity-70">Manufacturing Efficiency</span>
                    <span className="text-xl font-bold">
                      {((order.quantity_produced / order.quantity_planned) * 100).toFixed(1)}%
                    </span>
                  </div>
               </CardContent>
            </Card>
          )}

          {order.notes && (
            <Card className="border border-gray-200 dark:border-white/5 shadow-sm bg-amber-50/50">
               <CardHeader className="py-3 px-4 border-b border-amber-200/20">
                  <CardTitle className="text-xs font-bold text-amber-800">Internal Batch Notes</CardTitle>
               </CardHeader>
               <CardContent className="p-4">
                  <p className="text-xs font-medium text-amber-900/70 leading-relaxed italic">"{order.notes}"</p>
               </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
