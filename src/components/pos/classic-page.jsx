"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useReactToPrint } from "react-to-print";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useBeep } from "@/hooks/use-beep";
import { toast } from "sonner";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { useShift } from "@/app/hooks/swr/useShift";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { usePwaInstall } from "@/hooks/use-pwa-install";

import {
  Search, X, Loader2, Plus, Minus, Trash2,
  History, List, FileText, Package, BarChart3,
  ShoppingCart, RefreshCcw, ShieldCheck, CreditCard,
  Settings, User, Clock, Monitor, Calculator as CalcIcon,
  Maximize, Minimize, Printer, RotateCcw, PackageSearch,
  LayoutGrid, Trash, Sun, Moon, Briefcase, AlertTriangle, UtensilsCrossed
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { db } from "@/lib/indexedDB/db";
import { usePosData } from "./hooks/usePosData";
import { usePosCart } from "./hooks/usePosCart";
import { usePosActions } from "./hooks/usePosActions";
import {
  HoldListDialog, SaleListDialog, StockCheckDialog,
  ReturnDialogWrapper, SaleDetailWrapper
} from "./components/PosDialogs";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { InvoiceA4Template } from "./InvoiceA4Template";
import Calculator from "./components/Calculator";
import { CustomerSelector } from "./components/CustomerSelector";
import BatchSelectorDialog from "./components/BatchSelectorDialog";
import TenderModal from "./components/TenderModal";
import { isValid } from "date-fns";
import { format } from "@/lib/date-utils";
import clsx from "clsx";
import { cn } from "@/lib/utils";


// --- Components ---

const ActionButton = ({ icon: Icon, label, shortcut, onClick, className, color = "bg-primary/90 hover:bg-primary text-primary-foreground" }) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-95 border border-border/10 hover:brightness-110 h-full w-full shadow-sm font-sans antialiased cursor-pointer",
      color,
      className
    )}
  >
    <Icon className="h-10 w-10 mb-2 drop-shadow-sm" />
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-sm font-extrabold uppercase tracking-tight drop-shadow-sm whitespace-nowrap">{label}</span>
        {shortcut && <span className=" font-black  uppercase tracking-tighter">{shortcut}</span>}
      </div>
    </div>
  </button>
);

