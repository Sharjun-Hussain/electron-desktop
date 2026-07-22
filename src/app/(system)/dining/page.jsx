"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import {
  Shapes,
  Plus,
  Map,
  UtensilsCrossed,
  Users,
  Clock,
  Layers,
  ChevronRight,
  Check,
  CreditCard,
  Settings2,
  Trash2,
  Edit3,
  Grid3X3,
  CheckCircle,
  TrendingUp,
  Receipt,
  RotateCcw,
  Sparkles,
  Search,
  Monitor,
  LayoutGrid
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { AVAILABLE_PAYMENTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function DiningTableMapPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency, pos } = useAppSettings();
  const activeMethods = pos?.activePaymentMethods || ["cash", "card"];
  const { t } = useTranslation();

  // Floor layout states
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Table active order details
  const [activeTableDetails, setActiveTableDetails] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Settle Bill checkout modal
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [settling, setSettling] = useState(false);

  // Layout editor mode states
  const [editMode, setEditMode] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");
  const [submittingLayout, setSubmittingLayout] = useState(false);

  // Fetch Areas and Tables
  const fetchLayoutData = useCallback(async () => {
    if (!session?.accessToken) return;
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
        if (areasData.data?.length > 0 && !selectedAreaId) {
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
  }, [session, selectedAreaId]);

  useEffect(() => {
    fetchLayoutData();
  }, [fetchLayoutData]);

  // Click on a table
  const handleTableClick = async (table) => {
    if (editMode) return; // Ignore in customization mode

    if (table.status === "free") {
      // Direct POS integration
      router.push(`/pos?dining_type=dine_in&dining_table_id=${table.id}&table_number=${encodeURIComponent(table.table_number)}`);
      return;
    }

    // Fetch active order details for occupied table
    try {
      setFetchingDetails(true);
      setDetailsDialogOpen(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/tables/${table.id}/details`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setActiveTableDetails(data.data);
        setPaidAmount(data.data.activeSale?.payable_amount?.toString() || "");
      }
    } catch (err) {
      console.error("Error fetching table active order:", err);
      toast.error("Failed to retrieve guest order tickets");
    } finally {
      setFetchingDetails(false);
    }
  };

  // Add more items to active order
  const handleAddItems = () => {
    if (!activeTableDetails?.activeSale) return;
    const saleId = activeTableDetails.activeSale.id;
    const tableId = activeTableDetails.table.id;
    const tableNum = activeTableDetails.table.table_number;
    router.push(`/pos?sale_id=${saleId}&dining_type=dine_in&dining_table_id=${tableId}&table_number=${encodeURIComponent(tableNum)}`);
  };

  // Settle Order Payment
  const handleSettleSubmit = async () => {
    if (!activeTableDetails?.activeSale) return;
    try {
      setSettling(true);
      const saleId = activeTableDetails.activeSale.id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${saleId}/settle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          paid_amount: parseFloat(paidAmount),
          status: "completed",
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        toast.success("Table bill successfully settled and released!");
        setSettleDialogOpen(false);
        setDetailsDialogOpen(false);
        setActiveTableDetails(null);
        fetchLayoutData(); // Reload floor layout states
      } else {
        toast.error(data.message || "Failed to settle bill");
      }
    } catch (err) {
      console.error("Error settling table order:", err);
      toast.error("Settle checkout failed");
    } finally {
      setSettling(false);
    }
  };

  // Create Floor Area
  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    try {
      setSubmittingLayout(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/areas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ name: newAreaName }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`Dining Floor "${newAreaName}" registered!`);
        setNewAreaName("");
        fetchLayoutData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to register area");
    } finally {
      setSubmittingLayout(false);
    }
  };

  // Create Dining Table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableNumber.trim() || !selectedAreaId) return;
    try {
      setSubmittingLayout(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          dining_area_id: selectedAreaId,
          table_number: newTableNumber,
          capacity: parseInt(newTableCapacity),
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success(`Table Marker ${newTableNumber} added successfully.`);
        setNewTableNumber("");
        setNewTableCapacity("4");
        fetchLayoutData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add table");
    } finally {
      setSubmittingLayout(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId) => {
    if (!confirm("Are you sure you want to remove this table from layout?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/tables/${tableId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      toast.success("Table removed from layout.");
      fetchLayoutData();
    } catch (err) {
      console.error(err);
      toast.error("Delete table action failed");
    }
  };

  const activeAreaTables = tables.filter(t => t.dining_area_id === selectedAreaId);

  return (
    <div className="flex flex-col h-[calc(100vh-155px)] min-h-[560px] bg-background text-foreground p-4 md:p-6 overflow-hidden">

      {/* ─── Standard Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-9 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
            <UtensilsCrossed className="size-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
              Interactive Table Floor Plan
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1.5 opacity-70">
              Real-time dine-in table states, kitchen guest courses, and KOT statuses
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className={cn(
              "font-medium text-xs border-gray-200 dark:border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-1.5 h-8 px-3 rounded-md",
              editMode ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "text-muted-foreground"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            {editMode ? "Save Layout" : "Configure Layout"}
          </Button>

          <Button
            onClick={() => router.push('/pos')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs transition-all h-8 px-3 shadow-none flex items-center gap-1.5"
          >
            <Monitor className="w-3.5 h-3.5" />
            Open POS Terminal
          </Button>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 mt-6 overflow-hidden">

        {/* Left Control Panel / Floor Area list */}
        <div className="w-full md:w-64 flex flex-col gap-6 shrink-0 overflow-y-auto pr-1">

          {/* Areas Section Card */}
          <Card className="border border-gray-200 dark:border-white/5 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card p-5">
            <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-muted-foreground/60" />
                Floor Areas
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {areas.length === 0 && !loading && (
                <div className="text-[10px] text-muted-foreground text-center py-4 font-semibold uppercase tracking-wider">
                  No Areas Defined
                </div>
              )}
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedAreaId(area.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 rounded-md font-semibold text-xs text-left transition-all border",
                    selectedAreaId === area.id
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                      : "bg-muted/10 hover:bg-muted/40 text-foreground border-border/10"
                  )}
                >
                  <span className="truncate mr-2">{area.name}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded tracking-tight",
                    selectedAreaId === area.id ? "bg-emerald-700 text-emerald-100" : "bg-muted text-muted-foreground"
                  )}>
                    {tables.filter(t => t.dining_area_id === area.id).length}
                  </span>
                </button>
              ))}
            </div>

            {editMode && (
              <form onSubmit={handleCreateArea} className="mt-4 pt-4 border-t border-border/30 flex gap-2">
                <Input
                  placeholder="Area label (e.g. Garden)..."
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="bg-background border-border text-xs rounded-md focus-visible:ring-emerald-500 h-9"
                />
                <Button
                  size="icon"
                  disabled={submittingLayout}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shrink-0 h-9 w-9"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </form>
            )}
          </Card>

          {/* Quick Stats Overview Card */}
          <Card className="border border-gray-200 dark:border-white/5 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card p-5 flex flex-col gap-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 border-b border-border/30 pb-2">
              <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground/60" />
              Real-time Overview
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/20 border border-border/30 p-3 rounded-md flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Available</span>
                <span className="text-xl font-black text-emerald-500 font-mono mt-0.5">
                  {tables.filter(t => t.status === "free").length}
                </span>
              </div>
              <div className="bg-muted/20 border border-border/30 p-3 rounded-md flex flex-col">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Occupied</span>
                <span className="text-xl font-black text-amber-500 font-mono mt-0.5">
                  {tables.filter(t => t.status === "occupied").length}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Floor Grid Panel */}
        <Card className="flex-1 border border-gray-200 dark:border-white/5 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card p-6 flex flex-col overflow-hidden">

          {/* Status Indicators Legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 shrink-0 border-b border-border/30 pb-4 text-xs font-semibold text-muted-foreground">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available (Free)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Dining/Serving (Occupied)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Reserved</span>
            </div>
          </div>

          {/* Grid Layout Container */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-pulse text-xs font-bold uppercase tracking-wider">
                <Shapes className="w-8 h-8 mb-2 animate-spin text-emerald-500" />
                Loading dining map layout...
              </div>
            ) : activeAreaTables.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 border border-dashed border-border rounded-lg p-8 bg-muted/10">
                <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mb-1" />
                <span className="text-xs font-black uppercase tracking-wider text-center text-foreground">No tables defined in this floor layout yet.</span>
                {editMode ? (
                  <p className="text-muted-foreground text-[11px] font-medium text-center">Use the creator tool below to register dynamic table markers.</p>
                ) : (
                  <p className="text-muted-foreground text-[11px] font-medium text-center">Click "Configure Layout" above to register dining tables.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-0.5">
                {activeAreaTables.map((table) => {
                  const statusColors = {
                    free: "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                    occupied: "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-600 dark:text-amber-400",
                    reserved: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40 text-blue-600 dark:text-blue-400"
                  };

                  const formattedNumber = table.table_number.charAt(0).toUpperCase() + table.table_number.slice(1);

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={cn(
                        "relative flex flex-col justify-between p-4 rounded-lg border h-36 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group bg-card",
                        statusColors[table.status] || statusColors.free
                      )}
                    >
                      <div className="flex items-center justify-between shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                          {table.status === 'free' ? 'Available' : table.status === 'occupied' ? 'Dine In' : 'Reserved'}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          table.status === 'free' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : table.status === 'occupied' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
                        )} />
                      </div>

                      <div className="flex flex-col items-center justify-center my-auto py-1">
                        <span className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors truncate max-w-full px-1">
                          {formattedNumber}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-muted-foreground/75" />
                          {table.capacity} Pax
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold border-t border-border/40 pt-2 shrink-0">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-[9px] uppercase tracking-wider">
                          {table.status === 'occupied' ? 'View Bill' : 'New Order'}
                        </span>
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTable(table.id);
                            }}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manager New Table Creator Panel */}
          {editMode && selectedAreaId && (
            <form onSubmit={handleCreateTable} className="mt-6 pt-5 border-t border-border/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end shrink-0 bg-muted/10 p-4 rounded-lg">
              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Table Label / Num</Label>
                <Input
                  placeholder="e.g. Table 4, VIP-2..."
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="bg-background border-border text-xs rounded-md focus-visible:ring-emerald-500 h-9"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-3">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Capacity (Pax)</Label>
                <Input
                  type="number"
                  placeholder="4"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="bg-background border-border text-xs rounded-md focus-visible:ring-emerald-500 h-9"
                />
              </div>

              <Button
                type="submit"
                disabled={submittingLayout}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs transition-all h-9 px-4 col-span-1 sm:col-span-4 w-full"
              >
                Add Table Marker
              </Button>
            </form>
          )}
        </Card>
      </div>

      {/* ─── Table Details Modal ─── */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-card border border-border/50 text-foreground rounded-lg max-w-lg p-6 backdrop-blur-md">
          <DialogHeader className="border-b border-border/30 pb-3">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              Table {activeTableDetails?.table?.table_number} — Guest Order Details
            </DialogTitle>
          </DialogHeader>

          {fetchingDetails ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-xs font-bold animate-pulse uppercase tracking-widest gap-2">
              <Shapes className="w-5 h-5 animate-spin text-emerald-500" />
              Fetching guest tickets...
            </div>
          ) : (
            <div className="flex flex-col gap-5 mt-3">

              {/* KOT Info Bar */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md border border-border/30">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kitchen Ticket No</span>
                  <span className="text-xs font-black text-foreground mt-0.5">{activeTableDetails?.activeSale?.invoice_number || "Draft KOT"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Cooking Status</span>
                  <span className="text-xs font-black text-amber-500 uppercase mt-0.5 animate-pulse">
                    {activeTableDetails?.activeSale?.kot_status?.replace(/_/g, ' ') || "Pending Cooking"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Dine-In Ordered Items</span>
                <div className="max-h-60 overflow-y-auto border border-border/50 rounded-md divide-y divide-border/30 bg-muted/5">
                  {activeTableDetails?.activeSale?.items?.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-6 font-semibold uppercase">
                      No items ordered yet
                    </div>
                  )}
                  {activeTableDetails?.activeSale?.items?.map((item) => {
                    const statusColors = {
                      pending: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400",
                      preparing: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
                      ready: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
                      served: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
                    };

                    return (
                      <div key={item.id} className="flex justify-between items-center p-3.5 hover:bg-muted/10 transition-colors">
                        <div className="flex flex-col gap-0.5 max-w-[70%]">
                          <span className="text-xs font-bold text-foreground">{item.product?.name}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                          {item.cooking_notes && (
                            <span className="text-[9px] text-red-500 font-bold bg-red-500/5 border border-red-500/15 px-2 py-0.5 rounded-md mt-1 w-fit">
                              Notes: {item.cooking_notes}
                            </span>
                          )}
                        </div>

                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-none",
                          statusColors[item.cooking_status] || statusColors.pending
                        )}>
                          {item.cooking_status || "pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Totals Summary */}
              <div className="flex flex-wrap justify-between items-center border-t border-border/40 pt-4 gap-4 mt-1">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted-foreground uppercase">Grand Total (Inc Tax)</span>
                  <span className="text-xl font-black text-foreground font-mono">
                    {formatCurrency(activeTableDetails?.activeSale?.payable_amount || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleAddItems}
                    className="border-border/50 hover:bg-muted text-foreground rounded-md font-medium text-xs transition-all h-9 px-3"
                  >
                    Add Items (POS)
                  </Button>
                  <Button
                    onClick={() => setSettleDialogOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs transition-all h-9 px-4"
                  >
                    Settle & Checkout
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Settle Bill Payment Modal ─── */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="bg-card border border-border/50 text-foreground rounded-lg max-w-sm p-6 backdrop-blur-md">
          <DialogHeader className="border-b border-border/30 pb-3">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 animate-bounce" />
              Settle Table Payment
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-3">
            <div className="bg-muted/20 p-4 rounded-md border border-border/30 flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Total Payable:</span>
              <span className="text-lg font-black text-foreground font-mono">
                {formatCurrency(activeTableDetails?.activeSale?.payable_amount || 0)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_PAYMENTS.filter(p => activeMethods.includes(p.id)).map((payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => setPaymentMethod(payment.id)}
                    className={cn(
                      "px-3 py-2 rounded-md border font-bold text-[9px] uppercase text-center transition-all active:scale-[0.98]",
                      paymentMethod === payment.id
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-muted/20 text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {payment.id.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Paid Amount</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="bg-background border-border text-xs rounded-md focus-visible:ring-emerald-500 font-mono h-10"
              />
            </div>

            <Button
              onClick={handleSettleSubmit}
              disabled={settling}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-xs w-full h-10 mt-2 shadow-none transition-all"
            >
              {settling ? "Processing Settlement..." : "Confirm Settlement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
