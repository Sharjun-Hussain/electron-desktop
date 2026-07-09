"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileMenuGrid({ products, dispatch }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== "all") {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(s) || 
        p.code?.toLowerCase().includes(s) || 
        (p.category && p.category.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [products, search, activeCategory]);

  const handleAddProduct = useCallback((product) => {
    const variant = product.variants?.[0];
    if (!variant) return;

    dispatch({
      type: "ADD_ITEM",
      payload: {
        product: {
          variantId: variant.id,
          productId: variant.productId,
          barcode: variant.barcode,
          name: variant.fullName || variant.name,
          size: variant.variantName,
          unit: variant.unit,
          retailPrice: variant.retailPrice,
          wholesalePrice: variant.wholesalePrice
        },
        quantity: 1
      }
    });
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full bg-white touch-manipulation select-none">
      {/* Search Bar */}
      <div className="p-3 border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-none bg-white border-b overflow-x-auto scrollbar-hide shrink-0">
        <div className="flex p-2 gap-2 w-max">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap capitalize",
                activeCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const minPrice = product.minRetail || 0;
            return (
              <button
                key={product.id}
                onClick={() => handleAddProduct(product)}
                className="flex flex-col bg-white p-3 rounded-2xl border active:bg-gray-50 transition-colors text-left"
              >
                {product.image ? (
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-xl mb-2 bg-emerald-50 flex items-center justify-center">
                    <span className="text-emerald-300 font-bold text-3xl">
                      {product.name?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight mb-1">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between mt-auto w-full">
                  <span className="font-black text-emerald-600 text-sm">
                    Rs {minPrice.toFixed(2)}
                  </span>
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No items found.
          </div>
        )}
      </div>
    </div>
  );
}
