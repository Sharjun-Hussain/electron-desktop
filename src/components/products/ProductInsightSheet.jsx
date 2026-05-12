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
  History, 
  Layers, 
  Truck, 
  Warehouse, 
  Calendar, 
  DollarSign, 
  Barcode, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export const ProductInsightSheet = ({ isOpen, onClose, insightData }) => {
  if (!insightData) return null;

  const { type, data, purchaseHistory } = insightData;
  const product = type === 'variant' ? data.product : data;
  const variant = type === 'variant' ? data : null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden flex flex-col border-none shadow-2xl rounded-l-3xl">
        {/* Header Section */}
        <SheetHeader className="p-6 bg-linear-to-br from-slate-50 to-white dark:from-slate-900 dark:to-background shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Package className="size-8 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 text-[10px] font-bold uppercase tracking-wider">
                  Existing {type === 'variant' ? 'Variant' : 'Product'}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                  <Barcode className="size-3" />
                  {data.barcode}
                </div>
              </div>
              <SheetTitle className="text-xl font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">
                {product?.name} {variant && `- ${variant.name}`}
              </SheetTitle>
              <SheetDescription className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
                {product?.main_category?.name} • {product?.brand?.name || "No Brand"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                  <Warehouse className="size-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Stock</span>
                </div>
                <p className="text-2xl font-black text-blue-700">
                  {type === 'variant' 
                    ? data.stocks?.reduce((acc, s) => acc + parseFloat(s.quantity), 0) || 0
                    : data.variants?.reduce((acc, v) => acc + (v.stocks?.reduce((a, s) => a + parseFloat(s.quantity), 0) || 0), 0) || 0
                  }
                  <span className="text-xs font-bold ml-1 opacity-60 text-blue-500">{product?.unit?.name || 'Units'}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <TrendingUp className="size-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Selling Price</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">
                  LKR {parseFloat(data.price || 0).toLocaleString()}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-2 text-orange-600">
                  <AlertCircle className="size-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Active Batches</span>
                </div>
                <p className="text-2xl font-black text-orange-700">
                  {type === 'variant' 
                    ? data.batches?.length || 0
                    : data.variants?.reduce((acc, v) => acc + (v.batches?.length || 0), 0) || 0
                  }
                </p>
              </div>
            </div>

            {/* Current Batches Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Layers className="size-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Active Batches</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">In-Stock Only</Badge>
              </div>
              
              <div className="space-y-2">
                {(type === 'variant' ? data.batches : data.variants?.flatMap(v => v.batches))?.map((batch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
                        <Barcode className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">#{batch.batch_number}</p>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                          <Calendar className="size-3" />
                          Exp: {batch.expiry_date ? format(new Date(batch.expiry_date), 'dd MMM yyyy') : 'No Expiry'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{parseFloat(batch.quantity).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Remaining</p>
                    </div>
                  </div>
                ))}
                {(!insightData.data.batches && !insightData.data.variants?.some(v => v.batches?.length > 0)) && (
                   <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                     <p className="text-xs font-medium text-slate-400">No active batches found in the system</p>
                   </div>
                )}
              </div>
            </section>

            {/* Purchase History Section */}
            <section className="space-y-4 pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <History className="size-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Recent Purchase History</h3>
                </div>
              </div>

              <div className="relative">
                {purchaseHistory && purchaseHistory.length > 0 ? (
                  <div className="space-y-4">
                    {purchaseHistory.map((item, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 pb-2">
                        <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500" />
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-md">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                                {format(new Date(item.created_at), 'dd MMM yyyy')}
                              </p>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Truck className="size-3.5" />
                                {item.purchase_order?.supplier?.name || "Unknown Supplier"}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Cost Price</p>
                              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                                LKR {parseFloat(item.unit_price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <p className="text-[10px] font-medium text-slate-500">
                              Order: <span className="font-bold text-slate-700 dark:text-slate-300">#{item.purchase_order?.order_number || "N/A"}</span>
                            </p>
                            <p className="text-[10px] font-medium text-slate-500">
                              Qty: <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity} {product?.unit?.name}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <p className="text-xs font-medium text-slate-400">No purchase records found for this product</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={onClose}
            className="w-full h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            I Understand, Continue
            <ArrowRight className="size-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
