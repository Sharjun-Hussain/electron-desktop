"use client";

import { memo, forwardRef, useCallback, useRef, useImperativeHandle, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calculator, Maximize, Minimize, X, Plus, Minus, Trash2, Weight, Ruler, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";

// ─── CartItemCard ──────────────────────────────────────────────────────────────
// Highlight is done with CSS :focus-within — zero re-renders for keyboard nav.
export const CartItemCard = memo(
  forwardRef(({ item, dispatch, onEnterPress, isRestaurant }, ref) => {
    const netTotal = (item.price * item.quantity * (1 - item.discount / 100)) - (item.discount_amt || 0);
    const qtyRef = useRef(null);
    const discRef = useRef(null);
    const amtDiscRef = useRef(null);
    const { t } = useTranslation();

    useImperativeHandle(ref, () => ({
      focusQty: () => {
        qtyRef.current?.focus();
        qtyRef.current?.select?.();
      },
      focusDiscount: () => {
        discRef.current?.focus();
        discRef.current?.select?.();
      },
      focusAmountDiscount: () => {
        amtDiscRef.current?.focus();
        amtDiscRef.current?.select?.();
      },
    }));

    const handleQuantityChange = useCallback((valString) => {
      if (valString === "") return;
      const quantity = Math.max(0, Number(valString));
      dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, quantity } });
    }, [dispatch, item.id]);

    const handleDiscountChange = useCallback((val) => {
      const discount = Math.max(0, Math.min(100, val));
      dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, discount } });
    }, [dispatch, item.id]);

    const handleDiscountAmtChange = useCallback((val) => {
      const discount_amt = Math.max(0, val);
      dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, discount_amt } });
    }, [dispatch, item.id]);

    const isWeighted = ["kg", "g", "l", "m"].includes(item.unit?.toLowerCase());
    const [isWeighing, setIsWeighing] = useState(false);

    const formatWeight = (qty, unit) => {
      if (!qty || !unit) return "";
      const u = unit.toLowerCase();
      if (u === "kg") {
        if (qty < 1) return `${(qty * 1000).toFixed(0)} g`;
        return `${qty} Kg`;
      }
      return `${qty} ${unit}`;
    };

    /*
    const handleReadScale = () => {
      setIsWeighing(true);
      // Simulate industrial hardware bridge response latency
      setTimeout(() => {
        const randomWeight = (Math.random() * 5 + 0.5).toFixed(3);
        handleQuantityChange(Number(randomWeight));
        setIsWeighing(false);
        toast.success(t("pos.weight_locked") + ": " + randomWeight + " " + item.unit);
      }, 1500);
    };
    */

    return (
      <div className="group flex items-center gap-x-3 p-2 py-1.5 rounded-lg border-b border-border/30 transition-all duration-200 bg-card hover:bg-emerald-500/5 focus-within:bg-emerald-500/10">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground break-words leading-tight">{item.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {item.barcode} {item.size && `• ${item.size}`}
            {isWeighted && (
              <span className="ml-2 text-emerald-600 font-medium bg-emerald-50 px-1 rounded">
                {formatWeight(item.quantity, item.unit)}
              </span>
            )}
          </p>
          {isRestaurant && (
            <div className="mt-1">
              <input
                type="text"
                placeholder="Cooking instructions (e.g. no onion, extra spicy)..."
                value={item.cooking_notes || ""}
                onChange={(e) => dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, cooking_notes: e.target.value } })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-0.5 text-[10px] font-medium text-foreground focus:outline-none focus:border-emerald-500 placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
          )}
        </div>

        {/* MRP */}
        <div className="w-16 shrink-0 text-right">
          <p className="text-[12px] text-muted-foreground/60 line-through">{(item.mrp || item.price).toFixed(2)}</p>
        </div>

        {/* Price */}
        <div className="w-16 shrink-0 text-right">
          <p className="text-[13px] text-foreground font-medium">{item.price.toFixed(2)}</p>
        </div>

        {/* Quantity */}
        <div className="flex shrink-0 flex-col items-center w-14">
            <Input
              ref={qtyRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnterPress();
                }
              }}
              onFocus={(e) => e.target.select()}
              type="number"
              step="0.001"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onWheel={(e) => e.target.blur()}
              data-cart-qty="true"
              className="h-8 w-full text-center text-[13px] font-medium bg-transparent border-transparent hover:border-border/30 focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500/50 transition-all rounded-md shadow-none p-0"
            />
          </div>
  
          {/* Discount (%) */}
          <div className="w-14 shrink-0">
            <div className="relative group/disc">
              <Input
                ref={discRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    amtDiscRef.current?.focus();
                    amtDiscRef.current?.select?.();
                  }
                }}
                onFocus={(e) => e.target.select()}
                type="number"
                value={item.discount}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                onWheel={(e) => e.target.blur()}
                className="h-8 w-full text-center text-[13px] p-0 bg-transparent border-transparent hover:border-border/30 focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500/50 transition-all rounded-md shadow-none pr-2.5"
              />
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 pointer-events-none group-focus-within/disc:text-muted-foreground">%</span>
            </div>
          </div>
  
          {/* Manual Discount (Amt) */}
          <div className="w-16 shrink-0">
            <div className="relative">
              <Input
                ref={amtDiscRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onEnterPress();
                  }
                }}
                onFocus={(e) => e.target.select()}
                type="number"
                value={item.discount_amt}
                onChange={(e) => handleDiscountAmtChange(Number(e.target.value))}
                onWheel={(e) => e.target.blur()}
                className="h-8 w-full text-center text-[13px] p-0 bg-transparent border-transparent hover:border-border/30 focus:bg-white dark:focus:bg-slate-950 focus:border-emerald-500/50 transition-all rounded-md shadow-none"
                placeholder="0"
              />
          </div>
        </div>

        {/* Amount */}
        <div className="w-24 shrink-0 text-right">
          <p className="font-bold text-[14px] text-emerald-600">{netTotal.toFixed(2)}</p>
        </div>

        {/* Delete */}
        <div className="w-6 shrink-0 flex justify-end">
          <Button size="icon" variant="ghost"
            className="h-6 w-6 text-red-500/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  })
);
CartItemCard.displayName = "CartItemCard";

