"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { useBeep } from "@/hooks/use-beep";
import { db } from "@/lib/indexedDB/db";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAppSettings } from "@/app/hooks/useAppSettings";

// All handlers accept checkout values as arguments so they never need
// checkout state in their closure — no stale refs, no extra re-renders.
export function usePosActions({
  state,
  dispatch,
  selectedBranch,
  setPrintableSale,
  flattenedVariants,
  customers,
  setIsHoldListOpen,
}) {
  const { data: nextAuthSession } = useSession();
  const { session: localSession, receipt: receiptSettings } = useSettingsStore();
  const session = nextAuthSession || localSession;
  const { playBeep } = useBeep();
  const { finance: financeSettings, loyalty: loyaltyConfig, business } = useAppSettings();
  const loyaltyEnabled = business?.loyalty_enabled;

  const [salesData, setSalesData] = useState([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncCoolOffUntil, setSyncCoolOffUntil] = useState(null);

  const syncPendingSales = useCallback(async () => {
    if (!navigator.onLine || !session?.accessToken || isSyncing) return;
    
    // Check if we are in a cooling-off period due to previous rate limits
    if (syncCoolOffUntil && Date.now() < syncCoolOffUntil) {
      console.log(`Sync is cooling off until ${new Date(syncCoolOffUntil).toLocaleTimeString()}`);
      return;
    }

    // Only fetch sales that are 'pending' and haven't failed permanently
    const pending = await db.pendingSales
      .where('status').equals('pending')
      .toArray();
      
    if (pending.length === 0) return;

    setIsSyncing(true);
    console.log(`Throttled Sync: Processing ${pending.length} sales...`);
    let successCount = 0;

    for (const sale of pending) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify(sale.saleData),
        });
        
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After')) || 60;
          setSyncCoolOffUntil(Date.now() + (retryAfter * 1000));
          break; 
        }

        const result = await res.json();
        if (res.ok && result.status === "success") {
          await db.pendingSales.delete(sale.id);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error(`Sync Failed (HTTP ${res.status}):`, result.message || "Unknown server error");
          // If it's a validation error (400), we might need to skip it to avoid blocking
          if (res.status >= 400 && res.status < 500) {
            console.warn(`Skipping problematic sale ${sale.id} due to permanent rejection.`);
            // You might want to move this to a 'failed_sales' table for review
            await db.pendingSales.update(sale.id, { status: 'failed', error: result.message });
          }
          continue; 
        }
      } catch (err) {
        console.error("Network error during sync:", err);
        break;
      }
    }

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline sales`);
    }
    setIsSyncing(false);
  }, [session, isSyncing, syncCoolOffUntil]);

  // Auto-sync loop & Reconnect listener
  useEffect(() => {
    const interval = setInterval(syncPendingSales, 30000);
    window.addEventListener('online', syncPendingSales);
    
    // Also trigger immediately if we have pending sales and just came online
    if (navigator.onLine) {
      syncPendingSales();
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncPendingSales);
    };
  }, [syncPendingSales]);

  // ── Helpers — compute totals from cart + discount args (no stale state) ──
  const computeTotals = (cart, { generalDiscount = 0, generalDiscountAmt = 0, wholesaleDiscount = 0, isWholesale = false, adjustment = 0, taxConfig = {}, loyaltyConfig = {}, redeemedPoints = 0 }) => {
    // Always coerce to numbers to prevent string concatenation bugs
    const adj = parseFloat(adjustment) || 0;
    const genDisc = parseFloat(generalDiscount) || 0;
    const genDiscAmt = parseFloat(generalDiscountAmt) || 0;
    const whlDisc = parseFloat(wholesaleDiscount) || 0;
    const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
    const itemDiscounts = cart.reduce((a, i) => a + (i.price * i.quantity * (i.discount / 100)) + (parseFloat(i.discount_amt) || 0), 0);
    const wholesaleDiscAmt = isWholesale ? subtotal * (whlDisc / 100) : 0;
    
    // Support both percentage and absolute discount
    const generalDiscAmtFinal = genDiscAmt > 0 ? genDiscAmt : (subtotal * (genDisc / 100));

    // Loyalty Redemption Value
    const redemptionRate = parseFloat(loyaltyConfig?.redemption_rate) || 0;
    const redemptionValue = (parseFloat(redeemedPoints) || 0) * redemptionRate;

    const totalDiscount = itemDiscounts + wholesaleDiscAmt + generalDiscAmtFinal + redemptionValue;
    const grandTotal = subtotal - totalDiscount;

    // Tax Calculation
    const enableTax = taxConfig.enableTax !== false && taxConfig.enableTax !== 'false';
    const taxRate = (enableTax && taxConfig.taxRate) ? parseFloat(taxConfig.taxRate) / 100 : 0;
    const taxAmount = grandTotal * taxRate;

    const netTotal = Math.round((grandTotal + adj + taxAmount) * 100) / 100;
    return { subtotal, itemDiscounts, totalDiscount, grandTotal, netTotal, taxAmount, redemptionValue };
  };

  const decrementLocalStock = async (cart) => {
    try {
      await db.transaction('rw', db.variants, async () => {
        for (const item of cart) {
          if (item.variantId) {
            const variant = await db.variants.get(item.variantId);
            if (variant) {
              await db.variants.update(item.variantId, {
                stock: Math.max(0, (variant.stock || 0) - item.quantity)
              });
            }
          }
        }
      });
    } catch (err) {
      console.error("Failed to update local stock during offline sale:", err);
    }
  };

  const handlePayNow = useCallback(async ({
    payments, adjustment, chequeDetails,
    selectedEmployeeIds, generalDiscount, generalDiscountAmt, wholesaleDiscount, activeShiftId,
    redeemedPoints,
    onSuccess,
    dining_type,
    dining_table_id,
    waiter_id,
    sale_id,
    sendToKitchen = true
  }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    let saleData = null;

    try {
      const isWalkIn = !state.customer && !state.distributor;
      const isManufacturing = business?.business_type === 'manufacturing';
      const isRestaurant = business?.business_type?.toLowerCase().includes('restaurant');

      if (isManufacturing && isWalkIn) {
        toast.error("Manufacturing organizations require a selected partner (Distributor/Customer) to complete transactions.");
        return;
      }

      const taxConfig = financeSettings || {};

      const { netTotal, subtotal, totalDiscount, taxAmount, redemptionValue } = computeTotals(state.cart, {
        generalDiscount, generalDiscountAmt, wholesaleDiscount, isWholesale: state.isWholesale, adjustment, taxConfig,
        loyaltyConfig, redeemedPoints: loyaltyEnabled ? redeemedPoints : 0
      });

      const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      if (isWalkIn && Math.round(totalPaid * 100) < Math.round(netTotal * 100)) {
        toast.error("Walk-in (Guest) customers must pay in full.");
        return;
      }
      if (state.cart.length === 0) {
        toast.error("Cart is empty");
        return;
      }

      const terminalName = localStorage.getItem("pos_terminal_id") || "Main Terminal";

      saleData = {
        branch_id: selectedBranch?.id || localStorage.getItem("selected_branch_id"),
        customer_id: state.customer?.id,
        distributor_id: state.distributor?.id,
        items: state.cart.map((item) => {
          if (!item.productId || !item.variantId) {
            console.error("Invalid item in cart:", item);
            throw new Error(`Item "${item.name}" has missing ID data. Please remove and re-add it.`);
          }
          const itemSubtotal = item.price * item.quantity;
          let itemLineDiscount;
          let wholesaleDiscAmt;

          if (isRestaurant) {
            const safeDiscountPct = parseFloat(item.discount) || 0;
            const safeDiscountAmt = parseFloat(item.discount_amt) || 0;
            itemLineDiscount = (itemSubtotal * (safeDiscountPct / 100)) + safeDiscountAmt;
            const safeWholesaleDiscount = parseFloat(wholesaleDiscount) || 0;
            wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (safeWholesaleDiscount / 100) : 0;
          } else {
            // Original code for retail/other POS types
            itemLineDiscount = (itemSubtotal * (item.discount / 100)) + (parseFloat(item.discount_amt) || 0);
            wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (wholesaleDiscount / 100) : 0;
          }
          
          const genDiscAmtNum = parseFloat(generalDiscountAmt) || 0;
          const itemProportion = subtotal > 0 ? (itemSubtotal / subtotal) : 0;
          
          const generalDiscAmtFinal = genDiscAmtNum > 0 
            ? genDiscAmtNum * itemProportion 
            : itemSubtotal * (generalDiscount / 100);

          const finalDiscountAmount = Number((itemLineDiscount + wholesaleDiscAmt + generalDiscAmtFinal).toFixed(2));

          return {
            product_id: item.productId,
            product_variant_id: item.variantId,
            product_batch_id: item.batchId,
            quantity: item.quantity,
            unit_price: Number(parseFloat(item.price).toFixed(2)),
            discount_amount: finalDiscountAmount,
            manual_discount: Number(itemLineDiscount.toFixed(2)),
            cooking_notes: item.cooking_notes || null
          };
        }),
        total_amount: Number(subtotal.toFixed(2)),
        discount_amount: Number(totalDiscount.toFixed(2)),
        payable_amount: Number(netTotal.toFixed(2)),
        net_total: Number(netTotal.toFixed(2)),
        tax_amount: 0,
        paid_amount: Number(totalPaid.toFixed(2)),
        payments: payments,
        cheque_details: payments.some(p => p.payment_method === 'cheque') ? chequeDetails : null,
        notes: `[Terminal: ${terminalName}]`,
        adjustment: Number((parseFloat(adjustment) || 0).toFixed(2)),
        seller_ids: selectedEmployeeIds,
        is_wholesale: state.isWholesale ? 1 : 0,
        shift_id: activeShiftId || null,
        redeemed_points: loyaltyEnabled ? (parseInt(redeemedPoints) || 0) : 0,
        dining_type: dining_type || 'takeaway',
        dining_table_id: dining_table_id || null,
        waiter_id: waiter_id || null,
        send_to_kitchen: sendToKitchen
      };

      // --- OFFLINE-FIRST & FIFO LOGIC ---
      const pendingCount = await db.pendingSales.count();
      const shouldQueue = !navigator.onLine || pendingCount > 0;

      if (shouldQueue) {
        try {
          await db.pendingSales.add({
            saleData,
            type: 'sale',
            status: 'pending',
            invoice_no: `OFF-${Date.now()}`,
            createdAt: new Date()
          });

          await decrementLocalStock(state.cart);

          if (!navigator.onLine) {
            toast.success("Offline: Sale saved to local queue");
          } else {
            toast.info("Sync in progress: Sale queued for sequential upload");
          }

          playBeep("success");
          dispatch({ type: "CLEAR_CART" });
          onSuccess?.();

          if (navigator.onLine) syncPendingSales();
          return;
        } catch (err) {
          console.error("Failed to queue sale:", err);
          toast.error("Failed to save sale locally");
          return;
        }
      }

      if (!session?.accessToken) {
        toast.error("Please log in to complete the sale");
        return;
      }

      console.log("[Debug] Submitting Sale Payload:", JSON.stringify(saleData, null, 2));

      let res, result;
      const targetSaleId = sale_id || state.activeTabId;

      if (targetSaleId) {
        // We are checking out an ACTIVE TAB
        const hasUnsavedItems = state.cart.some(item => !item.isSaved);
        if (hasUnsavedItems) {
          toast.error("You have unsaved items. Please click 'Send to Kitchen' first to append them to the tab before checking out.");
          setIsProcessing(false);
          return;
        }

        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${targetSaleId}/settle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify({
            payments,
            payment_method: saleData.payment_method,
            paid_amount: saleData.paid_amount,
            status: "completed",
            shift_id: saleData.shift_id
          }),
        });
      } else {
        // Normal POST for a brand new sale
        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify(saleData),
        });
      }
      result = await res.json();

      if (result.status === "success") {
        if (receiptSettings.autoPrint !== false && !sale_id) setPrintableSale({ ...result.data, sendToKitchen });
        toast.success(sale_id ? "KOT orders sent to kitchen successfully!" : "Sale completed successfully");
        playBeep("success");

        // Broadcast checkout success to the secondary customer display
        if (typeof window !== "undefined" && !sale_id) {
          const channel = new BroadcastChannel("pos_customer_display");
          channel.postMessage({
            type: "checkout_success",
            payload: {
              sale: result.data
            }
          });
          channel.close();
        }

        dispatch({ type: "CLEAR_CART" });
        onSuccess?.();
        if (sale_id) {
          window.location.href = "/dining";
        }
      } else {
        toast.error(result.message || "Failed to complete sale");
        playBeep("error");
      }
    } catch (error) {
      console.error("Sale request failed, queuing locally:", error);
      await db.pendingSales.add({
        saleData: saleData || {}, // Fallback if saleData construction failed
        type: 'sale',
        status: 'pending',
        invoice_no: `OFF-${Date.now()}`,
        createdAt: new Date()
      });
      await decrementLocalStock(state.cart);
      toast.warning("Network issue: Sale queued locally");
      playBeep("success");
      dispatch({ type: "CLEAR_CART" });
      onSuccess?.();
    } finally {
      setIsProcessing(false);
    }
  }, [state.cart, state.customer, state.isWholesale, state.distributor, session, selectedBranch, receiptSettings, dispatch, setPrintableSale, playBeep, syncPendingSales, isProcessing, business?.business_type, financeSettings, loyaltyConfig, loyaltyEnabled, decrementLocalStock]);

  // ── Fetch Sales ───────────────────────────────────────────────────────────
  const fetchSales = useCallback(async (status) => {
    if (!session?.accessToken || !navigator.onLine) return;
    setIsLoadingSales(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?status=${status}&size=50`;
      
      if (status === "completed") {
        // Automatically reset recent orders (completed sales) every day (using local timezone)
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        url += `&start_date=${localDate}&end_date=${localDate}`;
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}` } });
      const result = await res.json();
      if (result.status === "success") setSalesData(result.data.data || []);
    } catch { toast.error("Failed to fetch sales"); }
    finally { setIsLoadingSales(false); }
  }, [session?.accessToken]);

  // ── Delete Sale ───────────────────────────────────────────────────────────
  const deleteSale = useCallback(async (id) => {
    if (!session?.accessToken || !navigator.onLine) return false;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await res.json();
      if (result.status === "success") { toast.success("Sale deleted"); return true; }
    } catch { toast.error("Failed to delete sale"); }
    return false;
  }, [session?.accessToken]);

  const handleHoldSale = useCallback(async ({
    adjustment, selectedEmployeeIds, generalDiscount, generalDiscountAmt, wholesaleDiscount, activeShiftId, onSuccess,
    dining_type, dining_table_id, waiter_id
  }) => {
    if (state.cart.length === 0) return toast.error("Cart is empty");

    const terminalName = localStorage.getItem("pos_terminal_id") || "Main Terminal";
    const { subtotal, totalDiscount, netTotal } = computeTotals(state.cart, {
      generalDiscount, generalDiscountAmt, wholesaleDiscount, isWholesale: state.isWholesale, adjustment,
    });

    const isRestaurant = business?.business_type?.toLowerCase().includes('restaurant');

    const saleData = {
      status: "draft",
      branch_id: selectedBranch?.id,
      customer_id: state.customer?.id,
      distributor_id: state.distributor?.id,
      seller_ids: selectedEmployeeIds,
      items: state.cart.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        let itemLineDiscount;
        let wholesaleDiscAmt;

        if (isRestaurant) {
          const safeDiscountPct = parseFloat(item.discount) || 0;
          const safeDiscountAmt = parseFloat(item.discount_amt) || 0;
          itemLineDiscount = (itemSubtotal * (safeDiscountPct / 100)) + safeDiscountAmt;
          const safeWholesaleDiscount = parseFloat(wholesaleDiscount) || 0;
          wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (safeWholesaleDiscount / 100) : 0;
        } else {
          // Original code for retail/other POS types
          itemLineDiscount = (itemSubtotal * (item.discount / 100)) + (parseFloat(item.discount_amt) || 0);
          wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (wholesaleDiscount / 100) : 0;
        }
        
        const genDiscAmtNum = parseFloat(generalDiscountAmt) || 0;
        const itemProportion = subtotal > 0 ? (itemSubtotal / subtotal) : 0;
        
        const generalDiscAmtFinal = genDiscAmtNum > 0 
          ? genDiscAmtNum * itemProportion 
          : itemSubtotal * (generalDiscount / 100);

        return {
          product_id: item.productId,
          product_variant_id: item.variantId,
          product_batch_id: item.batchId,
          quantity: item.quantity,
          unit_price: Number(parseFloat(item.price).toFixed(2)),
          discount_amount: Number((itemLineDiscount + wholesaleDiscAmt + generalDiscAmtFinal).toFixed(2)),
          manual_discount: Number(itemLineDiscount.toFixed(2)),
          cooking_notes: item.cooking_notes || null
        };
      }),
      total_amount: Number(subtotal.toFixed(2)),
      discount_amount: Number(totalDiscount.toFixed(2)),
      payable_amount: Number(netTotal.toFixed(2)),
      net_total: Number(netTotal.toFixed(2)),
      tax_amount: 0,
      paid_amount: 0,
      payment_method: "Other",
      notes: `[Held Sale] [Terminal: ${terminalName}]`,
      adjustment: Number((parseFloat(adjustment) || 0).toFixed(2)),
      is_wholesale: state.isWholesale ? 1 : 0,
      shift_id: activeShiftId || null,
      dining_type: dining_type || 'takeaway',
      dining_table_id: dining_table_id || null,
      waiter_id: waiter_id || null
    };

    if (!navigator.onLine) {
      toast.error("Offline: Holding sales is not supported in offline mode.");
      return;
    }

    if (!session?.accessToken) return toast.error("Please log in to hold the sale");

    try {
      let res;
      if (state.activeTabId) {
        // We are updating an existing tab/KOT ticket
        const newItems = saleData.items.filter((_, idx) => !state.cart[idx].isSaved);
        
        if (newItems.length === 0) {
          toast.success("No new items to send to kitchen.");
          dispatch({ type: "CLEAR_CART" });
          if (onSuccess) onSuccess();
          else await fetchSales("draft");
          return;
        }
        
        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${state.activeTabId}/append`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify({ items: newItems }),
        });
      } else {
        // Creating a new draft/KOT ticket
        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify(saleData),
        });
      }
      
      const result = await res.json();

      if (result.status === "success") {
        toast.success("Sale held successfully");
        playBeep("success");
        
        // Print KOT automatically when holding a sale in a restaurant
        if (isRestaurant && result.data) {
          setPrintableSale({ ...result.data, isKOT: true });
        }

        dispatch({ type: "CLEAR_CART" });
        
        if (onSuccess) {
          onSuccess();
        } else if (isRestaurant) {
          // Fallback if onSuccess is not provided
          await fetchSales("draft"); 
        } else {
          await fetchSales("draft");
        }
      } else {
        toast.error(result.message || "Failed to hold sale");
        playBeep("error");
      }
    } catch {
      toast.error("An error occurred while holding sale");
      playBeep("error");
    }
  }, [state.cart, state.customer, state.isWholesale, session, selectedBranch, dispatch, playBeep, fetchSales]);

  // ── Resume Sale ───────────────────────────────────────────────────────────
  const resumeSale = useCallback((sale) => {
    if (!sale.items?.length) return toast.error("This sale has no items");

    const isRestaurant = business?.business_type?.toLowerCase().includes('restaurant');

    const restoredCart = sale.items.map((item) => {
      // 1. Try matching by ID first (Standard)
      let v = flattenedVariants.find(
        (p) => (item.product_variant_id && p.id === item.product_variant_id) ||
          (!item.product_variant_id && p.productId === item.product_id)
      );

      // 2. SMART REPAIR: If ID matching fails, try matching by Barcode (Crucial for DB resets)
      if (!v && item.variant?.barcode) {
        console.warn(`Smart Match: Attempting repair for ${item.product?.name} via barcode ${item.variant.barcode}`);
        v = flattenedVariants.find(p => p.barcode === item.variant.barcode);
      }

      // 3. LAST RESORT: Try matching by Name
      if (!v && item.product?.name) {
        console.warn(`Smart Match: Attempting repair for ${item.product?.name} via name`);
        v = flattenedVariants.find(p => p.fullName?.toLowerCase() === item.product.name.toLowerCase());
      }

      if (v) {
        return {
          id: `${v.id}_${Date.now()}_${Math.random()}`, // Unique cart item ID
          productId: v.productId, variantId: v.id,
          barcode: v.barcode, name: v.name, size: v.variantName,
          quantity: parseFloat(item.quantity) || 1,
          price: parseFloat(item.unit_price) || v.retailPrice,
          discount: parseFloat(item.discount_amount) || 0,
          unit: v.unit || 'pc',
          isSaved: isRestaurant, // Mark as saved so we don't re-send it to kitchen
          cooking_status: item.cooking_status || 'pending'
        };
      }
      return null;
    }).filter(Boolean);

    if (restoredCart.length < sale.items.length) {
      toast.warning(`${sale.items.length - restoredCart.length} items from this draft could not be matched and were removed.`);
    }

    if (!restoredCart.length) return toast.error("Could not match any products from this sale");

    const restoredCustomer = customers.find((c) => c.id === sale.customer_id) || null;
    
    // For restaurants, keep the tab alive in DB. For retail, pull it out (delete it).
    dispatch({ 
      type: "RESUME_SALE", 
      payload: { 
        cart: restoredCart, 
        customer: restoredCustomer, 
        isWholesale: false, 
        activeTabId: isRestaurant ? sale.id : null 
      } 
    });

    if (!isRestaurant) {
      deleteSale(sale.id);
    }
    
    setIsHoldListOpen(false);
    toast.success(isRestaurant ? `Opened Tab ${sale.invoice_number}` : `Resumed sale ${sale.invoice_number}`);
  }, [flattenedVariants, customers, dispatch, deleteSale, setIsHoldListOpen, business]);

  // ── Check Stock ───────────────────────────────────────────────────────────
  const fetchStock = useCallback(async (query) => {
    if (!query || query.length < 2 || !session?.accessToken) return;
    setIsLoadingStock(true);

    if (!navigator.onLine) {
      try {
        // Local search in IndexedDB when offline
        const matches = await db.variants
          .filter(v =>
            v.fullName.toLowerCase().includes(query.toLowerCase()) ||
            v.barcode?.includes(query)
          )
          .toArray();
        setStockData(matches.map(m => ({
          id: m.id,
          name: m.fullName,
          barcode: m.barcode,
          stock: m.stock,
          retail_price: m.retailPrice
        })));
      } catch (err) {
        console.error("Offline stock lookup failed:", err);
      } finally {
        setIsLoadingStock(false);
      }
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/stock/check?search=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const result = await res.json();
      if (result.status === "success") setStockData(result.data || []);
    } catch { toast.error("Failed to fetch stock info"); }
    finally { setIsLoadingStock(false); }
  }, [session]);

  const clearStockData = useCallback(() => setStockData([]), []);


  return {
    handlePayNow, handleHoldSale,
    fetchSales, deleteSale, resumeSale,
    fetchStock, clearStockData, syncPendingSales,
    salesData, isLoadingSales,
    stockData, isLoadingStock,
    isSyncing,
  };
}
