"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  Layers, 
  Calendar, 
  Barcode, 
  Warehouse,
  History,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "@/lib/date-utils";
import { useSession } from "@/components/auth/DesktopAuthProvider";

export const StockBatchSheet = ({ isOpen, onClose, stock }) => {
  const { data: session } = useSession();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!stock || !isOpen || !session?.accessToken) return;
      
      setLoading(true);
      try {
        // Fetch batches for this specific variant and branch
        const params = new URLSearchParams({
            branch_id: stock.branch_id,
        });
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${stock.product_variant_id}/batches?${params.toString()}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        
        const data = await res.json();
        if (data.status === "success") {
          setBatches(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [stock, isOpen, session]);

  if (!stock) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-xl w-[95vw] p-0 overflow-hidden flex flex-col border-none shadow-2xl rounded-l-3xl">
        <SheetHeader className="p-8 pb-6 bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background shrink-0">
          <div className="flex items-start gap-5">
            <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
              <Layers className="size-8 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 text-[10px] font-bold uppercase tracking-wider">
                  Batch Repository
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                  <Warehouse className="size-3" />
                  {stock.branch?.name}
                </div>
              </div>
              <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">
                {stock.product?.name}
              </SheetTitle>
              <SheetDescription className="text-xs font-semibold text-slate-500 flex items-center gap-2 mt-1">
                {stock.variant?.name || "Standard Unit"} • {stock.variant?.sku || stock.product?.code}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
              <Loader2 className="size-8 animate-spin text-emerald-600" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Batch Data...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-8 h-full">
              <div className="py-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <TrendingUp className="size-3" /> On Hand
                    </p>
                    <p className="text-2xl font-black text-emerald-700 tabular-nums">
                      {parseFloat(stock.quantity).toLocaleString()}
                      <span className="text-xs font-bold ml-1 opacity-60">Units</span>
                    </p>
                  </div>
                  <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="size-3" /> active batches
                    </p>
                    <p className="text-2xl font-black text-amber-700 tabular-nums">
                      {batches.length}
                    </p>
                  </div>
                </div>

                {/* Batches List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <History className="size-4" /> Batch Segmentation
                    </h3>
                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tighter">Current Stock</Badge>
                  </div>

                  <div className="space-y-3">
                    {batches.length > 0 ? (
                      batches.map((batch, idx) => {
                        const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date();
                        return (
                          <div key={idx} className="group relative flex items-center justify-between p-4 rounded-3xl border border-border/60 bg-card hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className={`size-10 rounded-2xl flex items-center justify-center transition-colors ${isExpired ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-600'}`}>
                                <Barcode className="size-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  #{batch.batch_number || "DEF-BATCH"}
                                  {isExpired && <Badge variant="destructive" className="h-4 text-[8px] font-black uppercase px-1 rounded-sm">Expired</Badge>}
                                </p>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                                    <Calendar className="size-3" />
                                    {batch.expiry_date ? format(new Date(batch.expiry_date), 'dd MMM yyyy') : 'No Expiry'}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                    Sell: LKR {parseFloat(batch.selling_price || 0).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                    Cost: LKR {parseFloat(batch.cost_price || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-black tabular-nums ${parseFloat(batch.quantity) <= 0 ? 'text-muted-foreground' : 'text-slate-900 dark:text-white'}`}>
                                {parseFloat(batch.quantity).toLocaleString()}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Units Remaining</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-[32px] bg-muted/10 opacity-60">
                        <Package className="size-10 text-muted-foreground mb-3 opacity-20" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No Batch Data Found</p>
                        <p className="text-[10px] text-muted-foreground mt-1">This product may not have batch tracking enabled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-border shrink-0">
          <div className="flex items-center gap-3 text-muted-foreground/60">
            <AlertCircle className="size-4" />
            <p className="text-[10px] font-medium leading-relaxed">
              Batch information is strictly branch-specific. Prices and quantities shown represent the current physical allocation for <span className="font-bold text-foreground">{stock.branch?.name}</span>.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
