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
  ArrowRight,
  Heart,
  Maximize
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useSettings } from "@/app/hooks/swr/useSettings";

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
  const { useModularSettings } = useSettings();
  const { data: posSettingsData } = useModularSettings('pos');
  const posSettings = posSettingsData?.data || {};

  const showQr = posSettings.cd_show_qr ?? true;
  const showTime = posSettings.cd_show_time ?? true;
  const showBusiness = posSettings.cd_show_business ?? true;
  const showCheckout = posSettings.cd_show_checkout ?? true;
  const rawMediaUrls = posSettings.cd_media_urls || "";
  
  const customMediaUrls = useMemo(() => {
    return rawMediaUrls.split('\n').map(u => u.trim()).filter(Boolean);
  }, [rawMediaUrls]);

  const activePromoSlides = useMemo(() => {
    if (customMediaUrls.length > 0) {
      return customMediaUrls.map((url, idx) => ({
        id: `custom_${idx}`,
        isCustomImage: true,
        url: url,
        title: "",
        subtitle: "",
        tag: "",
        discount: "",
        bg: "bg-black",
      }));
    }
    return MOCK_PROMOS;
  }, [customMediaUrls]);

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
      setActivePromoIndex(prev => (prev + 1) % activePromoSlides.length);
    }, 6000);
    return () => clearInterval(promoInterval);
  }, [activePromoSlides.length]);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      }));
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
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">

      {/* Global Floating Footer (Bottom Right Fixed) */}
      {showTime && (
        <div className="absolute bottom-6 right-8 z-50 flex items-center gap-4 pointer-events-none">
          <div className="flex items-center gap-2 drop-shadow-xl p-1">
            <span className="font-mono text-sm font-black tracking-widest text-white/90 uppercase" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              {time}
            </span>
          </div>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.log(e));
              } else {
                document.exitFullscreen().catch(e => console.log(e));
              }
            }}
            className="p-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-white/80 hover:text-white backdrop-blur-md transition-all shadow-2xl group cursor-pointer pointer-events-auto"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4 group-hover:scale-110 transition-transform drop-shadow" />
          </button>
        </div>
      )}

      {/* ─── LEFT PANEL: Promotional Slideshow ─── */}
      <div className={cn("hidden md:flex flex-col p-8 h-full relative overflow-hidden shrink-0 border-r border-slate-800/40 transition-all duration-500", showCheckout ? "md:w-[50%] lg:w-[58%]" : "w-full")}>
        
        {/* Rolling Ad Slides */}
        {activePromoSlides.map((promo, idx) => {
          if (promo.isCustomImage) {
            return (
              <div
                key={promo.id}
                className={cn(
                  "absolute inset-0 transition-all duration-1000 ease-in-out bg-slate-950",
                  idx === activePromoIndex ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
                )}
              >
                <img src={promo.url} alt="Promo" className="w-full h-full object-cover transition-transform duration-6000 ease-linear scale-105" style={{ transform: idx === activePromoIndex ? 'scale(1)' : 'scale(1.05)' }} />
              </div>
            );
          }
          
          const PromoIcon = promo.icon;
          return (
            <div
              key={promo.id}
              className={cn(
                "absolute inset-0 p-12 flex flex-col justify-center transition-all duration-1000 ease-in-out bg-gradient-to-br",
                promo.bg,
                idx === activePromoIndex ? "opacity-100 scale-100 translate-x-0 z-0" : "opacity-0 scale-95 translate-x-full z-[-1] pointer-events-none"
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

      </div>

      {/* ─── RIGHT PANEL: Live Checkout/Receipt View ─── */}
      {showCheckout && (
        <div className={cn(
          "w-full md:w-[50%] lg:w-[42%] h-full flex flex-col bg-slate-900/40 p-6 overflow-hidden transition-all duration-500",
          showTime && "pb-24 pr-10"
        )}>

        {/* Brand Header Inside Checkout Side */}
        {showBusiness && (
          <div className="flex flex-col items-center justify-center shrink-0 mb-6 mt-2">
            {business?.logo ? (
              <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${business.logo}`} alt="Logo" className="w-20 h-20 object-contain rounded-full drop-shadow-lg bg-white/5 backdrop-blur-sm border border-white/10 p-1 mb-3" />
            ) : (
              <div className="size-16 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-white/20 mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
            <span className="text-xl font-semibold uppercase  text-white text-center max-w-md  shadow-black">
              {business?.name || "Inzeedo ERP"}
            </span>
          </div>
        )}

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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8 border-2 border-dashed border-slate-800/60 rounded-3xl bg-slate-950/40">
            <div className="w-24 h-24 rounded-3xl bg-slate-900/80 flex items-center justify-center shadow-lg border border-slate-800 mb-2 animate-pulse">
              <ShoppingBag className="w-12 h-12 text-slate-600" />
            </div>
            <div className="space-y-3">
              <span className="text-2xl font-black uppercase tracking-widest text-slate-200">Ready for Checkout</span>
              <p className="text-[15px] text-slate-400 font-medium leading-relaxed max-w-[280px] mx-auto">
                Browse our menu and our cashier will scan your items here.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-5 pt-8 opacity-40 select-none">
              <Banknote className="w-7 h-7 text-slate-500" />
              <CreditCard className="w-7 h-7 text-slate-500" />
              <QrCode className="w-7 h-7 text-slate-500" />
            </div>
          </div>
        ) : (
          /* C. Live Receipt Screen */
          <div className="flex-1 flex flex-col overflow-hidden relative animate-in fade-in duration-300">
            
            {/* Live Paper Receipt Design */}
            <div className="flex-1 flex flex-col border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden shadow-2xl p-5 relative">
              
              {/* Receipt Top Header */}
              <div className="text-center pb-5 border-b border-dashed border-slate-800 shrink-0">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Order Invoice Summary</span>
                {customer && (
                  <div className="mt-2 bg-slate-900 border border-slate-800 rounded-md px-3 py-1 text-[11px] font-bold text-slate-300 w-fit mx-auto uppercase">
                    Customer: {customer.name}
                  </div>
                )}
              </div>

              {/* Receipt Scrollable Item List */}
              <div className="flex-1 overflow-y-auto py-5 space-y-5 thin-scrollbar pr-2">
                {cart.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  const lineDiscount = lineTotal * (item.discount / 100);
                  const netLineTotal = lineTotal - lineDiscount;

                  return (
                    <div key={item.id || item.variantId} className="flex justify-between items-start text-sm border-b border-slate-900/60 pb-4">
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        <span className="font-bold text-slate-200 text-[15px]">{item.name}</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <span>Qty: {item.quantity}</span>
                          <span>×</span>
                          <span className="font-mono">LKR {parseFloat(item.price).toFixed(2)}</span>
                        </div>
                        {item.discount > 0 && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 w-fit mt-1.5">
                            -{item.discount}% Discount
                          </span>
                        )}
                      </div>

                      <span className="font-black text-slate-200 font-mono text-base text-right shrink-0">
                        LKR {netLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Receipt Totals Summary Panel */}
              <div className="border-t border-dashed border-slate-800 pt-5 space-y-3 shrink-0">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>SUBTOTAL</span>
                  <span className="font-mono text-slate-300 text-sm">
                    LKR {computedTotals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {computedTotals.itemDiscount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-rose-400">
                    <span>SAVINGS / DISCOUNT</span>
                    <span className="font-mono text-sm">
                      -LKR {computedTotals.itemDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {computedTotals.taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>TAX (VAT/GST)</span>
                    <span className="font-mono text-slate-300 text-sm">
                      LKR {computedTotals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-2 text-sm font-black text-slate-300">
                  <span className="text-emerald-400 uppercase tracking-widest">NET PAYABLE DUE</span>
                  <span className="text-3xl text-white font-mono drop-shadow-md">
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
                {showQr && (
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
                )}

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
      )}
    </div>
  );
}
