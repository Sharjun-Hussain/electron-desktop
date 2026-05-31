"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLOR_MAP = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-500/20",
    hover: "hover:border-indigo-200 dark:hover:border-indigo-500/40"
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-500/20",
    hover: "hover:border-emerald-200 dark:hover:border-emerald-500/40"
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-500/20",
    hover: "hover:border-rose-200 dark:hover:border-rose-500/40"
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-500/20",
    hover: "hover:border-amber-200 dark:hover:border-amber-500/40"
  }
};

export const TextLkDashboard = React.memo(function TextLkDashboard({ setActiveTab }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    balance: "N/A",
    logs: []
  });

  const fetchStats = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/stats`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if (!response.ok) throw new Error("Failed to load statistics");
      const data = await response.json();
      if (data && (data.success || data.status === 'success') && data.data) {
        setStats({
          totalSent: data.data.totalSent ?? 0,
          delivered: data.data.delivered ?? 0,
          failed: data.data.failed ?? 0,
          balance: data.data.balance ?? "N/A",
          logs: data.data.logs ?? []
        });
      }
    } catch (error) {
      console.error("Error fetching Text.lk stats:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchStats();
    }
  }, [session?.accessToken]);

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Remaining Balance", value: stats.balance !== "N/A" ? `${stats.balance} Credits` : "N/A", icon: Zap, color: "amber" },
          { label: "Total Sent", value: stats.totalSent, icon: MessageSquare, color: "indigo" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "emerald" },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: "rose" }
        ].map((stat, i) => {
          const style = COLOR_MAP[stat.color] || COLOR_MAP.indigo;
          return (
            <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
              <div className={`p-3 rounded-lg ${style.bg} ${style.text}`}>
                <stat.icon className="w-5 h-5 shadow-sm" />
              </div>
              <div className="flex flex-col">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card shadow-xs flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-foreground">Recent Logs</CardTitle>
            <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border bg-background">Live Feed</Badge>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.logs && stats.logs.length > 0 ? (
                stats.logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                    <div className={`p-1.5 rounded-lg ${log.status === "Delivered" ? "bg-emerald-500/10 text-emerald-500" : log.status === "Failed" ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500"}`}>
                      {log.status === "Delivered" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-foreground">{log.to}</p>
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          {log.sent_at ? new Date(log.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate font-medium">{log.message}</p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded ${
                          log.status === "Delivered" 
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : log.status === "Failed" 
                              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" 
                              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-medium">Cost: {log.cost || "1"} Credit</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                    <History className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground">No recent messages</p>
                    <p className="text-[10px] text-muted-foreground/80 font-medium">Your SMS activity will appear here once you start sending.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[11px] font-bold border-border"
                    onClick={() => setActiveTab("messages")}
                  >
                    Send your first message
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
