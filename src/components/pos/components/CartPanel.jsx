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
  forwardRef(({ item, dispatch, onEnterPress }, ref) => {
    const netTotal = item.price * item.quantity * (1 - item.discount / 100);
    const qtyRef = useRef(null);
    const discRef = useRef(null);
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
      <div className="group flex items-center gap-x-4 p-2 rounded-lg border-2 transition-all duration-200 bg-card border-transparent hover:border-border/50 focus-within:bg-emerald-500/10 focus-within:border-emerald-500 focus-within:shadow-md">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">{item.name}</p>
            {isWeighted && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/10">
                {formatWeight(item.quantity, item.unit)}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.barcode} {item.size && `• ${item.size}`}
          </p>
        </div>

        {/* Price */}
        <div className="w-24 shrink-0 text-right">
          <label className="text-xs text-muted-foreground block">{t("pos.price")}</label>
          <p className="font-medium text-sm text-foreground">{item.price.toFixed(2)}</p>
        </div>

        {/* Quantity */}
        <div className="flex shrink-0 flex-col items-center gap-1 w-[120px]">
          <div className="flex items-center gap-1.5 w-full">
            <Button size="icon" variant="outline" className="h-8 w-8 bg-card shrink-0"
              onClick={() => handleQuantityChange(item.quantity - 1)}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              ref={qtyRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  discRef.current?.focus();
                  discRef.current?.select?.();
                }
              }}
              type="number"
              step="0.001"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              data-cart-qty="true"
              className="h-8 w-full min-w-0 text-center text-base font-semibold p-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-none"
            />
            <Button size="icon" variant="outline" className="h-8 w-8 bg-card shrink-0"
              onClick={() => handleQuantityChange(item.quantity + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

        </div>

        {/* Discount */}
        <div className="w-24 shrink-0">
          <label className="text-xs text-muted-foreground block text-center">{t("pos.discount")}</label>
          <div className="relative">
            <Input
              ref={discRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnterPress();
                }
              }}
              type="number"
              value={item.discount}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              className="h-8 w-full text-center text-sm p-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-none pr-5"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
          </div>
        </div>

        {/* Amount */}
        <div className="w-32 shrink-0 text-right">
          <label className="text-xs text-muted-foreground block">{t("pos.amount")}</label>
          <p className="font-semibold text-lg text-emerald-600">{netTotal.toFixed(2)}</p>
        </div>

        {/* Delete */}
        <div className="w-8 shrink-0">
          <Button size="icon" variant="ghost"
            className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}>
            <Trash2 className="h-4 w-4" />
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
}) => {
  const { t } = useTranslation();
  return (
    <main className="flex flex-col h-full overflow-hidden">
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-emerald-500" />
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold text-foreground">{t("pos.current_sale")}</h2>
              {terminalName && (
                <span id="pos-terminal-name" className="text-xs font-mono">
                  ( {terminalName} )
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <span className="px-2.5 py-1 text-sm bg-emerald-500/20 text-emerald-700 rounded-full font-semibold">
                {cart.length} {t("pos.items_count")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Button
                id="pos-wholesale-toggle"
                variant={isWholesale ? "secondary" : "outline"}
                size="sm" className="h-9 bg-card"
                onClick={onWholesaleToggle}
                disabled={!enableWholesale}
              >
                {isManufacturing ? (isWholesale ? "Wholesale" : "Direct Sale") : t("pos.wholesale")}
              </Button>
              {isWholesale && enableWholesale && (
                <div id="pos-wholesale-discount" className="relative">
                  <Input
                    type="number" placeholder={t("pos.discount")}
                    className="h-9 w-28 pl-2 pr-7 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-none"
                    value={wholesaleDiscount || ""}
                    onChange={(e) => setWholesaleDiscount(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
            <Button id="pos-calculator-btn" variant="outline" size="icon" className="h-9 w-9 bg-card" onClick={onOpenCalculator}>
              <Calculator className="h-4 w-4" />
            </Button>
            <Button id="pos-fullscreen-btn" variant="outline" size="icon" className="h-9 w-9 bg-card" onClick={onToggleFullScreen}>
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button id="pos-clear-btn" variant="outline" size="sm"
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50/80 border-red-200/80 bg-card"
              onClick={onReset}>
              <X className="h-4 w-4 mr-1.5" /> {t("pos.clear")}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto bg-background/60">
        {cart.length > 0 ? (
          <div className="space-y-2 max-w-full mx-auto">
            {cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                dispatch={dispatch}
                onEnterPress={onEnterPress}
                ref={(el) => {
                  if (el) cartItemRefs.current.set(item.id, el);
                  else cartItemRefs.current.delete(item.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-20 w-20 mb-4 opacity-10" />
            <p className="text-lg font-medium mb-2">{t("pos.cart_empty")}</p>
            <p className="text-sm text-center">{t("pos.add_products_hint")}</p>
          </div>
        )}
      </div>
    </main>
  );
});
CartPanel.displayName = "CartPanel";

