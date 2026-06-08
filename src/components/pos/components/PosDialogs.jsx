"use client";

import { memo, useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Archive, List, PackageSearch, Loader2,
  Trash2, RotateCcw, Printer, Search, Plus, Truck,
} from "lucide-react";
import clsx from "clsx";
import { db } from "@/lib/indexedDB/db";
import { useTranslation } from "@/hooks/useTranslation";
import SalesReturnDialog from "../SalesReturnDialog";
import SaleDetailSheet from "../SaleDetailSheet";

// ─── Reusable Sale Item HoverCard ────────────────────────────────────────────
const SaleItemsHoverCard = memo(({ sale, accentClass }) => {
  const { t } = useTranslation();
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex flex-col gap-0.5 cursor-pointer group/items">
          <Badge variant="secondary" className={`w-fit text-[10px] h-5 px-1.5 mb-1 border-none group-hover/items:text-white transition-colors ${accentClass}`}>
            {sale.items?.length || 0} {t("pos.items")}
          </Badge>
        <div className="max-w-[400px]">
          <p className="text-[11px] text-muted-foreground truncate">
            {sale.items?.map((item) => `${item.product?.name} (${parseFloat(item.quantity).toFixed(0)})`).join(", ")}
          </p>
        </div>
      </div>
    </HoverCardTrigger>
    <HoverCardContent className="w-96 p-0 overflow-hidden border-border/50 shadow-2xl animate-in zoom-in-95 duration-200" side="right" align="start">
      <div className="bg-muted/80 backdrop-blur-sm p-4 text-foreground border-b border-border/50">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-sm font-bold opacity-70">{t("pos.sale_items")}</h4>
          <Badge>{sale.items?.length || 0} {t("pos.products")}</Badge>
        </div>
        <p className="text-[10px] opacity-50 font-mono">{sale.invoice_number}</p>
      </div>
      <div className="p-2 bg-card max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="h-8 w-12" />
              <TableHead className="h-8 text-[10px] font-bold text-muted-foreground">{t("pos.product_col")}</TableHead>
              <TableHead className="h-8 text-[10px] font-bold text-muted-foreground text-center">{t("pos.qty_col")}</TableHead>
              <TableHead className="h-8 text-[10px] font-bold text-muted-foreground text-right">{t("pos.price_col")}</TableHead>
              <TableHead className="h-8 text-[10px] font-bold text-muted-foreground text-right">{t("pos.total_col")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items?.map((item, idx) => (
              <TableRow key={idx} className="border-border/30 hover:bg-muted/30 transition-colors group/item">
                <TableCell className="py-2 px-2">
                  <div className="h-10 w-10 rounded-md bg-background overflow-hidden border border-border/50 shrink-0">
                    {item.product?.image ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")}/${JSON.parse(item.product.image)[0]}`}
                        alt={item.product?.name}
                        className="h-full w-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <PackageSearch className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-xs font-medium text-foreground">
                  <div className="flex flex-col">
                    <span>{item.product?.name}</span>
                    {item.variant?.name && <span className="text-[9px] text-muted-foreground">{item.variant.name}</span>}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-xs text-center text-muted-foreground">{parseFloat(item.quantity || 0).toFixed(0)}</TableCell>
                <TableCell className="py-2 text-xs text-right text-muted-foreground">{parseFloat(item.unit_price || item.price || 0).toLocaleString()}</TableCell>
                <TableCell className="py-2 text-xs text-right font-bold text-foreground">
                  {(parseFloat(item.unit_price || item.price || 0) * parseFloat(item.quantity || 0)).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-4 bg-muted/30 border-t border-border/30 flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground">{t("pos.payable_amount_col")}</span>
        <span className="text-lg font-black text-emerald-500">
          LKR {parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>
    </HoverCardContent>
  </HoverCard>
  );
});
SaleItemsHoverCard.displayName = "SaleItemsHoverCard";

// Helper to parse terminal from notes string "[Held Sale] [Terminal: Name]"
const parseTerminal = (notes) => {
  if (!notes) return "N/A";
  const match = notes.match(/\[Terminal: (.*?)\]/);
  return match ? match[1] : "N/A";
};

// ─── Hold List Dialog ────────────────────────────────────────────────────────
export const HoldListDialog = memo(({ isOpen, onOpenChange, salesData, isLoadingSales, onResume, onDelete }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 py-3 flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground leading-none mb-1">
              <Archive className="h-5 w-5 text-emerald-500" /> {t("pos.held_sales_title")}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold opacity-60 leading-none">{t("pos.held_sales_desc")}</DialogDescription>
          </div>
        </DialogHeader>
      <Separator />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingSales ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          </div>
        ) : salesData.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[140px] px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.invoice_no_col")}</TableHead>
                <TableHead className="w-[150px] px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.date_time_col")}</TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.customer_col")}</TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.terminal_col")}</TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.held_by_col")}</TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.items_col")}</TableHead>
                <TableHead className="px-4 py-2 text-right font-bold text-[10px] text-foreground">{t("pos.total_col")}</TableHead>
                <TableHead className="px-4 py-2 text-center font-bold text-[10px] text-foreground">{t("pos.actions_col")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((sale) => (
                <TableRow key={sale.id} className="group hover:bg-emerald-500/5 transition-colors border-border/30">
                  <TableCell className="px-4 py-2 font-mono font-bold text-[11px] text-emerald-500">{sale.invoice_number}</TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground text-[10px]">{new Date(sale.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-[11px] text-foreground">{sale.customer?.name || t("pos.walk_in")}</span>
                      <span className="text-[9px] text-muted-foreground leading-none">{sale.customer?.phone || t("pos.no_phone")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline" className="h-4 px-1 bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold">
                      {parseTerminal(sale.notes)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {sale.cashier?.name || (sale.sellers && sale.sellers[0]?.name) || t("pos.system")}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <SaleItemsHoverCard sale={sale} accentClass="bg-emerald-500/10 text-emerald-500 group-hover/items:bg-emerald-600" />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <span className="font-bold text-[11px] text-foreground">LKR {parseFloat(sale.payable_amount).toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-1.5">
                      <Button size="sm" variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(sale.id)} title={t("pos.delete_draft")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 font-bold px-3 text-[10px]"
                        onClick={() => onResume(sale)}>
                        {t("pos.resume")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Archive className="h-20 w-20 mb-4 opacity-10" />
            <p className="text-xl font-medium">{t("pos.no_held_sales")}</p>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
  );
});
HoldListDialog.displayName = "HoldListDialog";

// ─── Sale List Dialog ────────────────────────────────────────────────────────
export const SaleListDialog = memo(({
  isOpen, onOpenChange, salesData, isLoadingSales,
  setPrintableSale, setSelectedReturnSale, setIsReturnDialogOpen,
  searchSales
}) => {
  const { t } = useTranslation();
  const [filterState, setFilterState] = useState({
    search: "",
    sortKey: "created_at",
    sortDir: "desc",
    date: "all",
    isFilteredByProduct: false
  });
  const [localSales, setLocalSales] = useState([]);
  const [pendingLocalSales, setPendingLocalSales] = useState([]);

  // Fetch real offline pending sales from IndexedDB
  useEffect(() => {
    if (!isOpen) return;
    const fetchPending = async () => {
      try {
        const pending = await db.pendingSales.toArray();
        console.log(`[F7 List] Found ${pending.length} offline sales in DB:`, pending);
        
        // Format them to look like regular sales for the UI
        const formatted = pending.map(s => {
          const data = s.saleData || {};
          return {
            ...data,
            id: `pending-${s.id}`,
            created_at: s.createdAt || new Date().toISOString(),
            invoice_number: s.invoice_no || "LOCAL-PENDING",
            isOffline: true,
            syncStatus: s.status,
            syncError: s.error,
            payment_status: s.status === 'failed' ? "Sync Error" : "Pending Sync",
            // Ensure nested objects exist for the UI to render without crashing
            customer: data.customer_id ? { name: "Customer #" + data.customer_id } : { name: t("pos.walk_in") },
            items: data.items || []
          };
        });
        setPendingLocalSales(formatted);
      } catch (e) {
        console.error("Failed to load offline sales for list", e);
      }
    };
    fetchPending();
  }, [isOpen, t]);

  useEffect(() => {
    if (salesData) setLocalSales(salesData);
  }, [salesData]);

  const filteredAndSortedSales = useMemo(() => {
    let result = [...(pendingLocalSales || []), ...(localSales || [])];

    // Filter by Date
    if (filterState.date !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterday = today - 86400000;
      const sevenDays = today - 86400000 * 7;

      result = result.filter(s => {
        if (s.isOffline) return true;
        const sTime = new Date(s.created_at).getTime();
        if (filterState.date === "today") return sTime >= today;
        if (filterState.date === "yesterday") return sTime >= yesterday && sTime < today;
        if (filterState.date === "7days") return sTime >= sevenDays;
        return true;
      });
    }

    // Filter by Search Text
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      result = result.filter(s => 
        s.invoice_number?.toLowerCase().includes(q) || 
        s.customer?.name?.toLowerCase().includes(q) ||
        s.customer?.phone?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[filterState.sortKey];
      let bVal = b[filterState.sortKey];
      if (filterState.sortKey === "total") {
        aVal = parseFloat(a.payable_amount);
        bVal = parseFloat(b.payable_amount);
      }
      if (aVal < bVal) return filterState.sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return filterState.sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [localSales, pendingLocalSales, filterState]);

  const toggleSort = (key) => {
    setFilterState(prev => ({
      ...prev,
      sortKey: key,
      sortDir: prev.sortKey === key && prev.sortDir === "desc" ? "asc" : "desc"
    }));
  };

  // -- Barcode Scanning logic within the Dialog --
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = async (e) => {
      const now = Date.now();
      const diff = now - lastKeyTime.current;
      lastKeyTime.current = now;

      // Handle Enter (end of scan)
      if (e.key === "Enter") {
        const code = barcodeBuffer.current;
        barcodeBuffer.current = "";

        if (code.startsWith("INV") || code.length >= 10 && code.includes("-")) {
          // It's likely an invoice number
          const sales = await searchSales(code);
          if (sales.length > 0) {
            setSelectedReturnSale(sales[0]);
            setIsReturnDialogOpen(true);
            onOpenChange(false);
          }
        } else if (code.length >= 4) {
          // It's likely a product barcode - search for sales containing this product
          const sales = await searchSales(code);
          if (sales.length > 0) {
            setLocalSales(sales);
            setFilterState(prev => ({ ...prev, isFilteredByProduct: true }));
          } else {
            setLocalSales([]);
            setFilterState(prev => ({ ...prev, isFilteredByProduct: true }));
          }
        }
        return;
      }

      // Buffer fast keystrokes (scanners)
      if (diff < 50 && e.key.length === 1) {
        barcodeBuffer.current += e.key;
      } else {
        barcodeBuffer.current = e.key.length === 1 ? e.key : "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchSales, setSelectedReturnSale, setIsReturnDialogOpen, onOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 py-3 flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground leading-none mb-1">
              <List className="h-5 w-5 text-emerald-600" /> {t("pos.recent_completed_sales_title")}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold opacity-60 leading-none">
              {t("pos.recent_completed_sales_desc")} — Scan receipt barcode to initiate return instantly.
            </DialogDescription>
          </div>
        </DialogHeader>
      <Separator />
      <div className="p-2 px-4 bg-muted/20 border-b border-border/50 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="Search invoice, customer..."
            className="pl-8 h-7 text-[10px] bg-white dark:bg-slate-950 border-border/50 rounded-md"
            value={filterState.search}
            onChange={(e) => setFilterState(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-0.5 bg-background/50 p-0.5 rounded-md border border-border/50">
          {[
            { id: "all", label: "All" },
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7days", label: "7D" },
          ].map((d) => (
            <Button
              key={d.id}
              variant={filterState.date === d.id ? "secondary" : "ghost"}
              size="sm"
              className={clsx("h-5 px-2 text-[8px] font-bold uppercase transition-all", 
                filterState.date === d.id ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground")}
              onClick={() => setFilterState(prev => ({ ...prev, date: d.id }))}
            >
              {d.label}
            </Button>
          ))}
        </div>

        {filterState.isFilteredByProduct && (
          <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold border-emerald-500/50 text-emerald-600"
            onClick={() => { setLocalSales(salesData); setFilterState(prev => ({ ...prev, isFilteredByProduct: false, date: "all", search: "" })); }}>
            <RotateCcw className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingSales ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        ) : filteredAndSortedSales.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[140px] px-4 py-2 font-bold text-[10px] text-foreground cursor-pointer" onClick={() => toggleSort("invoice_number")}>
                  {t("pos.invoice_no_col")} {filterState.sortKey === "invoice_number" && (filterState.sortDir === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="w-[150px] px-4 py-2 font-bold text-[10px] text-foreground cursor-pointer" onClick={() => toggleSort("created_at")}>
                  {t("pos.date_time_col")} {filterState.sortKey === "created_at" && (filterState.sortDir === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground">{t("pos.customer_col")}</TableHead>
                <TableHead className="px-4 py-2 font-bold text-[10px] text-foreground text-center">{t("pos.items_col")}</TableHead>
                <TableHead className="px-4 py-2 text-right font-bold text-[10px] text-foreground cursor-pointer" onClick={() => toggleSort("total")}>
                  {t("pos.total_col")} {filterState.sortKey === "total" && (filterState.sortDir === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="px-4 py-2 text-center font-bold text-[10px] text-foreground">{t("pos.status_col")}</TableHead>
                <TableHead className="px-4 py-2 text-right font-bold text-[10px] text-foreground">{t("pos.actions_col")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSales.map((sale) => (
                <TableRow key={sale.id} className="group hover:bg-emerald-50/30 transition-colors">
                  <TableCell className="px-6 font-mono font-medium text-emerald-600">{sale.invoice_number}</TableCell>
                  <TableCell className="px-6 text-muted-foreground text-xs">{new Date(sale.created_at).toLocaleString()}</TableCell>
                  <TableCell className="px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{sale.customer?.name || t("pos.walk_in")}</span>
                      <span className="text-[10px] text-muted-foreground">{sale.customer?.phone || t("pos.no_phone")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <SaleItemsHoverCard sale={sale} accentClass="bg-emerald-500/10 text-emerald-500 group-hover/items:bg-emerald-600" />
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <span className="font-bold text-foreground">LKR {parseFloat(sale.payable_amount).toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="px-6 text-center">
                    {sale.isOffline ? (
                      <Badge 
                        variant="outline" 
                        className={clsx(
                          "h-5 px-2 border-none text-[10px] font-black animate-pulse cursor-help",
                          sale.syncStatus === 'failed' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                        )}
                        title={sale.syncError ? `Sync Failed: ${sale.syncError}` : "Waiting for internet to sync..."}
                      >
                        {sale.syncStatus === 'failed' ? "ERROR" : "LOCAL"}
                      </Badge>
                    ) : sale.status === 'draft' ? (
                      <Badge variant="outline" className="h-5 px-2 bg-amber-50 text-amber-700 border-amber-100 text-[10px] font-bold">
                        HELD
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-2 bg-green-50 text-green-700 border-green-100 text-[10px] font-bold">
                        {sale.payment_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {sale.isOffline && (
                        <Button size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            if (confirm("Delete this offline sale? It will not be synced to the cloud.")) {
                              await db.pendingSales.delete(parseInt(sale.id.replace('pending-', '')));
                              window.location.reload(); // Refresh to update list
                            }
                          }}
                          title="Delete Offline Sale">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-orange-600 hover:bg-orange-50"
                        onClick={() => { setSelectedReturnSale(sale); setIsReturnDialogOpen(true); }}
                        title={t("pos.sales_return")}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => setPrintableSale(sale)} title={t("pos.reprint_invoice")}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <List className="h-20 w-20 mb-4 opacity-10" />
            <p className="text-xl font-medium">{t("pos.no_completed_sales")}</p>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
  );
});
SaleListDialog.displayName = "SaleListDialog";

export const StockCheckDialog = memo(({
  isOpen, onOpenChange, stockData, isLoadingStock,
  stockSearch, setStockSearch, selectedBranch, onAddToCart,
}) => {
  const { t } = useTranslation();

  const groupedData = useMemo(() => {
    const groups = {};
    stockData.forEach(item => {
      // Use productId if available, otherwise fallback to id (for simple products)
      const pId = item.productId || item.id;
      const baseName = item.name.includes(" - ") ? item.name.split(" - ")[0] : item.name;
      
      if (!groups[pId]) {
        groups[pId] = {
          id: pId,
          name: baseName,
          variants: []
        };
      }
      groups[pId].variants.push(item);
    });
    return Object.values(groups);
  }, [stockData]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <DialogHeader className="p-8 pb-4 bg-linear-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
              <PackageSearch className="h-8 w-8 text-orange-600" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-medium text-foreground uppercase">
                {t("pos.check_stock_title")}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium opacity-60">
                {t("pos.check_stock_desc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-2 border-y border-border/50 bg-muted/10">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-orange-500 transition-all duration-300" />
            <Input
              placeholder={t("pos.search_placeholder")}
              className="pl-10 h-8 text-xs bg-white dark:bg-slate-950 border-border/50 rounded-lg focus:ring-1 focus:ring-orange-500/20 shadow-none"
              autoFocus
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 pt-6">
          {isLoadingStock ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative h-12 w-12">
                <Loader2 className="h-12 w-12 animate-spin text-orange-600 absolute inset-0" />
                <div className="h-12 w-12 animate-ping text-orange-600/20 absolute inset-0 rounded-full" />
              </div>
              <p className="text-xs font-medium text-muted-foreground animate-pulse uppercase">{t("common.loading")}</p>
            </div>
          ) : groupedData.length > 0 ? (
            <div className="space-y-6">
              {groupedData.map((product) => (
                <div key={product.id} className="group/product bg-card rounded-3xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md hover:border-orange-500/20 transition-all duration-500">
                  {/* Product Header */}
                  <div className="px-6 py-4 border-b border-border/40 bg-muted/30 group-hover/product:bg-orange-500/5 transition-colors">
                    <h3 className="text-lg font-medium text-foreground uppercase">{product.name}</h3>
                  </div>
                  
                  {/* Variants List */}
                  <div className="divide-y divide-border/30">
                    {product.variants.map((v) => {
                      const variantLabel = v.name.includes(" - ") ? v.name.split(" - ")[1] : "Standard";
                      const isDefault = variantLabel.toLowerCase() === "default" || variantLabel.toLowerCase() === "standard";
                      
                      return (
                        <div key={v.id} className="py-2.5 px-4 hover:bg-muted/30 transition-all duration-200 group/v">
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
                            {/* Variant Info */}
                            <div className="flex flex-col min-w-[140px] shrink-0">
                              <span className="text-xs font-medium text-foreground uppercase truncate" title={variantLabel}>
                                {isDefault ? "Standard" : variantLabel}
                              </span>
                              <span className="text-[9px] font-medium text-muted-foreground font-mono">
                                {v.barcode}
                              </span>
                            </div>

                            <Separator orientation="vertical" className="h-8 hidden md:block opacity-30" />

                            {/* Stock Levels - Scrollable horizontally if too many */}
                            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                              {v.stocks && v.stocks.length > 0 ? v.stocks.map((s, idx) => {
                                const qty = parseFloat(s.quantity);
                                const isLow = qty <= 5 && qty > 0;
                                const isOut = qty <= 0;
                                return (
                                  <div key={idx} className={clsx(
                                    "flex items-center gap-2 px-2 py-1 rounded-lg border shrink-0 min-w-[80px]",
                                    !isOut && !isLow ? "bg-emerald-500/5 border-emerald-500/20"
                                      : isLow ? "bg-amber-500/5 border-amber-500/20"
                                        : "bg-rose-500/5 border-rose-500/20 opacity-60"
                                  )}>
                                    <span className="text-[8px] font-medium uppercase opacity-60 truncate max-w-[50px]" title={s.branch}>
                                      {s.branch}
                                    </span>
                                    <span className={clsx(
                                      "text-[11px] font-medium font-mono",
                                      !isOut && !isLow ? "text-emerald-600"
                                        : isLow ? "text-amber-600"
                                          : "text-rose-600"
                                    )}>
                                      {(qty || 0).toFixed(0)}
                                    </span>
                                  </div>
                                );
                              }) : (
                                <span className="text-[10px] italic text-muted-foreground/40">{t("pos.no_stock")}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0 ml-auto">
                              <span className="text-[11px] font-medium text-emerald-600 font-mono hidden sm:block">
                                LKR {(v.retailPrice || 0).toFixed(2)}
                              </span>
                              <Button 
                                onClick={() => { onAddToCart(v); onOpenChange(false); }}
                                size="sm"
                                className="h-8 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-medium text-[10px] shadow-sm active:scale-95 transition-all"
                              >
                                <Plus className="h-3 w-3 mr-1" /> {t("pos.add")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : stockSearch.length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/30 mt-2">
              <p className="text-[10px] font-medium uppercase opacity-40">{t("pos.no_results_for")} &ldquo;{stockSearch}&rdquo;</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <PackageSearch className="h-16 w-16 opacity-5 mb-4" />
              <p className="text-xs font-medium text-foreground uppercase mb-1">{t("pos.search_availability_title")}</p>
              <p className="text-[10px] font-medium opacity-50 max-w-[200px] text-center leading-relaxed">
                {t("pos.search_availability_desc")}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
StockCheckDialog.displayName = "StockCheckDialog";



// ─── Return + SaleDetail + VariantSelector (thin wrappers) ───────────────────
export const ReturnDialogWrapper = memo(({ isOpen, onOpenChange, sale, onSuccess }) => {
  if (!sale) return null;
  return <SalesReturnDialog open={isOpen} onOpenChange={onOpenChange} sale={sale} onSuccess={onSuccess} />;
});
ReturnDialogWrapper.displayName = "ReturnDialogWrapper";

export const SaleDetailWrapper = memo(({ isOpen, onOpenChange, sale, onReprint }) => (
  <SaleDetailSheet isOpen={isOpen} onOpenChange={onOpenChange} sale={sale} onReprint={onReprint} />
));
SaleDetailWrapper.displayName = "SaleDetailWrapper";

// ─── VariantSelectorDialog ────────────────────────────────────────────────────
export const VariantSelectorDialog = memo(({ isOpen, onOpenChange, product, onSelect }) => {
  const { t } = useTranslation();
  if (!product) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center overflow-hidden border border-emerald-500/20">
              {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" /> : <PackageSearch className="h-6 w-6 text-emerald-500" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-medium">{product.name}</DialogTitle>
              <DialogDescription className="text-[10px] mt-0.5">{t("pos.select_variant")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="bg-border/50" />
        <ScrollArea className="max-h-[50vh]">
          <div className="p-4 space-y-2">
            {product.variants?.map((v) => (
              <div key={v.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                onClick={() => {
                  onSelect({
                    variantId: v.id, productId: v.productId, barcode: v.barcode,
                    name: v.fullName, size: v.variantName, unit: v.unit,
                    retailPrice: v.retailPrice, mrpPrice: v.mrpPrice, wholesalePrice: v.wholesalePrice,
                    batches: v.batches
                  });
                  onOpenChange(false);
                }}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{v.variantName}</span>
                  <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{v.barcode || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="flex flex-col">
                    <p className="text-base font-black text-emerald-600">LKR {v.retailPrice.toFixed(2)}</p>
                    {v.mrpPrice > v.retailPrice && (
                      <p className="text-[9px] text-muted-foreground line-through decoration-red-500/50">MRP: {v.mrpPrice.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Plus className="h-4 w-4 text-emerald-600" />
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
});
VariantSelectorDialog.displayName = "VariantSelectorDialog";
import { CustomerSelector } from "./CustomerSelector";

// ─── Payment Dialog ────────────────────────────────────────────────────────
export const PaymentDialog = memo(({ 
  isOpen, 
  onOpenChange, 
  netTotal, 
  onConfirm, 
  paymentMethods = ["cash", "card", "online", "qr"],
  allCustomers = [],
  selectedCustomer = null,
  onSelectCustomer,
  enableMultiplePayments = false,
}) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([{ id: 1, method: "cash", amount: "" }]);

  const totalReceived = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const balance = useMemo(() => {
    return totalReceived > netTotal ? totalReceived - netTotal : 0;
  }, [totalReceived, netTotal]);

  const remaining = useMemo(() => {
    return netTotal > totalReceived ? netTotal - totalReceived : 0;
  }, [totalReceived, netTotal]);

  useEffect(() => {
    if (isOpen) {
      setPayments([{ id: Date.now(), method: "cash", amount: "" }]);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const validPayments = payments
      .map(p => ({ method: p.method, received: parseFloat(p.amount) || 0 }))
      .filter(p => p.received > 0);
    
    if (validPayments.length === 0) {
      validPayments.push({ method: payments[0].method, received: netTotal });
    }

    onConfirm({
      payments: validPayments,
      received: totalReceived || netTotal, // Keep for backward compatibility if needed by parent
      balance
    });
  };

  const addPaymentMethod = () => {
    if (remaining > 0) {
      setPayments(prev => [
        ...prev, 
        { id: Date.now(), method: paymentMethods.find(m => !prev.some(p => p.method === m)) || paymentMethods[0], amount: remaining.toString() }
      ]);
    }
  };

  const updatePayment = (id, field, value) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePayment = (id) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-card">
        <div className="bg-violet-600 px-6 py-6 flex flex-col gap-1 relative">
          <DialogTitle className="text-white font-bold uppercase text-[12px] opacity-90">Finalize Sale</DialogTitle>
          <DialogDescription className="sr-only">Choose a payment method and confirm the amount received.</DialogDescription>
          <div className="flex items-baseline justify-between">
            <span className="text-white font-black text-3xl">
              LKR {netTotal.toFixed(2)}
            </span>
            <span className="text-white font-bold uppercase text-[11px] opacity-90">Payable Total</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-tight text-slate-500 ml-1">
                Select Customer (Default: Walk-in)
              </label>
              <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/5 h-10 flex items-center">
                <CustomerSelector 
                  customers={allCustomers} 
                  selectedCustomer={selectedCustomer} 
                  onSelect={onSelectCustomer}
                  isCompact={true}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {payments.map((p, index) => (
              <div key={p.id} className={clsx("grid gap-3 items-end", payments.length > 1 ? "grid-cols-[1fr_1.5fr_auto]" : "grid-cols-[1fr_1.5fr]")}>
                <div className="space-y-2">
                  {index === 0 && <label className="text-[11px] font-black uppercase tracking-tight text-slate-500 ml-1">Payment Method</label>}
                  <select
                    value={p.method}
                    onChange={(e) => updatePayment(p.id, "method", e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-border/40 bg-muted/20 text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-1 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem'
                    }}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m} className="bg-card text-foreground uppercase">{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 relative">
                  {index === 0 && <label className="text-[11px] font-black uppercase tracking-tight text-slate-500 ml-1">Amount Received</label>}
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={p.amount}
                      onChange={(e) => updatePayment(p.id, "amount", e.target.value)}
                      autoFocus={index === 0}
                      className="h-12 text-xl font-bold bg-muted/20 border-border/40 rounded-xl focus:ring-1 focus:ring-violet-500/20"
                      onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                    />
                    {index === 0 && payments.length === 1 && (
                      <Button 
                        variant="ghost" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-[10px] font-bold text-violet-600 hover:bg-violet-500/5"
                        onClick={() => updatePayment(p.id, "amount", netTotal.toString())}
                      >
                        EXACT
                      </Button>
                    )}
                  </div>
                </div>

                {payments.length > 1 && (
                  <Button 
                    variant="ghost" 
                    className="h-12 w-12 p-0 text-rose-500 hover:bg-rose-50 rounded-xl mb-[1px]"
                    onClick={() => removePayment(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {enableMultiplePayments && remaining > 0 && (
              <Button 
                variant="outline" 
                className="w-full h-10 border-dashed border-border/60 text-xs font-bold text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 mt-2"
                onClick={addPaymentMethod}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Payment Method (Remaining: {remaining.toFixed(2)})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-muted/10 p-4 rounded-xl border border-border/30">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Balance</p>
              <p className={clsx(
                "text-xl font-black",
                balance > 0 ? "text-emerald-600" : "text-muted-foreground/20"
              )}>
                {balance.toFixed(2)}
              </p>
            </div>
            <div className="bg-muted/10 p-4 rounded-xl border border-border/30">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Remaining</p>
              <p className={clsx(
                "text-xl font-black",
                remaining > 0 ? "text-rose-500" : "text-muted-foreground/20"
              )}>
                {remaining.toFixed(2)}
              </p>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/10 transition-all active:scale-[0.98] uppercase"
            onClick={handleConfirm}
          >
            Confirm & Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
PaymentDialog.displayName = "PaymentDialog";
