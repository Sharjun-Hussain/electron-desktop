"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Utensils,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Timer,
  RotateCcw,
  MapPin,
  Users,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Layers,
  ChefHat,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function KitchenDisplayPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastTicketCount, setLastTicketCount] = useState(0);

  // Play KOT alert sound
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context playback blocked by browser security.", e);
    }
  }, [soundEnabled]);

  // Fetch Active Tickets
  const initialLoadDone = useRef(false);

  const fetchTickets = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      if (!initialLoadDone.current) {
        setLoading(true);
      }

      const branchId = typeof window !== 'undefined' ? localStorage.getItem('selected_branch_id') : null;
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      if (branchId) {
        headers['x-branch-id'] = branchId;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kitchen/tickets`, {
        headers
      });
      const data = await res.json();
      if (data.status === "success") {
        const activeTickets = data.data || [];
        setTickets(activeTickets);

        // If a new ticket arrives, beep to notify the kitchen chefs!
        if (activeTickets.length > lastTicketCount && lastTicketCount > 0) {
          playAlertSound();
        }
        setLastTicketCount(activeTickets.length);
      }
    } catch (err) {
      console.error("Error loading kitchen tickets:", err);
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [session, lastTicketCount, playAlertSound]);

  // Set up polling for real-time kitchen updates (every 5 seconds)
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Update cooking status of a single item
  const handleUpdateItemStatus = async (itemId, currentStatus) => {
    const nextStatusMap = {
      pending: "preparing",
      preparing: "ready",
      ready: "served",
      served: "pending"
    };
    const nextStatus = nextStatusMap[currentStatus] || "preparing";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kitchen/items/${itemId}/cooking-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchTickets(); // Refresh tickets immediately
      }
    } catch (err) {
      console.error("Error updating item cooking status:", err);
    }
  };

  // Update whole ticket status (KOT Status)
  const handleUpdateTicketStatus = async (ticketId, nextStatus) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/kitchen/tickets/${ticketId}/kot-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchTickets();
      }
    } catch (err) {
      console.error("Error updating ticket KOT status:", err);
    }
  };

  // Helper: calculate elapsed time in minutes
  const getElapsedTime = (createdTime) => {
    const diffMs = new Date() - new Date(createdTime);
    return Math.floor(diffMs / 1000 / 60);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-155px)] min-h-[560px] bg-background text-foreground p-4 md:p-6 overflow-hidden">

      {/* ─── Standard Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-9 shrink-0 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-sm transition-all duration-300 hover:rotate-6">
            <Flame className="size-4.5 text-rose-600 dark:text-rose-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1.5 opacity-70">
              Real-time kitchen order tickets (KOT), custom modifications, and elapsed prep timers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "font-medium text-xs border-gray-200 dark:border-border/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all gap-1.5 h-8 px-3 rounded-md",
              soundEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "text-muted-foreground"
            )}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Alert: On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Audio Alert: Off</span>
              </>
            )}
          </Button>

          <div className="bg-muted/20 border border-border/30 rounded-md px-3 py-1.5 text-xs font-bold text-foreground font-mono flex items-center gap-1.5 h-8">
            <ChefHat className="w-3.5 h-3.5 text-muted-foreground" />
            <span>KOT Queue: {tickets.length}</span>
          </div>
        </div>
      </div>

      {/* ─── KDS Tickets Queue ─── */}
      <div className="flex-1 overflow-x-auto overflow-y-auto mt-6 pb-2 flex gap-6 select-none items-start">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground animate-pulse text-xs font-bold uppercase tracking-wider mt-10">
            <ChefHat className="w-8 h-8 mb-2 animate-spin text-rose-500" />
            Connecting to active kitchen queues...
          </div>
        ) : tickets.length === 0 ? (
          <div className="w-[100vw] h-[80vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Utensils className="w-8 h-8 text-muted-foreground/30 mb-1 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-center text-foreground">Hot Kitchen is Empty!</span>
            <p className="text-muted-foreground text-[11px] font-medium text-center">No pending Dine-In KOTs or Takeaway orders found in the queue.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const elapsed = getElapsedTime(ticket.created_at);
            const isUrgent = elapsed >= 15;

            const formattedTable = ticket.dining_type === 'dine_in'
              ? (ticket.table?.table_number
                ? `DINE IN - Table ${ticket.table.table_number.toUpperCase()}`
                : 'DINE IN')
              : 'TAKEAWAY';

            return (
              <div
                key={ticket.id}
                className={cn(
                  "w-[300px] flex flex-col shrink-0 overflow-hidden shadow-sm transition-all duration-300 rounded-xl border-2 bg-white dark:bg-slate-900",
                  isUrgent
                    ? "border-rose-500/50 shadow-md shadow-rose-500/10 dark:border-rose-500/40"
                    : "border-rose-300 dark:border-rose-800"
                )}
              >
                {/* Ticket Header */}
                <div className={cn(
                  "px-4 py-3 flex justify-between items-start shrink-0 border-b",
                  isUrgent ? "bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50" : "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800"
                )}>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase leading-none">
                      {formattedTable}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{ticket.invoice_number}</span>
                  </div>

                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border",
                    isUrgent
                      ? "bg-rose-200 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse"
                      : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                  )}>
                    <Clock className="w-3.5 h-3.5" />
                    {elapsed} min
                  </div>
                </div>

                {/* Ticket Ordered Items list (NO scrolling, full height) */}
                <div className="flex flex-col p-4 gap-3 bg-white dark:bg-slate-900">
                  {ticket.items?.map((item) => {
                    const statusStyles = {
                      pending: "text-slate-500 bg-slate-50 border-slate-100 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-800",
                      preparing: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-900/50",
                      ready: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900/50",
                      served: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-900/50"
                    };

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleUpdateItemStatus(item.id, item.cooking_status)}
                        className={cn(
                          "py-2 transition-all cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          // add a subtle border between items except the last one
                          "border-b border-slate-100 dark:border-slate-800 last:border-0"
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-tight flex items-center flex-wrap gap-2">
                              <span>
                                {parseFloat(item.quantity || 0).toLocaleString()} x {item.product_name || item.product?.name || item.name || "Item"}
                                {(item.variant?.name || item.variant_name) && (
                                  <span className="ml-1 text-slate-500 dark:text-slate-400">({item.variant?.name || item.variant_name})</span>
                                )}
                              </span>
                              
                              {new Date(item.created_at).getTime() - new Date(ticket.created_at).getTime() > 10000 && (!item.cooking_status || item.cooking_status === 'pending') && (
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black bg-emerald-500 text-white shadow-sm shrink-0 uppercase tracking-wider leading-none animate-pulse">
                                  New
                                </span>
                              )}
                            </span>
                          </div>

                          {(item.cooking_status !== 'pending' && item.cooking_status) && (
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0",
                              statusStyles[item.cooking_status] || statusStyles.pending
                            )}>
                              {item.cooking_status}
                            </span>
                          )}
                        </div>

                        {item.cooking_notes && (
                          <div className="mt-2 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="leading-tight">Note: {item.cooking_notes}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Ticket Action Button Footer */}
                <div className="p-4 bg-white dark:bg-slate-900 flex shrink-0">
                  {ticket.kot_status === "sent_to_kitchen" && (
                    <Button
                      onClick={() => handleUpdateTicketStatus(ticket.id, "preparing")}
                      className="w-full bg-[#E57A00] hover:bg-[#CC6D00] text-white rounded-xl font-bold text-xs uppercase tracking-widest h-10 shadow-none"
                    >
                      Start Cooking
                    </Button>
                  )}

                  {ticket.kot_status === "preparing" && (
                    <Button
                      onClick={() => handleUpdateTicketStatus(ticket.id, "ready")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-10 shadow-none"
                    >
                      All Items Ready
                    </Button>
                  )}

                  {ticket.kot_status === "ready" && (
                    <Button
                      onClick={() => handleUpdateTicketStatus(ticket.id, "served")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest h-10 shadow-none"
                    >
                      Mark as Served
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
