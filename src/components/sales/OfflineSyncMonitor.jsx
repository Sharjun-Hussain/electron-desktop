"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/indexedDB/db";
import {
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  ArrowUpCircle,
  Wifi,
  WifiOff,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "@/lib/date-utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function OfflineSyncMonitor() {
  const [isOnline, setIsOnline] = useState(true);

  // Live query for pending sales from IndexedDB
  const pendingSales = useLiveQuery(
    () => db.pendingSales.orderBy("createdAt").toArray(),
    []
  );

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const stats = {
    pending: pendingSales?.filter(s => s.status === "pending").length || 0,
    syncing: pendingSales?.filter(s => s.status === "syncing").length || 0,
    error: pendingSales?.filter(s => s.status === "error").length || 0,
    total: pendingSales?.length || 0,
  };

  const retryAll = async () => {
    if (!navigator.onLine) {
      toast.error("Still offline. Cannot retry sync.");
      return;
    }

    try {
      await db.pendingSales.where("status").equals("error").modify({ status: "pending", error: null });
      toast.success("Retry initiated for failed sales.");
    } catch (err) {
      toast.error("Failed to reset queue");
    }
  };

  const clearSyncQueue = async () => {
    if (!confirm("Are you sure you want to clear the entire offline queue? This data will be LOST if not synced.")) return;

    try {
      await db.pendingSales.clear();
      toast.success("Sync queue cleared.");
    } catch (err) {
      toast.error("Failed to clear queue");
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header & Connectivity Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <CloudOff className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Offline Sync Monitor(BETA)</h1>
            <p className="text-sm text-muted-foreground font-medium opacity-70">Real-time local database & cloud synchronization status</p>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300",
          isOnline ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700 animate-pulse"
        )}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-wider">{isOnline ? "System Online" : "System Offline"}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Queue"
          value={stats.pending}
          icon={Clock}
          gradient="from-blue-500 to-indigo-400"
          description="Waiting for sync"
        />
        <StatCard
          label="Pushing Now"
          value={stats.syncing}
          icon={RefreshCw}
          gradient="from-emerald-500 to-teal-400"
          description="Currently uploading"
          isSpinning={stats.syncing > 0}
        />
        <StatCard
          label="Sync Failures"
          value={stats.error}
          icon={AlertCircle}
          gradient="from-rose-500 to-orange-400"
          description="Failed to sync"
        />
        <StatCard
          label="Local Buffer"
          value={stats.total}
          icon={Database}
          gradient="from-violet-500 to-purple-400"
          description="Total items in IDB"
        />
      </div>

      {/* Sync Queue Table */}
      <Card className="border border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
          <div>
            <CardTitle className="text-sm font-bold">Local Sync Queue</CardTitle>
            <CardDescription className="text-xs">Individual transactions pending cloud authorization</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats.error > 0 && (
              <Button variant="outline" size="sm" onClick={retryAll} className="h-8 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Failed
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearSyncQueue} className="h-8 gap-2 text-muted-foreground hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
              Clear Queue
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground/60 border-b">
                <tr>
                  <th className="px-6 py-3">Transaction Info</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {pendingSales && pendingSales.length > 0 ? (
                  pendingSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">Inv: {sale.invoice_no || sale.id}</span>
                          <span className="text-[10px] text-muted-foreground">{sale.customer?.name || "Walk-in Customer"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {format(new Date(sale.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sale.status} error={sale.error} />
                      </td>
                      <td className="px-6 py-4 text-right font-black">
                        LKR {Number(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        <p className="font-bold text-lg">Sync Queue Clear</p>
                        <p className="text-xs">All local data is perfectly synchronized with the cloud.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, gradient, description, isSpinning }) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
      <div className={cn("p-3 rounded-lg bg-linear-to-br text-white shadow-sm", gradient)}>
        <Icon className={cn("w-5 h-5", isSpinning && "animate-spin")} />
      </div>
      <div className="flex flex-col">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </div>
    </div>
  );
}

function StatusBadge({ status, error }) {
  const config = {
    pending: { label: "Pending Sync", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
    syncing: { label: "Syncing...", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 animate-pulse", icon: RefreshCw },
    error: { label: "Failed", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: AlertCircle },
    success: { label: "Synced", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  };

  const { label, color, icon: Icon } = config[status] || config.pending;

  return (
    <div className="flex flex-col gap-1">
      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold w-fit", color)}>
        <Icon className={cn("h-3 w-3", status === 'syncing' && 'animate-spin')} />
        {label}
      </div>
      {error && <span className="text-[9px] text-rose-500 font-medium line-clamp-1">{error}</span>}
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
