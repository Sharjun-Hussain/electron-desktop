"use client";

import { memo, useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Sun, Moon, ShoppingCart, Store, Wallet,
  ChevronDown, Check, UserMinus, Gift, Plus, Network, LayoutGrid, Maximize2, Search,
  Calculator, Maximize, Minimize, Trash2, Zap, UtensilsCrossed
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AddCustomerForm, AddDistributorForm } from "./CustomerForms";

// ─── Clock ────────────────────────────────────────────────────────────────
const Clock = memo(() => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div id="pos-clock" className="hidden md:flex flex-col items-end text-right">
      <p className="text-[11px] font-medium text-foreground leading-tight">
        {currentDateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
      </p>
      <p className="text-[10px] font-medium text-muted-foreground font-mono leading-none">
        {currentDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    </div>
  );
});
Clock.displayName = "Clock";

// ─── CustomerSelector ─────────────────────────────────────────────────────────
const CustomerSelector = memo(({
  customers, distributors, selectedCustomer, selectedDistributor,
  isWholesale, onSelectCustomer, onSelectDistributor,
  onCustomerCreated, onDistributorCreated, isManufacturing,
  business, session, t
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const useDistributors = isWholesale && isManufacturing;
  const list = useDistributors ? distributors : customers;
  const selected = useDistributors ? selectedDistributor : selectedCustomer;
  const onSelect = useDistributors ? onSelectDistributor : onSelectCustomer;
  const onCreate = useDistributors ? onDistributorCreated : onCustomerCreated;

  const filtered = list.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  );

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "h-12 w-full justify-between items-center px-4 bg-card hover:bg-card border-border/50 rounded-2xl group transition-all",
              useDistributors && "border-blue-500/30 bg-blue-50/5"
            )}
          >
            <div className="truncate text-left">
              <p className={cn("text-xs font-normal leading-tight truncate", useDistributors ? "text-blue-600" : "text-foreground")}>
                {selected ? selected.name : (useDistributors ? "Select Distributor" : (isWholesale ? "Select Wholesale Customer" : t("pos.walk_in_customer")))}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {selected?.phone || (useDistributors ? "Bulk Distribution" : (isWholesale ? "Volume Pricing Applied" : t("pos.standard_pricing")))}
              </p>
            </div>
            {selected && !useDistributors && business?.loyalty_enabled && (
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-500/20 ml-2 shrink-0">
                <Gift className="h-2.5 w-2.5" />
                <span className="text-[10px] font-bold">{selected.loyalty_points || 0} pts</span>
              </div>
            )}
            {useDistributors && <Network className="h-3.5 w-3.5 text-blue-400 opacity-40 ml-2 shrink-0" />}
            <ChevronDown className="h-4 w-4 text-muted-foreground opacity-40 shrink-0 ml-auto" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={useDistributors ? "Search Distributors..." : (isWholesale ? "Search Wholesale Customers..." : t("pos.search_customers"))}
              value={search}
              onValueChange={setSearch}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{useDistributors ? "No distributor found" : (isWholesale ? "No wholesale customer found" : t("pos.no_customer_found"))}</CommandEmpty>
              <CommandGroup>
                {!useDistributors && (
                  <CommandItem
                    onSelect={() => {
                      onSelect(null);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <UserMinus className="h-4 w-4 opacity-70" />
                    <div className="flex flex-col">
                      <span className="text-sm font-normal">{t("pos.walk_in_customer")}</span>
                      <span className="text-[10px] opacity-60">{t("pos.no_profile_selection")}</span>
                    </div>
                    {!selected && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                  </CommandItem>
                )}

                {filtered.slice(0, 50).map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal">{item.name}</span>
                        {useDistributors && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold border-blue-200 text-blue-700 bg-blue-50 uppercase tracking-tighter">
                            Partner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-60">{item.phone || "No phone"}</span>
                        {!useDistributors && business?.loyalty_enabled && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1 rounded flex items-center gap-1">
                            <Gift className="h-2 w-2" /> {item.loyalty_points || 0}
                          </span>
                        )}
                      </div>
                    </div>
                    {selected?.id === item.id && (
                      <Check className={cn("ml-auto h-4 w-4", useDistributors ? "text-blue-600" : "text-emerald-600")} />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t border-border/40 bg-muted/20">
              <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-8 text-[11px] font-medium rounded-lg justify-between px-3",
                      useDistributors ? "text-blue-600 hover:bg-blue-500/10" : "text-emerald-600 hover:bg-emerald-500/10"
                    )}
                  >
                    <span>{useDistributors ? "Onboard New Distributor" : (isWholesale ? "Add Wholesale Customer" : t("pos.add_new_customer"))}</span><Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" align="end" className={cn("w-72 p-3 shadow-2xl rounded-xl", useDistributors ? "border-blue-500/20" : "border-emerald-500/20")} sideOffset={10}>
                  {useDistributors ? (
                    <AddDistributorForm
                      session={session}
                      initialName={search}
                      onCancel={() => setIsAddOpen(false)}
                      onDistributorCreated={(d) => {
                        onCreate(d);
                        onSelect(d);
                        setIsAddOpen(false);
                        setIsOpen(false);
                      }}
                    />
                  ) : (
                    <AddCustomerForm
                      session={session}
                      initialName={search}
                      onCancel={() => setIsAddOpen(false)}
                      onCustomerCreated={(c) => {
                        onCreate(c);
                        onSelect(c);
                        setIsAddOpen(false);
                        setIsOpen(false);
                      }}
                    />
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
});
CustomerSelector.displayName = "CustomerSelector";

export const PosHeader = memo(({
  handleDashboardExit,
  handleThemeToggle,
  theme,
  refreshData,
  isLoading,
  branches,
  selectedBranch,
  setSelectedBranch,
  activeShift,
  setIsShiftManagerOpen,
  requireShift,
  customers,
  distributors,
  selectedCustomer,
  selectedDistributor,
  isWholesale,
  handleSelectCustomer,
  handleSelectDistributor,
  addCustomerToList,
  addDistributorToList,
  isManufacturing,
  isRestaurant,
  business,
  session,
  t,
  isProductListVisible,
  onToggleProductList,
  productSearch,
  setProductSearch,
  onToggleCalculator,
  isCalculatorOpen,
  onToggleFullscreen,
  isFullscreen,
  onWholesaleToggle,
  onReset,
  allProducts,
  flattenedVariants,
  onAddToCart,
  onForceReset,
  isOnline = true,
  isHardwareReady = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleForceReset = () => {
    if (confirm("This will completely clear your local POS database and reload everything from the server. Use this if you are seeing 'Product not found' errors. Continue?")) {
      onForceReset?.();
    }
  };

  const filteredProducts = productSearch.trim().length > 1
    ? flattenedVariants.filter(v =>
      v.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      v.barcode?.toLowerCase().includes(productSearch.toLowerCase()) ||
      v.sku?.toLowerCase().includes(productSearch.toLowerCase())
    ).slice(0, 10)
    : [];

  useEffect(() => {
    setSelectedIndex(filteredProducts.length > 0 ? 0 : -1);
  }, [productSearch, filteredProducts.length]);

  // ─── Auto-add on exact barcode scan ───────────────────────────────────────
  // Barcode scanners type all digits in <50ms then send Enter.
  // This 80ms debounce fires right after the scanner finishes and
  // auto-adds the item without requiring a manual Enter press.
  useEffect(() => {
    const trimmed = productSearch.trim();
    // Skip short strings or anything with spaces (those are manual name searches)
    if (trimmed.length < 4 || trimmed.includes(' ')) return;

    const timer = setTimeout(() => {
      const exactMatch = flattenedVariants?.find(
        (v) => v.barcode && v.barcode === trimmed
      );
      if (exactMatch) {
        onAddToCart(exactMatch);
        setProductSearch('');
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [productSearch, flattenedVariants, onAddToCart, setProductSearch]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      const selectedEl = document.getElementById(`search-item-${selectedIndex}`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (filteredProducts.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
          onAddToCart(filteredProducts[selectedIndex]);
          setProductSearch("");
        } else if (productSearch.trim()) {
          // Fallback to barcode exact match if nothing selected but Enter pressed
          const match = flattenedVariants?.find(v => v.barcode === productSearch.trim());
          if (match) {
            onAddToCart(match);
            setProductSearch("");
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setProductSearch("");
        e.currentTarget.blur();
      }
    } else if (e.key === "Enter" && productSearch.trim()) {
      e.preventDefault();
      const match = flattenedVariants?.find(v => v.barcode === productSearch.trim());
      if (match) {
        onAddToCart(match);
        setProductSearch("");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setProductSearch("");
      e.currentTarget.blur();
    }
  };

  return (
    <header className="p-2 px-4 border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Navigation only */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button type="button" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-border/40" onClick={handleDashboardExit}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Center: Search & Actions Unified */}
        <div className="flex-1 max-w-5xl flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input
              id="pos-global-search"
              placeholder={isRestaurant ? "SEARCH FOOD ITEMS..." : "SCAN BARCODE OR TYPE..."}
              className="pl-11 pr-14 h-11 w-full bg-slate-50/80 hover:bg-slate-100/50 focus:bg-white dark:bg-slate-950 dark:hover:bg-slate-900/50 dark:focus:bg-slate-950 border-slate-200 dark:border-border/40 rounded-xl text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-none"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
              <kbd className="h-6 min-w-[28px] px-1.5 flex items-center justify-center bg-muted border border-border/60 rounded-md text-[9px] font-black text-muted-foreground shadow-sm uppercase">
                F1
              </kbd>
            </div>

            {/* Search Results Dropdown */}
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-border/50 rounded-xl shadow-2xl z-[100] max-h-[400px] overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-1">
                  {filteredProducts.map((match, index) => (
                    <button
                      key={`${match.id}-${match.batchId || 'no-batch'}`}
                      id={`search-item-${index}`}
                      onClick={() => {
                        onAddToCart(match);
                        setProductSearch("");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left group/item border mb-1 last:mb-0",
                        index === selectedIndex
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                          : "hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/20"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className={cn(
                          "text-sm font-semibold truncate transition-colors",
                          index === selectedIndex ? "text-emerald-700" : "text-foreground group-hover/item:text-emerald-600"
                        )}>
                          {match.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 rounded uppercase">
                            {match.barcode}
                          </span>
                          {match.size && (
                            <span className="text-[10px] text-muted-foreground/60">• {match.size}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-emerald-600">
                          {((isWholesale ? match.wholesalePrice : match.retailPrice) || 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 bg-muted/30 px-1.5 rounded-full inline-block mt-1">
                          {match.stock || 0} in stock
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {productSearch.trim().length > 1 && filteredProducts.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border border-border/50 rounded-xl shadow-2xl z-[100] p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm text-muted-foreground">No products found for "{productSearch}"</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-muted/30 p-1 rounded-xl border border-border/40">
            {isRestaurant && (
              <button
                type="button"
                onClick={() => { window.location.href = "/dining"; }}
                className="h-9 px-3 flex items-center gap-1.5 bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg font-bold text-xs shadow-sm transition-all border-none cursor-pointer"
                title="Dining Floor Plan"
              >
                <UtensilsCrossed className="h-3.5 w-3.5 animate-pulse" />
                <span>Tables</span>
              </button>
            )}

            <button
              id="pos-theme-toggle"
              onClick={handleThemeToggle}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-lg transition-all",
                theme === "dark"
                  ? "bg-slate-800 text-amber-500 hover:bg-slate-700"
                  : "bg-white text-indigo-500 hover:bg-slate-50 shadow-sm border border-slate-100"
              )}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              id="pos-sync-data"
              onClick={refreshData}
              className="h-9 w-9 flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/10"
              title="Sync Data"
            >
              <ShoppingCart className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="pos-hard-reset"
              onClick={handleForceReset}
              className="h-9 w-9 flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-lg transition-all border border-rose-500/10"
              title="Force Reset (Use if items not found)"
            >
              <Zap className="h-4 w-4" />
            </button>

            <button
              id="pos-toggle-list"
              onClick={onToggleProductList}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-lg transition-all border",
                isProductListVisible
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-inner"
                  : "bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:bg-blue-50 border-transparent"
              )}
              title={isProductListVisible ? "Hide Products" : "Show Products"}
            >
              {isProductListVisible ? <Maximize2 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </button>

            <button
              id="pos-toggle-calc"
              onClick={onToggleCalculator}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-lg transition-all border",
                isCalculatorOpen
                  ? "bg-violet-500/10 text-violet-600 border-violet-500/20 shadow-inner"
                  : "bg-white dark:bg-slate-900 text-slate-400 hover:text-violet-500 hover:bg-violet-50 border-transparent"
              )}
              title="Calculator"
            >
              <Calculator className="h-4 w-4" />
            </button>

            <button
              id="pos-toggle-fullscreen"
              onClick={onToggleFullscreen}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-lg transition-all border",
                isFullscreen
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-inner"
                  : "bg-white dark:bg-slate-900 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border-transparent"
              )}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            <div className="h-4 w-[1px] bg-border/40 mx-1" />

            <button
              id="pos-wholesale-toggle"
              onClick={onWholesaleToggle}
              className={cn(
                "px-3 h-9 flex items-center gap-2 rounded-lg transition-all border font-semibold text-xs",
                isWholesale
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-500 hover:text-orange-500 hover:bg-orange-50 border-transparent"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              {isWholesale ? "Wholesale" : "Retail"}
            </button>

            <button
              id="pos-clear-sale"
              onClick={onReset}
              className="px-3 h-9 flex items-center gap-2 rounded-lg transition-all border border-transparent bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 font-semibold text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Right Side: Status & Shift */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/40 border border-border/40">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isHardwareReady ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            )} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
              {isHardwareReady ? "HW Active" : "HW Offline"}
            </span>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full animate-pulse">
              <Network className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Offline Mode</span>
            </div>
          )}
          <Clock />

          {branches?.length > 1 && (
            <div className="flex items-center gap-2 max-w-[200px]">
              <Select value={selectedBranch?.id}
                onValueChange={(id) => setSelectedBranch(branches.find((b) => b.id === id))}>
                <SelectTrigger id="pos-branch-selector" className="h-9 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-medium text-slate-900 dark:text-white transition-all shadow-none">
                  <div className="flex items-center gap-2 truncate">
                    <Store className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <SelectValue placeholder={t("pos.select_branch")} />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {requireShift !== false && activeShift && (
            <Button
              id="pos-end-shift"
              variant="outline"
              className="h-9 px-3 gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-50 hover:text-rose-700 bg-rose-50/50"
              onClick={() => setIsShiftManagerOpen(true)}
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden xl:inline text-xs font-bold">End Shift</span>
            </Button>
          )}
        </div>
      </div>

      {/* Customer selector - TEMPORARILY HIDDEN
      <div id="pos-customer-selector" className="pt-1">
        <CustomerSelector
          customers={customers}
          distributors={distributors}
          selectedCustomer={selectedCustomer}
          selectedDistributor={selectedDistributor}
          isWholesale={isWholesale}
          onSelectCustomer={handleSelectCustomer}
          onSelectDistributor={handleSelectDistributor}
          onCustomerCreated={addCustomerToList}
          onDistributorCreated={addDistributorToList}
          isManufacturing={isManufacturing}
          business={business}
          session={session}
          t={t}
        />
      </div>
      */}
    </header>
  );
});
PosHeader.displayName = "PosHeader";
