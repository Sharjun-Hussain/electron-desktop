"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useReactToPrint } from "react-to-print";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useBeep } from "@/hooks/use-beep";
import { toast } from "sonner";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { useShift } from "@/app/hooks/swr/useShift";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, MonitorX, Sun, Moon, Search, X, Loader2,
  Plus, ChevronDown, ChevronRight, UserMinus, PackageSearch, Store,
  Monitor, User, Check, Gift,
  Network
} from "lucide-react";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { usePosData } from "./hooks/usePosData";
import { usePosCart } from "./hooks/usePosCart";
import { usePosActions } from "./hooks/usePosActions";
import { ProductGrid } from "./components/ProductGrid";
import { CartPanel } from "./components/CartPanel";
import { CheckoutPanel } from "./components/CheckoutPanel";
import { HoldListDialog, SaleListDialog, StockCheckDialog, ReturnDialogWrapper, SaleDetailWrapper } from "./components/PosDialogs";
import { ReceiptTemplate } from "./ReceiptTemplate";
import { InvoiceA4Template } from "./InvoiceA4Template";
import { ShiftManagerDialog } from "./components/ShiftManagerDialog";
import BatchSelectorDialog from "./components/BatchSelectorDialog";
import Calculator from "./components/Calculator";
import clsx from "clsx";
import { Wallet } from "lucide-react";


// ─── AddCustomerForm ──────────────────────────────────────────────────────────
const AddCustomerForm = ({ onCustomerCreated, initialName = "", onCancel }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();
  const { t } = useTranslation();

  const handleCreate = async () => {
    if (!name.trim()) return toast.error(t("pos.name_required"));
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(t("pos.created"));
        onCustomerCreated(result.data);
      } else toast.error(result.message);
    } catch {
      toast.error("Error creating customer");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-emerald-600">{t("pos.new_customer")}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-2">
        <Input placeholder={t("pos.full_name")} value={name} onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-emerald-500/30" autoFocus />
        <Input placeholder={t("pos.phone_optional")} value={phone} onChange={(e) => setPhone(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-emerald-500/30" />
        <Button className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
          onClick={handleCreate} disabled={isCreating}>
          {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("pos.save_customer")}
        </Button>
      </div>
    </div>
  );
};
// ─── AddDistributorForm ──────────────────────────────────────────────────────────
const AddDistributorForm = ({ onDistributorCreated, initialName = "", onCancel }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Partner onboarded successfully");
        onDistributorCreated(result.data);
      } else toast.error(result.message);
    } catch {
      toast.error("Error onboarding partner");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-blue-600">Onboard Partner</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-2">
        <Input placeholder="Business Name" value={name} onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-blue-500/30" autoFocus />
        <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-blue-500/30" />
        <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
          onClick={handleCreate} disabled={isCreating}>
          {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Authorize Partner"}
        </Button>
      </div>
    </div>
  );
};

