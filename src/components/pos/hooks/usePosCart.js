"use client";

import { useReducer, useCallback, useEffect } from "react";

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity: payloadQty, batchId } = action.payload;
      const qtyToAdd = payloadQty !== undefined ? parseFloat(payloadQty) : 1;
      const price = action.payload.price || (state.isWholesale ? (product.wholesalePrice || 0) : (product.retailPrice || 0)) || 0;

      // Items are now unique by (variantId + batchId)
      const itemKey = `${product.variantId || product.id}_${batchId || 'default'}`;
      const existingIndex = state.cart.findIndex((i) => `${i.variantId}_${i.batchId || 'default'}` === itemKey);

      if (existingIndex > -1) {
        const updated = [...state.cart];
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + qtyToAdd };
        return { ...state, cart: updated };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: itemKey, // Unique key for cart items
            productId: product.productId || product.product_id || (product.variants ? product.id : null),
            variantId: product.variantId || (product.variants ? (product.variants[0]?.id) : product.id),
            batchId: batchId || null,
            barcode: product.barcode,
            name: product.name || product.fullName || "Unknown Item",
            size: product.size,
            quantity: qtyToAdd,
            price,
            mrp: product.mrpPrice || product.mrp || price,
            discount: 0,
            discount_amt: 0,
            unit: product.unit || 'pc',
            stock: product.stock || 0,
            expiry_date: product.expiry_date || null,
            batch_number: product.batch_number || null,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, cart: state.cart.filter((i) => i.id !== action.payload) };
    case "UPDATE_ITEM":
      return {
        ...state,
        cart: state.cart.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload } : i
        ),
      };
    case "SET_CUSTOMER":
      return { ...state, customer: action.payload, distributor: null };
    case "SET_DISTRIBUTOR":
      return { ...state, distributor: action.payload, customer: null };
    case "TOGGLE_WHOLESALE": {
      const { isWholesale, flatVariants, isManufacturing } = action.payload;
      return {
        ...state,
        isWholesale,
        customer: (isWholesale && isManufacturing) ? null : state.customer,
        distributor: (isWholesale && isManufacturing) ? state.distributor : null,
        cart: state.cart.map((item) => {
          const v = flatVariants.find((p) => p.id === item.variantId);
          if (!v) return item;
          return { ...item, price: isWholesale ? v.wholesalePrice : v.retailPrice };
        }),
      };
    }
    case "CLEAR_CART":
      return { ...state, customer: null, distributor: null, cart: [], isWholesale: false };
    case "RESUME_SALE": {
      const { cart, customer, distributor, isWholesale } = action.payload;
      return { ...state, cart, customer, distributor, isWholesale: isWholesale || false };
    }
    default:
      return state;
  }
}

const INITIAL_STATE = { cart: [], customer: null, distributor: null, isWholesale: false };

// Lean hook — only cart + customer. ALL checkout inputs live in CheckoutPanel.
export function usePosCart() {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);

  // Broadcast cart updates in real-time to the customer-facing secondary display
  useEffect(() => {
    if (typeof window !== "undefined") {
      const channel = new BroadcastChannel("pos_customer_display");
      channel.postMessage({
        type: "cart_update",
        payload: {
          cart: state.cart,
          customer: state.customer,
          isWholesale: state.isWholesale
        }
      });
      return () => {
        channel.close();
      };
    }
  }, [state.cart, state.customer, state.isWholesale]);

  const handleSelectCustomer = useCallback((customer) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer });
  }, []);

  const handleSelectDistributor = useCallback((distributor) => {
    dispatch({ type: "SET_DISTRIBUTOR", payload: distributor });
  }, []);

  return { state, dispatch, handleSelectCustomer, handleSelectDistributor };
}
