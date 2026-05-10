"use client";

import { memo, useState, useMemo, useCallback, forwardRef, useRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ImageIcon, Plus, PackageSearch, LayoutGrid, List } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

// ─── Static sub-components (defined outside so they're never re-created) ─────

const ProductCardWithImage = memo(({ product, onAddToCart, isWholesale }) => {
  const displayPrice = product.variants?.length > 0
    ? Math.min(...product.variants.map((v) => isWholesale ? (v.wholesalePrice || v.retailPrice) : v.retailPrice))
    : 0;
  const variantCount = product.variants?.length || 0;
  const { t } = useTranslation();

  return (
    <Card
      onClick={() => onAddToCart(product)}
      className="group relative cursor-pointer border-border/60 hover:border-emerald-500/30 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col overflow-hidden bg-card/50 backdrop-blur-sm p-0"
    >
      <div className="relative aspect-3/2 overflow-hidden bg-muted/20 shrink-0">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {variantCount > 1 && (
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-emerald-400/30">
            {variantCount} {t("pos.variants")}
          </div>
        )}
        {variantCount <= 1 && (
          <div className="absolute top-2 right-2 bg-slate-800/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-white/10 backdrop-blur-sm">
            {product.unit?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <h3 className="font-medium text-[13px] md:text-sm text-foreground leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        <div className="mt-auto flex flex-col gap-1 border-t border-border/40 pt-2">
          <p className="text-emerald-600 font-bold text-sm lg:text-base leading-none">
            LKR {displayPrice.toFixed(2)}
          </p>
          <p className="text-muted-foreground/60 font-mono text-[10px] truncate max-w-[140px]">
            {product.code || product.variants?.[0]?.barcode || "N/A"}
          </p>
        </div>
        <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <Plus className="h-4 w-4 text-emerald-600" />
        </div>
      </div>
    </Card>
  );
});
ProductCardWithImage.displayName = "ProductCardWithImage";

const ProductCardSimple = memo(({ product, onAddToCart, isWholesale }) => {
  const displayPrice = product.variants?.length > 0
    ? Math.min(...product.variants.map((v) => isWholesale ? (v.wholesalePrice || v.retailPrice) : v.retailPrice))
    : 0;
  const variantCount = product.variants?.length || 0;
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onAddToCart(product)}
      className="w-full text-left p-3.5 border border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex justify-between items-center group shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-md bg-muted/20 flex items-center justify-center overflow-hidden border border-border/50">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm text-foreground group-hover:text-emerald-700 transition-colors">
            {product.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {variantCount > 1 ? (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold text-emerald-600 border-emerald-500/20 bg-emerald-500/5">
                {variantCount} {t("pos.variants_available")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold text-slate-500 border-slate-200 bg-slate-50">
                {product.unit?.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <div className="flex flex-col items-end">
          <p className="font-medium text-sm text-emerald-600">LKR {displayPrice.toFixed(2)}</p>
          <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">
            {product.code || product.variants?.[0]?.barcode || "N/A"}
          </p>
        </div>
        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
          <Plus className="h-4 w-4 text-emerald-600" />
        </div>
      </div>
    </button>
  );
});
ProductCardSimple.displayName = "ProductCardSimple";

// ─── Main ProductGrid component ───────────────────────────────────────────────
export const ProductGrid = memo(forwardRef(({ allProducts, flattenedVariants, onAddToCart, isWholesale, isLoading }, ref) => {
  const [productSearch, setProductSearch] = useState("");
  const [showImages, setShowImages] = useState(true);
  const debouncedSearch = useDebounce(productSearch, 300);
  const inputRef = useRef(null);
  const { t } = useTranslation();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    select: () => inputRef.current?.select(),
    clear: () => setProductSearch(""),
  }));

  // Barcode scan: instant add if exact match
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setProductSearch(val);

    if (val.length >= 3) {
      // 1. Check for Scale-Ready Barcode (Prefix 20)
      if (val.startsWith("20") && (val.length === 12 || val.length === 13)) {
        let productId = "";
        let weight = 0;

        if (val.length === 13) {
          productId = val.substring(2, 7);
          weight = parseInt(val.substring(7, 12), 10) / 1000;
        } else {
          productId = val.substring(2, 8);
          weight = parseInt(val.substring(8, 12), 10) / 1000;
        }

        const match = flattenedVariants.find((v) => v.barcode === productId || v.code === productId);
        if (match) {
          onAddToCart({
            variantId: match.id, productId: match.productId, barcode: match.barcode,
            name: match.fullName, size: match.variantName, unit: match.unit,
            retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice,
          }, weight);
          setProductSearch("");
          return;
        }
      }

      // 2. Normal exact barcode match
      const match = flattenedVariants.find((v) => v.barcode === val || v.code === val);
      if (match) {
        onAddToCart({
          variantId: match.id, productId: match.productId, barcode: match.barcode,
          name: match.fullName, size: match.variantName, unit: match.unit,
          retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice,
        });
        setProductSearch("");
      }
    }
  }, [flattenedVariants, onAddToCart]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return allProducts;
    const q = debouncedSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        p.variants.some((v) => v.barcode && v.barcode.includes(debouncedSearch))
    );
  }, [allProducts, debouncedSearch]);

  const SkeletonCard = () => (
    <div className="animate-pulse flex flex-col h-full bg-card/40 border border-border/40 rounded-xl overflow-hidden">
      <div className="aspect-3/2 bg-muted/20" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted/40 rounded w-3/4" />
        <div className="h-3 bg-muted/20 rounded w-1/2" />
        <div className="mt-auto pt-2 border-t border-border/10 flex justify-between">
          <div className="h-5 bg-emerald-500/10 rounded w-20" />
          <div className="h-4 bg-muted/10 rounded w-16" />
        </div>
      </div>
    </div>
  );

  const SkeletonRow = () => (
    <div className="animate-pulse flex items-center justify-between p-4 bg-card/40 border border-border/40 rounded-xl">
      <div className="flex items-center gap-4 flex-1">
        <div className="h-10 w-10 bg-muted/30 rounded" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted/40 rounded w-1/3" />
          <div className="h-3 bg-muted/20 rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-emerald-500/10 rounded w-24" />
    </div>
  );

  return (
    <>
      {/* Search bar lives here — its own isolated state. Added more top padding for spacing. */}
      <div className="p-6 pb-4 bg-card border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            <Input
              id="pos-search-bar"
              ref={inputRef}
              placeholder={t("pos.search_placeholder")}
              className="pl-12 h-12 text-[14px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl shadow-sm transition-all"
              value={productSearch}
              onChange={handleSearchChange}
            />
          </div>
          <Button
            id="pos-view-toggle"
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
            onClick={() => setShowImages(!showImages)}
            title={showImages ? t("pos.list_view") : t("pos.grid_view")}
          >
            {showImages ? <List className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-muted/20">
        {isLoading && allProducts.length === 0 ? (
          showImages ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 pb-10">
              {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )
        ) : (
          showImages ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 pb-10">
              {filteredProducts.map((p) => (
                <ProductCardWithImage key={p.id} product={p} onAddToCart={onAddToCart} isWholesale={isWholesale} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <PackageSearch className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("pos.no_products_found")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProducts.map((p) => (
                <ProductCardSimple key={p.id} product={p} onAddToCart={onAddToCart} isWholesale={isWholesale} />
              ))}
              {filteredProducts.length === 0 && (
                <div className="py-20 text-center">
                  <PackageSearch className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("pos.no_products_found")}</p>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </>
  );
}));
ProductGrid.displayName = "ProductGrid";
