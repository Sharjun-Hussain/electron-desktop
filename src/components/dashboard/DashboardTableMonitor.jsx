"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  UtensilsCrossed, Shapes, Play, ChefHat,
  Users, CheckCircle2, AlertCircle, RefreshCcw, Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardTableMonitor() {
  const { data: session } = useSession();
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLayoutData = useCallback(async (silent = false) => {
    if (!session?.accessToken) return;
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const [areasRes, tablesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/areas`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/tables`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      ]);

      const areasData = await areasRes.json();
      const tablesData = await tablesRes.json();

      if (areasData.status === "success") {
        const fetchedAreas = areasData.data || [];
        setAreas(fetchedAreas);
        if (fetchedAreas.length > 0 && !selectedAreaId) {
          setSelectedAreaId(fetchedAreas[0].id);
        }
      }
      if (tablesData.status === "success") {
        setTables(tablesData.data || []);
      }
    } catch (err) {
      console.error("Error loading dashboard floor layout:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [session, selectedAreaId]);

  useEffect(() => {
    fetchLayoutData();
    // Live Auto-Sync every 10 seconds to keep occupancy status fresh
    const interval = setInterval(() => fetchLayoutData(true), 10000);
    return () => clearInterval(interval);
  }, [session, fetchLayoutData]);

  // Aggregate stats
  const totalTables = tables.length;
  const occupiedTables = tables.filter(t => t.status === "occupied" || t.status === "seated").length;
  const settleTables = tables.filter(t => t.status === "settle" || t.status === "billing").length;
  const vacantTables = totalTables - occupiedTables - settleTables;
  const occupancyRate = totalTables > 0 ? Math.round(((occupiedTables + settleTables) / totalTables) * 100) : 0;
  const totalSeats = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);

  // Filtered tables for active area
  const activeAreaTables = tables.filter(t => String(t.area_id) === String(selectedAreaId));
  const activeArea = areas.find(a => String(a.id) === String(selectedAreaId));

  const handleTableClick = (table) => {
    // Dynamically open POS page and pre-select this dining table
    router.push(`/pos?dining_type=dine_in&dining_table_id=${table.id}&table_number=${encodeURIComponent(table.table_number)}`);
  };

  if (loading && areas.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-border/60 bg-muted/20 h-[88px]"></div>
        
        {/* Grid Content Skeleton */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
          <div className="lg:col-span-1 bg-muted/30 rounded-xl border border-border/50 h-full"></div>
          <div className="lg:col-span-3 bg-muted/10 rounded-xl border border-border/50 h-full"></div>
        </div>

        {/* Footer Skeleton */}
        <div className="p-4 bg-muted/20 border-t border-border/50 h-[64px]"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl animate-pulse">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Dining Floor Manager & Table Setup</h3>
            <p className="text-xs text-muted-foreground font-medium opacity-80 mt-0.5">Live monitor of restaurant table occupancy, seating, and bill settlements.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLayoutData(true)}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs font-semibold gap-1.5 active:scale-95 transition-transform"
          >
            <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            <span>{isRefreshing ? "Syncing..." : "Sync Floor"}</span>
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-medium text-[10px] px-2.5 py-1">
            Restaurant Live Overview
          </Badge>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Side: Stats Column */}
        <div className="lg:col-span-1 bg-muted/30 rounded-xl p-5 border border-border/50 flex flex-col justify-between gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">Live Seating Metrics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                  <span>Occupancy Capacity</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-card p-3 rounded-lg border border-border/40 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Total Tables</p>
                  <p className="text-xl font-semibold text-foreground mt-0.5">{totalTables}</p>
                </div>
                <div className="bg-card p-3 rounded-lg border border-border/40 text-center">
                  <p className="text-[10px] text-muted-foreground font-medium">Seating Capacity</p>
                  <p className="text-xl font-semibold text-foreground mt-0.5">{totalSeats} Pax</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Vacant Seating
              </span>
              <span className="font-mono text-foreground font-semibold">{vacantTables}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                Occupied / Dining
              </span>
              <span className="font-mono text-foreground font-semibold">{occupiedTables}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 bg-rose-500 rounded-full" />
                Settle / Billing
              </span>
              <span className="font-mono text-foreground font-semibold">{settleTables}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Floor Map / Table Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Seating Areas Selector Tabs */}
          {areas.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40 max-w-fit">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-transparent cursor-pointer",
                    selectedAreaId === area.id
                      ? "bg-card text-foreground shadow-xs border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {area.name}
                </button>
              ))}
            </div>
          )}

          {/* Seating Tables grid */}
          {activeAreaTables.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {activeAreaTables.map((table) => {
                const isOccupied = table.status === "occupied" || table.status === "seated";
                const isSettle = table.status === "settle" || table.status === "billing";

                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={cn(
                      "group p-3 rounded-xl border flex flex-col items-center justify-between text-center gap-3 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs",
                      isSettle
                        ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60"
                        : isOccupied
                          ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                          : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50"
                    )}
                  >
                    {/* Badge status */}
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                      isSettle
                        ? "bg-rose-500/10 text-rose-600"
                        : isOccupied
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {isSettle ? "Settle" : isOccupied ? "Occupied" : "Vacant"}
                    </span>

                    {/* Table Details */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Table</p>
                      <p className="text-2xl font-semibold text-foreground">{table.table_number}</p>
                    </div>

                    {/* Seats count */}
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                      <Users className="w-3 h-3 text-muted-foreground/60" />
                      <span>{table.capacity} Seats</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="w-full bg-muted/20 border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <Shapes className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-bold text-foreground">No tables configured</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">Use the floor plan editor to configure seating layout inside {activeArea?.name || "this area"}.</p>
            </div>
          )}
        </div>

      </div>

      {/* Footer controls */}
      <div className="p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 text-center sm:text-left">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          Auto-refresh active • Click any table to open POS order linkage.
        </span>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/reports/sales/dining")}
            className="text-xs h-8 font-medium text-emerald-600 hover:text-indigo-700 hover:bg-indigo-50/50 w-full sm:w-auto"
          >
            <Landmark className="h-3.5 w-3.5 mr-1 shrink-0" />
            Dining Reports
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/kitchen")}
            className="text-xs h-8 font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50/50 w-full sm:w-auto"
          >
            <ChefHat className="h-3.5 w-3.5 mr-1 shrink-0" />
            Kitchen Monitor
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/dining")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 font-medium rounded-lg shadow-sm w-full sm:w-auto"
          >
            <Shapes className="h-3.5 w-3.5 mr-1 shrink-0" />
            Edit Floor Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
