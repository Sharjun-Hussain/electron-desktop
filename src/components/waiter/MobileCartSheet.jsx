"use client";

import React, { useMemo, useCallback } from "react";
import { X, Minus, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileCartSheet({ isOpen, onClose, state, dispatch, onSendToCashier, activeTable, isSubmitting }) {
  
  const subtotal = useMemo(() => {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [state.cart]);

  const handleUpdateQty = useCallback((id, newQty) => {
    if (newQty <= 0) {
      dispatch({ type: "REMOVE_ITEM", payload: id });
    } else {
      dispatch({ type: "UPDATE_ITEM", payload: { id, quantity: newQty } });
    }
  }, [dispatch]);

  const handleRemove = useCallback((id) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  }, [dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-150 touch-manipulation select-none">
      <div 
        className="flex-1" 
        onClick={onClose} 
      />
      
      <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
            {activeTable && (
              <p className="text-sm font-semibold text-emerald-600">Table {activeTable.table_number}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {state.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium text-lg">Your cart is empty</p>
              <p className="text-sm">Add some items from the menu</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {state.cart.map((item) => (
                <div key={item.id} className="flex flex-col border border-gray-100 rounded-2xl p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 leading-tight">{item.name}</h4>
                      {item.size && item.size !== "Default" && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.size}</p>
                      )}
                    </div>
                    <span className="font-bold text-emerald-600">Rs {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-red-500 p-2 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center bg-gray-100 rounded-full p-1">
                      <button 
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-emerald-600 rounded-full shadow-sm text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 bg-gray-50 border-t shrink-0 pb-safe">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-semibold">Total Amount</span>
            <span className="text-2xl font-black text-gray-900">Rs {subtotal.toFixed(2)}</span>
          </div>
          
          <button
            onClick={onSendToCashier}
            disabled={state.cart.length === 0 || isSubmitting}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-sm transition-colors",
              (state.cart.length > 0 && !isSubmitting)
                ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSubmitting ? "Sending..." : "Send to Cashier"}
          </button>
        </div>
      </div>
    </div>
  );
}
