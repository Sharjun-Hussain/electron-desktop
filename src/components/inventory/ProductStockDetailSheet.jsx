"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Copy, Barcode as BarcodeIcon, Calendar, Box, Tag, ExternalLink, Activity, Info, TrendingUp, History, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/auth/DesktopAuthProvider";

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { label: 'Normal', color: 'bg-emerald-500' };
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: 'Expired', color: 'bg-red-500' };
  if (diffDays <= 30) return { label: 'Critical', color: 'bg-orange-500' };
  if (diffDays <= 90) return { label: 'Warning', color: 'bg-amber-500' };
  return { label: 'Normal', color: 'bg-emerald-500' };
};

export default function ProductStockDetailSheet({ isOpen, onClose, selectedItem, formatCurrency }) {
  const { data: session } = useSession();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedItem) {
      if (selectedItem.batches && Array.isArray(selectedItem.batches) && selectedItem.batches.length > 0) {
        setBatches(selectedItem.batches);
      } else {
        // Fallback: If no batches are attached, try to extract it if the item itself is a batch (from Watchlist)
        if (selectedItem.batch_number) {
            setBatches([selectedItem]);
        } else {
            setBatches([]);
        }
      }
    }
  }, [isOpen, selectedItem]);

  if (!selectedItem) return null;

  const product = selectedItem.product || {};
  const variant = selectedItem.variant || {};
  
  const isVariantProduct = variant.name && variant.name !== 'Default';
  const mainName = isVariantProduct ? variant.name : product.name || 'Unknown Product';
  const subName = isVariantProduct ? product.name : (variant.name || "Standard");

  const barcodeVal = variant.barcode || product.barcode;
  const skuVal = variant.sku || product.code;

  // Calculate totals
  const totalQty = batches.reduce((sum, b) => sum + parseFloat(b.quantity || 0), 0) || parseFloat(selectedItem.quantity || 0);
  const stockThreshold = parseFloat(variant.low_stock_threshold || 10);
  
  const globalStatus = 
    totalQty <= 0 ? { label: "Out of Stock", style: "bg-red-100 text-red-700 border-red-200" } :
    totalQty <= stockThreshold ? { label: "Low Stock", style: "bg-amber-100 text-amber-700 border-amber-200" } :
    { label: "Healthy", style: "bg-emerald-100 text-emerald-700 border-emerald-200" };

  const costPrice = parseFloat(variant.cost_price || 0);
  const sellingPrice = parseFloat(variant.price || 0);
  
  const totalValue = totalQty * costPrice;
  const totalRevenue = totalQty * sellingPrice;
  const marginStr = costPrice > 0 ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1) : "100.0";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl xl:max-w-5xl overflow-y-auto bg-slate-50 dark:bg-slate-950 p-0 border-l border-border scale-in-slide-right data-[state=closed]:slide-out-to-right">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-border/50 p-6 shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="p-3.5 bg-linear-to-br from-indigo-50 to-white dark:from-indigo-500/20 dark:to-slate-800 rounded-2xl shadow-sm border border-indigo-100/50 dark:border-indigo-500/20 shrink-0">
                        <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{mainName}</h2>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">{subName}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="outline" className={cn("px-2.5 py-0.5 font-bold shadow-xs", globalStatus.style)}>
                                <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", globalStatus.style.replace('bg-', 'bg-').split(' ')[0].replace('100', '500'))} />
                                {globalStatus.label}
                            </Badge>
                            
                            {skuVal && (
                                <span className="text-[11px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-bold border border-slate-200 dark:border-slate-700 shadow-xs">
                                    SKU: {skuVal}
                                </span>
                            )}
                            
                            {barcodeVal && (
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(barcodeVal);
                                        toast.success("Barcode copied to clipboard");
                                    }}
                                    className="text-[11px] flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 active:scale-95 transition-all shadow-xs cursor-pointer group"
                                >
                                    <BarcodeIcon className="h-3 w-3" />
                                    {barcodeVal}
                                    <Copy className="h-3 w-0 opacity-0 -ml-1 group-hover:ml-0 group-hover:opacity-100 group-hover:w-3 transition-all" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <SheetClose className="rounded-full p-2.5 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors group">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </SheetClose>
            </div>
        </div>

        <div className="p-6 space-y-8">
            {/* High-Level Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Box className="h-4 w-4" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total On-Hand</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white truncate tabular-nums">
                        {totalQty.toFixed(2)}
                    </p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Threshold</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white truncate tabular-nums">
                        {stockThreshold}
                    </p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Tag className="h-4 w-4" />
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Cost Value</span>
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white truncate tabular-nums">
                        {formatCurrency(totalValue)}
                    </p>
                </div>

                <div className="bg-linear-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 border border-emerald-400 dark:border-emerald-500 rounded-xl p-4 shadow-md flex flex-col justify-between text-white">
                    <div className="flex items-center gap-2 text-emerald-50 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-bold">Est. Revenue</span>
                    </div>
                    <p className="text-xl font-bold truncate tabular-nums text-white">
                        {formatCurrency(totalRevenue)}
                    </p>
                </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white dark:bg-slate-900 border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-border flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-500" />
                    <h3 className="text-[15px] font-bold text-slate-700 dark:text-slate-300">Master Pricing Profile</h3>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-1">Base Cost</p>
                        <p className="text-sm font-bold">{formatCurrency(costPrice)}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-1">Default Selling</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(sellingPrice)}</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-1">Profit Margin</p>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                           {marginStr}%
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Batch Ledger */}
            <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <History className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Batch Ledger</h3>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-border shadow-sm rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-bold text-sm text-slate-500">Batch ID</TableHead>
                                <TableHead className="font-bold text-sm text-slate-500">Expiry Date</TableHead>
                                <TableHead className="font-bold text-sm text-slate-500">Supplier</TableHead>
                                <TableHead className="text-right font-bold text-sm text-slate-500">Quantity</TableHead>
                                <TableHead className="text-right font-bold text-sm text-slate-500">Cost (Rs)</TableHead>
                                <TableHead className="text-right font-bold text-sm text-slate-500">Sales (Rs)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.length > 0 ? (
                                batches.map((batch, idx) => {
                                    const rawQty = parseFloat(batch.quantity || 0);
                                    let status = { label: 'Normal', color: 'bg-emerald-500' };
                                    
                                    if (rawQty <= 0) {
                                        status = { label: 'Depleted', color: 'bg-slate-300 text-slate-700' };
                                    } else if (batch.expiration_status) {
                                        switch(batch.expiration_status) {
                                            case 'expired': status = { label: 'Expired', color: 'bg-red-500' }; break;
                                            case 'critical': status = { label: 'Critical', color: 'bg-orange-500' }; break;
                                            case 'warning': status = { label: 'Warning', color: 'bg-amber-500' }; break;
                                        }
                                    } else {
                                        status = getExpiryStatus(batch.expiry_date);
                                    }

                                    return (
                                        <TableRow key={batch.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                                                        {batch.batch_number || "B-Unknown"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    {batch.expiry_date ? (
                                                        <span className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                            {new Date(batch.expiry_date).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">No Expiry</span>
                                                    )}
                                                    {rawQty > 0 && (
                                                        <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white shadow-xs", status.color, status.color.includes('text') ? 'bg-slate-100 text-slate-600 border border-slate-200' : '')}>
                                                            {status.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm text-slate-600 dark:text-slate-300">
                                                {batch.Supplier?.name || batch.supplier?.name || <span className="text-slate-400 italic text-xs">N/A</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn("text-sm font-bold", rawQty <= 0 ? "text-slate-400" : "text-slate-900 dark:text-white")}>
                                                    {rawQty.toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-sm text-slate-600 dark:text-slate-300 tabular-nums">
                                                {formatCurrency(batch.cost_price || 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                {formatCurrency(batch.mrp_price || batch.selling_price || batch.price || 0)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 dark:text-slate-400 italic">
                                        No active batches found for this product.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            <div className="flex justify-center pb-8 pt-4">
               {/* Could add actionable buttons here later (e.g. Master Edit overlay) */}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
