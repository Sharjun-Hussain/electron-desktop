"use client";

import { memo, useState, useMemo, forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

// ─── Static sub-components (defined outside so they're never re-created) ─────

const ProductCardWithImage = memo(({ product, onAddToCart, isWholesale }) => {
  const displayPrice = isWholesale ? product.minWholesale : product.minRetail;
  const categoryName = product.main_category?.name || product.category?.name || "General";

  return (
    <Card
      onClick={() => onAddToCart(product)}
      className="group cursor-pointer border border-border/50 bg-card hover:border-emerald-500 hover:shadow-sm transition-all rounded-lg overflow-hidden h-full flex flex-col"
    >
      <div className="aspect-[1.6/1] w-full bg-muted/30 flex items-center justify-center overflow-hidden shrink-0 border-b border-border/50">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
        )}
      </div>
      <CardContent className="p-2 flex flex-col justify-between flex-1 gap-0.5">
        <div>
          <p className="text-[9px] font-medium text-emerald-600 uppercase tracking-wider leading-none mb-0.5">{categoryName}</p>
          <h3 className="font-semibold text-[13px] text-foreground line-clamp-1 leading-tight">
            {product.name}
          </h3>
        </div>
        <p className="text-emerald-600 font-bold text-sm leading-none mt-1">
          <span className="text-[10px] mr-0.5 opacity-60">LKR</span>
          {(displayPrice || 0).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
});
ProductCardWithImage.displayName = "ProductCardWithImage";

const ProductCardSimple = memo(({ product, onAddToCart, isWholesale }) => {
  const displayPrice = isWholesale ? product.minWholesale : product.minRetail;

  return (
    <button
      onClick={() => onAddToCart(product)}
      className="group w-full text-left p-1.5 bg-card border border-border/50 rounded-lg hover:border-emerald-500 hover:shadow-sm transition-all flex justify-between items-center"
    >
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-md bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground/20" />
          )}
        </div>
        <div>
          <p className="font-semibold text-[13px] text-foreground leading-tight">{product.name}</p>
          <p className="text-[9px] text-muted-foreground uppercase">{product.code || "No Code"}</p>
        </div>
      </div>
      <p className="text-emerald-600 font-bold text-sm whitespace-nowrap ml-4">
        <span className="text-[10px] mr-0.5 opacity-60">LKR</span>
        {(displayPrice || 0).toFixed(2)}
      </p>
    </button>
  );
});
ProductCardSimple.displayName = "ProductCardSimple";

// ─── Main ProductGrid component ───────────────────────────────────────────────
export const ProductGrid = memo(forwardRef(({ allProducts, flattenedVariants, onAddToCart, isWholesale, productSearch }, ref) => {
  const [showImages, setShowImages] = useState(true);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        p.variants.some((v) => v.barcode && v.barcode.includes(productSearch))
    );
  }, [allProducts, productSearch]);

  return (
    <div className="flex-1 p-1 overflow-y-auto bg-muted/5">
      {showImages ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredProducts.map((p) => (
            <ProductCardWithImage key={p.id} product={p} onAddToCart={onAddToCart} isWholesale={isWholesale} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {filteredProducts.map((p) => (
            <ProductCardSimple key={p.id} product={p} onAddToCart={onAddToCart} isWholesale={isWholesale} />
          ))}
        </div>
      )}
    </div>
  );
}));
ProductGrid.displayName = "ProductGrid";