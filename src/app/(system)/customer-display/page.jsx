"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  QrCode, 
  ShoppingBag, 
  Sparkles, 
  UtensilsCrossed, 
  Volume2, 
  VolumeX, 
  Wallet, 
  Banknote, 
  CreditCard, 
  Users,
  Coins,
  ArrowRight,
  Heart
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

// High-fidelity Mock Promos for the KDS slider
const MOCK_PROMOS = [
  {
    id: 1,
    title: "Signature Spicy Chicken Burger Combo",
    subtitle: "Get a free seasoned potato wedge & beverage bundle!",
    tag: "Chef's Special",
    discount: "Save 15%",
    bg: "from-rose-500 to-orange-600",
    icon: UtensilsCrossed
  },
  {
    id: 2,
    title: "Golden Crispy Fries Family Feast",
    subtitle: "Double size salted french fries with signature dip sauces.",
    tag: "Trending Now",
    discount: "Free Upgrade",
    bg: "from-amber-500 to-yellow-600",
    icon: Sparkles
  },
  {
    id: 3,
    title: "Premium Handcrafted Mocktail Shakes",
    subtitle: "Sourced with fresh mountain berries and cold pressed cream.",
    tag: "Summer Refreshment",
    discount: "Buy 1 Get 1 Free",
    bg: "from-emerald-500 to-teal-600",
    icon: Heart
  }
];

