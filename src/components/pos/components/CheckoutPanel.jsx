"use client";

import { memo, useState, useEffect, useCallback, useMemo, forwardRef, useRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, ChevronDown, BarChart3, ShoppingCart, Package, History, List, FileText, Search, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import clsx from "clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmployeeSelector } from "../employee-selector";
import { useBeep } from "@/hooks/use-beep";
import { useAppSettings } from "@/app/hooks/useAppSettings";

// ─── Static constants (outside component = zero allocation cost per render) ──
export const PAYMENT_METHODS_MAP = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card Terminal" },
  { id: "online", label: "Online Transfer" },
  { id: "qr", label: "QR Payment" },
  { id: "wallet", label: "Digital Wallet" },
  { id: "cheque", label: "Cheque Basis" },
];

const UTILITY_ACTIONS_CONFIG = [
  { label: "Hold Sale", key: "holdSale", icon: "History" },
  { label: "Hold List", key: "holdList", icon: "List" },
  { label: "Sale List", key: "saleList", icon: "FileText" },
  { label: "Check Stock", key: "checkStock", icon: "Search" },
  { label: "Reports", key: "reports", icon: "BarChart3" },
  { label: "Purchase", key: "purchase", icon: "ShoppingCart" },
  { label: "Inventory", key: "inventory", icon: "Package" },
];

