"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useReactToPrint } from "react-to-print";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useBeep } from "@/hooks/use-beep";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useHardware } from "./hooks/useHardware";
import { useTranslation } from "@/hooks/useTranslation";
import { useShift } from "@/app/hooks/swr/useShift";

import { Button } from "@/components/ui/button";
import { MonitorX } from "lucide-react";

import { usePosData } from "./hooks/usePosData";
import { usePosCart } from "./hooks/usePosCart";
import { usePosActions } from "./hooks/usePosActions";
import { ProductGrid } from "./components/ProductGrid";
import { HeldSalesPanel } from "./components/HeldSalesPanel";
import { CartPanel } from "./components/CartPanel";
import { CheckoutPanel } from "./components/CheckoutPanel";
import {
  HoldListDialog, SaleListDialog, StockCheckDialog,
  ReturnDialogWrapper, SaleDetailWrapper, VariantSelectorDialog, PaymentDialog
} from "./components/PosDialogs";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { InvoiceA4Template } from "./InvoiceA4Template";
import { ShiftManagerDialog } from "./components/ShiftManagerDialog";
import BatchSelectorDialog from "./components/BatchSelectorDialog";
import Calculator from "./components/Calculator";
import { PosHeader } from "./components/PosHeader";
import { UtilitySidebar } from "./components/UtilitySidebar";
import { db } from "@/lib/indexedDB/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function PosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDiningType = searchParams ? searchParams.get("dining_type") : null;
  const queryTableId = searchParams ? searchParams.get("dining_table_id") : null;
  const queryTableNum = searchParams ? searchParams.get("table_number") : null;
  const querySaleId = searchParams ? searchParams.get("sale_id") : null;
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { receipt: receiptSettings, setReceiptSettings, business: localBusiness, setBusinessSettings, setGeneralSettings } = useSettingsStore();
  const { useBusinessSettings, useModularSettings, updateModularSettings } = useSettings();
  const { data: businessResponse } = useBusinessSettings();
  const { data: posResponse } = useModularSettings("pos");
  const { data: generalResponse } = useModularSettings("general");
  const { business, loyalty, general, refreshSettings } = useAppSettings();
  const { t } = useTranslation();
  const { playBeep } = useBeep();

  const { useActiveShift, openShift, closeShift } = useShift();
  const { data: activeShiftRes, isLoading: isShiftLoading } = useActiveShift();
  const activeShift = activeShiftRes?.data || null;
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const handleThemeToggle = useCallback(async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (general) {
      await updateModularSettings('general', {
        ...general,
        interface: { ...(general.interface || {}), theme: newTheme }
      });
      if (refreshSettings) refreshSettings();
    }
  }, [theme, general, updateModularSettings, refreshSettings, setTheme]);

  useEffect(() => {
    if (businessResponse?.data) setBusinessSettings(businessResponse.data);
    if (posResponse?.data) setReceiptSettings(posResponse.data);
    if (generalResponse?.data) setGeneralSettings(generalResponse.data);
  }, [businessResponse, posResponse, generalResponse, setBusinessSettings, setReceiptSettings, setGeneralSettings]);

  // ── Core hooks ─────────────────────────────────────────────────────────────
  const {
    allProducts, flattenedVariants, customers, distributors,
    activeEmployees, branches, selectedBranch, setSelectedBranch,
    addCustomerToList, addDistributorToList, refreshData, forceReset, isLoading
  } = usePosData();

  const { state, dispatch, handleSelectCustomer, handleSelectDistributor } = usePosCart();

  const [isPending, startTransition] = useTransition();
  const [activeDialog, setActiveDialog] = useState(null); // 'calculator', 'holdList', 'saleList', 'stock', 'variants', 'batch', 'return', 'detail', 'shift'
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [printableSale, setPrintableSale] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [terminalName, setTerminalName] = useState("");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [itemPendingBatch, setItemPendingBatch] = useState(null);
  const [pendingPaymentArgs, setPendingPaymentArgs] = useState(null);
  const [isProductListVisible, setIsProductListVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedStockSearch = useDebounce(stockSearch, 400);

  useEffect(() => {
    const saved = localStorage.getItem("pos_terminal_id");
    if (saved) setTerminalName(saved);

    // SEO & Branding
    document.title = "Terminal Control Deck | Inzeedo POS";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = "High-velocity POS terminal with advanced inventory management and multi-branch synchronization.";
  }, []);

  const businessType = (session?.user?.organization?.business_type || "").toLowerCase();
  const isManufacturing = businessType === "manufacturing";
  const isRestaurant = businessType === "restaurant";

  useEffect(() => {
    if (isManufacturing && !state.isWholesale && flattenedVariants.length > 0) {
      dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: true, flatVariants: flattenedVariants, isManufacturing } });
    }
  }, [isManufacturing, flattenedVariants, state.isWholesale, dispatch]);

  useEffect(() => {
    if (posResponse?.data?.enableWholesale && flattenedVariants.length > 0 && !state.isWholesale && state.cart.length === 0 && !state.customer) {
      dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: true, flatVariants: flattenedVariants, isManufacturing } });
    }
  }, [posResponse, flattenedVariants, dispatch, state.isWholesale, state.cart.length, state.customer, isManufacturing]);

  const editModeRef = useRef("search");
  const selectedIndexRef = useRef(0);
  const cartRef = useRef(state.cart);
  const cartItemRefs = useRef(new Map());
  const printRef = useRef(null);
  const searchRef = useRef(null);
  const checkoutRef = useRef(null);
  const barcodeBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  useEffect(() => { cartRef.current = state.cart; }, [state.cart]);

  useEffect(() => {
    const handleBeforeUnload = (e) => { if (state.cart.length > 0) { e.preventDefault(); e.returnValue = ""; } };
    const handlePopState = (e) => {
      if (state.cart.length > 0) {
        if (!window.confirm("Active sale in progress. Are you sure you want to leave?")) window.history.pushState(null, "", window.location.href);
        else router.push("/");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => { window.removeEventListener("beforeunload", handleBeforeUnload); window.removeEventListener("popstate", handlePopState); };
  }, [state.cart.length, router]);

  const handleDashboardExit = useCallback(() => {
    if (state.cart.length > 0) {
      if (window.confirm("You have items in your cart. Are you sure you want to exit to the Dashboard?")) router.push("/");
    } else router.push("/");
  }, [state.cart.length, router]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  }, []);

  const {
    handlePayNow: rawHandlePayNow, handleHoldSale: rawHandleHoldSale, fetchSales, deleteSale, resumeSale,
    fetchStock, clearStockData, salesData, isLoadingSales, stockData, isLoadingStock, syncPendingSales, searchSales
  } = usePosActions({
    state, dispatch, selectedBranch, setPrintableSale,
    flattenedVariants, customers, setIsHoldListOpen: (open) => setActiveDialog(open ? 'holdList' : null),
  });

  const { 
    isReady: isHardwareReady, selectedScalePort, selectedDisplayPort, currentWeight,
    openDrawer, printReceipt, updateDisplay, startScaleListening, stopScaleListening 
  } = useHardware();

  // Update Customer Display when cart changes
  useEffect(() => {
    if (isHardwareReady && selectedDisplayPort) {
      if (state.cart.length > 0) {
        const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Grab the last item in the cart array (most recently scanned)
        const lastItem = state.cart[state.cart.length - 1];
        
        // Line 1: Item Name (Truncated to exactly 20 chars to prevent overflow)
        const line1 = lastItem.name.substring(0, 20);
        
        // Line 2: Qty x Price on left, Total on right
        const priceStr = `${lastItem.quantity}x${lastItem.price.toFixed(2)}`;
        const totalStr = `T:${subtotal.toFixed(2)}`;
        const spaceCount = Math.max(1, 20 - priceStr.length - totalStr.length);
        const line2 = `${priceStr}${" ".repeat(spaceCount)}${totalStr}`;
        
        updateDisplay(line1, line2);
      } else {
        updateDisplay("WELCOME", "-- HAVE A NICE DAY AND THANK YOU --");
      }
    }
  }, [state.cart, isHardwareReady, selectedDisplayPort, updateDisplay]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt_${printableSale?.invoice_number || "Draft"}`,
    onAfterPrint: () => setPrintableSale(null),
  });

  const handlePrintRef = useRef(handlePrint);
  useEffect(() => { handlePrintRef.current = handlePrint; });

  const isPrintingRef = useRef(false);

  useEffect(() => {
    if (printableSale) {
      if (isPrintingRef.current) return;
      isPrintingRef.current = true;

      // If hardware is ready, print SILENTLY and INSTANTLY
      if (isHardwareReady && printRef.current) {
        const printSilently = async () => {
          const html = printRef.current.innerHTML;
          const success = await printReceipt(html);
          if (success) {
            setPrintableSale(null); // Clear immediately so no preview shows
          } else {
            handlePrintRef.current(); // Fallback to browser if silent failed
          }
        };
        printSilently();
        return;
      }

      // If no hardware, use browser print with a small delay for rendering
      const t = setTimeout(() => { 
        if (printRef.current) {
          handlePrintRef.current(); 
        }
      }, 500);
      return () => clearTimeout(t);
    } else {
      isPrintingRef.current = false;
    }
  }, [printableSale, isHardwareReady, printReceipt]);

  const handlePayNow = useCallback((args) => {
    setPendingPaymentArgs(args);
    setActiveDialog('payment');
  }, []);

  const confirmFinalPayment = useCallback(async (paymentData) => {
    if (!pendingPaymentArgs) return;
    
    // Auto-open cash drawer if hardware is ready
    if (isHardwareReady) {
      openDrawer();
    }

    // Merge modal data with original checkout args
    const finalizedArgs = {
      ...pendingPaymentArgs,
      payments: paymentData.payments 
        ? paymentData.payments.map(p => ({ payment_method: p.method, amount: p.received }))
        : [{ payment_method: paymentData.method, amount: paymentData.received }],
      paid_amount: paymentData.received,
      generalDiscountAmt: paymentData.generalDiscountAmt || 0,
      generalDiscount: paymentData.generalDiscount || 0,
      activeShiftId: activeShift?.id
    };

    // Show change on customer display if applicable
    const change = paymentData.received - (pendingPaymentArgs?.netTotal || 0);
    if (isHardwareReady && selectedDisplayPort && change > 0) {
        updateDisplay("CHANGE DUE:", `LKR ${change.toFixed(2)}`);
        // Reset display after 5 seconds
        setTimeout(() => updateDisplay("WELCOME", "-- HAVE A NICE DAY AND THANK YOU --"), 5000);
    }

    rawHandlePayNow(finalizedArgs);
    setActiveDialog(null);
    setPendingPaymentArgs(null);
  }, [rawHandlePayNow, pendingPaymentArgs, activeShift, isHardwareReady, openDrawer, selectedDisplayPort, updateDisplay]);

  const handleHoldSale = useCallback((args) => rawHandleHoldSale({ ...args, activeShiftId: activeShift?.id }), [rawHandleHoldSale, activeShift]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncPendingSales(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncPendingSales();
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [syncPendingSales]);

  useEffect(() => {
    fetchSales("draft");
  }, [fetchSales]);

  const handleAddToCart = useCallback((item, quantity = 1, skipBatchCheck = false) => {
    // Auto-scale detection for weighted items
    let finalQuantity = quantity;
    const unit = (item.unit || "").toLowerCase();
    const isWeighted = unit === "kg" || unit === "g" || unit === "gram" || unit === "kilogram";

    if (isWeighted && isHardwareReady && selectedScalePort) {
      if (currentWeight > 0) {
        finalQuantity = currentWeight;
        toast.success(`Weight captured: ${currentWeight.toFixed(3)} ${unit}`);
      } else {
        toast.info("Please place item on scale...");
        startScaleListening();
      }
    }

    if (item.variants) {
      if (item.variants.length === 1) {
        const v = item.variants[0];
        handleAddToCart({
          variantId: v.id, productId: v.productId, barcode: v.barcode,
          name: v.name, size: v.variantName, unit: v.unit,
          retailPrice: v.retailPrice, mrpPrice: v.mrpPrice, wholesalePrice: v.wholesalePrice,
          batches: v.batches
        }, finalQuantity);
      } else {
        startTransition(() => {
          setSelectedProductForVariants(item);
          setActiveDialog('variants');
        });
      }
      return;
    }

    if (!skipBatchCheck && item.variantId) {
      const batches = item.batches || [];
      if (batches.length > 1) {
        const pricingMode = receiptSettings?.posPricingMode || 'fifo';
        const forceOnConflict = receiptSettings?.enableBatchSelection === true;
        let shouldShowSelector = false;
        if (pricingMode === 'manual_batch') shouldShowSelector = true;
        else if (pricingMode === 'fifo' && forceOnConflict) {
          const prices = new Set(batches.map(b => parseFloat(b.selling_price).toFixed(2)));
          if (prices.size > 1) shouldShowSelector = true;
        }
        if (shouldShowSelector) {
          startTransition(() => {
            setAvailableBatches(batches);
            setItemPendingBatch({ item, quantity: finalQuantity });
            setActiveDialog('batch');
          });
          return;
        }
      }
    }

    const cart = cartRef.current;
    const existingIndex = cart.findIndex((ci) => ci.variantId === item.variantId && (!item.batchId || ci.batchId === item.batchId));

    if (existingIndex > -1) {
      const targetId = cart[existingIndex].id;
      setTimeout(() => {
        const ref = cartItemRefs.current.get(targetId);
        if (ref) { ref.focusQty(); editModeRef.current = "cart"; selectedIndexRef.current = existingIndex; }
      }, 0);
    }

    dispatch({ type: "ADD_ITEM", payload: { product: item, quantity: finalQuantity, batchId: item.batchId, price: item.price } });
    playBeep("scan");
  }, [dispatch, playBeep, session, receiptSettings, isHardwareReady, selectedScalePort, currentWeight, startScaleListening]);

  const handleBatchSelect = useCallback((batch) => {
    const { item, quantity } = itemPendingBatch;
    handleAddToCart({
      ...item, batchId: batch.id,
      price: state.isWholesale ? batch.wholesale_price : batch.selling_price
    }, quantity, true);
    setActiveDialog(null);
    setItemPendingBatch(null);
  }, [handleAddToCart, itemPendingBatch, state.isWholesale]);

  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const handleWholesaleToggle = useCallback(() => {
    const next = !state.isWholesale;
    dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: next, flatVariants: flattenedVariants, isManufacturing } });
    if (!next) setWholesaleDiscount(0);
  }, [state.isWholesale, flattenedVariants, dispatch, isManufacturing]);

  const resetSale = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    editModeRef.current = "search";
    searchRef.current?.focus();
  }, [dispatch]);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    const cart = state.cart;
    if (cart.length > 0) {
      setTimeout(() => {
        searchRef.current?.focus();
        editModeRef.current = "search";
      }, 50);
    }
  }, [state.cart.length]);

  // ── Keyboard handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = "";
        if (code.startsWith("20") && code.length === 13) {
          const productId = code.substring(2, 7);
          const weight = parseInt(code.substring(7, 12), 10) / 1000;
          const match = flattenedVariants.find(v => v.barcode === productId);
          if (match) {
            e.preventDefault();
            handleAddToCart({
              variantId: match.id, productId: match.productId, barcode: match.barcode,
              name: match.fullName, size: match.variantName, unit: match.unit,
              retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice
            }, weight);
            return;
          }
        }
        const match = flattenedVariants.find(v => v.barcode === code);
        if (match) {
          e.preventDefault();
          handleAddToCart({
            variantId: match.id, productId: match.productId, barcode: match.barcode,
            name: match.fullName, size: match.variantName, unit: match.unit,
            retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice
          });
          return;
        }
      }

      if (diff < 50 && e.key.length === 1) barcodeBufferRef.current += e.key;
      else barcodeBufferRef.current = e.key.length === 1 ? e.key : "";

      // ── Classic F-Key Shortcuts ───────────────────────────────────────────
      switch (e.key) {
        case "F1":
          e.preventDefault();
          const searchInput = document.getElementById("pos-global-search");
          if (searchInput) { searchInput.focus(); searchInput.select(); }
          break;
        case "F2":
          e.preventDefault();
          resetSale();
          break;
        case "F3":
          e.preventDefault();
          handleHoldSale({ onSuccess: resetSale });
          break;
        case "F4":
          e.preventDefault();
          setActiveDialog('holdList');
          fetchSales("draft");
          break;
        case "F7":
        case "F10":
          e.preventDefault();
          setActiveDialog('saleList');
          fetchSales("completed");
          break;
        case "F9":
          e.preventDefault();
          setActiveDialog('stock');
          clearStockData();
          setStockSearch("");
          break;
        case "F11":
          e.preventDefault();
          openDrawer();
          break;
        case "F12":
          e.preventDefault();
          if (cartRef.current.length > 0) {
            checkoutRef.current?.clickPayNow?.() || handlePayNow({ netTotal: cartRef.current.reduce((s, i) => s + (i.price * i.quantity), 0) });
          }
          break;
      }

      if (e.key === "Escape") {
        setActiveDialog(null);
        editModeRef.current = "search"; searchRef.current?.focus(); return;
      }

      const activeEl = document.activeElement;
      const activeTag = activeEl?.tagName?.toLowerCase();
      const isQtyInput = activeEl?.getAttribute("data-cart-qty") === "true";
      const isTypingInField = (activeTag === "input" || activeTag === "textarea" || activeTag === "select") && !isQtyInput;

      if (!isTypingInField && !e.ctrlKey && !e.altKey && !e.metaKey) { /* Single-key shortcuts if needed */ }

      const cart = cartRef.current;
      if (editModeRef.current === "cart" && cart.length > 0) {
        if (e.key === "ArrowDown") {
          const isAtBottom = selectedIndexRef.current === cart.length - 1;
          if (isAtBottom) { e.preventDefault(); checkoutRef.current?.focusCashIn(); return; }
          e.preventDefault();
          const next = Math.min(cart.length - 1, selectedIndexRef.current + 1);
          selectedIndexRef.current = next;
          cartItemRefs.current.get(cart[next].id)?.focusQty();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = Math.max(0, selectedIndexRef.current - 1);
          selectedIndexRef.current = prev;
          cartItemRefs.current.get(cart[prev].id)?.focusQty();
        }
        if (!isTypingInField && e.key === "Delete") {
          const target = cart[selectedIndexRef.current];
          if (target) {
            e.preventDefault(); dispatch({ type: "REMOVE_ITEM", payload: target.id });
            setTimeout(() => {
              const newCart = cartRef.current;
              if (newCart.length > 0) {
                const nextIdx = Math.min(selectedIndexRef.current, newCart.length - 1);
                selectedIndexRef.current = nextIdx;
                cartItemRefs.current.get(newCart[nextIdx].id)?.focusQty();
              } else { editModeRef.current = "search"; searchRef.current?.focus(); }
            }, 50);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    flattenedVariants, handleAddToCart, dispatch, resetSale,
    handleHoldSale, handlePayNow, fetchSales, clearStockData,
    state.cart.length, checkoutRef, searchRef, setActiveDialog
  ]);

  useEffect(() => {
    if (debouncedStockSearch?.length >= 2) fetchStock(debouncedStockSearch);
    else if (!debouncedStockSearch) clearStockData();
  }, [debouncedStockSearch, fetchStock, clearStockData]);

  const handleLivePreview = useCallback(({ grandTotal, totalDiscount, subtotal }) => {
    setPrintableSale({
      invoice_number: "PREVIEW", created_at: new Date().toISOString(),
      customer_name: state.customer?.name || "Guest Customer",
      items: state.cart.map((item) => ({
        product_name: item.name, quantity: item.quantity, unit_price: item.price,
        total_amount: item.price * item.quantity,
        discount_amount: (item.price * item.quantity) * ((item.discount || 0) / 100),
        product: { name: item.name }, variant_name: item.size
      })),
      total_amount: subtotal, discount_amount: totalDiscount, payable_amount: grandTotal,
      paid_amount: 0, payment_method: "preview", adjustment: 0, status: "preview",
    });
    playBeep("scan");
  }, [state.customer, state.cart, playBeep]);

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center md:hidden">
        <MonitorX className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">{t("pos.optimal_experience")}</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">{t("pos.designed_for")}</p>
      </div>

      <div className="hidden h-screen flex-col bg-muted/30 font-sans md:flex relative">
        <PosHeader
          handleDashboardExit={handleDashboardExit}
          handleThemeToggle={handleThemeToggle}
          theme={theme}
          refreshData={refreshData}
          isLoading={isLoading}
          branches={branches}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          activeShift={activeShift}
          setIsShiftManagerOpen={setIsShiftManagerOpen}
          requireShift={posResponse?.data?.requireShift}
          customers={customers}
          distributors={distributors}
          selectedCustomer={state.customer}
          selectedDistributor={state.distributor}
          handleSelectCustomer={handleSelectCustomer}
          handleSelectDistributor={handleSelectDistributor}
          addCustomerToList={addCustomerToList}
          addDistributorToList={addDistributorToList}
          isManufacturing={isManufacturing}
          isRestaurant={isRestaurant}
          business={business}
          session={session}
          isOnline={isOnline}
          onForceReset={forceReset}
          t={t}
          isProductListVisible={isProductListVisible}
          onToggleProductList={() => setIsProductListVisible(!isProductListVisible)}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          allProducts={allProducts}
          flattenedVariants={flattenedVariants}
          onAddToCart={handleAddToCart}
          onToggleCalculator={() => setActiveDialog(prev => prev === 'calculator' ? null : 'calculator')}
          isCalculatorOpen={activeDialog === 'calculator'}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          isWholesale={state.isWholesale}
          onWholesaleToggle={handleWholesaleToggle}
          onReset={resetSale}
          isHardwareReady={isHardwareReady}
        />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pr-24">
          {/* Main Cart Area - Left Side */}
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-card transition-all duration-300 border-r border-border/40">
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={state.cart}
                dispatch={dispatch}
                cartItemRefs={cartItemRefs}
                terminalName={terminalName}
                isWholesale={state.isWholesale}
                wholesaleDiscount={wholesaleDiscount}
                setWholesaleDiscount={setWholesaleDiscount}
                onWholesaleToggle={handleWholesaleToggle}
                enableWholesale={receiptSettings.enableWholesale ?? true}
                isManufacturing={isManufacturing}
                isRestaurant={isRestaurant}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onToggleFullScreen={toggleFullScreen}
                isFullScreen={isFullScreen}
                onReset={resetSale}
                onEnterPress={() => {
                  const searchInput = document.getElementById("pos-global-search");
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                  }
                }}
              />
            </div>
          </div>

          {/* Right Action Column: Held Sales + Checkout */}
          <aside className="w-full md:w-[35%] lg:w-[30%] flex flex-col h-full bg-muted/5 gap-4 p-4">
            <div className="flex-1 overflow-hidden bg-card rounded-2xl border border-border/40 shadow-sm flex flex-col">
              {!isProductListVisible ? (
                <HeldSalesPanel
                  sales={salesData}
                  isLoading={isLoadingSales}
                  onResume={resumeSale}
                  onDelete={(id) => deleteSale(id).then((ok) => ok && fetchSales("draft"))}
                  t={t}
                />
              ) : (
                <ProductGrid
                  ref={searchRef}
                  allProducts={allProducts}
                  flattenedVariants={flattenedVariants}
                  onAddToCart={handleAddToCart}
                  isWholesale={state.isWholesale}
                  productSearch={debouncedProductSearch}
                />
              )}
            </div>

            <div id="pos-actions" className="shrink-0 bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              <CheckoutPanel
                ref={checkoutRef}
                cart={state.cart}
                isWholesale={state.isWholesale}
                handlePayNow={(args) => handlePayNow({
                  ...args,
                  dining_type: queryDiningType || args.dining_type,
                  dining_table_id: queryTableId || args.dining_table_id,
                  sale_id: querySaleId || args.sale_id,
                  waiter_id: session?.user?.id
                })}
                handleHoldSale={(args) => handleHoldSale({
                  ...args,
                  dining_type: queryDiningType || args.dining_type,
                  dining_table_id: queryTableId || args.dining_table_id,
                  sale_id: querySaleId || args.sale_id,
                  waiter_id: session?.user?.id
                })}
                onHoldList={() => { setActiveDialog('holdList'); fetchSales("draft"); }}
                onSaleList={() => { setActiveDialog('saleList'); fetchSales("completed"); }}
                onCheckStock={() => { setActiveDialog('stock'); clearStockData(); setStockSearch(""); }}
                activeEmployees={activeEmployees}
                defaultEmployeeIds={session?.user?.id ? [session.user.id] : []}
                showReceiptPreview={!!posResponse?.data?.showReceiptPreview}
                onLivePreview={handleLivePreview}
                activePaymentMethods={posResponse?.data?.activePaymentMethods}
                customerId={state.customer?.id}
                selectedCustomer={state.customer}
                distributorId={state.distributor?.id}
                selectedDistributor={state.distributor}
                queryDiningType={queryDiningType}
                queryTableNum={queryTableNum}
                querySaleId={querySaleId}
              />
            </div>
          </aside>
        </div>
      </div>

      <UtilitySidebar
        cartEmpty={state.cart.length === 0}
        isRestaurant={isRestaurant}
        onAction={(key) => {
          if (key === 'hold' || key === 'holdSale') {
            handleHoldSale({
              adjustment: 0,
              selectedEmployeeIds: [],
              generalDiscount: 0,
              wholesaleDiscount: 0,
              onSuccess: resetSale
            });
          } else if (key === 'openDrawer') {
            openDrawer();
          } else if (key === 'holdList') { setActiveDialog('holdList'); fetchSales("draft"); }
          else if (key === 'saleList') { setActiveDialog('saleList'); fetchSales("completed"); }
          else if (key === 'checkStock' || key === 'stock') { setActiveDialog('stock'); clearStockData(); setStockSearch(""); }
          else if (key === 'reports') router.push("/reports");
          else if (key === 'salesByProduct') window.open("/reports/sales/product", "_blank");
          else if (key === 'purchase') router.push("/purchase/suppliers");
          else if (key === 'inventory') router.push("/products");
        }}
      />

      {/* ── Dialogs ── */}
      <HoldListDialog isOpen={activeDialog === 'holdList'} onOpenChange={(open) => setActiveDialog(open ? 'holdList' : null)}
        salesData={salesData} isLoadingSales={isLoadingSales} onResume={resumeSale}
        onDelete={(id) => deleteSale(id).then((ok) => ok && fetchSales("draft"))} />

      <BatchSelectorDialog isOpen={activeDialog === 'batch'} onOpenChange={(open) => setActiveDialog(open ? 'batch' : null)}
        batches={availableBatches} onSelect={handleBatchSelect} productName={itemPendingBatch?.item?.name} />

      <SaleListDialog isOpen={activeDialog === 'saleList'} onOpenChange={(open) => setActiveDialog(open ? 'saleList' : null)}
        salesData={salesData} isLoadingSales={isLoadingSales} setPrintableSale={setPrintableSale}
        setSelectedReturnSale={setSelectedReturnSale} setIsReturnDialogOpen={(open) => setActiveDialog(open ? 'return' : null)}
        searchSales={searchSales} />

      <StockCheckDialog isOpen={activeDialog === 'stock'} onOpenChange={(open) => setActiveDialog(open ? 'stock' : null)}
        stockData={stockData} isLoadingStock={isLoadingStock} stockSearch={stockSearch}
        setStockSearch={setStockSearch} selectedBranch={selectedBranch} onAddToCart={handleAddToCart} />

      {activeDialog === 'calculator' && <Calculator onClose={() => setActiveDialog(null)} />}

      <VariantSelectorDialog isOpen={activeDialog === 'variants'} onOpenChange={(open) => setActiveDialog(open ? 'variants' : null)}
        product={selectedProductForVariants} onSelect={handleAddToCart} />

      <ReturnDialogWrapper isOpen={activeDialog === 'return'} onOpenChange={(open) => setActiveDialog(open ? 'return' : 'saleList')}
        sale={selectedReturnSale} onSuccess={() => fetchSales("completed")} />

      <SaleDetailWrapper isOpen={activeDialog === 'detail'} onOpenChange={(open) => setActiveDialog(open ? 'detail' : null)}
        sale={selectedSaleDetail} onReprint={setPrintableSale} />

        <PaymentDialog
          isOpen={activeDialog === 'payment'}
          onOpenChange={(open) => setActiveDialog(open ? 'payment' : null)}
          netTotal={pendingPaymentArgs?.netTotal || 0}
          onConfirm={confirmFinalPayment}
          paymentMethods={posResponse?.data?.activePaymentMethods || ["cash"]}
          allCustomers={customers}
          selectedCustomer={state.customer}
          onSelectCustomer={(c) => dispatch({ type: 'SET_CUSTOMER', payload: c })}
          enableMultiplePayments={posResponse?.data?.enableMultiplePayments}
          settings={posResponse?.data}
        />

      <ShiftManagerDialog
        isOpen={isShiftManagerOpen || activeDialog === 'shift'} onClose={() => { setIsShiftManagerOpen(false); setActiveDialog(null); }}
        forceOpen={posResponse?.data?.requireShift !== false && !isShiftLoading && !activeShift}
        activeShift={activeShift} openShift={openShift} closeShift={closeShift} branchId={selectedBranch?.id}
      />

      <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
        <div className="block print:block">
          {receiptSettings?.invoiceTemplate === 'a4_professional' ? (
            <InvoiceA4Template ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
          ) : (
            <ReceiptTemplate ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
          )}
        </div>
      </div>
    </>
  );
}