// ─── CustomerSelector ─────────────────────────────────────────────────────────
const CustomerSelector = ({ customers, distributors, selectedCustomer, selectedDistributor, isWholesale, onSelectCustomer, onSelectDistributor, onCustomerCreated, onDistributorCreated, isManufacturing = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const { business } = useAppSettings();

  const useDistributors = isWholesale && isManufacturing;
  const entityLabel = useDistributors ? "Wholesale Partner" : (isManufacturing ? "Direct Sale Customer" : (isWholesale ? "Wholesale Customer" : "Customer"));
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
};

// ─── VariantSelectorDialog ────────────────────────────────────────────────────
const VariantSelectorDialog = ({ isOpen, onOpenChange, product, onSelect }) => {
  const { t } = useTranslation();
  if (!product) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center overflow-hidden border border-emerald-500/20">
              {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <PackageSearch className="h-8 w-8 text-emerald-500" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-normal">{product.name}</DialogTitle>
              <DialogDescription className="text-xs mt-1">{t("pos.select_variant")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="bg-border/50" />
        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-3">
            {product.variants?.map((v) => (
              <div key={v.id}
                className="group flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                onClick={() => {
                  onSelect({
                    variantId: v.id, productId: v.productId, barcode: v.barcode,
                    name: v.fullName, size: v.variantName, unit: v.unit,
                    retailPrice: v.retailPrice, wholesalePrice: v.wholesalePrice
                  });
                  onOpenChange(false);
                }}>
                <div className="flex flex-col">
                  <span className="font-normal group-hover:text-emerald-700 transition-colors">{v.variantName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{v.barcode || "N/A"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-normal text-emerald-600">LKR {v.retailPrice.toFixed(2)}</p>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Plus className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/10 border-t border-border/40 text-center">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground">{t("common.cancel")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main POS Page ────────────────────────────────────────────────────────────
import { db } from "@/lib/indexedDB/db";
import { useLiveQuery } from "dexie-react-hooks";

export default function PosPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const { receipt: receiptSettings, setReceiptSettings, business: localBusiness, setBusinessSettings, setGeneralSettings } = useSettingsStore();
  const { useBusinessSettings, useModularSettings, updateModularSettings } = useSettings();
  const { data: businessResponse } = useBusinessSettings();
  const { data: posResponse } = useModularSettings("pos");
  const { data: generalResponse } = useModularSettings("general");
  const { business, loyalty, general, refreshSettings } = useAppSettings();
  const { t } = useTranslation();
  const { playBeep } = useBeep();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const { useActiveShift, openShift, closeShift } = useShift();
  const { data: activeShiftRes, isLoading: isShiftLoading } = useActiveShift();
  const activeShift = activeShiftRes?.data || null;
  const [isShiftManagerOpen, setIsShiftManagerOpen] = useState(false);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const pendingSales = useLiveQuery(() => db.pendingSales.toArray()) || [];

  const handleThemeToggle = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (general) {
      await updateModularSettings('general', {
        ...general,
        interface: {
          ...(general.interface || {}),
          theme: newTheme
        }
      });
      if (refreshSettings) refreshSettings();
    }
  };

  // ── Clock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (businessResponse?.data) setBusinessSettings(businessResponse.data);
    // Sync receipt design from the POS configuration response
    if (posResponse?.data) setReceiptSettings(posResponse.data);
    if (generalResponse?.data) setGeneralSettings(generalResponse.data);
  }, [businessResponse, posResponse, generalResponse]);

  // ── Core hooks ─────────────────────────────────────────────────────────────
  const { allProducts, flattenedVariants, customers, distributors, activeEmployees, selectedBranch, setSelectedBranch, addCustomerToList, addDistributorToList } = usePosData();
  const { state, dispatch, handleSelectCustomer, handleSelectDistributor } = usePosCart();

  // ── UI state for dialogs only (these drive conditional rendering) ──────────
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isHoldListOpen, setIsHoldListOpen] = useState(false);
  const [isSaleListOpen, setIsSaleListOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  // ── Business Type Logic ───────────────────────────────────────────────────
  const businessType = (session?.user?.organization?.business_type || "").toLowerCase();
  const isManufacturing = businessType === "manufacturing";

  useEffect(() => {
    if (isManufacturing && !state.isWholesale && flattenedVariants.length > 0) {
      dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: true, flatVariants: flattenedVariants, isManufacturing } });
    }
  }, [isManufacturing, flattenedVariants, state.isWholesale, dispatch]);
  const [printableSale, setPrintableSale] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [terminalName, setTerminalName] = useState("");
  const [isBatchSelectorOpen, setIsBatchSelectorOpen] = useState(false);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [itemPendingBatch, setItemPendingBatch] = useState(null);
  const debouncedStockSearch = useDebounce(stockSearch, 400);

  useEffect(() => {
    const saved = localStorage.getItem("pos_terminal_id");
    if (saved) setTerminalName(saved);
  }, []);

  // ── Auto-enable Wholesale if configured ────────────────────────────────────
  useEffect(() => {
    if (posResponse?.data?.enableWholesale && flattenedVariants.length > 0 && !state.isWholesale && state.cart.length === 0 && !state.customer) {
      dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: true, flatVariants: flattenedVariants, isManufacturing } });
    }
  }, [posResponse, flattenedVariants, dispatch, state.isWholesale, state.cart.length, state.customer, isManufacturing]);

  // ── useRef for everything that drives keyboard logic (NOT rendering) ───────
  const editModeRef = useRef("search"); // "search" | "cart"
  const selectedIndexRef = useRef(0);
  const cartRef = useRef(state.cart);
  const cartItemRefs = useRef(new Map());
  const printRef = useRef(null);
  const searchRef = useRef(null);
  const checkoutRef = useRef(null);

  // Barcode buffer for global hardware scanner support
  const barcodeBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  // Keep cartRef in sync
  useEffect(() => { cartRef.current = state.cart; }, [state.cart]);

  // ── Actions hook ──────────────────────────────────────────────────────────
  const {
    handlePayNow: rawHandlePayNow, handleHoldSale: rawHandleHoldSale, fetchSales, deleteSale, resumeSale,
    fetchStock, clearStockData, salesData, isLoadingSales, stockData, isLoadingStock, syncPendingSales
  } = usePosActions({
    state, dispatch, selectedBranch, setPrintableSale,
    flattenedVariants, customers, setIsHoldListOpen,
  });

  const handlePayNow = useCallback((args) => rawHandlePayNow({ ...args, activeShiftId: activeShift?.id }), [rawHandlePayNow, activeShift]);
  const handleHoldSale = useCallback((args) => rawHandleHoldSale({ ...args, activeShiftId: activeShift?.id }), [rawHandleHoldSale, activeShift]);

  // ── Connectivity & Sync Listener ───────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    if (navigator.onLine) syncPendingSales();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingSales]);

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt_${printableSale?.invoice_number || "Draft"}`,
    onAfterPrint: () => setPrintableSale(null),
  });
  useEffect(() => {
    if (printableSale) {
      const t = setTimeout(() => { if (printRef.current) handlePrint(); }, 500);
      return () => clearTimeout(t);
    }
  }, [printableSale, handlePrint]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (item, quantity = 1, skipBatchCheck = false) => {
    if (item.variants) {
      if (item.variants.length === 1) {
        const v = item.variants[0];
        handleAddToCart({
          variantId: v.id, productId: v.productId, barcode: v.barcode,
          name: v.fullName, size: v.variantName, unit: v.unit,
          retailPrice: v.retailPrice, wholesalePrice: v.wholesalePrice
        }, quantity);
      } else {
        setSelectedProductForVariants(item);
        setIsVariantSelectorOpen(true);
      }
      return;
    }

    // --- BATCH SELECTION LOGIC ---
    if (!skipBatchCheck && item.variantId) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/variants/${item.variantId}/batches`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const result = await res.json();

        if (result.status === "success" && result.data.length > 1) {
          const pricingMode = receiptSettings?.posPricingMode || 'fifo';
          const forceOnConflict = receiptSettings?.enableBatchSelection === true;

          let shouldShowSelector = false;

          if (pricingMode === 'manual_batch') {
            shouldShowSelector = true;
          } else if (pricingMode === 'fifo' && forceOnConflict) {
            // Check if there are at least two different selling prices among the batches
            const prices = new Set(result.data.map(b => parseFloat(b.selling_price).toFixed(2)));
            if (prices.size > 1) {
              shouldShowSelector = true;
            }
          }

          if (shouldShowSelector) {
            setAvailableBatches(result.data);
            setItemPendingBatch({ item, quantity });
            setIsBatchSelectorOpen(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      }
    }

    const cart = cartRef.current;
    const existingIndex = cart.findIndex((ci) => ci.variantId === item.variantId && (!item.batchId || ci.batchId === item.batchId));

    if (existingIndex > -1) {
      const targetId = cart[existingIndex].id;
      setTimeout(() => {
        const ref = cartItemRefs.current.get(targetId);
        if (ref) {
          ref.focusQty();
          editModeRef.current = "cart";
          selectedIndexRef.current = existingIndex;
        }
      }, 0);
    }

    dispatch({ type: "ADD_ITEM", payload: { product: item, quantity, batchId: item.batchId, price: item.price } });
    playBeep("scan");
  }, [dispatch, playBeep, session]);

  const handleBatchSelect = (batch) => {
    const { item, quantity } = itemPendingBatch;
    handleAddToCart({
      ...item,
      batchId: batch.id,
      price: state.isWholesale ? batch.wholesale_price : batch.selling_price
    }, quantity, true);
    setIsBatchSelectorOpen(false);
    setItemPendingBatch(null);
  };

  // ── Wholesale toggle ──────────────────────────────────────────────────────
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const handleWholesaleToggle = useCallback(() => {
    const next = !state.isWholesale;
    dispatch({ type: "TOGGLE_WHOLESALE", payload: { isWholesale: next, flatVariants: flattenedVariants, isManufacturing } });
    if (!next) setWholesaleDiscount(0);
  }, [state.isWholesale, flattenedVariants, dispatch, isManufacturing]);

  // ── Reset sale ────────────────────────────────────────────────────────────
  const resetSale = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    editModeRef.current = "search";
    searchRef.current?.focus();
  }, [dispatch]);

  // ── Full screen ───────────────────────────────────────────────────────────
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen?.();
  }, []);
  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Focus last added item ─────────────────────────────────────────────────
  useEffect(() => {
    const cart = state.cart;
    if (cart.length > 0) {
      const last = cart[cart.length - 1];
      // Small timeout to allow DOM to render the new item
      setTimeout(() => {
        const ref = cartItemRefs.current.get(last.id);
        if (ref) {
          ref.focusQty();
          editModeRef.current = "cart";
          selectedIndexRef.current = cart.length - 1;
        }
      }, 50);
    }
  }, [state.cart.length]);

  // ── Keyboard handler — installed ONCE, reads refs for latest state ─────────
  useEffect(() => {
    const handler = (e) => {
      // 1. Global Barcode Listener (Hardware Scanners)
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If Enter is pressed and buffer has stuff, it's likely a finish signal from a hardware scanner
      if (e.key === "Enter" && barcodeBufferRef.current.length >= 4) {
        const code = barcodeBufferRef.current;
        barcodeBufferRef.current = "";

        // 1. Check for Weighted Barcode (Industry Standard Prefix: 20)
        // Format: 20 + 5-digit PLU/ID + 5-digit weight + checksum
        if (code.startsWith("20") && code.length === 13) {
          const productId = code.substring(2, 7);
          const weightValue = parseInt(code.substring(7, 12), 10);
          const weight = weightValue / 1000; // e.g. 00500 -> 0.500 kg

          const match = flattenedVariants.find(v => v.barcode === productId);
          if (match && match.measurementUnit) {
            e.preventDefault();
            handleAddToCart({
              variantId: match.id, productId: match.productId, barcode: match.barcode,
              name: match.fullName, size: match.variantName, unit: match.unit,
              retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice
            }, weight);
            return;
          }
        }

        // 2. Normal Barcode Matching
        const match = flattenedVariants.find(v => v.barcode === code);
        if (match) {
          e.preventDefault();
          handleAddToCart({
            variantId: match.id, productId: match.productId, barcode: match.barcode,
            name: match.fullName, size: match.variantName, unit: match.unit,
            retailPrice: match.retailPrice, wholesalePrice: match.wholesalePrice
          });
          return;
        }
      }

      // Fast keystrokes are buffered
      if (diff < 50 && e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      } else {
        // Human typing or start of a new scan
        barcodeBufferRef.current = e.key.length === 1 ? e.key : "";
      }

      // 2. Global Shortcuts
      if ((e.key === "q" || e.key === "Q") && e.ctrlKey) {
        e.preventDefault();
        editModeRef.current = "search";
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }

      if ((e.key === "c" || e.key === "C") && e.altKey) {
        e.preventDefault();
        setIsCalculatorOpen(prev => !prev);
        return;
      }

      // 2a. Global Action Shortcuts (Ctrl + Key)
      if (e.ctrlKey) {
        // Ctrl + d → focus Discount
        if (e.key === "d" || e.key === "D") {
          e.preventDefault();
          checkoutRef.current?.focusDiscount();
          return;
        }
        // Ctrl + a → focus Adjustment
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          checkoutRef.current?.focusAdjustment();
          return;
        }
        // Ctrl + Enter → jump to Cash Input
        if (e.key === "Enter") {
          e.preventDefault();
          checkoutRef.current?.focusCashIn();
          return;
        }
      }

      if (e.key === "Escape") {
        setIsCalculatorOpen(false);
        setIsSaleListOpen(false);
        setIsHoldListOpen(false);
        setIsStockModalOpen(false);
        editModeRef.current = "search";
        searchRef.current?.focus();
        return;
      }

      // 2b. Single-key shortcuts — only fire when NOT already focused inside an input/textarea/select
      const activeEl = document.activeElement;
      const activeTag = activeEl?.tagName?.toLowerCase();
      const isQtyInput = activeEl?.getAttribute("data-cart-qty") === "true";
      const isTypingInField = (activeTag === "input" || activeTag === "textarea" || activeTag === "select") && !isQtyInput;

      if (!isTypingInField && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Add single-key shortcuts here if needed in the future
      }

      // 3. Cart Navigation (only if not focused on an input elsewhere or specifically in cart mode)
      const cart = cartRef.current;
      if (editModeRef.current === "cart" && cart.length > 0) {
        if (e.key === "ArrowDown") {
          const isAtBottom = selectedIndexRef.current === cart.length - 1;
          if (isAtBottom) {
            e.preventDefault();
            checkoutRef.current?.focusCashIn();
            return;
          }
          e.preventDefault();
          const next = Math.min(cart.length - 1, selectedIndexRef.current + 1);
          selectedIndexRef.current = next;
          cartItemRefs.current.get(cart[next].id)?.focusQty();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = Math.max(0, selectedIndexRef.current - 1);
          selectedIndexRef.current = prev;
          cartItemRefs.current.get(cart[prev].id)?.focusQty();
        }

        // 4. Delete item shortcut
        if (!isTypingInField && e.key === "Delete") {
          const target = cart[selectedIndexRef.current];
          if (target) {
            // Check if we are in an input. If so, only delete if the input is empty or we want to allow row deletion.
            // For now, we follow the user's direct request to bind backspace to deletion when selected.
            e.preventDefault();
            dispatch({ type: "REMOVE_ITEM", payload: target.id });

            // Update selection after deletion
            setTimeout(() => {
              const newCart = cartRef.current;
              if (newCart.length > 0) {
                const nextIdx = Math.min(selectedIndexRef.current, newCart.length - 1);
                selectedIndexRef.current = nextIdx;
                cartItemRefs.current.get(newCart[nextIdx].id)?.focusQty();
              } else {
                editModeRef.current = "search";
                searchRef.current?.focus();
              }
            }, 50);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flattenedVariants, handleAddToCart]); // handleAddToCart is stable but depends on deps

  // ── Stock search debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedStockSearch?.length >= 2) fetchStock(debouncedStockSearch);
    else if (!debouncedStockSearch) clearStockData();
  }, [debouncedStockSearch, fetchStock, clearStockData]);

  // ── Live preview ──────────────────────────────────────────────────────────
  const handleLivePreview = useCallback(({ grandTotal, totalDiscount, subtotal }) => {
    setPrintableSale({
      invoice_number: "PREVIEW",
      created_at: new Date().toISOString(),
      customer_name: state.customer?.name || "Guest Customer",
      items: state.cart.map((item) => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: item.price * item.quantity,
        discount_amount: (item.price * item.quantity) * ((item.discount || 0) / 100),
        product: { name: item.name },
        product_variant: item.variantId ? { name: item.size } : null,
        variant_name: item.size
      })),
      total_amount: subtotal,
      discount_amount: totalDiscount,
      payable_amount: grandTotal,
      paid_amount: 0,
      payment_method: "preview",
      adjustment: 0,
      status: "preview",
    });
    playBeep("scan");
  }, [state.customer, state.cart, playBeep]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile fallback */}
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center lg:hidden">
        <MonitorX className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">{t("pos.optimal_experience")}</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">{t("pos.designed_for")}</p>
      </div>

      {/* Desktop layout */}
      <div className="hidden h-screen flex-col bg-muted/30 font-sans lg:flex">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ── Left: Products (Fixed 35% width) ── */}
          <aside id="pos-terminal" className="w-full lg:w-[35%] flex flex-col h-full border-r border-border/50 bg-card overflow-hidden">
            <header className="p-4 border-b border-border/50 space-y-4">
              {/* Top Nav Row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="outline" className="h-10 px-3" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <button
                    id="pos-theme-toggle"
                    onClick={handleThemeToggle}
                    className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-slate-800 border border-border/50 rounded-xl transition-all duration-500 ease-in-out hover:scale-105 active:scale-95 shadow-none hover:shadow-lg hover:shadow-emerald-500/10 group"
                  >
                    {theme === "dark"
                      ? <Sun className="h-4 w-4 group-hover:rotate-90 transition-transform duration-700 ease-in-out text-amber-500" />
                      : <Moon className="h-4 w-4 group-hover:-rotate-12 transition-transform duration-700 ease-in-out text-indigo-400" />}
                  </button>
                </div>

                {/* Branch selector and Clock utilzie empty space */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                  <div id="pos-clock" className="hidden md:flex flex-col items-end text-right">
                    <p className="text-[11px] font-medium text-foreground leading-tight">
                      {currentDateTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground font-mono leading-none">
                      {currentDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                  </div>

                  {session?.user?.branches?.length > 1 && (
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <Select value={selectedBranch?.id}
                        onValueChange={(id) => setSelectedBranch(session.user.branches.find((b) => b.id === id))}>
                        <SelectTrigger id="pos-branch-selector" className="h-9 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-medium text-slate-900 dark:text-white transition-all shadow-none">
                          <div className="flex items-center gap-2 truncate">
                            <Store className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <SelectValue placeholder={t("pos.select_branch")} />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                          {session.user.branches.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs font-medium">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {posResponse?.data?.requireShift !== false && activeShift && (
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

              {/* Customer selector */}
              <div id="pos-customer-selector" className="pt-1">
                <CustomerSelector
                  customers={customers}
                  distributors={distributors}
                  selectedCustomer={state.customer}
                  selectedDistributor={state.distributor}
                  isWholesale={state.isWholesale}
                  onSelectCustomer={handleSelectCustomer}
                  onSelectDistributor={handleSelectDistributor}
                  onCustomerCreated={addCustomerToList}
                  onDistributorCreated={addDistributorToList}
                  isManufacturing={isManufacturing}
                />
              </div>
            </header>
            <ProductGrid
              ref={searchRef}
              allProducts={allProducts}
              flattenedVariants={flattenedVariants}
              onAddToCart={handleAddToCart}
              isWholesale={state.isWholesale}
            />
          </aside>

          {/* ── Right: Cart + Checkout (65% width) ── */}
          <div className="flex-1 lg:w-[65%] flex flex-col h-full overflow-hidden bg-card">
            {/* Cart Section (Flexible space) */}
            <div className="flex-1 overflow-hidden">
              <CartPanel
                cart={state.cart}
                dispatch={dispatch}
                cartItemRefs={cartItemRefs}
                terminalName={terminalName}
                isWholesale={state.isWholesale}
                wholesaleDiscount={wholesaleDiscount}
                setWholesaleDiscount={setWholesaleDiscount}
                onWholesaleToggle={handleWholesaleToggle}
                enableWholesale={receiptSettings.enableWholesale ?? true}
                isManufacturing={isManufacturing}
                onOpenCalculator={() => setIsCalculatorOpen(true)}
                onToggleFullScreen={toggleFullScreen}
                isFullScreen={isFullScreen}
                onReset={resetSale}
                onEnterPress={() => { searchRef.current?.focus(); searchRef.current?.select(); }}
              />
            </div>

            {/* Checkout Section (Fixed at bottom) */}
            <div id="pos-actions" className="shrink-0 border-t border-border/50 bg-card">
              <CheckoutPanel
                ref={checkoutRef}
                cart={state.cart}
                isWholesale={state.isWholesale}
                handlePayNow={handlePayNow}
                handleHoldSale={handleHoldSale}
                onHoldList={() => { setIsHoldListOpen(true); fetchSales("draft"); }}
                onSaleList={() => { setIsSaleListOpen(true); fetchSales("completed"); }}
                onCheckStock={() => { setIsStockModalOpen(true); clearStockData(); setStockSearch(""); }}
                activeEmployees={activeEmployees}
                defaultEmployeeIds={session?.user?.id ? [session.user.id] : []}
                showReceiptPreview={!!posResponse?.data?.showReceiptPreview}
                onLivePreview={handleLivePreview}
                activePaymentMethods={posResponse?.data?.activePaymentMethods}
                customerId={state.customer?.id}
                selectedCustomer={state.customer}
                distributorId={state.distributor?.id}
                selectedDistributor={state.distributor}
              />
            </div>
          </div>
        </div>

        {/* ── Dialogs ── */}
        <HoldListDialog isOpen={isHoldListOpen} onOpenChange={setIsHoldListOpen}
          salesData={salesData} isLoadingSales={isLoadingSales}
          onResume={resumeSale}
          onDelete={(id) => deleteSale(id).then((ok) => ok && fetchSales("draft"))} />

        <BatchSelectorDialog
          isOpen={isBatchSelectorOpen}
          onOpenChange={setIsBatchSelectorOpen}
          batches={availableBatches}
          onSelect={handleBatchSelect}
          productName={itemPendingBatch?.item?.name}
        />
        <SaleListDialog isOpen={isSaleListOpen} onOpenChange={setIsSaleListOpen}
          salesData={salesData} isLoadingSales={isLoadingSales}
          setPrintableSale={setPrintableSale}
          setSelectedReturnSale={setSelectedReturnSale}
          setIsReturnDialogOpen={setIsReturnDialogOpen} />
        <StockCheckDialog isOpen={isStockModalOpen} onOpenChange={setIsStockModalOpen}
          stockData={stockData} isLoadingStock={isLoadingStock}
          stockSearch={stockSearch} setStockSearch={setStockSearch}
          selectedBranch={selectedBranch} onAddToCart={handleAddToCart} />
        {isCalculatorOpen && <Calculator onClose={() => setIsCalculatorOpen(false)} />}
        <VariantSelectorDialog isOpen={isVariantSelectorOpen} onOpenChange={setIsVariantSelectorOpen}
          product={selectedProductForVariants} onSelect={handleAddToCart} />
        <ReturnDialogWrapper isOpen={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}
          sale={selectedReturnSale} onSuccess={() => fetchSales("completed")} />
        <SaleDetailWrapper isOpen={isDetailOpen} onOpenChange={setIsDetailOpen}
          sale={selectedSaleDetail} onReprint={setPrintableSale} />

        <ShiftManagerDialog
          isOpen={isShiftManagerOpen}
          onClose={() => setIsShiftManagerOpen(false)}
          forceOpen={posResponse?.data?.requireShift !== false && !isShiftLoading && !activeShift}
          activeShift={activeShift}
          openShift={openShift}
          closeShift={closeShift}
          branchId={selectedBranch?.id}
        />

        {/* Off-screen receipt */}
        <div style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}>
          <div className="block print:block">
            {receiptSettings?.invoiceTemplate === 'a4_professional' ? (
              <InvoiceA4Template ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
            ) : (
              <ReceiptTemplate ref={printRef} sale={printableSale} settings={receiptSettings} business={localBusiness} branch={selectedBranch} terminalName={terminalName} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
