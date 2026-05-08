"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Tag, Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";

const BatchSelectorDialog = ({ isOpen, onOpenChange, batches, onSelect, productName }) => {
  const { t } = useTranslation();

  if (!batches || batches.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{productName}</DialogTitle>
              <DialogDescription className="text-xs">
                {t("pos.multiple_batches_found")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-6 pt-2">
          <div className="space-y-3">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => onSelect(batch)}
                className="group relative flex flex-col p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors">
                      {batch.batch_number || "Default Batch"}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] h-4 px-1 bg-background">
                        Stock: {parseFloat(batch.quantity).toFixed(2)}
                      </Badge>
                      {batch.expiry_date && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(batch.expiry_date), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">
                      LKR {parseFloat(batch.selling_price).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Selling Price</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                            Cost: LKR {parseFloat(batch.cost_price).toFixed(2)}
                        </span>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                        Select Batch
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-muted/10 border-t border-border/40 text-center">
            <p className="text-[10px] text-muted-foreground mb-3 flex items-center justify-center gap-1">
                <Info className="h-3 w-3" />
                Select the correct batch price based on the product label.
            </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground">
            {t("common.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchSelectorDialog;
