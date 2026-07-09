"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { usePosData } from "@/components/pos/hooks/usePosData";
import { usePosCart } from "@/components/pos/hooks/usePosCart";
import { usePosActions } from "@/components/pos/hooks/usePosActions";
import { MobileTableSelection } from "./MobileTableSelection";
import { MobileMenuGrid } from "./MobileMenuGrid";
import { MobileCartSheet } from "./MobileCartSheet";
import { Loader2, ArrowLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { useShift } from "@/app/hooks/swr/useShift";
import { useRouter } from "next/navigation";

export default function MobileWaiterApp() {
  const router = useRouter();
  const { allProducts, flattenedVariants, branches, selectedBranch, isLoading } = usePosData();
  const { state, dispatch } = usePosCart();

  const [activeTable, setActiveTable] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { useActiveShift } = useShift();
  const { data: activeShiftRes } = useActiveShift();
  const activeShift = activeShiftRes?.data || null;

  const { handleHoldSale, isProcessing } = usePosActions({
    state,
    dispatch,
    selectedBranch,
    flattenedVariants,
    setIsHoldListOpen: () => { }, // unused in waiter
  });

  const handleSelectTable = useCallback((table) => {
    setActiveTable(table);
    dispatch({ type: "CLEAR_CART" });
  }, [dispatch]);

  const handleSendToCashier = useCallback(async () => {
    if (state.cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    if (!activeTable) {
      toast.error("No table selected.");
      return;
    }

    handleHoldSale({
      adjustment: 0,
      generalDiscount: 0,
      generalDiscountAmt: 0,
      wholesaleDiscount: 0,
      selectedEmployeeIds: [],
      dining_type: "dine_in",
      dining_table_id: activeTable.id,
      waiter_id: null,
      activeShiftId: activeShift?.id,
      onSuccess: () => {
        toast.success(`Order sent to cashier for Table ${activeTable.table_number}`);
        setIsCartOpen(false);
        setActiveTable(null);
        dispatch({ type: "CLEAR_CART" });
      }
    });
  }, [state.cart.length, activeTable, handleHoldSale, activeShift?.id, dispatch]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-emerald-600">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#f8fafc] font-sans overflow-hidden touch-manipulation select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
      {/* Premium Top Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          {activeTable ? (
            <button
              onClick={() => setActiveTable(null)}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-50 rounded-2xl border border-emerald-100">
              <Store className="w-5 h-5 text-emerald-600" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">
              {activeTable ? `Table ${activeTable.table_number}` : "Service Mode"}
            </h1>
            {activeTable ? (
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {activeTable.capacity} Pax
              </p>
            ) : (
              <p className="text-xs text-emerald-600 font-medium">Ready for orders</p>
            )}
          </div>
        </div>

        {activeTable && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            Order
            {state.cart.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-sm border-2 border-white">
                {state.cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {!activeTable ? (
          <MobileTableSelection onSelectTable={handleSelectTable} />
        ) : (
          <MobileMenuGrid
            products={allProducts}
            dispatch={dispatch}
          />
        )}
      </div>

      {/* Cart Drawer / Bottom Sheet */}
      <MobileCartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        state={state}
        dispatch={dispatch}
        onSendToCashier={handleSendToCashier}
        activeTable={activeTable}
        isSubmitting={isProcessing}
      />
    </div>
  );
}