// ─── CartPanel ────────────────────────────────────────────────────────────────
export const CartPanel = memo(({
  cart,
  dispatch,
  cartItemRefs,
  terminalName,
  isWholesale,
  wholesaleDiscount,
  setWholesaleDiscount,
  onWholesaleToggle,
  onOpenCalculator,
  onToggleFullScreen,
  isFullScreen,
  onReset,
  onEnterPress,
  enableWholesale = true,
  isManufacturing = false,
  isRestaurant = false,
}) => {
  const { t } = useTranslation();
  return (
    <main className="flex flex-col h-full overflow-hidden">
      {/* Redundant header hidden as requested */}

      <div className="flex-1 p-4 pt-0 overflow-y-auto bg-background/60">
        {cart.length > 0 ? (
          <div className="max-w-full mx-auto">
            {/* Table Header */}
            <div className="flex items-center gap-x-3 p-2 py-2 sticky top-0 bg-amber-500/10 backdrop-blur-sm z-20 border-b border-amber-500/20 mb-1 rounded-t-lg">
              <div className="flex-1 text-[12px] font-bold text-amber-700 uppercase tracking-tight">Product</div>
              <div className="w-16 text-right text-[12px] font-bold text-amber-700 uppercase tracking-tight">MRP</div>
              <div className="w-16 text-right text-[12px] font-bold text-amber-700 uppercase tracking-tight">Price</div>
              <div className="w-14 text-center text-[12px] font-bold text-amber-700 uppercase tracking-tight">Qty</div>
              <div className="w-14 text-center text-[12px] font-bold text-amber-700 uppercase tracking-tight">Disc %</div>
              <div className="w-16 text-center text-[12px] font-bold text-amber-700 uppercase tracking-tight">Manual</div>
              <div className="w-24 text-right text-[12px] font-bold text-amber-700 uppercase tracking-tight">Amount</div>
              <div className="w-6" />
            </div>

            <div className="space-y-1">
              {cart.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  dispatch={dispatch}
                  onEnterPress={onEnterPress}
                  isRestaurant={isRestaurant}
                  ref={(el) => {
                    if (el) cartItemRefs.current.set(item.id, el);
                    else cartItemRefs.current.delete(item.id);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-start justify-start p-12 text-left text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="bg-muted/30 p-6 rounded-full mb-6">
            <ShoppingCart className="h-12 w-12 opacity-20" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="max-w-md text-base leading-relaxed opacity-70">
            Scan a barcode or use the product search in the header to start adding items to this sale.
          </p>
        </div>
        )}
      </div>
    </main>
  );
});

