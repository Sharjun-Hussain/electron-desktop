"use client";

import { useCallback, useState } from "react";
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
  const { data: session } = useSession();
  const { playBeep } = useBeep();
  const { finance: financeSettings, loyalty: loyaltyConfig, business } = useAppSettings();
  const loyaltyEnabled = business?.loyalty_enabled;
  const { receipt: receiptSettings } = useSettingsStore();

  const [salesData, setSalesData] = useState([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // ── Helpers — compute totals from cart + discount args (no stale state) ──
  const computeTotals = (cart, { generalDiscount = 0, wholesaleDiscount = 0, isWholesale = false, adjustment = 0, taxConfig = {}, loyaltyConfig = {}, redeemedPoints = 0 }) => {
    // Always coerce to numbers to prevent string concatenation bugs
    const adj = parseFloat(adjustment) || 0;
    const genDisc = parseFloat(generalDiscount) || 0;
    const whlDisc = parseFloat(wholesaleDiscount) || 0;
    const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
    const itemDiscounts = cart.reduce((a, i) => a + i.price * i.quantity * (i.discount / 100), 0);
    const wholesaleDiscAmt = isWholesale ? subtotal * (whlDisc / 100) : 0;
    const generalDiscAmt = subtotal * (genDisc / 100);
    
    // Loyalty Redemption Value
    const redemptionRate = parseFloat(loyaltyConfig?.redemption_rate) || 0;
    const redemptionValue = (parseFloat(redeemedPoints) || 0) * redemptionRate;

    const totalDiscount = itemDiscounts + wholesaleDiscAmt + generalDiscAmt + redemptionValue;
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
    selectedEmployeeIds, generalDiscount, wholesaleDiscount, activeShiftId,
    redeemedPoints,
    onSuccess,
  }) => {
    const isWalkIn = !state.customer && !state.distributor;
    const isManufacturing = business?.business_type === 'manufacturing';

    if (isManufacturing && isWalkIn) {
      toast.error("Manufacturing organizations require a selected partner (Distributor/Customer) to complete transactions.");
      return;
    }

    const taxConfig = financeSettings || {};

    const { netTotal, subtotal, totalDiscount, taxAmount, redemptionValue } = computeTotals(state.cart, {
      generalDiscount, wholesaleDiscount, isWholesale: state.isWholesale, adjustment, taxConfig,
      loyaltyConfig, redeemedPoints: loyaltyEnabled ? redeemedPoints : 0
    });

    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    if (isWalkIn && Math.round(totalPaid * 100) < Math.round(netTotal * 100)) {
      toast.error("Walk-in (Guest) customers must pay in full.");
      return;
    }
    if (state.cart.length === 0) return toast.error("Cart is empty");

    const terminalName = localStorage.getItem("pos_terminal_id") || "Main Terminal";

    const saleData = {
      branch_id: selectedBranch?.id,
      customer_id: state.customer?.id,
      distributor_id: state.distributor?.id,
      items: state.cart.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const itemLineDiscount = itemSubtotal * (item.discount / 100);
        const wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (wholesaleDiscount / 100) : 0;
        const generalDiscAmt = itemSubtotal * (generalDiscount / 100);

        return {
          product_id: item.productId,
          product_variant_id: item.variantId,
          product_batch_id: item.batchId,
          quantity: item.quantity,
          unit_price: Number(parseFloat(item.price).toFixed(2)),
          discount_amount: Number((itemLineDiscount + wholesaleDiscAmt + generalDiscAmt).toFixed(2)),
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
    };

    // --- OFFLINE LOGIC ---
    if (!navigator.onLine) {
      try {
        await db.pendingSales.add({
          saleData,
          type: 'sale',
          createdAt: new Date()
        });
        await decrementLocalStock(state.cart);
        toast.success("Offline: Sale saved to local queue");
        playBeep("success");
        dispatch({ type: "CLEAR_CART" });
        onSuccess?.();
        return;
      } catch (err) {
        toast.error("Failed to save sale locally");
        return;
      }
    }

    if (!session?.accessToken) return toast.error("Please log in to complete the sale");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify(saleData),
      });
      const result = await res.json();

      if (result.status === "success") {
        if (receiptSettings.autoPrint !== false) setPrintableSale(result.data);
        toast.success("Sale completed successfully");
        playBeep("success");
        dispatch({ type: "CLEAR_CART" });
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to complete sale");
        playBeep("error");
      }
    } catch (error) {
      // If fetch fails (maybe transient network issue), fallback to local storage
      console.error("Sale request failed, queuing locally:", error);
      await db.pendingSales.add({ saleData, type: 'sale', createdAt: new Date() });
      await decrementLocalStock(state.cart);
      toast.warning("Network issue: Sale queued locally");
      playBeep("success");
      dispatch({ type: "CLEAR_CART" });
      onSuccess?.();
    }
  }, [state.cart, state.customer, state.isWholesale, session, selectedBranch, receiptSettings, dispatch, setPrintableSale, playBeep]);

  // ── Hold Sale ─────────────────────────────────────────────────────────────
  const handleHoldSale = useCallback(async ({
    adjustment, selectedEmployeeIds, generalDiscount, wholesaleDiscount, activeShiftId, onSuccess,
  }) => {
    if (state.cart.length === 0) return toast.error("Cart is empty");

    const terminalName = localStorage.getItem("pos_terminal_id") || "Main Terminal";
    const { subtotal, totalDiscount, netTotal } = computeTotals(state.cart, {
      generalDiscount, wholesaleDiscount, isWholesale: state.isWholesale, adjustment,
    });

    const saleData = {
      status: "draft",
      branch_id: selectedBranch?.id,
      customer_id: state.customer?.id,
      distributor_id: state.distributor?.id,
      seller_ids: selectedEmployeeIds,
      items: state.cart.map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const itemLineDiscount = itemSubtotal * (item.discount / 100);
        const wholesaleDiscAmt = state.isWholesale ? itemSubtotal * (wholesaleDiscount / 100) : 0;
        const generalDiscAmt = itemSubtotal * (generalDiscount / 100);

        return {
          product_id: item.productId,
          product_variant_id: item.variantId,
          product_batch_id: item.batchId,
          quantity: item.quantity,
          unit_price: Number(parseFloat(item.price).toFixed(2)),
          discount_amount: Number((itemLineDiscount + wholesaleDiscAmt + generalDiscAmt).toFixed(2)),
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
    };

    if (!navigator.onLine) {
      toast.error("Offline: Holding sales is not supported in offline mode.");
      return;
    }

    if (!session?.accessToken) return toast.error("Please log in to hold the sale");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify(saleData),
      });
      const result = await res.json();

      if (result.status === "success") {
        toast.success("Sale held successfully");
        playBeep("success");
        dispatch({ type: "CLEAR_CART" });
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to hold sale");
        playBeep("error");
      }
    } catch {
      toast.error("An error occurred while holding sale");
      playBeep("error");
    }
  }, [state.cart, state.customer, state.isWholesale, session, selectedBranch, dispatch, playBeep]);

  // ── Fetch Sales ───────────────────────────────────────────────────────────
  const fetchSales = useCallback(async (status) => {
    if (!session?.accessToken || !navigator.onLine) return;
    setIsLoadingSales(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?status=${status}&size=50`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const result = await res.json();
      if (result.status === "success") setSalesData(result.data.data || []);
    } catch { toast.error("Failed to fetch sales"); }
    finally { setIsLoadingSales(false); }
  }, [session]);

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
  }, [session]);

  // ── Resume Sale ───────────────────────────────────────────────────────────
  const resumeSale = useCallback((sale) => {
    if (!sale.items?.length) return toast.error("This sale has no items");

    const restoredCart = sale.items.map((item) => {
      const v = flattenedVariants.find(
        (p) => (item.product_variant_id && p.id === item.product_variant_id) ||
          (!item.product_variant_id && p.productId === item.product_id)
      );
      return v ? {
        id: v.id, productId: v.productId, variantId: v.id,
        barcode: v.barcode, name: v.fullName, size: v.variantName,
        quantity: parseFloat(item.quantity) || 1,
        price: parseFloat(item.unit_price) || v.retailPrice,
        discount: 0,
      } : null;
    }).filter(Boolean);

    if (!restoredCart.length) return toast.error("Could not match any products from this sale");

    const restoredCustomer = customers.find((c) => c.id === sale.customer_id) || null;
    dispatch({ type: "RESUME_SALE", payload: { cart: restoredCart, customer: restoredCustomer, isWholesale: false } });
    deleteSale(sale.id);
    setIsHoldListOpen(false);
    toast.success(`Resumed sale ${sale.invoice_number}`);
  }, [flattenedVariants, customers, dispatch, deleteSale, setIsHoldListOpen]);

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

  const syncPendingSales = useCallback(async () => {
    if (!navigator.onLine || !session?.accessToken) return;

    const pending = await db.pendingSales.toArray();
    if (pending.length === 0) return;

    console.log(`Attempting to sync ${pending.length} pending sales...`);
    let successCount = 0;

    for (const sale of pending) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
          body: JSON.stringify(sale.saleData),
        });
        const result = await res.json();
        if (result.status === "success") {
          await db.pendingSales.delete(sale.id);
          successCount++;
        }
      } catch (err) {
        console.error("Failed to sync sale:", sale.id, err);
        break; // Stop if network fails again
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} offline sales`);
    }
  }, [session]);

  return {
    handlePayNow, handleHoldSale,
    fetchSales, deleteSale, resumeSale,
    fetchStock, clearStockData, syncPendingSales,
    salesData, isLoadingSales,
    stockData, isLoadingStock,
  };
}
