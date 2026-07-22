"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw, Package, Receipt, Calendar, CreditCard, Banknote, AlertCircle, RefreshCw, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useSWRConfig } from "swr";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useSettingsStore } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";

export function SalesReturnModal({ isOpen, onOpenChange, flattenedVariants, allProducts }) {
  const { t } = useTranslation();
  const searchInputRef = useRef(null);
  const barcodeBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  
  const { data: nextAuthSession } = useSession();
  const { session: localSession } = useSettingsStore();
  const session = nextAuthSession || localSession;

  const [searchQuery, setSearchQuery] = useState("");
  const [returnItems, setReturnItems] = useState([]);
  const [notes, setNotes] = useState("");
  
  const [recentSales, setRecentSales] = useState([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setSearchQuery("");
    barcodeBufferRef.current = "";
    setReturnItems([]);
    setNotes("");
    setRecentSales([]);
    setSelectedSaleId(null);
  };

  const fetchRecentSales = useCallback(async (productId) => {
    if (!productId) return;
    setIsLoadingSales(true);
    setRecentSales([]);
    setSelectedSaleId(null);
    try {
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      // Use local date strings (YYYY-MM-DD) to match the server's timezone, not UTC
      const pad = (n) => String(n).padStart(2, "0");
      const toLocalDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const start_date = toLocalDate(threeDaysAgo);
      const end_date = toLocalDate(today);

      console.log(`[SalesReturn] Fetching history for product ${productId} from ${start_date} to ${end_date}`);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?product_id=${productId}&start_date=${start_date}&end_date=${end_date}&status=completed&size=50`,
        { headers: { Authorization: `Bearer ${session?.accessToken}` } }
      );
      const result = await res.json();
      console.log(`[SalesReturn] API result:`, result);
      
      setRecentSales(result.data?.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch recent sales history");
    } finally {
      setIsLoadingSales(false);
    }
  }, [session?.accessToken]);

  const processBarcode = useCallback((code) => {
    let match = flattenedVariants?.find(v => v.barcode === code || v.sku === code);
    
    // Auto-scale barcode detection (20 prefix, 13 chars long)
    let finalQuantity = 1;
    if (!match && code.startsWith("20") && code.length === 13) {
      const productId = code.substring(2, 7);
      const weight = parseInt(code.substring(7, 12), 10) / 1000;
      match = flattenedVariants?.find(v => v.barcode === productId);
      if (match) {
        finalQuantity = weight || 1;
      }
    }

    if (!match) {
      match = flattenedVariants?.find(v => v.fullName?.toLowerCase().includes(code.toLowerCase()));
    }

    if (match) {
      setReturnItems(prev => {
        const existing = prev.find(item => item.id === match.id);
        // Only fetch sales history when first item is added
        if (!existing && prev.length === 0) {
          fetchRecentSales(match.productId);
        }
        const basePrice = match.retailPrice || match.price || 0;
        if (existing) {
          return prev.map(item => item.id === match.id ? { ...item, returnQuantity: item.returnQuantity + finalQuantity } : item);
        }
        return [{ ...match, returnQuantity: finalQuantity, returnPrice: basePrice }, ...prev];
      });
      
      setSearchQuery("");
    } else {
      toast.error("Product not found");
    }
  }, [flattenedVariants, fetchRecentSales]);

  // Global keydown listener for rapid hardware barcode scanning
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Handle rapid barcode scanner
      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = "";
        e.preventDefault();
        processBarcode(code);
        return;
      }

      // Build the rapid scan string
      if (diff < 50 && e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      } else {
        barcodeBufferRef.current = e.key.length === 1 ? e.key : "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, processBarcode]);

  // Find product logic (for manual input bar type + enter)
  const handleSearchKeys = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      if (barcodeBufferRef.current.length < 4) {
        processBarcode(searchQuery.trim());
      }
    }
  };

  const handleUpdateQuantity = (id, newQty) => {
    const parsed = Number(newQty);
    if (parsed <= 0 || isNaN(parsed)) return;
    setReturnItems(prev => prev.map(item => item.id === id ? { ...item, returnQuantity: parsed } : item));
  };

  const handleRemoveItem = (id) => {
    setReturnItems(prev => {
      const next = prev.filter(item => item.id !== id);
      if (next.length === 0) {
        setRecentSales([]);
        setSelectedSaleId(null);
      } else if (prev[prev.length - 1]?.id === id && next.length > 0) {
        fetchRecentSales(next[next.length - 1].productId);
      }
      return next;
    });
  };

  const handleUpdatePrice = (id, newPrice) => {
    const parsed = Number(newPrice);
    if (parsed < 0 || isNaN(parsed)) return;
    setReturnItems(prev => prev.map(item => item.id === id ? { ...item, returnPrice: parsed } : item));
  };

  const handleProcessReturn = async () => {
    if (returnItems.length === 0) return toast.error("Add at least one product to return");

    setIsSubmitting(true);
    try {
      let totalAmount = 0;
      const itemsPayload = returnItems.map(item => {
        const unit_price = item.returnPrice !== undefined ? item.returnPrice : (item.retailPrice || item.price || 0);
        totalAmount += Number(item.returnQuantity) * Number(unit_price);
        return {
          product_id: item.productId,
          product_variant_id: item.id,
          quantity: Number(item.returnQuantity),
          unit_price: Number(unit_price),
          reason: "Direct Sales Return"
        };
      });

      const payload = {
        sale_id: selectedSaleId || undefined,
        return_date: new Date().toISOString(),
        items: itemsPayload,
        refund_amount: totalAmount,
        refund_method: "cash", 
        notes
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/returns`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}` 
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (result.status === "success" || res.ok) {
        toast.success(selectedSaleId ? "Linked return processed successfully" : "Direct unlinked return processed successfully");
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to process return");
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Network error while processing return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRefundEst = returnItems.reduce((acc, item) => {
    const price = item.returnPrice !== undefined ? item.returnPrice : (item.retailPrice || item.price || 0);
    return acc + (item.returnQuantity * price);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full! sm:max-w-none w-screen h-screen rounded-none flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-full ring-4 ring-red-500/5">
              <RotateCcw className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold font-heading">Sales Return - Multiple Items</DialogTitle>
              <DialogDescription className="text-base mt-1">
                Scan all items to find matched receipts or process direct unlinked returns.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN - Return Cart List */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-muted/10 border-r">
            
            <div className="p-6 border-b shrink-0 bg-card">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-emerald-500" />
                Scan Item Barcode
              </label>
              <Input
                ref={searchInputRef}
                placeholder="Scan barcode or type exact name and press Enter..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length >= 4) {
                    const match = flattenedVariants?.find(v => v.barcode === val.trim() || v.sku === val.trim());
                    if (match) {
                       processBarcode(val.trim());
                    }
                  }
                }}
                onKeyDown={handleSearchKeys}
                className="h-14 text-lg font-medium shadow-sm border-emerald-500/30 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {returnItems.length === 0 ? (
                <div className="flex w-full h-full flex-col items-center justify-center opacity-30 text-center gap-4">
                  <Package className="w-20 h-20" />
                  <p className="font-medium text-lg">Awaiting product scans...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Table Header */}
                  <div className="hidden sm:grid grid-cols-[1fr_120px_100px_100px_40px] gap-4 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider items-center">
                    <div>Item</div>
                    <div className="text-center">Quantity</div>
                    <div className="text-right">Unit Price</div>
                    <div className="text-right">Total</div>
                    <div></div>
                  </div>
                  
                  {returnItems.map(item => (
                    <div key={item.id} className="p-3 sm:p-4 rounded-xl border bg-card shadow-sm flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px_100px_40px] gap-4 items-center animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex-1 min-w-0 w-full">
                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug text-wrap">{item.fullName}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-mono tracking-tight">{item.barcode}</p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto">
                        <span className="sm:hidden text-xs text-muted-foreground font-semibold">QTY:</span>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.returnQuantity - 1)}
                            disabled={item.returnQuantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.returnQuantity}
                            onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                            className="h-8 w-16 text-center font-bold"
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id, item.returnQuantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Unit Price Column */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto text-right">
                        <span className="sm:hidden text-xs text-muted-foreground font-semibold">UNIT:</span>
                        {!selectedSaleId ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.returnPrice !== undefined ? item.returnPrice : (item.retailPrice || item.price || 0)}
                            onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                            className="h-8 w-24 text-right font-medium bg-emerald-500/5 border-emerald-500/20"
                            title="Edit custom unit price"
                          />
                        ) : (
                          <div className="text-sm font-medium">
                            {(item.retailPrice || item.price || 0).toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Total Column */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto text-right">
                        <span className="sm:hidden text-xs text-muted-foreground font-semibold">TOTAL:</span>
                        <div className="font-bold text-emerald-600 text-sm sm:text-base">
                          {((item.returnPrice !== undefined ? item.returnPrice : (item.retailPrice || item.price || 0)) * item.returnQuantity).toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="flex justify-end w-full sm:w-auto">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 w-8 h-8"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-card flex flex-col gap-3 shrink-0">
              <label className="text-sm font-semibold">Return Notes (Optional)</label>
              <Input
                placeholder="Global reason for return..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {/* RIGHT COLUMN - Invoices Match */}
          <div className="w-1/2 flex flex-col overflow-hidden bg-card">
            <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                Matched Invoices (Last 3 Days)
              </h3>
              {isLoadingSales && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              {returnItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-sm">
                  Scan a product to check recent sales history.
                </div>
              ) : isLoadingSales ? (
                <div className="flex-1 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500/50" />
                </div>
              ) : recentSales.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <AlertCircle className="w-12 h-12 text-amber-500/50" />
                  <div>
                    <h4 className="font-semibold text-lg text-foreground">No recent invoices found</h4>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      The primary item wasn't sold in the last 3 days, or all invoices are already fully returned.
                    </p>
                  </div>
                </div>
              ) : (
                recentSales.map((sale) => {
                  // Find if ANY item in returnItems is in this sale
                  const itemsInSale = sale.items?.filter(i => returnItems.some(ri => ri.id === i.product_variant_id || ri.productId === i.product_id)) || [];
                  const isSelected = selectedSaleId === sale.id;

                  return (
                    <div 
                      key={sale.id}
                      onClick={() => setSelectedSaleId(isSelected ? null : sale.id)}
                      className={cn(
                        "p-4 shrink-0 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                        isSelected 
                          ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500 ring-offset-0" 
                          : "border-border hover:border-emerald-500/50 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold font-mono text-emerald-700">{sale.invoice_number}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {new Date(sale.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">Total: {parseFloat(sale.payable_amount || 0).toFixed(2)}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                            {sale.customer ? sale.customer.name : "Guest"}
                          </Badge>
                        </div>
                      </div>
                      
                      {itemsInSale.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-1 text-sm">
                          {itemsInSale.map((item, idx) => {
                            const matchedName = item.product?.name || item.product_variant?.name || "Item";
                            return (
                              <div key={idx} className="flex justify-between text-xs items-center text-muted-foreground">
                                <span className="truncate max-w-[200px]">{matchedName}</span>
                                <div>
                                  <span>Purchased Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t bg-muted/5 flex flex-col xl:flex-row items-center justify-between shrink-0 gap-4">
              <div className="text-sm w-full xl:w-auto text-left gap-1 flex flex-col sm:flex-row items-start sm:items-center">
                <span className="text-muted-foreground mr-2">Return Mode:</span>
                {selectedSaleId ? (
                  <strong className="text-emerald-600 inline-flex items-center gap-1">
                    Linked to Invoice <Receipt className="w-3 h-3" />
                  </strong>
                ) : (
                  <strong className="text-amber-600 inline-flex items-center gap-1 cursor-help" title="Will instantly adjust stock and cash without tying to an invoice.">
                    Unlinked / Direct <AlertCircle className="w-3 h-3" />
                  </strong>
                )}
              </div>
              
              <div className="flex items-center gap-4 w-full xl:w-auto">
                <div className="hidden sm:flex flex-row items-center gap-3">
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Est. Refund:</div>
                  <div className="text-2xl font-black text-white bg-emerald-600/90 px-4 py-1.5 rounded-md shadow-inner border border-emerald-500/50 min-w-[100px] text-center">
                    {totalRefundEst.toFixed(2)}
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  onClick={handleProcessReturn}
                  disabled={returnItems.length === 0 || isSubmitting}
                  className={cn(
                    "px-6 h-12 text-base font-bold shadow-md w-full sm:w-auto shrink-0",
                    selectedSaleId ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <RotateCcw className="w-5 h-5 mr-2" />}
                  Continue
                </Button>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Ensure Badge is imported correctly, usually from ui/badge. We define inline if needed.
function Badge({ children, variant, className }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold max-w-full truncate",
      variant === "outline" ? "border text-foreground" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  );
}
