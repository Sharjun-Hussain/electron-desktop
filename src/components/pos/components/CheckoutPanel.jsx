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
    <footer className="shrink-0 border-t border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto items-start">

        {/* ── Left Column ── */}
        <div className="lg:col-span-7 flex flex-col gap-3">

          {/* Utility Actions */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
            <TooltipProvider>
              {UTILITY_ACTIONS_CONFIG.map((action) => {
                const isHoldSale = action.key === "holdSale";
                const isDisabled = action.disabled || (isHoldSale && cart.length === 0);

                return (
                  <Tooltip key={action.label} delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className={clsx("flex", isDisabled && "cursor-not-allowed")}>
                        <Button
                          id={
                            action.key === "holdSale" ? "pos-hold-btn" :
                            action.key === "holdList" ? "pos-hold-list-btn" :
                            action.key === "saleList" ? "pos-history-btn" :
                            action.key === "checkStock" ? "pos-stock-btn" :
                            action.key === "reports" ? "pos-reports-btn" :
                            action.key === "purchase" ? "pos-purchase-btn" :
                            action.key === "inventory" ? "pos-inventory-btn" : undefined
                          }
                          variant="outline"
                          className="h-14 w-full bg-card text-muted-foreground hover:bg-muted/30 hover:text-foreground border-border/50 rounded-xl flex-col gap-1 py-2"
                          onClick={action.key ? utilityHandlers[action.key] : undefined}
                          disabled={isDisabled}
                        >
                          {action.icon === "History" && <History className="h-4 w-4" />}
                          {action.icon === "List" && <List className="h-4 w-4" />}
                          {action.icon === "FileText" && <FileText className="h-4 w-4" />}
                          {action.icon === "Search" && <Search className="h-4 w-4" />}
                          {action.icon === "BarChart3" && <BarChart3 className="h-4 w-4" />}
                          {action.icon === "ShoppingCart" && <ShoppingCart className="h-4 w-4" />}
                          {action.icon === "Package" && <Package className="h-4 w-4" />}
                          
                          <span className="text-center leading-tight font-bold text-[11px]">
                            {action.label}
                          </span>
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {isHoldSale && cart.length === 0 && (
                      <TooltipContent className="bg-slate-900 text-white border-slate-800 rounded-lg py-2 px-3 shadow-xl">
                        <p className="text-xs font-bold">{t("pos.cart_empty")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>

          {/* Payments Section */}
          <div id="pos-payment-methods" className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
            {payments.map((pmt, index) => (
              <div key={pmt.id} className="flex gap-2 items-center bg-slate-100/50 dark:bg-slate-900/40 p-2 rounded-xl border border-border/40">
                <div className="w-[140px] shrink-0 relative">
                  <select 
                    value={pmt.method}
                    onChange={(e) => updatePayment(pmt.id, 'method', e.target.value)}
                    className="w-full h-10 pl-2 pr-8 text-xs font-bold rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-border/50 outline-none focus:ring-1 focus:ring-emerald-500 appearance-none shadow-sm transition-all"
                  >
                    {PAYMENT_METHODS_MAP
                      .filter(pm => activePMs.includes(pm.id))
                      .map(pm => (
                        <option key={pm.id} value={pm.id} className="bg-white dark:bg-slate-900">
                          {pm.label}
                        </option>
                      ))
                    }
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none opacity-60" />
                </div>
                
                <div className="relative grow">
                  <Input 
                    ref={index === 0 ? cashInRef : null}
                    type="number"
                    placeholder="0.00"
                    value={pmt.amount || ""}
                    onChange={(e) => updatePayment(pmt.id, 'amount', e.target.value)}
                    onKeyDown={(e) => handleInputKeyDown(e, payNowRef, null)}
                    className="h-10 text-sm font-bold pl-2 pr-12 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-border/50 shadow-sm"
                  />
                  {index === 0 && (
                    <Button 
                      size="sm" variant="ghost" 
                      className="absolute right-1 top-1 h-8 text-[10px] font-black text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => updatePayment(pmt.id, 'amount', (parseFloat(pmt.amount || 0) + remaining).toFixed(2))}
                    >
                      MAX
                    </Button>
                  )}
                </div>

                {payments.length > 1 && (
                  <Button 
                    size="icon" variant="ghost" 
                    className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                    onClick={() => removePaymentLine(pmt.id)}
                  >
                    <span className="text-xl">×</span>
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-1">
            <Button 
              id="pos-add-payment-btn"
              variant="outline" 
              size="sm" 
              className="h-9 gap-1.5 text-xs font-bold border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
              onClick={addPaymentLine}
            >
              <span className="text-lg">+</span> Add Payment
            </Button>
            
            <div className="flex items-center gap-4">
               <EmployeeSelector
                employees={activeEmployees}
                selectedEmployees={selectedEmployeeIds}
                onToggleEmployee={toggleEmployee}
              />
            </div>
          </div>

          {/* Cheque Details (conditional if any payment is cheque) */}
          {payments.some(p => p.method === "cheque") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              {[
                { label: t("pos.bank_name"), key: "bank_name", type: "text", placeholder: t("pos.enter_bank") },
                { label: t("pos.cheque_no"), key: "cheque_number", type: "text", placeholder: t("pos.enter_cheque_no") },
                { label: t("pos.date"), key: "cheque_date", type: "date", placeholder: "" },
                { label: t("pos.payor"), key: "payee_payor_name", type: "text", placeholder: t("pos.payor_name") },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-700">{label}</label>
                  <Input
                    type={type} placeholder={placeholder}
                    className="h-8 text-xs bg-card border-amber-200"
                    value={chequeDetails[key]}
                    onChange={(e) => setChequeDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* PAY NOW */}
          <div className="mt-4">
            <Button
              ref={payNowRef}
              id="pos-pay-now-btn"
              className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all rounded-2xl ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              disabled={(totalPaid < netTotal || isManufacturing) && !customerId && !distributorId}
              onClick={() => handlePayNow({
                payments: payments.map(p => ({
                  payment_method: p.method,
                  amount: parseFloat(p.amount || 0)
                })),
                adjustment, 
                chequeDetails,
                selectedEmployeeIds, 
                generalDiscount, 
                wholesaleDiscount,
                redeemedPoints: loyaltyEnabled ? redeemedPoints : 0,
                distributor_id: distributorId,
                onSuccess: resetCheckout,
              })}
            >
              {t("pos.pay_now")} (LKR {netTotal.toFixed(2)})
            </Button>
          </div>
        </div>

        {/* ── Right Column: Totals ── */}
        <div className="lg:col-span-5 space-y-2.5 bg-muted/30 p-4 rounded-xl border border-border/60">

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pos.subtotal")}</span>
            <span className="font-medium">LKR {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("pos.item_discounts")}</span>
            <span className="font-medium text-red-600">- LKR {totals.totalItemDiscount.toFixed(2)}</span>
          </div>
          {isWholesale && wholesaleDiscountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("pos.wholesale_discount")}</span>
              <span className="font-medium text-red-600">- LKR {wholesaleDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          {generalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("pos.general_discount")} ({generalDiscount}%)</span>
              <span className="font-medium text-red-600">- LKR {generalDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({finance.taxRate}%)</span>
              <span className="font-medium">LKR {taxAmount.toFixed(2)}</span>
            </div>
          )}

          {/* General Discount Input */}
          <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
            <span className="text-muted-foreground">{t("pos.discount_percent")}</span>
            <div className="relative">
              <Input
                id="pos-general-discount-input"
                ref={generalDiscountRef}
                onKeyDown={(e) => handleInputKeyDown(e, payNowRef, adjustmentRef)}
                type="number" min="0" max="100" step="0.01" placeholder="0"
                className="h-8 w-28 pl-2 pr-7 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg shadow-none"
                value={generalDiscount || ""}
                onChange={(e) => setGeneralDiscount(Math.max(0, Math.min(100, Number(e.target.value))))}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
            <span>{t("pos.grand_total")}</span>
            <span>LKR {grandTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{t("pos.adjustment")}</span>
            <Input
              ref={adjustmentRef}
              onKeyDown={(e) => {
                if (e.key === "-") {
                  e.preventDefault();
                  // Toggle sign: 100 becomes -100, -100 becomes 100
                  setAdjustment(prev => (prev === 0 ? 0 : prev * -1));
                } else {
                  handleInputKeyDown(e, payNowRef, null);
                }
              }}
              type="text"
              inputMode="decimal"
              className="h-8 max-w-[120px] text-right bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg font-mono shadow-none"
              value={adjustment || ""}
              placeholder="0.00"
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "-") {
                  // Allow empty or just a minus sign while typing
                  setAdjustment(val);
                } else {
                  const num = parseFloat(val);
                  if (!isNaN(num)) setAdjustment(num);
                }
              }}
              onBlur={() => {
                // Ensure it's a number on blur
                setAdjustment(prev => (typeof prev === "string" ? (parseFloat(prev) || 0) : prev));
              }}
            />
          </div>

          {loyaltyEnabled && selectedCustomer && (
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-amber-500/10 bg-amber-500/5 mt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <Gift className="h-3.5 w-3.5" />
                  <span>Redeem Points</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-white px-1.5 py-0.5 rounded-full border border-amber-200">
                  {selectedCustomer.loyalty_points || 0} pts available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="h-8 flex-1 bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/30 rounded-lg text-sm font-mono focus-visible:ring-amber-500"
                  placeholder="Points to redeem"
                  value={redeemedPoints || ""}
                  max={selectedCustomer.loyalty_points || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const max = selectedCustomer.loyalty_points || 0;
                    setRedeemedPoints(Math.min(val, max));
                  }}
                />
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-amber-700">Value: </span>
                  <span className="text-xs font-bold text-amber-600">LKR {redemptionValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between text-2xl font-bold text-emerald-600 pt-3 border-t border-border/50 mt-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-foreground">{t("pos.net_total")}</span>
              {showReceiptPreview && (
                <Button size="icon" variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
                  onClick={() => onLivePreview({ grandTotal, totalDiscount, subtotal: totals.subtotal })}
                  title={t("pos.preview")}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
            <span>LKR {netTotal.toFixed(2)}</span>
          </div>

          {/* Summarized Payment Status */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1">Paid Amount</label>
              <div className="h-10 flex items-center bg-slate-50 dark:bg-slate-950/50 border border-border/50 rounded-lg px-3 text-lg font-bold text-slate-900 dark:text-white">
                {totalPaid.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              {remaining > 0 ? (
                 <>
                  <label className="text-[10px] font-bold text-rose-600 dark:text-rose-500 block mb-1">Remaining</label>
                  <div className="h-10 flex items-center justify-end rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 font-bold text-xl px-3 border border-rose-200 dark:border-rose-500/20">
                    {remaining.toFixed(2)}
                  </div>
                 </>
              ) : (
                <>
                  <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 block mb-1">Change</label>
                  <div className="h-10 flex items-center justify-end rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-bold text-xl px-3 border border-emerald-200 dark:border-emerald-500/20">
                    {balance.toFixed(2)}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}));

CheckoutPanel.displayName = "CheckoutPanel";

