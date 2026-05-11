"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  Loader2, 
  Plus, 
  Trash2, 
  PackagePlus, 
  X, 
  Search,
  AlertCircle,
  CheckCircle2,
  Package,
  CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Memoized Row Component for Performance ---
const StockItemRow = React.memo(({ 
  item, 
  index, 
  products, 
  updateItem, 
  removeItem 
}) => {
  const productObj = useMemo(() => products.find(p => p.id === item.productId), [products, item.productId]);
  const variants = useMemo(() => productObj?.variants || [], [productObj]);

  return (
    <tr className="group border-b transition-colors hover:bg-muted/30">
      <td className="py-4 pl-4 min-w-[300px]">
        <div className="space-y-2">
          <Select 
            value={item.productId} 
            onValueChange={(v) => updateItem(index, "productId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{p.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {variants.length > 0 && (
            <Select 
              value={item.variantId} 
              onValueChange={(v) => updateItem(index, "variantId", v)}
            >
              <SelectTrigger className="h-8 text-[10px] bg-muted/30 border-dashed">
                <SelectValue placeholder="Select Variant" />
              </SelectTrigger>
              <SelectContent>
                {variants.map(v => (
                  <SelectItem key={v.id} value={v.id} className="text-[10px]">
                    {v.name || v.sku || "Default Variant"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </td>
      <td className="py-4 px-2 w-[140px]">
        <Input 
          className="shadow-sm" 
          placeholder="Batch #" 
          value={item.batchNumber}
          onChange={(e) => updateItem(index, "batchNumber", e.target.value)}
        />
      </td>
      <td className="py-4 px-2 w-[160px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !item.expiryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate text-xs">
                {item.expiryDate ? format(new Date(item.expiryDate), "dd MMM yyyy") : "Expiry Date"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={item.expiryDate ? new Date(item.expiryDate) : undefined}
              onSelect={(date) => updateItem(index, "expiryDate", date ? format(date, "yyyy-MM-dd") : "")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>
      <td className="py-4 px-2 w-[100px]">
        <Input 
          type="number" 
          className="text-center font-bold text-emerald-600 border-emerald-500/20 shadow-sm" 
          placeholder="0"
          value={item.quantity}
          onChange={(e) => updateItem(index, "quantity", e.target.value)}
        />
      </td>
      <td className="py-4 px-2 w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">RS</span>
             <Input 
                type="number" 
                className="pl-8 shadow-sm" 
                placeholder="0.00"
                value={item.costPrice}
                onChange={(e) => updateItem(index, "costPrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 px-2 w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">RS</span>
             <Input 
                type="number" 
                className="pl-8 shadow-sm" 
                placeholder="0.00"
                value={item.wholesalePrice}
                onChange={(e) => updateItem(index, "wholesalePrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 px-2 w-[120px]">
        <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">RS</span>
             <Input 
                type="number" 
                className="pl-8 font-semibold text-emerald-600 shadow-sm" 
                placeholder="0.00"
                value={item.sellingPrice}
                onChange={(e) => updateItem(index, "sellingPrice", e.target.value)}
            />
        </div>
      </td>
      <td className="py-4 pr-4 pl-3 text-right">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => removeItem(index)} 
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});

StockItemRow.displayName = "StockItemRow";

export function OpeningStockSheet({ open, onOpenChange, accessToken }) {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [items, setItems] = useState([
    { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }
  ]);

  const fetchMetadata = useCallback(async () => {
    try {
      setMetadataLoading(true);
      const [branchRes, productRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/active/list?branch_id=${selectedBranch || ""}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ]);

      const branchData = await branchRes.json();
      const productData = await productRes.json();

      if (branchData.status === "success") setBranches(branchData.data || []);
      if (productData.status === "success") setProducts(productData.data || []);
    } catch (error) {
      console.error("Failed to fetch metadata", error);
      toast.error("Failed to load metadata");
    } finally {
      setMetadataLoading(false);
    }
  }, [accessToken, selectedBranch]);

  useEffect(() => {
    if (open && accessToken) {
      fetchMetadata();
    }
  }, [open, accessToken, fetchMetadata]);

  const addItem = () => {
    setItems(prev => [...prev, { productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
  };

  const removeItem = useCallback((index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index, field, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // If product changed, reset variant
      if (field === "productId") {
        newItems[index].variantId = "";
      }
      return newItems;
    });
  }, []);

  const handleSubmit = async () => {
    if (!selectedBranch) {
      toast.error("Please select a branch");
      return;
    }

    if (items.some(i => !i.productId || !i.quantity)) {
      toast.error("Required fields missing (Product/Quantity)");
      return;
    }

    try {
      setLoading(true);
      const payload = {
          branch_id: selectedBranch,
          items: items.map(i => ({
              product_id: i.productId,
              product_variant_id: i.variantId || null,
              quantity: parseFloat(i.quantity),
              cost_price: parseFloat(i.costPrice || 0),
              selling_price: parseFloat(i.sellingPrice || 0),
              wholesale_price: parseFloat(i.wholesalePrice || 0),
              batch_number: i.batchNumber || null,
              expiry_date: i.expiryDate || null
          }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/opening-stock`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === "success") {
          toast.success("Opening stock recorded!");
          onOpenChange(false);
          setItems([{ productId: "", variantId: "", quantity: "", costPrice: "", sellingPrice: "", wholesalePrice: "", batchNumber: "", expiryDate: "" }]);
      } else {
          toast.error(result.message || "Failed to save stock");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-7xl p-0 flex flex-col bg-background border-l shadow-2xl">
        {/* HEADER */}
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                <PackagePlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  Stock Opening
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-0.5">
                  Initialize inventory levels across your organization's branches.
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-6 border-r">
                <Label className="text-sm font-medium">Target Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[200px] h-10">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Entries</span>
                  <span className="text-sm font-bold text-emerald-600">{items.length}</span>
                </div>
                <Button 
                  size="icon"
                  onClick={addItem} 
                  className="h-10 w-10 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm rounded-lg transition-all active:scale-95"
                >
                  <Plus className="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Optimized Content Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 thin-scrollbar">
          <div className="min-w-full inline-block align-middle">
            <div className="relative rounded-t-xl border-x border-t border-border overflow-hidden bg-background/50">
              {metadataLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="size-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground ">Warming engine...</p>
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900 border-b border-border">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-left">
                      <th className="py-3 pr-3 pl-4 border-b border-border/60">Product Details</th>
                      <th className="py-3 px-2 border-b border-border/60">Batch Number</th>
                      <th className="py-3 px-2 border-b border-border/60">Expiry Date</th>
                      <th className="py-3 px-2 border-b border-border/60 text-center">Qty</th>
                      <th className="py-3 px-2 border-b border-border/60">Cost</th>
                      <th className="py-3 px-2 border-b border-border/60">Wholesale</th>
                      <th className="py-3 px-2 border-b border-border/60">Retail</th>
                      <th className="py-3 pl-3 border-b border-border/60 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <StockItemRow 
                        key={`${index}-${item.productId}`} 
                        item={item} 
                        index={index} 
                        products={products} 
                        updateItem={updateItem} 
                        removeItem={removeItem} 
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {!metadataLoading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-40">
                    <Package className="size-12" />
                    <p className="font-bold  text-xs">No entries recorded</p>
                </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium italic">Changes will update physical stock levels immediately.</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto font-semibold"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto min-w-[160px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalize Records
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
