"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shapes, Map, Grid3X3, Users, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";

export function TableSelectionDialog({ isOpen, onOpenChange, onSelectTable }) {
  const { data: session } = useSession();
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLayoutData = useCallback(async () => {
    if (!session?.accessToken || !isOpen) return;
    try {
      setLoading(true);
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
        setAreas(areasData.data || []);
        if (areasData.data?.length > 0) {
          setSelectedAreaId(areasData.data[0].id);
        }
      }
      if (tablesData.status === "success") {
        setTables(tablesData.data || []);
      }
    } catch (err) {
      console.error("Error loading floor layouts:", err);
      toast.error("Failed to sync floor plan data");
    } finally {
      setLoading(false);
    }
  }, [session, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchLayoutData();
    }
  }, [isOpen, fetchLayoutData]);

  const handleTableClick = (table) => {
    if (table.status !== "free") {
      toast.error("Table is currently occupied or reserved.");
      return;
    }
    onSelectTable(table);
    onOpenChange(false);
  };

  const activeAreaTables = tables.filter(t => t.dining_area_id === selectedAreaId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground rounded-2xl w-[95vw] sm:max-w-5xl lg:max-w-6xl h-[85vh] p-0 flex flex-col overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 border-b border-border/30 bg-muted/10 shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            Select a Dining Table
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row h-full min-h-[400px] overflow-hidden bg-background/50">
          {/* Left Areas Sidebar */}
          <div className="w-full md:w-64 border-r border-border/30 p-5 flex flex-col gap-4 bg-muted/5 shrink-0 overflow-y-auto">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2 border-b border-border/30 pb-3">
              <Map className="w-4 h-4 text-muted-foreground/60" />
              Floor Areas
            </span>
            
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="animate-pulse text-sm text-muted-foreground text-center py-6">Loading...</div>
              ) : areas.length === 0 ? (
                <div className="text-[11px] text-muted-foreground text-center py-6 font-medium">
                  No Areas Defined
                </div>
              ) : (
                areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setSelectedAreaId(area.id)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3.5 rounded-xl font-semibold text-sm text-left transition-all border",
                      selectedAreaId === area.id
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-background hover:bg-muted/60 text-foreground border-border/40 hover:border-border"
                    )}
                  >
                    <span className="truncate mr-2">{area.name}</span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      selectedAreaId === area.id ? "bg-emerald-700/60 text-emerald-100" : "bg-muted text-muted-foreground"
                    )}>
                      {tables.filter(t => t.dining_area_id === area.id).length}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Tables Grid */}
          <div className="flex-1 p-6 lg:p-8 bg-background overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-pulse text-sm font-medium">
                <Shapes className="w-10 h-10 mb-3 animate-spin text-emerald-500" />
                Loading layout...
              </div>
            ) : activeAreaTables.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 border-2 border-dashed border-border/60 rounded-2xl p-8 bg-muted/10">
                <span className="text-sm font-semibold text-center text-foreground">No tables available in this area.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {activeAreaTables.map((table) => {
                  const statusColors = {
                    free: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 hover:shadow-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    occupied: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400 opacity-60 cursor-not-allowed",
                    reserved: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400 opacity-60 cursor-not-allowed"
                  };

                  const formattedNumber = table.table_number.charAt(0).toUpperCase() + table.table_number.slice(1);

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={cn(
                        "relative flex flex-col justify-between p-4 rounded-xl border min-h-[130px] transition-all duration-300 group",
                        table.status === 'free' ? "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-sm hover:shadow-md" : "",
                        statusColors[table.status] || statusColors.free
                      )}
                    >
                      <div className="flex items-center justify-between shrink-0 mb-3">
                        <span className="text-[10px] font-semibold text-muted-foreground truncate mr-2">
                          {table.status === 'free' ? 'Available' : table.status === 'occupied' ? 'Occupied' : 'Reserved'}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          table.status === 'free' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : table.status === 'occupied' ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                      </div>

                      <div className="flex flex-col items-center justify-center my-auto flex-1 gap-1">
                        <span className="text-lg md:text-xl font-bold text-center break-words max-w-full leading-tight text-foreground">
                          {formattedNumber}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-full">
                          <Users className="w-3.5 h-3.5" />
                          {table.capacity} Pax
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
