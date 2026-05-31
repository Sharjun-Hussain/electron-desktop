"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Send, 
  Users, 
  History, 
  Zap, 
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TextLkDashboard({ setActiveTab }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    delivered: 0,
    failed: 0,
    balance: "N/A",
    logs: []
  });

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    if (session?.accessToken) {
      fetchStats();
    }
  }, [session?.accessToken]);

  // Color mapping to ensure Tailwind values render correctly without compilation dynamic-class issues
  const colorMap = {
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

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 border-none text-white shadow-xl shadow-indigo-500/20 dark:shadow-indigo-500/5">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Send className="h-48 w-48 rotate-12" />
          </div>
          <CardContent className="pt-8 pb-8 relative z-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none font-bold">Text.lk Sri Lanka</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight">Ready to connect?</h1>
                <p className="text-indigo-100 font-medium max-w-md text-sm">
                  Engage your Sri Lankan customers with real-time transactional SMS and digital receipts.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button 
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-6 h-11"
                  onClick={() => setActiveTab("messages")}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Compose Message
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-bold px-6 h-11"
                  onClick={() => setActiveTab("contacts")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Contacts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              Service Status
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Operational</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Gateway: REST v3</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Response Time</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">~240ms</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[94%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Remaining Balance", value: stats.balance !== "N/A" ? `${stats.balance} Credits` : "N/A", icon: Zap, color: "amber" },
          { label: "Total Sent", value: stats.totalSent, icon: MessageSquare, color: "indigo" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "emerald" },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: "rose" }
        ].map((stat, i) => {
          const style = colorMap[stat.color] || colorMap.indigo;
          return (
            <Card key={i} className={`border-border bg-card shadow-xs group ${style.hover} transition-all duration-200`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} group-hover:scale-105 transition-transform duration-200`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{stat.value}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Tips & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Zap className="h-4 w-4" />
              Automation Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 p-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 group hover:bg-indigo-500/10 transition-colors cursor-pointer">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-background border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-500">1</div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Digital Receipts</p>
                <p className="text-[11px] text-muted-foreground font-medium">Auto-send SMS receipt after every POS sale for a premium customer experience.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-400 ml-auto self-center group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="flex gap-4 p-3 rounded-lg border border-border bg-card group hover:bg-muted/40 transition-colors cursor-pointer">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center font-bold text-muted-foreground group-hover:text-indigo-500">2</div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Loyalty Alerts</p>
                <p className="text-[11px] text-muted-foreground font-medium">Notify customers about their point balance or birthday discounts via Text.lk.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 ml-auto self-center group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>

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
}
