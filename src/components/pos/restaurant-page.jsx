"use client";
import { ArrowLeft, Maximize, Minimize, Trash2, Moon, Sun, Calculator as CalculatorIcon, ZoomIn, ZoomOut, Clock, ChevronRight, ChevronLeft } from "lucide-react";

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

import { usePosData } from "./hooks/usePosData";
import { usePosCart } from "./hooks/usePosCart";
import { usePosActions } from "./hooks/usePosActions";
import {
  HoldListDialog, SaleListDialog, StockCheckDialog,
  ReturnDialogWrapper, SaleDetailWrapper, VariantSelectorDialog, PaymentDialog
} from "./components/PosDialogs";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { RestaurantReceiptTemplate } from "./RestaurantReceiptTemplate";
import { InvoiceA4Template } from "./InvoiceA4Template";
import { ShiftManagerDialog } from "./components/ShiftManagerDialog";
import BatchSelectorDialog from "./components/BatchSelectorDialog";
import Calculator from "./components/Calculator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "@/lib/date-utils";
import { TableSelectionDialog } from "./components/TableSelectionDialog";
import { UtilitySidebar } from "./components/UtilitySidebar";

export default function RestaurantPosPage() {
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
  const { business, loyalty, general, refreshSettings, formatCurrency } = useAppSettings();
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
  const [activeDialog, setActiveDialog] = useState(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  // Restaurant-specific state
  const [activeDiningType, setActiveDiningType] = useState(queryDiningType || "dine_in");
  const [manualTableId, setManualTableId] = useState(queryTableId || "");
  const [manualTableNum, setManualTableNum] = useState(queryTableNum || "");
  const [activeSalesTab, setActiveSalesTab] = useState("recent");
  const [activeOrderFilter, setActiveOrderFilter] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [vegFilter, setVegFilter] = useState({ veg: false, nonVeg: false, egg: false });
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
    if (posResponse?.data?.showRecentOrders === false && activeSalesTab === "recent") {
      setActiveSalesTab("hold");
    }
  }, [posResponse?.data?.showRecentOrders, activeSalesTab]);

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
  const recentOrdersScrollRef = useRef(null);
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

    // Calculate the actual net total after applying the extra discount from the dialog
    const extraDiscountAmt = paymentData.generalDiscountAmt || 0;
    const extraDiscountPct = paymentData.generalDiscount || 0;
    const originalNetTotal = pendingPaymentArgs?.netTotal || 0;
    const discountDeduction = extraDiscountAmt > 0
      ? extraDiscountAmt
      : originalNetTotal * (extraDiscountPct / 100);
    const finalNetTotal = Math.max(0, originalNetTotal - discountDeduction);

    // Merge modal data with original checkout args
    // Convert payments from { method, received } → { payment_method, amount } for usePosActions
    const normalizedPayments = paymentData.payments
      ? paymentData.payments.map(p => ({ payment_method: p.method, amount: p.received }))
      : [{ payment_method: "cash", amount: paymentData.received || finalNetTotal }];

    const finalizedArgs = {
      ...pendingPaymentArgs,
      netTotal: finalNetTotal,
      payments: normalizedPayments,
      generalDiscountAmt: extraDiscountAmt,
      generalDiscount: extraDiscountPct,
      activeShiftId: activeShift?.id,
      sendToKitchen: paymentData.sendToKitchen
    };

    console.log("[Debug] restaurant-page.jsx -> confirmFinalPayment");
    console.log("[Debug] 1. paymentData received from PaymentDialog:", paymentData);
    console.log("[Debug] 2. pendingPaymentArgs:", pendingPaymentArgs);
    console.log("[Debug] 3. finalizedArgs being sent to rawHandlePayNow:", finalizedArgs);

    if (querySaleId) {
      await deleteSale(querySaleId);
      delete finalizedArgs.sale_id; // Ensure we don't hit append
    }

    // Show change on customer display if applicable
    const totalReceived = normalizedPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const change = totalReceived - finalNetTotal;
    if (isHardwareReady && selectedDisplayPort && change > 0) {
      updateDisplay("CHANGE DUE:", formatCurrency(change));
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
    fetchSales(activeSalesTab === "recent" ? "completed" : "draft");
  }, [fetchSales, activeSalesTab]);

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

  const handleUtilityAction = useCallback((actionKey) => {
    switch (actionKey) {
      case "hold":
        handleHoldSale({
          adjustment: 0,
          generalDiscount: 0,
          generalDiscountAmt: 0,
          wholesaleDiscount: 0,
          selectedEmployeeIds: [],
          onSuccess: resetSale,
          dining_type: activeDiningType,
          dining_table_id: manualTableId || queryTableId,
          waiter_id: null
        });
        break;
      case "holdList":
        if (fetchSales) fetchSales("draft");
        setActiveDialog('holdList');
        break;
      case "saleList":
        if (fetchSales) fetchSales("completed");
        setActiveDialog('saleList');
        break;
      case "checkStock":
        setActiveDialog('stock');
        break;
      case "openDrawer":
        if (openDrawer) {
          openDrawer();
        }
        break;
      case "reports":
        router.push("/reports");
        break;
      case "salesByProduct":
        window.open("/reports/sales/product", "_blank");
        break;
      case "inventory":
        router.push("/products");
        break;
    }
  }, [router, handleHoldSale, fetchSales, activeDiningType, manualTableId, queryTableId, resetSale, openDrawer]);

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
    <div className="flex h-screen w-full bg-[#f8f9fc] dark:bg-[#020817] font-sans text-gray-900 dark:text-slate-100 overflow-hidden transition-colors pr-24">
      {/* LEFT SECTION */}
      <div className="flex-1 flex flex-col min-w-0 pr-4 pl-6 py-6 border-r border-gray-200 dark:border-slate-800/50" style={{ zoom: zoomLevel }}>

        {/* HEADER AREA */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/'}
              className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/60 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
            <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 tracking-tight">
              {business?.name || localBusiness?.name || "Restaurant POS"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls Segment */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden h-9">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}
                className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-gray-100 dark:bg-slate-800" />
              <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 w-12 text-center bg-gray-50/80 dark:bg-slate-950 h-full flex items-center justify-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <div className="w-px h-5 bg-gray-100 dark:bg-slate-800" />
              <button
                onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}
                className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Utilities Segment */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/60 rounded-xl shadow-sm overflow-hidden h-9">
              <button
                onClick={() => setActiveDialog('shift')}
                className={`w-10 h-full flex items-center justify-center transition-colors ${activeDialog === 'shift' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400"
                  }`}
                title="Shift Management"
              >
                <Clock className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-gray-100 dark:bg-slate-800" />
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-full flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <div className="w-px h-5 bg-gray-100 dark:bg-slate-800" />
              <button
                onClick={() => setActiveDialog(activeDialog === 'calculator' ? null : 'calculator')}
                className={`w-10 h-full flex items-center justify-center transition-colors ${activeDialog === 'calculator' ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                title="Calculator"
              >
                <CalculatorIcon className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-gray-100 dark:bg-slate-800" />
              <button
                onClick={handleToggleFullscreen}
                className={`w-10 h-full flex items-center justify-center transition-colors ${isFullscreen ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>

            {/* Clear Action */}
            <button
              onClick={resetSale}
              className="px-4 h-9 flex items-center gap-2 rounded-xl transition-all bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold text-[11px] uppercase tracking-wider shadow-sm ml-1"
              title="Clear Sale"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* ── RECENT ORDERS ROW ── */}
        <div className="mb-5 shrink-0">
          <div className="flex items-center justify-between mb-3">
            
            {/* Sales Tabs */}
            <div className="flex items-center gap-6">
              {posResponse?.data?.showRecentOrders !== false && (
                <button
                  onClick={() => { setActiveSalesTab("recent"); fetchSales("completed"); }}
                  className={`text-xl font-bold transition-all pb-1 border-b-[3px] ${
                    activeSalesTab === "recent" ? "text-gray-900 dark:text-slate-100 border-[#4c51f7]" : "text-gray-400 dark:text-slate-600 border-transparent hover:text-gray-600 dark:hover:text-slate-400"
                  }`}
                >
                  Recent Orders
                </button>
              )}
              <button
                onClick={() => { setActiveSalesTab("hold"); fetchSales("draft"); }}
                className={`text-xl font-bold transition-all pb-1 border-b-[3px] ${
                  activeSalesTab === "hold" ? "text-gray-900 dark:text-slate-100 border-[#4c51f7]" : "text-gray-400 dark:text-slate-600 border-transparent hover:text-gray-600 dark:hover:text-slate-400"
                }`}
              >
                Hold Sales
              </button>
            </div>

            {/* Dining Type Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {["all", "dine_in", "takeaway", "delivery"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveOrderFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeOrderFilter === f
                    ? "bg-[#4c51f7] text-white shadow-md shadow-indigo-200 dark:shadow-none border border-transparent"
                    : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                    }`}
                >
                  {{ all: "All Orders", dine_in: "Dine In", takeaway: "Take Away", delivery: "Delivery" }[f]}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd'); // 'YYYY-MM-DD'
            
            const filteredSales = salesData?.filter(sale => {
              // Only filter by today if we are viewing Recent Orders (completed sales)
              if (activeSalesTab === "recent") {
                const saleDateStr = format(new Date(sale.created_at), 'yyyy-MM-dd');
                if (saleDateStr !== todayStr) return false;
              }
              return activeOrderFilter === "all" || sale.dining_type === activeOrderFilter;
            }) || [];
            const showArrows = filteredSales.length > 4 && !isLoadingSales;

            return (
              <div className="relative group">
                <div 
                  ref={recentOrdersScrollRef}
                  className="flex gap-3 overflow-x-auto pb-2 scroll-smooth" 
                  style={{ scrollbarWidth: "none" }}
                >
                  {isLoadingSales ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="min-w-[200px] h-[100px] bg-gray-100 dark:bg-slate-800/50 rounded-2xl animate-pulse shrink-0" />
                    ))
                  ) : filteredSales.length > 0 ? (
                    filteredSales
                      .slice(0, 15)
                      .map((sale, i) => {
                      const dType = sale.dining_type || "delivery";
                      const dLabel = { dine_in: "Dine In", takeaway: "Take Away", delivery: "Delivery" }[dType] || dType;
                      const dIcon = { dine_in: "🍽", takeaway: "🛍", delivery: "🛵" }[dType] || "🍽";
                      
                      const dColor = {
                        dine_in: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
                        takeaway: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
                        delivery: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
                      }[dType] || "text-gray-700 bg-gray-50";

                      const elapsed = Math.round((Date.now() - new Date(sale.created_at)) / 60000);
                      const isLate = elapsed > 30;
                      return (
                        <div
                          key={sale.id}
                          className="min-w-[200px] bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800/60 shadow-sm shrink-0 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all flex flex-col"
                          onClick={() => {
                            if (activeSalesTab === "hold") {
                              resumeSale(sale);
                            } else {
                              setSelectedSaleDetail(sale);
                              setActiveDialog('detail');
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <span className={`font-bold text-[13px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 ${dColor}`}>
                              <span>{dIcon}</span>{dLabel}
                            </span>
                            {sale.table_number && (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold border border-indigo-100">
                                Table {sale.table_number}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[11px] font-mono text-gray-400 dark:text-slate-500 mb-1 truncate">
                            {sale.invoice_number || sale.id}
                          </div>
                          
                          {sale.customer_name && sale.customer_name.toLowerCase() !== "guest" && (
                            <h3 className="text-[12px] font-medium text-gray-500 dark:text-slate-400 truncate">
                              {sale.customer_name}
                            </h3>
                          )}
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <span className="text-gray-400 text-[11px]">
                              {format(new Date(sale.created_at), 'hh:mm a')}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                              {formatCurrency(sale.payable_amount || sale.net_total || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-full h-[118px] bg-gray-50/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700/50 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
                      <Clock className="w-5 h-5 mb-1.5 opacity-60" />
                      <span className="text-sm font-medium">
                        {activeSalesTab === "hold" ? "No hold sales found" : "No recent orders found"}
                      </span>
                    </div>
                  )}
                </div>

                {showArrows && (
                  <>
                    <button 
                      onClick={() => recentOrdersScrollRef.current?.scrollBy({ left: -250, behavior: 'smooth' })}
                      className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => recentOrdersScrollRef.current?.scrollBy({ left: 250, behavior: 'smooth' })}
                      className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-100 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── MENU CATEGORIES ── */}
        <div className="mb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Menu Categories</h2>

            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search menu..."
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="pl-4 pr-9 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-500 w-44 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs">🔍</span>
            </div>
          </div>

          {/* Category pills from real product categories */}
          {(() => {
            const cats = ["all", ...new Set((allProducts || []).map(p => p.category).filter(Boolean))];
            return (
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {cats.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${activeCategory === cat
                      ? "bg-[#4c51f7] text-white border-indigo-500 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                      }`}
                  >
                    {cat === "all" ? `All (${(allProducts || []).length})` : `${cat} (${(allProducts || []).filter(p => p.category === cat).length})`}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* PRODUCTS GRID */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {(() => {
            const anyVeg = vegFilter.veg || vegFilter.nonVeg || vegFilter.egg;
            const filtered = (allProducts || []).filter(p => {
              if (activeCategory !== "all" && p.category !== activeCategory) return false;
              if (menuSearch && !p.name?.toLowerCase().includes(menuSearch.toLowerCase())) return false;
              return true;
            });
            if (filtered.length === 0) return (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <span className="text-4xl mb-2">🍽️</span>
                <p className="text-sm">No items found</p>
              </div>
            );
            const categoryColors = [
              "bg-blue-100 dark:bg-blue-950/40", "bg-green-100 dark:bg-green-950/40", "bg-amber-100 dark:bg-amber-950/40", "bg-red-100 dark:bg-red-950/40",
              "bg-purple-100 dark:bg-purple-950/40", "bg-pink-100 dark:bg-pink-950/40", "bg-indigo-100 dark:bg-indigo-950/40", "bg-orange-100 dark:bg-orange-950/40", "bg-teal-100 dark:bg-teal-950/40", "bg-cyan-100 dark:bg-cyan-950/40"
            ];

            const getCategoryColor = (category) => {
              if (!category || category === "Menu") return "bg-white";
              let hash = 0;
              for (let i = 0; i < category.length; i++) {
                hash = category.charCodeAt(i) + ((hash << 5) - hash);
              }
              return categoryColors[Math.abs(hash) % categoryColors.length];
            };

            return (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((product, i) => {
                  const cartItem = state.cart.find(c => c.variantId === product.variants?.[0]?.id || c.productId === product.id);
                  const qty = cartItem?.quantity || 0;
                  return (
                    <div
                      key={product.id || i}
                      className={`rounded-2xl p-3 shadow-sm border transition-all cursor-pointer group flex flex-col ${qty > 0 ? "border-indigo-400 dark:border-indigo-500 shadow-indigo-100 dark:shadow-none ring-1 ring-indigo-400 dark:ring-indigo-500" : "border-gray-100 dark:border-slate-800/60 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-700"
                        } ${getCategoryColor(product.category)}`}
                      onClick={() => handleAddToCart(product)}
                    >


                      {(posResponse?.data?.showProductImage ?? true) && (
                        <div className="w-full aspect-[4/3] bg-gray-100 dark:bg-slate-900 rounded-xl mb-2 overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl opacity-80">
                              {["🍕", "🍗", "🥗", "🍜", "🌮", "🦞", "🥩", "🍱"][i % 8]}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{product.category || "Menu"}</span>
                      </div>

                      <h3 className="font-bold text-xs text-gray-900 dark:text-slate-100 leading-tight mb-2 line-clamp-2">{product.name}</h3>

                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-xs text-gray-900 dark:text-slate-200 font-medium">
                          {product.minRetail ? formatCurrency(product.minRetail) : "-"}
                        </span>
                        <div
                          className="flex items-center gap-1 bg-gray-50 dark:bg-slate-900 rounded-full border border-gray-200 dark:border-slate-700 px-1.5 py-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 w-4 h-4 flex items-center justify-center text-sm font-bold"
                            onClick={e => { e.stopPropagation(); if (cartItem) dispatch({ type: "UPDATE_ITEM", payload: { id: cartItem.id, quantity: Math.max(0, cartItem.quantity - 1) } }); }}
                          >-</button>
                          <span className={`text-xs font-bold w-4 text-center ${qty > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-slate-500"}`}>{qty}</span>
                          <button
                            className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300 w-4 h-4 flex items-center justify-center text-sm font-bold"
                            onClick={e => { e.stopPropagation(); handleAddToCart(product); }}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>

      {/* RIGHT SECTION: CART */}
      <div className="w-[400px] shrink-0 bg-white dark:bg-slate-900 flex flex-col h-full border-l border-gray-200 dark:border-slate-800 shadow-xl z-10 transition-colors">

        {/* Order Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-800/60">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {querySaleId ? `Order #${querySaleId}` : "New Order"}
            </h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {format(new Date(), 'MMM dd, yyyy, hh:mm a')}
            </span>
          </div>

          {/* Dining Type Selector */}
          <div className="flex gap-1.5 mb-3">
            {[["dine_in", "🍽", "Dine In"], ["takeaway", "🛍", "Take Away"], ["delivery", "🛵", "Delivery"]].map(([type, icon, label]) => (
              <button
                key={type}
                onClick={() => setActiveDiningType(type)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${activeDiningType === type
                  ? "bg-[#4c51f7] text-white shadow-md shadow-indigo-100 dark:shadow-none"
                  : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50"
                  }`}
              >
                <span>{icon}</span>{label}
              </button>
            ))}
          </div>

          {/* Waiter + Customer row */}
          <div className="flex gap-2">
            <div className="flex-1 border border-gray-200 dark:border-slate-800 rounded-lg flex items-center px-2 py-1.5 bg-gray-50 dark:bg-slate-950">
              <select className="bg-transparent w-full outline-none text-xs text-gray-700 dark:text-slate-300 font-medium">
                <option value="">{session?.user?.name || "Waiter"}</option>
                {activeEmployees?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {/* Customer Selection - Commented out for Restaurant Type 
            <div className="flex-[2] border border-gray-200 dark:border-slate-800 rounded-lg flex items-center px-2 py-1.5 bg-white dark:bg-slate-900">
              <input type="text" placeholder="Select Customer" className="w-full outline-none text-xs text-gray-700 dark:text-slate-300 bg-transparent" value={state.customer?.name || ""} readOnly />
              <button className="w-5 h-5 bg-[#4c51f7] rounded flex items-center justify-center text-white text-xs ml-1 shrink-0">+</button>
            </div>
            */}

            {/* Manual Table Input / Table Selection Button */}
            {activeDiningType === 'dine_in' && (
              <div className="flex-[2]">
                <button
                  onClick={() => setActiveDialog('tableSelect')}
                  className="w-full h-full min-h-[34px] border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-between px-3 text-[13px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-1.5 truncate pr-1">
                    {manualTableNum ? (manualTableNum.toLowerCase().startsWith('table') ? manualTableNum : `Table ${manualTableNum}`) : "Select Table"}
                  </span>
                  {!manualTableNum && (
                    <span className="px-2 py-0.5 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-sm ml-1 shrink-0">
                      MAP
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ordered Menus Title */}
        <div className="px-5 py-3 flex justify-between items-center border-b border-gray-100 dark:border-slate-800/60">
          <h3 className="font-bold text-gray-900 dark:text-slate-100">Ordered Menus</h3>
          <span className="text-xs text-gray-500 dark:text-slate-400">Total Menus : {state.cart.length}</span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-50/50 dark:bg-slate-950/30">
          {state.cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500">Cart is empty</div>
          ) : (
            <div className="flex flex-col gap-3">
              {state.cart.map((item, idx) => (
                <div key={idx} className={`bg-white dark:bg-slate-900 p-2.5 rounded-xl border ${idx === 0 ? 'border-[#4c51f7] dark:border-indigo-500 shadow-sm' : 'border-gray-100 dark:border-slate-800'}`}>
                  <div className="flex gap-2.5 relative">
                    {(posResponse?.data?.showProductImage ?? true) && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-xs opacity-80">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} /> : "🍽️"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100 truncate">{item.name}</h4>
                            {state.activeTabId && !item.isSaved && (
                              <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-black bg-emerald-500 text-white shadow-sm shrink-0 uppercase tracking-wider leading-none">
                                New
                              </span>
                            )}
                          </div>
                          {item.size && item.size !== "Default" && item.size !== item.name && (
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{item.size}</p>
                          )}
                        </div>
                        <span className="font-bold text-sm text-gray-900 dark:text-slate-100 shrink-0 ml-2">{formatCurrency(item.price * item.quantity)}</span>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <button className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" onClick={() => dispatch({ type: 'UPDATE_ITEM', payload: { id: item.id, quantity: Math.max(1, item.quantity - 1) } })}>-</button>
                          <span className="font-semibold text-sm w-5 text-center dark:text-slate-200">{item.quantity}</span>
                          <button className="w-6 h-6 flex items-center justify-center rounded bg-gray-900 dark:bg-slate-700 text-white hover:bg-gray-700 dark:hover:bg-slate-600 transition-colors" onClick={() => dispatch({ type: 'UPDATE_ITEM', payload: { id: item.id, quantity: item.quantity + 1 } })}>+</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">{formatCurrency(item.price)}/ea</span>
                        </div>
                      </div>
                    </div>

                    <button className="absolute top-0 right-0 w-5 h-5 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center text-xs hover:bg-red-500 hover:text-white dark:hover:bg-red-500/30 transition-colors" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="p-5 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3">Payment Summary</h3>
          <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
            <span>Sub Total</span>
            <span className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(state.cart.reduce((s, i) => s + (i.price * i.quantity), 0))}</span>
          </div>
          {(() => {
            const taxConfig = general?.finance || {};
            const enableTax = taxConfig.enableTax !== false && taxConfig.enableTax !== 'false';
            const taxRate = (enableTax && taxConfig.taxRate) ? parseFloat(taxConfig.taxRate) / 100 : 0;
            const subTotal = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
            
            // Replicate usePosActions logic
            const itemDiscounts = state.cart.reduce((a, i) => a + (i.price * i.quantity * (i.discount / 100)) + (parseFloat(i.discount_amt) || 0), 0);
            const grandTotal = subTotal - itemDiscounts;
            const taxAmount = grandTotal * taxRate;
            const netTotal = Math.round((grandTotal + taxAmount) * 100) / 100;

            return (
              <>
                {itemDiscounts > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2 text-red-500">
                    <span>Discount</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(itemDiscounts)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-4 pb-4 border-b border-gray-100 dark:border-slate-800/60">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-5 mt-2">
                  <span className="font-bold text-gray-900 dark:text-slate-100">Amount to be Paid</span>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">{formatCurrency(netTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-200 dark:shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={state.cart.length === 0}
                    onClick={() => {
                      rawHandleHoldSale({
                        dining_type: activeDiningType,
                        dining_table_id: manualTableId || queryTableId,
                        waiter_id: null,
                      });
                    }}
                  >
                    🔥 Send to Kitchen
                  </button>

                  <button
                    className="w-full py-3 bg-[#4c51f7] hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={state.cart.length === 0}
                    onClick={() => {
                      handlePayNow({
                        netTotal,
                        taxAmount,
                        itemDiscounts,
                        adjustment: 0,
                        generalDiscount: 0,
                        generalDiscountAmt: 0,
                        wholesaleDiscount: 0,
                        selectedEmployeeIds: [],
                        dining_type: activeDiningType,
                        dining_table_id: manualTableId || queryTableId,
                        waiter_id: null,
                      });
                    }}
                  >
                    💵 Pay / Checkout
                  </button>
                </div>
              </>
            );
          })()}
        </div>

      </div>

      {/* ── Utility Sidebar ── */}
      <UtilitySidebar onAction={handleUtilityAction} cartEmpty={state.cart.length === 0} isRestaurant={true} />

      {/* ── All Dialogs ── */}
      <TableSelectionDialog
        isOpen={activeDialog === 'tableSelect'}
        onOpenChange={(open) => setActiveDialog(open ? 'tableSelect' : null)}
        onSelectTable={(table) => {
          setManualTableId(table.id);
          setManualTableNum(table.table_number.charAt(0).toUpperCase() + table.table_number.slice(1));
        }}
      />
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
        isRestaurant={true}
      />

      <ShiftManagerDialog
        isOpen={isShiftManagerOpen || activeDialog === 'shift'}
        onClose={() => { setIsShiftManagerOpen(false); setActiveDialog(null); }}
        forceOpen={posResponse?.data?.requireShift !== false && !isShiftLoading && !activeShift}
        activeShift={activeShift} openShift={openShift} closeShift={closeShift} branchId={selectedBranch?.id}
      />

      <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
        <div>
          {receiptSettings?.invoiceTemplate === 'a4_professional' ? (
            <InvoiceA4Template ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
          ) : (
            <RestaurantReceiptTemplate ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
          )}
        </div>
      </div>

    </div>
  );
}
