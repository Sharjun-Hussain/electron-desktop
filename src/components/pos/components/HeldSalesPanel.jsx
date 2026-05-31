import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import clsx from "clsx";

export const HeldSalesPanel = ({ sales, isLoading, onResume, onDelete, t }) => {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  const drafts = (sales || []).filter(s => s.status === 'draft');

  if (!drafts || drafts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 opacity-10">
        <ShoppingBag className="h-8 w-8 mb-2" strokeWidth={1.5} />
        <p className="text-[10px] uppercase">No Drafts</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent">
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/10">
          {drafts.map((sale) => {
            const amount = parseFloat(sale.net_total || sale.payable_amount || 0);
            const date = new Date(sale.created_at);
            const sessionCode = sale.id.slice(-4).toUpperCase();

            return (
              <div
                key={sale.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5 hover:bg-emerald-500/5 transition-colors group cursor-pointer border-b border-border/5"
                onClick={() => onResume(sale)}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">#{sessionCode}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{sale.customer_name || "Guest Checkout"}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-foreground">
                    {amount.toFixed(2)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sale.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

