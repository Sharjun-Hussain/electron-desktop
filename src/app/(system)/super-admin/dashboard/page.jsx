"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Building, 
  Users, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recentOrgs, setRecentOrgs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.accessToken) return;
      try {
        setLoading(true);
        const [statsRes, orgsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/stats`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations?size=3`, {
            headers: { Authorization: `Bearer ${session.accessToken}` }
          })
        ]);

        const statsData = await statsRes.json();
        const orgsData = await orgsRes.json();

        if (statsData.status === "success") setStats(statsData.data);
        if (orgsData.status === "success") setRecentOrgs(orgsData.data.data);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [session]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic flex items-center gap-3">
            <ShieldCheck className="size-8 text-[#10b981]" />
            System Control Center
          </h1>
          <p className="text-muted-foreground font-medium ml-1">
            Global overview of all organizations and infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-[#10b981] hover:bg-[#10b981]/90 text-white font-bold rounded-xl px-6">
            View System Logs
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Organizations" 
          value={stats.totalOrganizations} 
          icon={Building} 
          color="blue"
          trend="+2 this month"
        />
        <StatCard 
          title="Active Branches" 
          value={stats.totalBranches} 
          icon={MapPin} 
          color="emerald"
          trend="+5 this month"
        />
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          color="purple"
          trend="+12 this month"
        />
        <StatCard 
          title="System Health" 
          value={stats.systemHealth} 
          icon={TrendingUp} 
          color="amber"
          trend="99.9% Uptime"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Recent Organizations</h3>
              <Button variant="ghost" className="text-[#10b981] font-bold gap-1 hover:bg-[#10b981]/5">
                View All <ArrowUpRight className="size-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentOrgs.length > 0 ? recentOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40 hover:border-[#10b981]/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Building className="size-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Joined {new Date(org.created_at).toLocaleDateString()} • {org.plan?.name || org.subscription_tier || 'Trial'}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
                    org.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {org.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              )) : (
                <p className="text-center py-8 text-muted-foreground font-medium italic">No organizations found yet.</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl rounded-[2.5rem] overflow-hidden">
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground">Pending Issues</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Plan Expiry</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
                    TechStore Corp subscription expires in 48 hours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Memory Usage</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-relaxed">
                    Main server memory usage exceeded 85%.
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl py-6 gap-2 border border-border/50 shadow-sm mt-4">
              Manage Subscriptions
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    emerald: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-lg rounded-4xl overflow-hidden group hover:border-[#10b981]/30 transition-all duration-300">
      <CardContent className="p-7">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl border transition-all duration-300 group-hover:scale-110", colors[color])}>
            <Icon className="size-6" />
          </div>
          <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded-full">{trend}</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</h4>
          <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { cn } from "@/lib/utils";
