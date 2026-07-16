"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Tag, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { isValid } from "date-fns";
import { format } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const BatchSelectorDialog = ({ isOpen, onOpenChange, batches, onSelect, productName }) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Keyboard Navigation
  useEffect(() => {
    if (!isOpen || !batches?.length) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < batches.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : batches.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          onSelect(batches[selectedIndex]);
          break;
        case "Escape":
          // Dialog component handles this by default via onOpenChange
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, batches, selectedIndex, onSelect]);

  if (!batches || batches.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[450px] p-4 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950 rounded-xl max-h-[80vh] flex flex-col"
      >
        {/* Content Area - Minimalist List Only */}
        <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex justify-between items-center">
              <span>Select Batch</span>
              <span className="text-emerald-600 lowercase font-medium italic">{productName}</span>
            </h3>
            
            <ScrollArea className="flex-1 pr-2">
                <div className="space-y-2 pb-2">
                    {batches.map((batch, idx) => (
                        <div
                            key={batch.id}
                            onClick={() => onSelect(batch)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={cn(
                              "group relative flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer overflow-hidden border",
                              idx === selectedIndex 
                                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.02] z-10" 
                                : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
                            )}
                        >
                            <div className="flex flex-col gap-1 z-10">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "text-[13px] font-black transition-colors uppercase",
                                      idx === selectedIndex ? "text-white" : "text-slate-900 dark:text-white"
                                    )}>
                                        {batch.batch_number || "Default Batch"}
                                    </span>
                                    {batch.expiry_date && (
                                        <span className={cn(
                                          "text-[9px] font-bold",
                                          idx === selectedIndex ? "text-white/70" : "text-slate-400"
                                        )}>
                                            EXP: {isValid(new Date(batch.expiry_date)) ? format(new Date(batch.expiry_date), "dd/MM/yy") : "N/A"}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase",
                                      idx === selectedIndex ? "text-white/80" : "text-slate-400"
                                    )}>
                                        Stock: <span className={cn("font-mono", idx === selectedIndex ? "text-white" : "text-slate-600 dark:text-slate-300")}>{parseFloat(batch.quantity).toFixed(0)}</span>
                                    </span>
                                    <span className={cn("text-[10px] font-bold uppercase opacity-40", idx === selectedIndex ? "text-white/40" : "text-slate-400")}>|</span>
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase",
                                      idx === selectedIndex ? "text-white/80" : "text-slate-400"
                                    )}>
                                        Cost: <span className={cn("font-mono", idx === selectedIndex ? "text-white" : "text-slate-600 dark:text-slate-300")}>{parseFloat(batch.cost_price).toFixed(2)}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="text-right z-10">
                                <p className={cn(
                                  "text-xl font-black font-mono tracking-tighter",
                                  idx === selectedIndex ? "text-white" : "text-emerald-600"
                                )}>
                                    {parseFloat(batch.selling_price).toFixed(2)}
                                </p>
                            </div>

                            {idx === selectedIndex && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20">
                                <ChevronRight className="h-8 w-8" />
                              </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSelectorDialog;