// ─── CheckoutPanel ─────────────────────────────────────────────────────────────
// Owns ALL checkout input state. Receives only cart data + action callbacks.
// Typing cashIn, adjustments, etc. NEVER re-renders CartPanel or ProductGrid.
export const CheckoutPanel = memo(forwardRef(({
  // Cart data (for totals computation)
  cart,
  isWholesale,
  // Handlers from main-page
  handlePayNow,
  handleHoldSale,
  onHoldList,
  onSaleList,
  onCheckStock,
  // Employee data
  activeEmployees,
  defaultEmployeeIds,
  // Settings
  showReceiptPreview,
  onLivePreview,
  activePaymentMethods,
  customerId,
  selectedCustomer,
  distributorId,
  selectedDistributor,
  // Restaurant Floor Context
  queryDiningType,
  queryTableNum,
  querySaleId,
}, ref) => {
  const router = useRouter();
  const { playBeep } = useBeep();
  const { t } = useTranslation();

  // ── Refs for keyboard navigation ──────────────────────────────────────────
  const cashInRef = useRef(null);
  const adjustmentRef = useRef(null);
  const generalDiscountRef = useRef(null);
  const payNowRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusCashIn: () => {
      cashInRef.current?.focus();
      cashInRef.current?.select?.();
    },
    focusAdjustment: () => {
      adjustmentRef.current?.focus();
      adjustmentRef.current?.select?.();
    },
    focusDiscount: () => {
      generalDiscountRef.current?.focus();
      generalDiscountRef.current?.select?.();
    },
    clickPayNow: () => {
      payNowRef.current?.click();
    }
  }));

  // ── All checkout inputs live HERE — typing never bubbles up ───────────────
  const activePMs = useMemo(() => activePaymentMethods && activePaymentMethods.length > 0
    ? activePaymentMethods
    : ["cash", "card"],
    [activePaymentMethods]);

  const [payments, setPayments] = useState([
    { id: Date.now(), method: activePMs[0] || "cash", amount: 0 }
  ]);
  const [adjustment, setAdjustment] = useState(0);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(defaultEmployeeIds || []);
  const [chequeDetails, setChequeDetails] = useState({
    bank_name: "", cheque_number: "", cheque_date: "", payee_payor_name: "",
  });
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Sync defaultEmployeeIds on first load (from session)
  useEffect(() => {
    if (defaultEmployeeIds?.length) setSelectedEmployeeIds(defaultEmployeeIds);
  }, [defaultEmployeeIds?.join(",")]); // only re-run if the IDs change


  const { finance, loyalty: loyaltyConfig, business } = useAppSettings();
  const loyaltyEnabled = business?.loyalty_enabled;
  const isManufacturing = business?.business_type === 'manufacturing';

  // ── Totals — computed locally from cart prop ──────────────────────────────
  const totals = useMemo(() => cart.reduce(
    (acc, item) => {
      const gross = item.price * item.quantity;
      acc.subtotal += gross;
      acc.totalItemDiscount += gross * (item.discount / 100);
      return acc;
    },
    { subtotal: 0, totalItemDiscount: 0 }
  ), [cart]);

  const wholesaleDiscountAmount = useMemo(
    () => (isWholesale ? totals.subtotal * (wholesaleDiscount / 100) : 0),
    [isWholesale, totals.subtotal, wholesaleDiscount]
  );
  const generalDiscountAmount = useMemo(
    () => totals.subtotal * (generalDiscount / 100),
    [totals.subtotal, generalDiscount]
  );

  const redemptionValue = useMemo(() => {
    if (!loyaltyEnabled) return 0;
    const rate = parseFloat(loyaltyConfig?.redemption_rate) || 0;
    return (parseFloat(redeemedPoints) || 0) * rate;
  }, [redeemedPoints, loyaltyConfig, loyaltyEnabled]);

  const totalDiscount = totals.totalItemDiscount + wholesaleDiscountAmount + generalDiscountAmount + redemptionValue;
  const grandTotal = totals.subtotal - totalDiscount;

  // Tax Calculation
  const taxAmount = useMemo(() => {
    const enableTax = finance?.enableTax !== false && finance?.enableTax !== 'false';
    const taxRate = (enableTax && finance?.taxRate) ? parseFloat(finance.taxRate) / 100 : 0;
    return grandTotal * taxRate;
  }, [grandTotal, finance]);

  const netTotal = Math.round((grandTotal + (parseFloat(adjustment) || 0) + taxAmount) * 100) / 100;
  
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0), [payments]);
  const balance = totalPaid > netTotal ? totalPaid - netTotal : 0;
  const remaining = netTotal > totalPaid ? netTotal - totalPaid : 0;

  // Auto-sync payment amount if only one payment exists and matches netTotal or is 0
  useEffect(() => {
    if (payments.length === 1 && (payments[0].amount === 0 || payments[0].amount < netTotal) && netTotal > 0) {
      setPayments(prev => [{ ...prev[0], amount: netTotal }]);
    }
  }, [netTotal]);

  // Broadcast payment updates in real-time to the secondary customer display
  useEffect(() => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("pos_customer_display");
      channel.postMessage({
        type: "payment_update",
        payload: {
          isOpen: true,
          totalAmount: netTotal,
          selectedMethod: payments[0]?.method || "cash",
          payments: payments.reduce((acc, p) => {
            acc[p.method] = (acc[p.method] || 0) + (parseFloat(p.amount) || 0);
            return acc;
          }, {}),
          balance,
          totalPaid
        }
      });
      return () => {
        channel.close();
      };
    }
  }, [netTotal, payments, balance, totalPaid]);

  const resetCheckout = useCallback(() => {
    const firstActive = PAYMENT_METHODS_MAP.find(pm => activePMs.includes(pm.id))?.id || "cash";
    setPayments([{ id: Date.now(), method: firstActive, amount: 0 }]);
    setAdjustment(0);
    setGeneralDiscount(0);
    setWholesaleDiscount(0);
    setRedeemedPoints(0);
    setChequeDetails({ bank_name: "", cheque_number: "", cheque_date: "", payee_payor_name: "" });
  }, [activePMs]);

  // ── Stable toggle ─────────────────────────────────────────────────────────
  const toggleEmployee = useCallback((id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  }, []);

  const addPaymentLine = useCallback(() => {
    const firstActive = activePMs[0] || "cash";
    setPayments(prev => [...prev, { id: Date.now(), method: firstActive, amount: remaining > 0 ? remaining : 0 }]);
    playBeep("subtle");
  }, [activePMs, remaining, playBeep]);

  const removePaymentLine = useCallback((id) => {
    if (payments.length <= 1) return;
    setPayments(prev => prev.filter(p => p.id !== id));
  }, [payments.length]);

  const updatePayment = useCallback((id, field, value) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  // Ensure selected methods are always valid
  useEffect(() => {
    setPayments(prev => prev.map(p => {
      if (!activePMs.includes(p.method)) {
        const firstActive = activePMs[0] || "cash";
        return { ...p, method: firstActive };
      }
      return p;
    }));
  }, [activePMs]);

  const utilityHandlers = {
    holdSale: () => handleHoldSale({ adjustment, selectedEmployeeIds, generalDiscount, wholesaleDiscount, onSuccess: resetCheckout }),
    holdList: onHoldList,
    saleList: onSaleList,
    checkStock: onCheckStock,
    reports: () => router.push("/reports"),
    purchase: () => router.push("/purchase/suppliers"),
    inventory: () => router.push("/products"),
  };

  // ── Keyboard Navigation ───────────────────────────────────────────────────
  const handleInputKeyDown = useCallback((e, nextRef, prevRef) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      if (nextRef) {
        e.preventDefault();
        nextRef.current?.focus();
        nextRef.current?.select?.();
      }
    } else if (e.key === "ArrowUp") {
      if (prevRef) {
        e.preventDefault();
        prevRef.current?.focus();
        prevRef.current?.select?.();
      }
    }
  }, []);

  return (
    <footer className="shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm p-4">
      <div className="flex flex-col gap-6 w-full">

        {/* ── Top Actions Area (Hidden/Optional) ── */}
        <div className="hidden">
           {/* Legacy left column space */}
        </div>

        {/* ── Totals & Pay Now Area ── */}
        <div className="w-full flex flex-col gap-4">
          
          <div className="flex flex-col gap-2.5">
            {/* Restaurant Active Context Indicator */}
            {(queryDiningType || queryTableNum || querySaleId) && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-emerald-600/70 font-black">Dining Mode</span>
                  <span className="text-sm font-black tracking-tight text-foreground">
                    {queryDiningType === 'dine_in' ? 'Dine-In Serving' : queryDiningType}
                  </span>
                </div>
                {queryTableNum && (
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[10px] text-emerald-600/70 font-black">Table Assigned</span>
                    <span className="text-sm font-black tracking-tight text-foreground">Table {queryTableNum}</span>
                  </div>
                )}
              </div>
            )}

            {/* Gross Total */}
            <div className="flex justify-between items-center text-base border-b border-border/60 pb-2">
              <span className="text-muted-foreground font-medium">{t("pos.subtotal")}</span>
              <span className="font-bold text-foreground">LKR {totals.subtotal.toFixed(2)}</span>
            </div>

            {/* Total Quantity */}
            <div className="flex justify-between items-center text-base border-b border-border/60 pb-2">
              <span className="text-muted-foreground font-medium">Total items</span>
              <span className="font-bold text-foreground">
                {cart.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)}
              </span>
            </div>

            {/* Total Savings */}
            <div className="flex justify-between items-center text-base border-b border-border/60 pb-2">
              <span className="text-muted-foreground font-medium">Total savings</span>
              <span className="text-rose-600 font-bold">LKR {totalDiscount.toFixed(2)}</span>
            </div>
          </div>

          {/* Master Action Block */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Net payable</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl text-foreground font-black tracking-tighter">
                    {netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-black text-muted-foreground">LKR</span>
                </div>
              </div>
              
              {showReceiptPreview && (
                <Button size="icon" variant="ghost"
                  className="h-9 w-9 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                  onClick={() => onLivePreview({ grandTotal, totalDiscount, subtotal: totals.subtotal })}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="relative group/pay">
              <Button
                ref={payNowRef}
                id="pos-pay-now-btn"
                className="h-14 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/10 uppercase tracking-widest"
                onClick={() => handlePayNow({
                  netTotal,
                  adjustment,
                  generalDiscount,
                  wholesaleDiscount,
                  selectedEmployeeIds,
                  distributor_id: distributorId,
                  payments,
                  chequeDetails,
                  onSuccess: resetCheckout,
                })}
              >
                Pay Now
              </Button>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="h-7 min-w-[32px] px-2 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-lg border border-white/30 text-[10px] font-black text-white shadow-sm uppercase tracking-tighter">
                  F12
                </kbd>
              </div>
            </div>
          </div>

          {/* Hidden logic helpers */}
          <div className="hidden">
            <Input ref={generalDiscountRef} value={generalDiscount} onChange={(e) => setGeneralDiscount(e.target.value)} />
            <Input ref={adjustmentRef} value={adjustment} onChange={(e) => setAdjustment(e.target.value)} />
          </div>

        </div>
      </div>
    </footer>
  );
}));

CheckoutPanel.displayName = "CheckoutPanel";