export default function CustomerDisplayPage() {
  const { business, finance } = useAppSettings();
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [isWholesale, setIsWholesale] = useState(false);
  const [payment, setPayment] = useState({
    isOpen: false,
    totalAmount: 0,
    selectedMethod: "cash",
    payments: {},
    balance: 0,
    totalPaid: 0
  });
  const [successSale, setSuccessSale] = useState(null);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [time, setTime] = useState("");

  // Promo Slide interval
  useEffect(() => {
    const promoInterval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % MOCK_PROMOS.length);
    }, 6000);
    return () => clearInterval(promoInterval);
  }, []);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 30000);
    return () => clearInterval(clockInterval);
  }, []);

  // BroadcastChannel Listeners for real-time synchronization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("pos_customer_display");

      channel.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case "cart_update":
            setCart(payload.cart || []);
            setCustomer(payload.customer || null);
            setIsWholesale(payload.isWholesale || false);
            // Auto clear success sale if cashier scans new items
            if (payload.cart && payload.cart.length > 0) {
              setSuccessSale(null);
            }
            break;

          case "payment_update":
            setPayment(prev => ({
              ...prev,
              ...payload
            }));
            break;

          case "checkout_success":
            setSuccessSale(payload.sale);
            // Play success sound
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.type = "sine";
              oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
              oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.45);
            } catch (e) {}
            
            // Return to standby after 6 seconds
            setTimeout(() => {
              setSuccessSale(null);
              setCart([]);
              setPayment({
                isOpen: false,
                totalAmount: 0,
                selectedMethod: "cash",
                payments: {},
                balance: 0,
                totalPaid: 0
              });
            }, 6500);
            break;

          case "clear_display":
            setCart([]);
            setCustomer(null);
            setSuccessSale(null);
            setPayment({
              isOpen: false,
              totalAmount: 0,
              selectedMethod: "cash",
              payments: {},
              balance: 0,
              totalPaid: 0
            });
            break;

          default:
            break;
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // Compute local totals based on received cart
  const computedTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemDiscount = cart.reduce((sum, item) => sum + ((item.price * item.quantity) * (item.discount / 100)), 0);
    
    // Taxes configuration
    const enableTax = finance?.enableTax !== false && finance?.enableTax !== 'false';
    const taxRate = (enableTax && finance?.taxRate) ? parseFloat(finance.taxRate) / 100 : 0;
    
    const grandTotal = subtotal - itemDiscount;
    const taxAmount = grandTotal * taxRate;
    const netTotal = grandTotal + taxAmount;

    return {
      subtotal,
      itemDiscount,
      taxAmount,
      netTotal
    };
  }, [cart, finance]);

  // Dynamic Payment QR Code value based on payment amount and business
  const qrCodeUrl = useMemo(() => {
    const merchantName = business?.name || "Inzeedo Merchant";
    const amount = payment.isOpen ? payment.totalAmount : computedTotals.netTotal;
    return `upi://pay?pa=merchant@upi&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=LKR&tn=POSOrder`;
  }, [business, payment, computedTotals]);

  // Standard Payment icons map
  const methodIcons = {
    cash: Banknote,
    card: CreditCard,
    online: Wallet,
    qr: QrCode,
    wallet: Wallet,
    cheque: Coins,
    credit: Users
  };

  const ActiveIcon = methodIcons[payment.selectedMethod] || Banknote;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* ─── LEFT PANEL: Rolling Promotions Screen ─── */}
      <div className="hidden md:flex md:w-[50%] lg:w-[58%] h-full relative overflow-hidden flex-col justify-between p-8 border-r border-slate-800/40 shrink-0">
        
        {/* Rolling Ad Slides */}
        {MOCK_PROMOS.map((promo, idx) => {
          const PromoIcon = promo.icon;
          return (
            <div
              key={promo.id}
              className={cn(
                "absolute inset-0 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-gradient-to-br",
                promo.bg,
                idx === activePromoIndex ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-full pointer-events-none"
              )}
            >
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 w-fit border border-white/20 shadow-sm animate-bounce mb-6">
                <PromoIcon className="w-4 h-4 text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{promo.tag}</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-[1.1] max-w-[90%]">
                {promo.title}
              </h2>
              <p className="text-white/80 font-medium text-base mt-4 max-w-[80%] leading-relaxed">
                {promo.subtitle}
              </p>
              <div className="mt-8 bg-white text-slate-900 font-black text-sm uppercase px-5 py-3 rounded-xl w-fit shadow-lg shadow-black/10 border border-white/40">
                {promo.discount}
              </div>
            </div>
          );
        })}

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between shrink-0 bg-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 w-full">
          <div className="flex items-center gap-3">
            <div className="size-8.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {business?.name || "Inzeedo POS"}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {business?.business_type || "Retail & Restaurant"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-800/40 border border-white/5 rounded-md px-2.5 py-1">
              Screen Active
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/40" />
          </div>
        </div>

        {/* Standby Footer */}
        <div className="relative z-10 w-full flex items-center justify-between shrink-0 bg-slate-900/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 mt-auto">
          <div className="flex items-center gap-2.5 text-xs font-bold text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span className="font-mono text-sm">{time}</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span>Powered by Inzeedo ERP</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Live Checkout/Receipt View ─── */}
      <div className="w-full md:w-[50%] lg:w-[42%] h-full flex flex-col bg-slate-900/40 p-6 overflow-hidden">
        
        {successSale ? (
          /* A. Successful Checkout Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-950/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Order Completed!</h3>
              <p className="text-slate-400 text-xs font-medium">Invoice Number: <span className="font-mono text-white font-bold">{successSale.invoice_number}</span></p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 w-full space-y-3.5 max-w-[280px]">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>TOTAL BILLED</span>
                <span className="text-sm font-black text-white font-mono">
                  LKR {successSale.payable_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>PAID AMOUNT</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  LKR {successSale.paid_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {successSale.paid_amount > successSale.payable_amount && (
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-3 text-xs font-bold text-slate-400">
                  <span className="text-emerald-500">CHANGE DUE</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    LKR {(successSale.paid_amount - successSale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
              Thank you for your order! <br />Please collect your receipt.
            </p>
          </div>
        ) : cart.length === 0 ? (
          /* B. Standby Mode / Empty Cart Receipt Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 border border-dashed border-slate-800 rounded-3xl bg-slate-950/20">
            <ShoppingBag className="w-10 h-10 text-slate-700 animate-pulse" />
            <div className="space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">Ready for Checkout</span>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed max-w-[200px]">
                Browse our menu and our cashier will scan your items here.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-4 opacity-30 select-none">
              <Banknote className="w-4 h-4 text-slate-400" />
              <CreditCard className="w-4 h-4 text-slate-400" />
              <QrCode className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        ) : (
          /* C. Live Receipt Screen */
          <div className="flex-1 flex flex-col overflow-hidden relative animate-in fade-in duration-300">
            
            {/* Live Paper Receipt Design */}
            <div className="flex-1 flex flex-col border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden shadow-2xl p-5 relative">
              
              {/* Receipt Top Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-800 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Order Invoice Summary</span>
                {customer && (
                  <div className="mt-1.5 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5 text-[9px] font-bold text-slate-300 w-fit mx-auto uppercase">
                    Customer: {customer.name}
                  </div>
                )}
              </div>

              {/* Receipt Scrollable Item List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 thin-scrollbar pr-1">
                {cart.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  const lineDiscount = lineTotal * (item.discount / 100);
                  const netLineTotal = lineTotal - lineDiscount;

                  return (
                    <div key={item.id || item.variantId} className="flex justify-between items-start text-xs border-b border-slate-900/60 pb-3">
                      <div className="flex flex-col gap-0.5 max-w-[70%]">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <span>Qty: {item.quantity}</span>
                          <span>×</span>
                          <span className="font-mono">LKR {parseFloat(item.price).toFixed(2)}</span>
                        </div>
                        {item.discount > 0 && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 w-fit mt-1">
                            -{item.discount}% Discount
                          </span>
                        )}
                      </div>

                      <span className="font-black text-slate-200 font-mono text-right shrink-0">
                        LKR {netLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Receipt Totals Summary Panel */}
              <div className="border-t border-dashed border-slate-800 pt-4 space-y-2 shrink-0">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>SUBTOTAL</span>
                  <span className="font-mono text-slate-300">
                    LKR {computedTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {computedTotals.itemDiscount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-rose-400">
                    <span>SAVINGS / DISCOUNT</span>
                    <span className="font-mono">
                      -LKR {computedTotals.itemDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {computedTotals.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>TAX (VAT/GST)</span>
                    <span className="font-mono text-slate-300">
                      LKR {computedTotals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-800 pt-3 text-xs font-black text-slate-300">
                  <span className="text-emerald-400 uppercase tracking-wider">NET PAYABLE DUE</span>
                  <span className="text-xl text-white font-mono">
                    LKR {computedTotals.netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── DYNAMIC PAYMENT / CHECKOUT TENDER PANEL ─── */}
            {payment.isOpen && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-slate-800 p-5 flex flex-col justify-between animate-in slide-in-from-bottom duration-300 z-20 shadow-2xl">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <ActiveIcon className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settlement Method</span>
                      <span className="text-xs font-bold text-white uppercase">{payment.selectedMethod} Payment</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-0.5">
                    Terminal A
                  </span>
                </div>

                {/* QR Code Scan Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-200">
                    {/* Display standard visual QR container */}
                    <div className="size-36 flex items-center justify-center bg-slate-50 relative rounded-lg border border-slate-100">
                      <QrCode className="size-32 text-slate-900" />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3.5 flex items-center gap-1">
                    Scan QR Code to Pay instantly
                  </span>
                </div>

                {/* Cash/Amount details */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shrink-0">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>BILL AMOUNT</span>
                    <span className="text-sm font-black text-white font-mono">
                      LKR {payment.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-t border-slate-800/60 pt-2.5">
                    <span className="text-emerald-500">CASH RECEIVED</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      LKR {payment.totalPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {payment.balance > 0 && (
                    <div className="flex justify-between items-center border-t border-slate-800 pt-2.5 text-xs font-bold text-slate-400">
                      <span className="text-amber-500">CHANGE DUE BACK</span>
                      <span className="text-base font-black text-amber-400 font-mono">
                        LKR {payment.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
