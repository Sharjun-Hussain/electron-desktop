"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  ShoppingCart, LogOut, Banknote, CreditCard, Users, 
  RotateCcw, CheckCircle2, Zap, Wallet, QrCode, ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useSettingsStore } from "@/store/useSettingsStore";
import { VirtualNumpad } from "./VirtualNumpad";

const AVAILABLE_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card Terminal", icon: CreditCard },
  { id: "online", label: "Online Transfer", icon: CreditCard },
  { id: "qr", label: "QR Payment", icon: QrCode },
  { id: "wallet", label: "Digital Wallet", icon: Wallet },
  { id: "cheque", label: "Cheque Basis", icon: ScrollText },
  { id: "credit", label: "Credit / Account", icon: Users },
];

const TenderModal = ({ 
  isOpen, 
  onOpenChange, 
  totalAmount = 0, 
  activeMethods = ["cash", "card"], 
  onPay, 
  selectedCustomer = null,
  enableMultiplePayments = false,
}) => {
  const [payments, setPayments] = useState({
    cash: 0,
    card: 0,
    online: 0,
    qr: 0,
    wallet: 0,
    cheque: 0,
    credit: 0
  });

  const [lastDiscount, setLastDiscount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [cardChargePercent, setCardChargePercent] = useState(0);
  const inputRef = useRef(null);

  const posTouchUI = useSettingsStore((state) => state.global?.posTouchUI || false);
  const receiptSettings = useSettingsStore((state) => state.receipt || {});
  
  const [discountType, setDiscountType] = useState(receiptSettings?.defaultExtraDiscountType || "amount");

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod("cash");
      setPayments({
        cash: totalAmount,
        card: 0,
        online: 0,
        qr: 0,
        wallet: 0,
        cheque: 0,
        credit: 0
      });
      setLastDiscount(0);
      setDiscountType(receiptSettings?.defaultExtraDiscountType || "amount");
      setCardChargePercent(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, totalAmount]);

  const handleMethodChange = (methodId) => {
    setSelectedMethod(methodId);
    if (!enableMultiplePayments) {
      // Reset all and put total in selected
      const newPayments = {
        cash: 0, card: 0, online: 0, qr: 0, wallet: 0, cheque: 0, credit: 0
      };
      newPayments[methodId] = totalAmount;
      setPayments(newPayments);
    } else {
      setPayments(prev => {
        const currentPaid = Object.values(prev).reduce((sum, val) => sum + val, 0);
        const remaining = totalAmount - currentPaid;
        if (remaining > 0 && prev[methodId] === 0) {
          return { ...prev, [methodId]: remaining };
        }
        return prev;
      });
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handlePaymentChange = (method, value) => {
    const val = parseFloat(value) || 0;
    setPayments(prev => ({ ...prev, [method]: val }));
  };

  const cardChargeAmount = useMemo(() => (payments.card * (cardChargePercent / 100)), [payments.card, cardChargePercent]);
  const cardTotal = useMemo(() => payments.card + cardChargeAmount, [payments.card, cardChargeAmount]);
  const totalPaid = useMemo(() => Object.values(payments).reduce((sum, val) => sum + val, 0), [payments]);
  const calculatedDiscountAmt = useMemo(() => {
    if (discountType === "percentage") {
      return totalAmount * (lastDiscount / 100);
    }
    return lastDiscount;
  }, [totalAmount, lastDiscount, discountType]);

  const netAmountToPay = useMemo(() => Math.max(0, totalAmount - calculatedDiscountAmt), [totalAmount, calculatedDiscountAmt]);
  const balance = useMemo(() => {
    const bal = totalPaid - netAmountToPay;
    return bal > 0 ? bal : 0;
  }, [totalPaid, netAmountToPay]);

  // Broadcast payment updates in real-time to the secondary customer display
  useEffect(() => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("pos_customer_display");
      if (isOpen) {
        channel.postMessage({
          type: "payment_update",
          payload: {
            isOpen: true,
            totalAmount,
            selectedMethod,
            payments,
            balance,
            totalPaid
          }
        });
      } else {
        channel.postMessage({
          type: "payment_update",
          payload: {
            isOpen: false
          }
        });
      }
      return () => {
        channel.close();
      };
    }
  }, [isOpen, totalAmount, selectedMethod, payments, balance, totalPaid]);

  const handlePayClick = () => {
    const paymentArray = Object.entries(payments)
      .filter(([_, amount]) => amount > 0)
      .map(([method, amount]) => ({
        payment_method: method,
        amount: method === 'card' ? amount + cardChargeAmount : amount
      }));

    if (paymentArray.length === 0 && netAmountToPay > 0) {
      paymentArray.push({ payment_method: selectedMethod, amount: netAmountToPay });
    }

    onPay({ 
      payments: paymentArray,
      generalDiscountAmt: discountType === "amount" ? lastDiscount : 0,
      generalDiscount: discountType === "percentage" ? lastDiscount : 0,
      total_paid: totalPaid + cardChargeAmount,
      balance: balance
    });
  };

  const filteredMethods = useMemo(() => {
    // Add credit to filtered methods even if not in activeMethods for professional flow
    const methods = AVAILABLE_METHODS.filter(m => activeMethods.includes(m.id) || m.id === 'credit');
    return methods;
  }, [activeMethods]);

  const LabelCls = "text-[13px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight";
  const InputCls = "h-12 text-2xl font-bold text-right bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-emerald-500 rounded-md font-mono";
  const DisplayCls = "h-12 flex items-center justify-end px-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md text-2xl font-bold font-mono";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950 rounded-xl max-h-[90vh] flex flex-col" 
        onKeyDown={(e) => {
            if (e.key === "F12" || e.key === "Enter") {
                e.preventDefault();
                handlePayClick();
            }
        }}
      >
        <div className="bg-[#1e293b] p-4 px-6 flex items-center justify-between shrink-0">
            <DialogTitle className="text-white font-black text-lg tracking-tight uppercase">Payment Settlement</DialogTitle>
            <DialogDescription className="sr-only">Finalize the payment for the current transaction.</DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-sm font-bold text-slate-500 uppercase">Bill Amount</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>

            {(receiptSettings?.enableExtraDiscount !== false) && (
              <div className="grid grid-cols-2 items-center gap-4">
                  <label className={LabelCls}>Extra Discount</label>
                  <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={lastDiscount || ""}
                        onChange={(e) => setLastDiscount(parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        onWheel={(e) => e.target.blur()}
                        className={cn(InputCls, "border-slate-300 ring-2 ring-slate-100 flex-1")}
                        placeholder="0.00"
                    />
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger className="w-[80px] h-12 rounded-md border border-slate-200 text-sm font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">LKR</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
              </div>
            )}
            
            {discountType === "percentage" && lastDiscount > 0 && (
              <div className="flex items-center justify-end">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Discount Amount: LKR {calculatedDiscountAmt.toFixed(2)}</p>
              </div>
            )}

            {lastDiscount > 0 && (
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase">Net Payable</span>
                  <span className="text-4xl font-black text-emerald-600 font-mono">
                      {netAmountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
              </div>
            )}

            <div className="space-y-4 pt-2">
                {/* Payment Method Dropdown */}
                <div className="grid grid-cols-2 items-center gap-4">
                    <label className={LabelCls}>Payment Method</label>
                    <Select value={selectedMethod} onValueChange={handleMethodChange}>
                        <SelectTrigger className="h-11 font-bold text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                            {filteredMethods.map(m => (
                                <SelectItem key={m.id} value={m.id} className="font-bold text-xs uppercase">
                                    <div className="flex items-center gap-2">
                                        <m.icon className="h-3.5 w-3.5 text-slate-400" />
                                        {m.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator className="opacity-50" />

                {/* Dynamic Payment Input Section */}
                {(selectedMethod === 'cash' || payments.cash > 0) && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-2 items-center gap-4">
                            <label className={cn(LabelCls, "text-emerald-600")}>Cash Received</label>
                            <Input
                                ref={inputRef}
                                type="number"
                                value={payments.cash || ""}
                                onChange={(e) => handlePaymentChange("cash", e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.target.blur()}
                                className={cn(InputCls, "border-emerald-500 ring-2 ring-emerald-500/10")}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <label className={LabelCls}>Balance</label>
                            <div className={cn(DisplayCls, "text-emerald-600 bg-emerald-500/5 border-emerald-500/10")}>
                                {balance.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {(selectedMethod === 'card' || payments.card > 0) && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="grid grid-cols-2 items-center gap-4">
                            <label className={cn(LabelCls, "text-blue-600")}>Card Payment</label>
                            <Input
                                ref={inputRef}
                                type="number"
                                value={payments.card || ""}
                                onChange={(e) => handlePaymentChange("card", e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onWheel={(e) => e.target.blur()}
                                className={cn(InputCls, "border-blue-500 ring-2 ring-blue-500/10")}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase">Charge (%)</label>
                                <Input 
                                    type="number" 
                                    value={cardChargePercent || ""} 
                                    onChange={(e) => setCardChargePercent(parseFloat(e.target.value) || 0)}
                                    onWheel={(e) => e.target.blur()}
                                    className="h-8 w-14 text-xs font-bold bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className={cn(DisplayCls, "h-8 text-sm text-slate-500 bg-transparent border-dashed")}>
                                {cardChargeAmount.toFixed(2)}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <label className={LabelCls}>Card Total</label>
                            <div className={cn(DisplayCls, "text-blue-600 bg-blue-500/5 border-blue-500/10")}>
                                {cardTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}

                {AVAILABLE_METHODS.map(m => {
                    if (m.id === 'cash' || m.id === 'card') return null;
                    if (selectedMethod !== m.id && payments[m.id] === 0) return null;
                    return (
                        <div key={m.id} className="space-y-4 animate-in fade-in zoom-in-95 duration-200 mt-4">
                            <div className="grid grid-cols-2 items-center gap-4">
                                <label className={cn(LabelCls, "text-amber-600")}>
                                    {m.label} Amount
                                </label>
                                <Input
                                    ref={selectedMethod === m.id ? inputRef : null}
                                    type="number"
                                    value={payments[m.id] || ""}
                                    onChange={(e) => handlePaymentChange(m.id, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    onWheel={(e) => e.target.blur()}
                                    className={cn(InputCls, "border-amber-500 ring-2 ring-amber-500/10")}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    );
                })}

                {/* Touch UI Virtual Numpad */}
                {posTouchUI && (
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <VirtualNumpad 
                            value={payments[selectedMethod] || ""}
                            onChange={(val) => handlePaymentChange(selectedMethod, val)}
                            onExact={(amount) => handlePaymentChange(selectedMethod, amount.toString())}
                            totalAmount={totalAmount}
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
           <Button 
            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg uppercase tracking-tight shadow-md rounded-lg transition-all"
            onClick={handlePayClick}
            disabled={totalPaid < totalAmount}
          >
            <ShoppingCart className="mr-3 h-5 w-5" />
            PROCESS (F12)
          </Button>
          <Button 
            variant="ghost"
            className="w-1/3 h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase rounded-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 hover:brightness-110 hover:shadow-lg hover:shadow-rose-600/20"
            onClick={() => onOpenChange(false)}
          >
            <LogOut className="h-5 w-5" />
            EXIT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenderModal;