export default function ClassicPosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDiningType = searchParams ? searchParams.get("dining_type") : null;
  const queryTableId = searchParams ? searchParams.get("dining_table_id") : null;
  const queryTableNum = searchParams ? searchParams.get("table_number") : null;
  const querySaleId = searchParams ? searchParams.get("sale_id") : null;
  const { theme, setTheme } = useTheme();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { isInstallAvailable, handleInstallClick } = usePwaInstall();
  const { data: nextAuthSession } = useSession();
  const { 
    receipt: receiptSettings, setReceiptSettings, 
    business: localBusiness, setBusinessSettings, 
    setGeneralSettings,
    session: localSession, setSession: setLocalSession
  } = useSettingsStore();

  // effectiveSession provides fallback to local storage if next-auth is loading/offline
  const session = useMemo(() => nextAuthSession || localSession, [nextAuthSession, localSession]);

  useEffect(() => {
    if (nextAuthSession) {
      setLocalSession(nextAuthSession);
    }
  }, [nextAuthSession, setLocalSession]);
  const { useBusinessSettings, useModularSettings } = useSettings();
  const { data: businessResponse } = useBusinessSettings();
  const { data: posResponse } = useModularSettings("pos");
  const { data: generalResponse } = useModularSettings("general");
  const { business, general, refreshSettings } = useAppSettings();
  const isRestaurant = (business?.business_type || session?.user?.organization?.business_type || "").toLowerCase() === 'restaurant';
  const { t } = useTranslation();
  const { playBeep } = useBeep();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const { useActiveShift, openShift, closeShift } = useShift();
  const { data: activeShiftRes, isLoading: isShiftLoading } = useActiveShift();
  const activeShift = activeShiftRes?.data || null;
  const [isOnline, setIsOnline] = useState(true);

  // -- Clock --
  useEffect(() => {
    const t = setInterval(() => setCurrentDateTime(new Date()), 1000);
    document.title = "POS | Inzeedo POS";
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (businessResponse?.data) setBusinessSettings(businessResponse.data);
    if (posResponse?.data) setReceiptSettings(posResponse.data);
    if (generalResponse?.data) setGeneralSettings(generalResponse.data);
  }, [businessResponse, posResponse, generalResponse]);

  // -- Core hooks --
  const {
    allProducts, flattenedVariants, customers, distributors,
    activeEmployees, branches, selectedBranch, setSelectedBranch,
    isLoading, refreshData
  } = usePosData();
  const { state, dispatch, handleSelectCustomer, handleSelectDistributor } = usePosCart();

  // -- UI state --
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isHoldListOpen, setIsHoldListOpen] = useState(false);
  const [isSaleListOpen, setIsSaleListOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [printableSale, setPrintableSale] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [terminalName, setTerminalName] = useState("");
  const [isBatchSelectorOpen, setIsBatchSelectorOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [itemPendingBatch, setItemPendingBatch] = useState(null);
  const [lastSaleInfo, setLastSaleInfo] = useState({ bill: 0, paid: 0, balance: 0, timestamp: null });

  const [barcodeInput, setBarcodeInput] = useState("");
  const debouncedBarcodeInput = useDebounce(barcodeInput, 50);
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const searchRef = useRef(null);
  const printRef = useRef(null);
  const cartContainerRef = useRef(null);

  // Auto-scroll cart to bottom when items are added
  useEffect(() => {
    if (cartContainerRef.current && state.cart.length > 0) {
      cartContainerRef.current.scrollTo({
        top: cartContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [state.cart.length]);

  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("pos_terminal_id");
    if (saved) setTerminalName(saved);

    // Online/Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    
    // Monitor pending sales count for the UI badge
    const checkPending = async () => {
      try {
        const count = await db.pendingSales.count();
        setPendingSalesCount(count);
      } catch (e) { console.error("Failed to count pending sales", e); }
    };

    const itv = setInterval(checkPending, 5000);
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(itv);
    };
  }, []);

  // -- Totals computation --
  const totals = useMemo(() => state.cart.reduce(
    (acc, item) => {
      const gross = item.price * item.quantity;
      const amtDisc = parseFloat(item.discount_amt) || 0;
      const percentDisc = gross * ((parseFloat(item.discount) || 0) / 100);

      acc.subtotal += gross;
      acc.totalItemDiscount += (amtDisc + percentDisc);
      acc.totalQty += item.quantity;
      return acc;
    },
    { subtotal: 0, totalItemDiscount: 0, totalQty: 0 }
  ), [state.cart]);

  const { finance: financeSettings } = useAppSettings();

  const taxAmount = useMemo(() => {
    const enableTax = financeSettings?.enableTax !== false && financeSettings?.enableTax !== 'false';
    const taxRate = (enableTax && financeSettings?.taxRate) ? parseFloat(financeSettings.taxRate) / 100 : 0;
    const grandTotal = totals.subtotal - totals.totalItemDiscount;
    return grandTotal * taxRate;
  }, [totals.subtotal, totals.totalItemDiscount, financeSettings]);

  const netBill = Math.round((totals.subtotal - totals.totalItemDiscount + taxAmount) * 100) / 100;

  // -- Actions hook --
  const {
    handlePayNow: rawHandlePayNow, handleHoldSale: rawHandleHoldSale, fetchSales, deleteSale, resumeSale,
    searchSales,
    fetchStock, clearStockData, salesData, isLoadingSales, stockData, isLoadingStock, syncPendingSales, isSyncing
  } = usePosActions({
    state, dispatch, selectedBranch, setPrintableSale,
    flattenedVariants, customers, distributors, setIsHoldListOpen,
  });

  const [statusMessage, setStatusMessage] = useState("System Ready");
  const [isVerboseLoading, setIsVerboseLoading] = useState(false);

  // Verbose Status Monitor Logic
  useEffect(() => {
    if (isLoadingSales || isLoadingStock || isLoading) {
      setIsVerboseLoading(true);
      setStatusMessage("> Fetching Product & Stock Data...");
    } else if (isSyncing) {
      setIsVerboseLoading(true);
      setStatusMessage(`> Syncing Offline Queue (${pendingSalesCount} left)...`);
    } else if (pendingSalesCount > 0 && isOnline) {
      setStatusMessage("> Preparing Cloud Sync...");
    } else {
      setIsVerboseLoading(false);
      setStatusMessage(`System Ready - ${flattenedVariants.length} Items Loaded`);
    }
  }, [isLoadingSales, isLoadingStock, isLoading, isSyncing, pendingSalesCount, isOnline]);

  const handlePayNow = useCallback((args) => {
    const { onSuccess, billTotal, total_paid, balance, ...rest } = args;

    return rawHandlePayNow({
      ...rest,
      activeShiftId: activeShift?.id,
      dining_type: queryDiningType || rest.dining_type,
      dining_table_id: queryTableId || rest.dining_table_id,
      sale_id: querySaleId || rest.sale_id,
      waiter_id: session?.user?.id,
      onSuccess: () => {
        // Capture last bill details from the closure
        setLastSaleInfo({
          bill: billTotal || 0,
          paid: total_paid || 0,
          balance: balance || 0,
          timestamp: new Date()
        });

        onSuccess?.();
      }
    });
  }, [rawHandlePayNow, activeShift, queryDiningType, queryTableId, querySaleId, session]);

  const handleHoldSale = useCallback((args) => rawHandleHoldSale({
    ...args,
    activeShiftId: activeShift?.id,
    dining_type: queryDiningType || args.dining_type,
    dining_table_id: queryTableId || args.dining_table_id,
    sale_id: querySaleId || args.sale_id,
    waiter_id: session?.user?.id
  }), [rawHandleHoldSale, activeShift, queryDiningType, queryTableId, querySaleId, session]);

  // -- Print Logic (Sync with main-page.jsx) --
  const handleStandardPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt_${printableSale?.invoice_number || "Draft"}`,
    onAfterPrint: () => setPrintableSale(null),
  });

  const handlePrint = useCallback(async () => {
    if (!printRef.current) return;

    // Desktop Silent Printing logic
    if (window.api?.printSilent && posResponse?.data?.silentPrint) {
      try {
        const printerName = posResponse?.data?.receiptPrinterName || "DEFAULT";
        const html = printRef.current.innerHTML;

        const fullHtml = `
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; font-family: sans-serif; }
                @page { margin: 0; }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `;

        const result = await window.api.printSilent({
          html: fullHtml,
          printerName: printerName === "DEFAULT" ? "" : printerName
        });

        if (result.success) {
          toast.success("Receipt printed silently");
          setPrintableSale(null);
        } else {
          toast.error("Silent print failed: " + result.message);
          handleStandardPrint();
        }
      } catch (err) {
        console.error("Silent printing error:", err);
        handleStandardPrint();
      }
    } else {
      handleStandardPrint();
    }
  }, [printableSale, handleStandardPrint, posResponse]);

  const isPrintingRef = useRef(false);

  useEffect(() => {
    if (printableSale) {
      if (isPrintingRef.current) return;
      isPrintingRef.current = true;

      const t = setTimeout(() => { if (printRef.current) handlePrint(); }, 500);
      return () => clearTimeout(t);
    } else {
      isPrintingRef.current = false;
    }
  }, [printableSale]);

  // Auto-fetch hold sales on load
  useEffect(() => {
    fetchSales("draft");
  }, []);

  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleAddToCart = useCallback(async (rawItem, quantity = 1, skipBatchCheck = false) => {
    let item = { ...rawItem };
    const vId = item.variantId || item.id;

    // --- 1. LOCAL BATCH LOOKUP (NEAR INSTANT) ---
    let localBatches = item.batches || [];
    
    if (localBatches.length === 0 && !skipBatchCheck && vId) {
      try {
        // Try looking up by variantId first, then fallback to productId if it's a simple product
        localBatches = await db.batches.where('variantId').equals(vId).toArray();
        if (localBatches.length === 0) {
           localBatches = await db.batches.where('productId').equals(item.productId || item.id).toArray();
        }
      } catch (err) { console.error("Local batch lookup failed:", err); }
    }

    // --- 2. OPTIMISTIC ADD (ONLY IF NO LOCAL DATA) ---
    // Only add a temporary row if we truly have to wait for the network
    if (!skipBatchCheck && vId && localBatches.length === 0 && navigator.onLine) {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          product: { ...item, stock: item.stock || 0 },
          quantity,
          batchId: 'pending', // Mark as pending to prevent duplicates
          price: state.isWholesale ? (item.wholesalePrice || 0) : (item.retailPrice || 0)
        }
      });
    }

    // --- 3. CLOUD FETCH & SYNC (IF NEEDED) ---
    if (!skipBatchCheck && vId && localBatches.length === 0 && navigator.onLine) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${vId}/batches?branch_id=${selectedBranch?.id || ""}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const result = await res.json();
        if (result.status === "success" && result.data) {
          localBatches = result.data;
          await db.batches.bulkPut(localBatches.map(b => ({ ...b, variantId: vId })));
        }
      } catch (err) { console.error("Cloud batch fetch failed:", err); }
    }

    // --- 4. FINAL RESOLUTION ---
    if (localBatches.length > 0) {
      const settings = posResponse?.data || receiptSettings || {};
      const pricingMode = settings.posPricingMode || 'fifo';
      const forceOnConflict = settings.enableBatchSelection === true;

      if (localBatches.length === 1) {
        const b = localBatches[0];
        item.batchId = b.id;
        item.expiry_date = b.expiry_date;
        item.batch_number = b.batch_number;
        item.price = state.isWholesale ? (Number(b.wholesale_price) || 0) : (Number(b.selling_price) || 0);
      } else {
        let shouldShowSelector = false;
        if (pricingMode === 'manual_batch') shouldShowSelector = true;
        else if (pricingMode === 'fifo' && forceOnConflict) {
          const prices = new Set(localBatches.map(b => parseFloat(b.selling_price).toFixed(2)));
          if (prices.size > 1) shouldShowSelector = true;
        }

        if (shouldShowSelector) {
          // If we had a pending item, we should remove it before showing selector
          dispatch({ type: "REMOVE_ITEM", payload: `${vId}_pending` });
          setAvailableBatches(localBatches);
          setItemPendingBatch({ item, quantity });
          setIsBatchSelectorOpen(true);
          return;
        } else {
          const b = localBatches[0];
          item.batchId = b.id;
          item.expiry_date = b.expiry_date;
          item.batch_number = b.batch_number;
          item.price = state.isWholesale ? (Number(b.wholesale_price) || 0) : (Number(b.selling_price) || 0);
        }
      }
    }

    // Replace the pending item or add the final resolved item
    // Note: If we had a pending item, ADD_ITEM with the real batchId will either increment 
    // or create a new row. We need to clear the 'pending' one if it exists.
    if (!skipBatchCheck && vId) {
      dispatch({ type: "REMOVE_ITEM", payload: `${vId}_pending` });
    }

    dispatch({
      type: "ADD_ITEM",
      payload: {
        product: { 
          ...item, 
          stock: item.stock || 0,
          expiry_date: item.expiry_date || null,
          batch_number: item.batch_number || null 
        },
        quantity,
        batchId: item.batchId || null,
        price: item.price || (state.isWholesale ? item.wholesalePrice : item.retailPrice)
      }
    });

    setTimeout(() => searchRef.current?.focus(), 10);
  }, [dispatch, session, receiptSettings, state.isWholesale, selectedBranch, posResponse]);

  const handleBatchSelect = useCallback(async (batch) => {
    if (!itemPendingBatch) return;
    const { item, quantity } = itemPendingBatch;
    
    // Ensure this batch is cached locally
    await db.batches.put({ ...batch, variantId: item.variantId || item.id });

    handleAddToCart({
      ...item,
      batchId: batch.id,
      price: state.isWholesale ? (Number(batch.wholesale_price) || 0) : (Number(batch.selling_price) || 0),
      expiry_date: batch.expiry_date,
      batch_number: batch.batch_number
    }, quantity, true);
    setIsBatchSelectorOpen(false);
    setItemPendingBatch(null);
  }, [itemPendingBatch, handleAddToCart, state.isWholesale]);

  const handleUpdateItem = useCallback((id, updates) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id, ...updates } });
  }, [dispatch]);



  // Predictive Search logic - Debounced for performance
  useEffect(() => {
    if (debouncedBarcodeInput.length > 1) {
      const trimmed = debouncedBarcodeInput.trim();
      const search = trimmed.toLowerCase();

      // Auto-add on exact barcode/SKU match (scanner support - no Enter needed)
      if (trimmed.length >= 4 && !trimmed.includes(' ')) {
        const exactMatch = flattenedVariants.find(v =>
          (v.barcode && v.barcode.toLowerCase() === search) ||
          (v.sku && v.sku.toLowerCase() === search) ||
          (v.item_code && v.item_code.toLowerCase() === search)
        );
        if (exactMatch) {
          handleAddToCart(exactMatch);
          setBarcodeInput('');
          setSearchResults([]);
          playBeep('success');
          return;
        }
      }

      const results = flattenedVariants.filter(v =>
        v.barcode?.toLowerCase().includes(search) ||
        v.item_code?.toLowerCase().includes(search) ||
        v.sku?.toLowerCase().includes(search) ||
        v.name?.toLowerCase().includes(search)
      ).slice(0, 8);
      setSearchResults(results);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } else {
      setSearchResults([]);
      setSelectedIndex(-1);
    }
  }, [debouncedBarcodeInput, flattenedVariants, handleAddToCart, playBeep]);

  const handleSearchKeyDown = (e) => {
    if (searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Escape") {
        setSearchResults([]);
      }
    }
  };

  // -- Barcode handling --
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const targetItem = selectedIndex > -1 ? searchResults[selectedIndex] : (searchResults.length > 0 ? searchResults[0] : null);
    if (targetItem) {
      handleAddToCart(targetItem);
      setBarcodeInput("");
      setSearchResults([]);
      playBeep("success");
      return;
    }

    const search = barcodeInput.trim().toLowerCase();
    if (!search) return;

    const variant = flattenedVariants.find(v =>
      v.barcode?.toLowerCase() === search ||
      v.item_code?.toLowerCase() === search ||
      v.sku?.toLowerCase() === search ||
      v.name?.toLowerCase() === search
    );

    if (variant) {
      handleAddToCart(variant);
      setBarcodeInput("");
      playBeep("success");
      searchRef.current?.focus();
    } else {
      toast.error(t("pos.product_not_found"));
      playBeep("error");
      searchRef.current?.focus();
    }
  };

  // -- Keyboard Shortcuts (F1-F12) --
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore shortcuts like Delete if user is typing in an input or textarea
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        if (e.key === "Delete") return;
      }

      // Map F-keys to actions
      switch (e.key) {
        case "F1":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "F2":
          e.preventDefault();
          if (isRestaurant) {
            router.push("/dining");
          } else {
            dispatch({ type: "CLEAR_CART" });
          }
          break;
        case "Delete":
          e.preventDefault();
          dispatch({ type: "CLEAR_CART" });
          break;
        case "F3":
          e.preventDefault();
          handleHoldSale({ onSuccess: () => { dispatch({ type: "CLEAR_CART" }); fetchSales("draft"); } });
          break;
        case "F4":
          e.preventDefault();
          setIsHoldListOpen(true);
          fetchSales("draft");
          break;
        case "F6":
          e.preventDefault();
          // Qty shortcut
          break;
        case "F7":
          e.preventDefault();
          setIsSaleListOpen(true);
          fetchSales("completed");
          break;
        case "F8":
          e.preventDefault();
          // Cash Out
          break;
        case "F9":
          e.preventDefault();
          // Drawer
          break;
        case "F10":
          e.preventDefault();
          fetchSales("completed").then(() => setIsSaleListOpen(true));
          break;
        case "F11":
          e.preventDefault();
          fetchSales("completed").then(() => setIsSaleListOpen(true));
          break;
        case "F12":
          e.preventDefault();
          if (state.cart.length > 0) setIsTenderModalOpen(true);
          break;
        case "Escape":
          e.preventDefault();
          document.activeElement.blur();
          setSearchResults([]);
          if (state.cart.length > 0) setSelectedCartIndex(0);
          break;
        case "ArrowDown":
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            setSelectedCartIndex(prev => (prev < state.cart.length - 1 ? prev + 1 : (state.cart.length > 0 ? 0 : -1)));
          }
          break;
        case "ArrowUp":
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            setSelectedCartIndex(prev => (prev > 0 ? prev - 1 : (state.cart.length > 0 ? state.cart.length - 1 : -1)));
          }
          break;
        case "Backspace":
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            if (selectedCartIndex > -1 && state.cart[selectedCartIndex]) {
              e.preventDefault();
              dispatch({ type: "REMOVE_ITEM", payload: state.cart[selectedCartIndex].id });
              // Adjust selection
              if (state.cart.length <= 1) {
                setSelectedCartIndex(-1);
              } else if (selectedCartIndex >= state.cart.length - 1) {
                setSelectedCartIndex(state.cart.length - 2);
              }
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleHoldSale, handlePayNow, fetchSales, netBill, dispatch, clearStockData, state.cart, selectedCartIndex]);

  // -- Navigation Guard: Prevent accidental back/refresh --
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (state.cart.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = (e) => {
      if (state.cart.length > 0) {
        if (!window.confirm("Active sale in progress. Are you sure you want to leave?")) {
          // Push current state back into history to "stay" here
          window.history.pushState(null, "", window.location.href);
        } else {
          router.push("/");
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    // Initialize history state to capture next back click
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [state.cart.length, router]);

  const handleDashboardExit = () => {
    if (state.cart.length > 0) {
      if (window.confirm("You have items in your cart. Are you sure you want to exit to the Dashboard?")) {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  // -- Last added item --
  const lastItem = state.cart.length > 0 ? state.cart[state.cart.length - 1] : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      {/* 1. Header Bar */}
      <header className="h-12 bg-card border-b border-border/50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all rounded-lg"
            onClick={handleDashboardExit}
            title="Go to Dashboard"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 text-emerald-500 font-medium">
            <User className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wide">
              {session?.user?.name || "System"}
            </span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          
          {/* --- SYNC & OFFLINE INDICATORS --- */}
          <div className="flex items-center gap-3">
             {/* Connection Status */}
             <div className={cn(
               "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
               isOnline ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
             )}>
               <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
               {isOnline ? "System Online" : "System Local"}
             </div>

             {/* Pending Sync Counter */}
             {pendingSalesCount > 0 && (
               <Badge 
                 variant="destructive" 
                 className="flex items-center gap-2 py-1 px-3 bg-red-600 hover:bg-red-700 text-white border-none shadow-lg animate-pulse"
               >
                 <RefreshCcw className="h-3 w-3" />
                 <span className="font-bold text-[10px] tracking-wide">
                   {pendingSalesCount} PENDING SALES
                 </span>
               </Badge>
             )}

             {/* Data Optimization Progress */}
             {isLoading && (
               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase animate-pulse">
                 <Loader2 className="h-3 w-3 animate-spin" />
                 Optimizing POS...
               </div>
             )}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <CustomerSelector
            customers={customers}
            distributors={distributors}
            selectedCustomer={state.selectedCustomer}
            selectedDistributor={state.selectedDistributor}
            isWholesale={state.isWholesale}
            onSelectCustomer={handleSelectCustomer}
            onSelectDistributor={handleSelectDistributor}
            className="w-64"
          />
          {receiptSettings?.enableWholesale && (
            <Button
              variant={state.isWholesale ? "default" : "outline"}
              size="sm"
              className={cn("h-10 px-4 rounded-xl text-[10px] font-medium uppercase", state.isWholesale ? "bg-blue-600 hover:bg-blue-700" : "border-border/50")}
              onClick={() => dispatch({
                type: "TOGGLE_WHOLESALE",
                payload: {
                  isWholesale: !state.isWholesale,
                  flatVariants: flattenedVariants,
                  isManufacturing: business?.business_type === 'manufacturing'
                }
              })}
            >
              <Briefcase className="h-3.5 w-3.5 mr-2" />
              {state.isWholesale ? "Wholesale Active" : "Wholesale Off"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-muted/20 p-0.5 rounded-full border border-border/50">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono">{currentDateTime.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <div className="h-12 bg-muted/30 border-b border-border/30 flex items-center px-4 gap-6 shrink-0">
        <div className="flex items-center gap-2 relative w-full">
          {isRestaurant ? (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 h-11 uppercase flex gap-2 items-center rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer border-none"
                onClick={() => router.push("/dining")}
              >
                <UtensilsCrossed className="h-5 w-5 animate-pulse" />
                Dining Floor Plan (F2)
              </Button>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] uppercase px-3 py-1.5 h-8">
                Restaurant Mode Active
              </Badge>
              <Button
                type="button"
                variant="destructive"
                className="px-4 h-11 font-black uppercase flex gap-2 items-center rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer border-none"
                onClick={() => dispatch({ type: "CLEAR_CART" })}
              >
                <Trash2 className="h-5 w-5" />
                CLEAR (DEL)
              </Button>
            </div>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground uppercase">Barcode / ItemCode</span>
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    ref={searchRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="bg-yellow-400 dark:bg-yellow-500 text-black font-black px-4 py-1 h-11 w-96 outline-none border-none rounded-lg shadow-inner focus:ring-2 focus:ring-yellow-600 transition-all uppercase font-mono text-base"
                    placeholder="SCAN OR TYPE... (F1)"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-4 h-11 font-black uppercase flex gap-2 items-center rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer"
                    onClick={() => dispatch({ type: "CLEAR_CART" })}
                  >
                    <Trash2 className="h-5 w-5" />
                    CLEAR (DEL)
                  </Button>
                </div>
                
                {/* Predictive Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-[450px] bg-card border border-border mt-1.5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[100] overflow-hidden backdrop-blur-md">
                    <div className="bg-muted/40 px-3 py-1.5 border-b border-border/50 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Intelligent Search Results</span>
                      <span className="text-[9px] text-muted-foreground font-medium">↑↓ to navigate • Enter to select</span>
                    </div>
                    <div className="max-h-[320px] overflow-auto custom-scrollbar">
                      {searchResults.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleAddToCart(item);
                            setBarcodeInput("");
                            setSearchResults([]);
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "p-3 flex items-center justify-between cursor-pointer border-b border-border/20 last:border-0 transition-all duration-150",
                            idx === selectedIndex
                              ? "bg-yellow-500 text-black scale-[1.01] z-10 shadow-sm"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className={cn("text-xs font-bold uppercase tracking-tight", idx === selectedIndex ? "text-black" : "text-foreground")}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] font-mono font-medium px-1 rounded", idx === selectedIndex ? "bg-black/10 text-black" : "bg-muted text-muted-foreground")}>
                                {item.item_code || item.barcode}
                              </span>
                              <span className={cn("text-[9px] font-medium opacity-60 uppercase", idx === selectedIndex ? "text-black/60" : "text-muted-foreground")}>
                                {item.brand}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-sm font-bold tracking-tighter", idx === selectedIndex ? "text-black" : "text-emerald-600 dark:text-emerald-400")}>
                              LKR {(Number(state.isWholesale ? item.wholesalePrice : item.retailPrice) || 0).toFixed(2)}
                            </div>
                            <div className={cn("text-[9px] font-medium flex items-center justify-end gap-1", idx === selectedIndex ? "text-black/60" : "text-muted-foreground")}>
                              <span>AVL: {item.stock || 0} {item.unit || 'pcs'}</span>
                              {(item.stock || 0) < 10 && (
                                <AlertTriangle className={cn("h-3 w-3 animate-pulse", idx === selectedIndex ? "text-black" : "text-amber-500")} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </>
          )}
          
          {/* Minimal Terminal Prompt */}
          <div className="flex items-center gap-2 ml-auto font-mono pr-4">
            <span className="text-emerald-500 font-black animate-pulse opacity-80">{">"}</span>
            <span className={cn(
              "text-[12px] font-bold tracking-tight leading-none",
              isVerboseLoading ? "text-amber-500" : "text-emerald-500"
            )}>
              {statusMessage}
            </span>
            {isVerboseLoading ? (
              <span className="text-amber-500/30 text-[9px] animate-pulse ml-2 font-black uppercase tracking-widest">Active</span>
            ) : (
              <button 
                onClick={refreshData}
                className="ml-2 text-emerald-500/30 hover:text-emerald-500 transition-colors"
                title="Force Master Data Sync"
              >
                <RefreshCcw className="h-2.5 w-2.5" />
              </button>
            )}

            {isInstallAvailable && (
              <button
                onClick={handleInstallClick}
                className="ml-4 px-2 py-0.5 border border-emerald-500/50 text-emerald-500 text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-black transition-all rounded"
              >
                [Install App]
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section (3/4 width) */}
        <div className="w-3/4 flex flex-col border-r border-border/50 bg-background">
          <div ref={cartContainerRef} className="flex-1 overflow-auto custom-scrollbar scroll-smooth">
            <table className="w-full border-collapse text-xs relative">
              <thead className="sticky top-0 bg-background z-30 border-b border-border shadow-sm text-muted-foreground uppercase">
                <tr>
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("barcode") && (
                    <th className="border-b border-r border-border/50 p-2 text-left w-24">ItemCode</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("name") && (
                    <th className="border-b border-r border-border/50 p-2 text-left">ItemName</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("quantity") && (
                    <th className="border-b border-r border-border/50 p-2 text-center w-12">Qty</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("mrp") && (
                    <th className="border-b border-r border-border/50 p-2 text-right w-20">MRP</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("price") && (
                    <th className="border-b border-r border-border/50 p-2 text-right w-20">Price</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("discount") && (
                    <th className="border-b border-r border-border/50 p-2 text-right w-16">Discount</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("discount_percent") && (
                    <th className="border-b border-r border-border/50 p-2 text-right w-16">Disc(%)</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("total") && (
                    <th className="border-b border-r border-border/50 p-2 text-right w-24">Net Total</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("batch") && (
                    <th className="border-b border-r border-border/50 p-2 text-left w-20">Batch</th>
                  )}
                  {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("expire") && (
                    <th className="border-b border-border/50 p-2 text-left w-20">Expire</th>
                  )}
                </tr>
              </thead>
              <tbody className="text-foreground/90">
                {state.cart.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "transition-colors cursor-pointer",
                      selectedCartIndex === idx
                        ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-inset ring-1 ring-emerald-500/30"
                        : idx % 2 === 0 ? "bg-transparent" : "bg-muted/5",
                      "hover:bg-muted/10"
                    )}
                    onClick={() => setSelectedCartIndex(idx)}
                  >
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("barcode") && (
                      <td className="border-b border-r border-border/30 p-2 font-mono uppercase">{item.item_code || item.barcode}</td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("name") && (
                      <td className="border-b border-r border-border/30 p-2 font-medium">
                        <div className="flex flex-col">
                          <span className="leading-tight">{item.name}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-black bg-muted px-1 rounded-sm text-muted-foreground uppercase">Stock: {item.stock || 0}</span>
                            {(item.stock || 0) < 10 && (
                              <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 animate-pulse">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                <span className="text-[8px] font-bold uppercase tracking-tighter">Low</span>
                              </div>
                            )}
                          </div>
                          {isRestaurant && (
                            <div className="mt-1">
                              <input
                                type="text"
                                placeholder="Cooking notes (e.g. no onion)..."
                                value={item.cooking_notes || ""}
                                onChange={(e) => handleUpdateItem(item.id, { cooking_notes: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-emerald-500 placeholder:text-muted-foreground/30 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("quantity") && (
                      <td className="border-b border-r border-border/30 p-1 text-center font-bold text-emerald-600 dark:text-emerald-400 text-base">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          onFocus={(e) => e.target.select()}
                          onWheel={(e) => e.target.blur()}
                          className="w-full bg-emerald-500/10 border-none text-center focus:ring-1 focus:ring-emerald-500 rounded p-1 outline-none font-bold"
                        />
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("mrp") && (
                      <td className="border-b border-r border-border/30 p-2 text-right">0.00</td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("price") && (
                      <td className="border-b border-r border-border/30 p-2 text-right font-medium">{(Number(item.price) || 0).toFixed(2)}</td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("discount") && (
                      <td className="border-b border-r border-border/30 p-1 text-right">
                        <input
                          type="number"
                          value={item.discount_amt || 0}
                          onChange={(e) => handleUpdateItem(item.id, { discount_amt: parseFloat(e.target.value) || 0 })}
                          onFocus={(e) => e.target.select()}
                          onWheel={(e) => e.target.blur()}
                          className="w-full bg-muted/30 border-none text-right focus:ring-1 focus:ring-emerald-500 rounded p-1 outline-none"
                        />
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "expire"]).includes("discount_percent") && (
                      <td className="border-b border-r border-border/30 p-1 text-right text-rose-500">
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleUpdateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                            onFocus={(e) => e.target.select()}
                            onWheel={(e) => e.target.blur()}
                            className="w-12 bg-rose-500/10 border-none text-right focus:ring-1 focus:ring-rose-500 rounded p-1 outline-none text-rose-500 font-bold"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("total") && (
                      <td className="border-b border-r border-border/30 p-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {( (Number(item.price) * item.quantity) - (Number(item.discount_amt) || 0) - (Number(item.price) * item.quantity * (Number(item.discount) / 100)) ).toFixed(2)}
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("batch") && (
                      <td className="border-b border-r border-border/30 p-2 text-[10px] text-muted-foreground font-mono italic">
                        {item.batch_number || "N/A"}
                      </td>
                    )}
                    {(receiptSettings?.posTableColumns || ["barcode", "name", "quantity", "mrp", "price", "discount", "discount_percent", "total", "batch", "expire"]).includes("expire") && (
                      <td className="border-b border-border/30 p-2 text-[10px] text-muted-foreground font-mono italic">
                        {item.expiry_date 
                          ? (isValid(new Date(item.expiry_date)) ? format(new Date(item.expiry_date), "dd/MM/yy") : "Err Date") 
                          : "N/A"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {state.cart.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[400px] opacity-20">
                <ShoppingCart className="h-16 w-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Ready for Scanning</p>
              </div>
            )}
          </div>

          {/* Last Scanned Item Preview */}
          <div className="h-16 bg-muted/10 border-t border-border/50 flex items-center px-6 shrink-0 shadow-inner">
            {lastItem && (
              <div className="text-rose-500 dark:text-rose-400 text-2xl font-bold uppercase tracking-tight drop-shadow-sm">
                {lastItem.name} <span className="text-foreground/40 mx-2">|</span> {(Number(lastItem.price) || 0).toFixed(2)} X {lastItem.quantity} = {(Number(lastItem.price) * lastItem.quantity).toFixed(2)}
              </div>
            )}
          </div>

          {/* 4. Bottom Grid Actions (Inside 3/4 width section) */}
          <div className="h-[130px] bg-card/30 border-t border-border/50 p-2 shrink-0">
            <div className="grid grid-cols-7 gap-1.5 h-full">
              <ActionButton shortcut="(F3)" label="Hold" icon={History} onClick={() => handleHoldSale({ onSuccess: () => { dispatch({ type: "CLEAR_CART" }); fetchSales("draft"); } })} />
              <ActionButton shortcut="(F6)" label="Qty" icon={Plus} />
              <ActionButton shortcut="(F7)" label="Invoices" icon={FileText} onClick={() => { setIsSaleListOpen(true); fetchSales("completed"); }} />
              <ActionButton shortcut="(F9)" label="Drawer" icon={Settings} />
              <ActionButton shortcut="(F10)" label="Re-Print" icon={Printer} onClick={() => fetchSales("completed").then(() => setIsSaleListOpen(true))} />
              <ActionButton shortcut="(F11)" label="Return" icon={RotateCcw} onClick={() => { setIsSaleListOpen(true); fetchSales("completed"); }} />
              <ActionButton shortcut="(F12)" label="PAYMENT" icon={CalcIcon} color="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => { if (state.cart.length > 0) setIsTenderModalOpen(true); }} />
            </div>
          </div>
        </div>

        {/* Right Section (Summary - 1/4 width) */}
        <div className="w-1/4 bg-card border-l border-border/50 flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          <div className="p-3 space-y-2">
            {/* Restaurant Active Context Indicator */}
            {(queryDiningType || queryTableNum || querySaleId) && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 py-2 rounded-xl mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-emerald-600/70 font-black">Dining Mode</span>
                  <span className="text-xs font-black tracking-tight text-foreground">
                    {queryDiningType === 'dine_in' ? 'Dine-In' : queryDiningType}
                  </span>
                </div>
                {queryTableNum && (
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[9px] text-emerald-600/70 font-black">Table Assigned</span>
                    <span className="text-xs font-black tracking-tight text-foreground">Table {queryTableNum}</span>
                  </div>
                )}
              </div>
            )}

            {/* Net Bill - Most Important */}
            <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 rounded-xl shadow-lg mb-2 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold opacity-80">Net Payable</span>
                <span className="text-base font-bold bg-black/20 px-2 py-0.5 rounded">LKR</span>
              </div>
              <div className="text-5xl font-black text-right tracking-tighter drop-shadow-md">
                {netBill.toFixed(2)}
              </div>
            </div>

            {/* Compact Summary Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background border border-border/40 p-3 rounded-xl shadow-sm">
                <label className="text-sm font-bold text-muted-foreground block mb-2">Total Qty</label>
                <div className="text-2xl font-black text-right text-foreground">
                  {totals.totalQty}
                </div>
              </div>
              <div className="bg-background border border-border/40 p-3 rounded-xl shadow-sm">
                <label className="text-sm font-bold text-muted-foreground block mb-2">Gross Total</label>
                <div className="text-2xl font-black text-right text-foreground">
                  {totals.subtotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background border border-border/40 p-3 rounded-xl shadow-sm">
                <label className="text-sm font-bold text-muted-foreground block mb-2">Saving</label>
                <div className="text-2xl font-black text-right text-blue-500 dark:text-blue-400">
                  0.00
                </div>
              </div>
              <div className="bg-background border border-border/40 p-3 rounded-xl shadow-sm">
                <label className="text-sm font-bold text-muted-foreground block mb-2">Discount</label>
                <div className="text-2xl font-black text-right text-yellow-600 dark:text-yellow-500">
                  {totals.totalItemDiscount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto flex-1 border-t border-border/50 overflow-auto bg-muted/5 custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead className="bg-muted text-muted-foreground uppercase sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left font-bold border-b border-border/30">Hold No</th>
                  <th className="p-2 text-center font-bold border-b border-border/30">Qty</th>
                  <th className="p-2 text-right font-bold border-b border-border/30">Total</th>
                </tr>
              </thead>
              <tbody>
                {(salesData || []).filter(s => s.status === 'draft').map((sale, idx) => (
                  <tr
                    key={sale.id}
                    onClick={async () => {
                      await resumeSale(sale);
                      fetchSales("draft");
                    }}
                    className="hover:bg-emerald-500/10 cursor-pointer transition-colors group border-b border-border/10"
                  >
                    <td className="p-2 font-mono text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      #{sale.invoice_no?.split('-').pop() || sale.id.toString().slice(-4)}
                    </td>
                    <td className="p-2 text-center">{sale.total_qty || sale.items?.length || 0}</td>
                    <td className="p-2 text-right font-medium">{(parseFloat(sale.net_total || sale.payable_amount || sale.net_amount) || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {(!salesData || salesData.filter(s => s.status === 'draft').length === 0) && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-muted-foreground opacity-30 italic">
                      No hold sales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Footer Status Bar */}
      <footer className="h-12 bg-primary flex items-center justify-end gap-12 px-8 font-bold tracking-tight text-primary-foreground shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
        {lastSaleInfo.timestamp && (
          <div className="flex items-center gap-2 text-primary-foreground/70">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] uppercase">{format(lastSaleInfo.timestamp, "HH:mm:ss")}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70 uppercase">Last Bill :</span>
          <span className="text-2xl">{lastSaleInfo.bill.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70 uppercase">Paid :</span>
          <span className="text-2xl">{lastSaleInfo.paid.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary-foreground/90 uppercase bg-black/20 px-2 py-0.5 rounded">Balance :</span>
          <span className="text-3xl text-yellow-300">{lastSaleInfo.balance.toFixed(2)}</span>
        </div>
      </footer>

      {/* Dialogs */}
      <HoldListDialog isOpen={isHoldListOpen} onOpenChange={setIsHoldListOpen}
        salesData={salesData} isLoadingSales={isLoadingSales}
        onResume={resumeSale}
        onDelete={(id) => deleteSale(id).then((ok) => ok && fetchSales("draft"))} />

      <SaleListDialog isOpen={isSaleListOpen} onOpenChange={setIsSaleListOpen}
        salesData={salesData} isLoadingSales={isLoadingSales}
        setPrintableSale={setPrintableSale}
        setSelectedReturnSale={setSelectedReturnSale}
        setIsReturnDialogOpen={setIsReturnDialogOpen}
        searchSales={searchSales} />

      <StockCheckDialog isOpen={isStockModalOpen} onOpenChange={setIsStockModalOpen}
        stockData={stockData} isLoadingStock={isLoadingStock}
        stockSearch={stockSearch} setStockSearch={setStockSearch}
        selectedBranch={selectedBranch} onAddToCart={handleAddToCart} />

      {isCalculatorOpen && <Calculator onClose={() => setIsCalculatorOpen(false)} />}

      <ReturnDialogWrapper isOpen={isReturnDialogOpen} onOpenChange={(open) => { setIsReturnDialogOpen(open); if (!open) setIsSaleListOpen(true); }}
        sale={selectedReturnSale} onSuccess={() => fetchSales("completed")} />

      <SaleDetailWrapper isOpen={isDetailOpen} onOpenChange={setIsDetailOpen}
        sale={selectedSaleDetail} onReprint={setPrintableSale} />

      {/* Hidden printing templates */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
        {receiptSettings?.invoiceTemplate === 'a4_professional' ? (
          <InvoiceA4Template ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
        ) : (
          <ReceiptTemplate ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
        )}
      </div>
      <BatchSelectorDialog
        isOpen={isBatchSelectorOpen}
        onOpenChange={setIsBatchSelectorOpen}
        productName={itemPendingBatch?.item?.name}
        batches={availableBatches}
        onSelect={handleBatchSelect}
      />
      <TenderModal
        isOpen={isTenderModalOpen}
        onOpenChange={setIsTenderModalOpen}
        totalAmount={netBill}
        activeMethods={receiptSettings?.activePaymentMethods || ["cash", "card"]}
        selectedCustomer={state.selectedCustomer}
        enableMultiplePayments={receiptSettings?.enableMultiplePayments}
        onPay={(paymentData) => {
          handlePayNow({
            ...paymentData,
            billTotal: netBill,
            onSuccess: () => setIsTenderModalOpen(false)
          });
        }}
        onSearchCustomer={() => {
          // Already handled by customer selector but could add more here
        }}
      />
    </div>
  );
}
