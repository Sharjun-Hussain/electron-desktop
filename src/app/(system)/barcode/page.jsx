"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
  Printer,
  Settings,
  Search,
  Barcode as BarcodeIcon,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize,
  ScrollText,
  Sheet,
  XCircle,
  ScanLine,
  Ruler,
  ChevronRight,
  ChevronDown,
  Settings2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCurrency } from "@/hooks/useCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useSettingsStore } from "@/store/useSettingsStore";
import { BarcodeSticker } from "@/components/barcode/barcode-sticker";

// --- COMPONENT: HIDDEN PRINT SHEET ---
const PrintableSheet = ({ itemsToPrint, settings, refInstance }) => {
    return (
        <div style={{ display: "none" }}>
            <div ref={refInstance}>
                <style type="text/css" media="print">
                    {` @page { size: auto; margin: 0mm; } body { margin: 0; padding: 0; } `}
                </style>
                <div 
                    className="w-full"
                    style={{ 
                        paddingTop: settings.paperType === 'roll' ? '0' : `${settings.marginTop}mm`, 
                        paddingLeft: settings.paperType === 'roll' ? '0' : `${settings.marginLeft}mm`,
                        display: 'grid',
                        justifyContent: settings.paperType === 'roll' ? 'center' : 'start',
                        gridTemplateColumns: (settings.perRow === 'auto' 
                            ? `repeat(auto-fill, ${settings.labelWidth}mm)` 
                            : `repeat(${settings.perRow}, ${settings.labelWidth}mm)`),
                        columnGap: `${settings.gapX}mm`,
                        rowGap: `${settings.gapY}mm`,
                    }}
                >
                    {itemsToPrint.map((item, idx) => {
                        const columns = settings.perRow === 'auto' ? 1 : parseInt(settings.perRow);
                        const isLastInRow = (idx + 1) % columns === 0;
                        return (
                            <div key={idx} style={{ breakAfter: (settings.paperType === 'roll' && isLastInRow) ? 'page' : 'auto' }}>
                                <BarcodeSticker product={item} settings={settings} scale={1} showRulers={false} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

export default function BarcodePrintingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Column Toggle State
  const [tableColumns, setTableColumns] = useState({
      sku: true,
      price: true,
      sellerName: false,
      sellerSku: false,
      mrpPrice: false
  });

  // Initialize columns from localStorage
  useEffect(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('barcodeTableColumns');
          if (saved) setTableColumns(JSON.parse(saved));
      }
  }, []);

  const toggleColumn = (key) => {
      setTableColumns(prev => {
          const next = { ...prev, [key]: !prev[key] };
          localStorage.setItem('barcodeTableColumns', JSON.stringify(next));
          return next;
      });
  };
  const [zoomLevel, setZoomLevel] = useState([1]);

  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  // Print Configuration
  const [settings, setSettings] = useState({
    paperType: "roll",
    labelWidth: 50,
    labelHeight: 30,
    perRow: 1, // Default to 1 column
    marginTop: 10, marginLeft: 10, gapX: 2, gapY: 2,
    customQty: 1,
    barcodeFormat: "CODE128",
    // New Barcode Styling Props
    barThickness: 1.5,
    barHeight: 30,
    barFontSize: 12,
    showFields: {
      name: true, variant: true, sku: true, barcode: true, barcodeImage: true, price: true, customText: false,
    },
    customTextContent: "",
    layoutMode: "classic",
  });

  const { data: session } = useSession();
  const { formatCurrency } = useCurrency();
  const { useModularSettings } = useSettings();
  const { setGlobalSettings, setBusinessSettings } = useSettingsStore();

  const { data: globalSettingsResponse } = useModularSettings("global");

  useEffect(() => {
    if (globalSettingsResponse?.data) {
      const { business, modules } = globalSettingsResponse.data;
      if (business) {
        setBusinessSettings(business);
        // Explicitly sync business currency to global store if business has it
        if (business.currency) {
          setGlobalSettings({ currency: business.currency });
        }
      }
      // Modules contains category keys like 'global', 'receipt', 'pos'
      if (modules?.global) {
        setGlobalSettings(modules.global);
      }
    }
  }, [globalSettingsResponse, setGlobalSettings, setBusinessSettings]);

  const fetchData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=2000`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();

      if (response.ok) {
          const arr = result.data.data || [];
          const precomputed = arr.map(p => ({
              ...p,
              searchText: `${p.name || ""} ${p.sku || ""} ${p.barcode || ""} ${p.variants?.map(v => `${v.name || ""} ${v.sku || ""} ${v.barcode || ""}`).join(" ") || ""}`.toLowerCase()
          }));
          setProducts(precomputed);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Network error fetching barcode data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  // Flatten logic for printing and filtered views
  const allVariants = useMemo(() => {
    const list = [];
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          let variantLabel = v.name;
          if (!variantLabel && v.attribute_values) {
              variantLabel = v.attribute_values.map(av => av.value).join(" / ");
          }
          list.push({
            id: v.id,
            productId: p.id,
            name: p.name,
            variant: variantLabel || "Default",
            sku: v.sku || p.sku,
            barcode: v.barcode || p.barcode,
            stock: v.stock_quantity || 0,
            price: v.price || p.price || 0,
            mrp_price: v.mrp_price || p.mrp_price || 0,
            supplier: p.supplier,
            supplier_code: p.supplier?.code || p.supplier_code
          });
        });
      } else {
        // Simple product
        list.push({
          id: `p-${p.id}`, // Pseudo-ID for simple product variant
          productId: p.id,
          name: p.name,
          variant: "Standard",
          sku: p.sku,
          barcode: p.barcode,
          stock: 0,
          price: p.price || 0,
          mrp_price: p.mrp_price || 0,
          supplier: p.supplier,
          supplier_code: p.supplier?.code || p.supplier_code
        });
      }
    });
    return list;
  }, [products]);

  const itemsToPrint = useMemo(() => {
    let list = [];
    selectedVariants.forEach(id => {
        const variant = allVariants.find(v => v.id === id);
        if(!variant) return;
        const count = parseInt(settings.customQty) || 1;
        list = [...list, ...Array(count).fill(variant)];
    });
    return list;
  }, [selectedVariants, allVariants, settings.customQty]);

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Barcodes_Export`,
  });

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  
  const toggleField = (field) => {
    setSettings(prev => ({ ...prev, showFields: { ...prev.showFields, [field]: !prev.showFields[field] } }));
  };

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products;
    const term = debouncedSearchTerm.toLowerCase();
    return products.filter(p => {
        return (p.searchText || "").includes(term);
    });
  }, [products, debouncedSearchTerm]);

  const toggleVariantSelection = (id) => {
    setSelectedVariants(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const toggleProductSelection = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variantIds = product.variants && product.variants.length > 0 
        ? product.variants.map(v => v.id)
        : [`p-${product.id}`];
    
    const allSelected = variantIds.every(id => selectedVariants.includes(id));
    
    if (allSelected) {
        setSelectedVariants(prev => prev.filter(id => !variantIds.includes(id)));
    } else {
        setSelectedVariants(prev => [...new Set([...prev, ...variantIds])]);
    }
  };

  const toggleAll = () => {
    const allVisibleVariantIds = [];
    filteredProducts.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => allVisibleVariantIds.push(v.id));
        } else {
            allVisibleVariantIds.push(`p-${p.id}`);
        }
    });

    const allSelected = allVisibleVariantIds.every(id => selectedVariants.includes(id));
    if (allSelected) {
        setSelectedVariants(prev => prev.filter(id => !allVisibleVariantIds.includes(id)));
    } else {
        setSelectedVariants(prev => [...new Set([...prev, ...allVisibleVariantIds])]);
    }
  };

  const toggleExpand = (id) => {
      setExpandedProducts(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  return (
    <div className="flex flex-1 w-full bg-background font-sans relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background border-r border-border/40" />
      
      <PrintableSheet itemsToPrint={itemsToPrint} settings={settings} refInstance={componentRef} />

      {/* --- LEFT: MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-[600px]">
        <header className="px-8 py-6 z-10 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 group">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm transition-transform duration-300">
                        <BarcodeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-foreground">Barcode Center</h1>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Attribute & Stock Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden xl:block">
                        <p className="text-sm font-bold text-foreground">{itemsToPrint.length} Labels</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Total to print</p>
                    </div>
                    <Separator orientation="vertical" className="h-8 hidden xl:block border-border/40" />
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 px-4 gap-2 rounded-md bg-background border-border/60 hover:bg-muted/50 font-semibold text-sm shadow-sm transition-all active:scale-95">
                                <Settings2 className="h-4 w-4" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={tableColumns.sku} onCheckedChange={() => toggleColumn("sku")}>SKU</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={tableColumns.price} onCheckedChange={() => toggleColumn("price")}>Selling Price</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={tableColumns.mrpPrice} onCheckedChange={() => toggleColumn("mrpPrice")}>MRP Price</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={tableColumns.sellerName} onCheckedChange={() => toggleColumn("sellerName")}>Seller Name</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={tableColumns.sellerSku} onCheckedChange={() => toggleColumn("sellerSku")}>Seller SKU</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                      onClick={handlePrint} 
                      disabled={itemsToPrint.length === 0} 
                      className="h-10 px-8 gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all active:scale-95"
                    >
                        <Printer className="h-4 w-4" /> Print Labels
                    </Button>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-20">
                {/* Unified Search */}

                {/* Filters & Table (Same as previous) */}
                <div className="flex gap-4 items-center px-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input 
                            placeholder="Search products or variants (Name, SKU, Barcode)..." 
                            className="pl-10 bg-background border-border/60 h-11 rounded-xl focus:ring-emerald-500/20 font-semibold text-sm shadow-sm transition-all"
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="border border-border/60 shadow-sm rounded-xl overflow-hidden bg-card flex flex-col min-h-[400px]">
                    <div className="bg-muted/30 px-6 py-3 flex justify-between items-center border-b border-border/40">
                        <div className="flex items-center gap-3">
                            <Checkbox 
                                id="select-all"
                                checked={filteredProducts.length > 0 && filteredProducts.every(p => {
                                    const variantIds = p.variants?.length > 0 ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    return variantIds.every(id => selectedVariants.includes(id));
                                }) ? true : (filteredProducts.some(p => {
                                    const variantIds = p.variants?.length > 0 ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    return variantIds.some(id => selectedVariants.includes(id));
                                }) ? "indeterminate" : false)} 
                                onCheckedChange={toggleAll} 
                            />
                            <Label htmlFor="select-all" className="text-[10px] font-bold text-muted-foreground cursor-pointer">Select All Visible</Label>
                        </div>
                        <Badge variant="secondary" className="bg-muted border border-border/60 text-foreground font-bold px-3 py-1 rounded-md shadow-none">{selectedVariants.length} selected</Badge>
                    </div>
                    <div className="overflow-auto max-h-[500px] scrollbar-thin">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-[11px] text-muted-foreground font-bold bg-muted/30 sticky top-0 z-10 border-b border-border/40">
                                <tr>
                                    <th className="px-6 py-4 w-10"></th>
                                    <th className="px-2 py-4 w-8"></th>
                                    <th className="px-6 py-4">Product / Variant</th>
                                    <th className="px-6 py-4">Barcode</th>
                                    {tableColumns.sku && <th className="px-6 py-4">SKU</th>}
                                    <th className="px-6 py-4 text-right">Stock</th>
                                    {tableColumns.price && <th className="px-6 py-4 text-right">Selling Price</th>}
                                    {tableColumns.mrpPrice && <th className="px-6 py-4 text-right">MRP Price</th>}
                                    {tableColumns.sellerName && <th className="px-6 py-4">Seller Name</th>}
                                    {tableColumns.sellerSku && <th className="px-6 py-4">Seller SKU</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {filteredProducts.map((p) => {
                                    const hasVariants = p.variants && p.variants.length > 1;
                                    const variantIds = p.variants && p.variants.length > 0 ? p.variants.map(v => v.id) : [`p-${p.id}`];
                                    const isExpanded = expandedProducts.has(p.id);
                                    const isAllSelected = variantIds.every(id => selectedVariants.includes(id));
                                    const isSomeSelected = variantIds.some(id => selectedVariants.includes(id));
                                    const defaultVariant = p.variants?.[0] || {};
                                    const displayPrice = defaultVariant.price || p.price || 0;
                                    const displayMrp = defaultVariant.mrp_price || p.mrp_price || 0;
                                    const displaySku = defaultVariant.sku || p.sku;
                                    const displayBarcode = defaultVariant.barcode || p.barcode;
                                    const displayStock = defaultVariant.stock_quantity || p.stock || 0;

                                    return (
                                        <>
                                            {/* Product Row */}
                                            <tr key={p.id} className={`group transition-colors ${isAllSelected ? "bg-emerald-500/5" : "hover:bg-muted/50"}`} onClick={() => toggleProductSelection(p.id)}>
                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox 
                                                        checked={isAllSelected ? true : (isSomeSelected ? "indeterminate" : false)}
                                                        onCheckedChange={() => toggleProductSelection(p.id)} 
                                                    />
                                                </td>
                                                <td className="px-2 py-4" onClick={(e) => { e.stopPropagation(); if(hasVariants) toggleExpand(p.id); }}>
                                                    {hasVariants && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/40 hover:text-emerald-600 transition-colors">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{p.name}</span>
                                                        {!hasVariants && <span className="text-[10px] text-muted-foreground font-bold mt-0.5">Simple Product</span>}
                                                        {hasVariants && <span className="text-[10px] text-emerald-600 font-bold mt-0.5">{p.variants.length} Variants</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground font-bold">
                                                    {!hasVariants ? (displayBarcode) : "---"}
                                                </td>
                                                {tableColumns.sku && (
                                                    <td className="px-6 py-4 text-[11px] text-muted-foreground font-bold">
                                                        {!hasVariants ? (displaySku) : "---"}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right">
                                                    {!hasVariants ? (
                                                        <Badge variant="outline" className="bg-muted/50 border-border/60 text-foreground font-bold rounded-md px-2 py-0.5">{displayStock}</Badge>
                                                    ) : "---"}
                                                </td>
                                                {tableColumns.price && (
                                                    <td className="px-6 py-4 text-right font-bold text-foreground tabular-nums">
                                                        {!hasVariants ? formatCurrency(displayPrice) : "---"}
                                                    </td>
                                                )}
                                                {tableColumns.mrpPrice && (
                                                    <td className="px-6 py-4 text-right font-bold text-foreground tabular-nums">
                                                        {!hasVariants ? formatCurrency(displayMrp) : "---"}
                                                    </td>
                                                )}
                                                {tableColumns.sellerName && (
                                                    <td className="px-6 py-4 text-[11px] text-muted-foreground font-bold">
                                                        {!hasVariants ? (p.supplier?.name || "N/A") : "---"}
                                                    </td>
                                                )}
                                                {tableColumns.sellerSku && (
                                                    <td className="px-6 py-4 text-[11px] text-muted-foreground font-bold">
                                                        {!hasVariants ? (p.supplier_code || "N/A") : "---"}
                                                    </td>
                                                )}
                                            </tr>

                                            {/* Variant Rows */}
                                            {hasVariants && isExpanded && p.variants.map(v => {
                                                const vId = v.id;
                                                const isVSelected = selectedVariants.includes(vId);
                                                let variantLabel = v.name;
                                                if (!variantLabel && v.attribute_values) {
                                                    variantLabel = v.attribute_values.map(av => av.value).join(" / ");
                                                }
                                                return (
                                                    <tr key={vId} className={`group transition-colors ${isVSelected ? "bg-emerald-500/5" : "bg-muted/10 hover:bg-muted/30"}`} onClick={(e) => { e.stopPropagation(); toggleVariantSelection(vId); }}>
                                                        <td className="px-6 py-3 border-l-2 border-emerald-500/30"></td>
                                                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox checked={isVSelected} onCheckedChange={() => toggleVariantSelection(vId)} />
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-foreground font-bold text-[13px]">{variantLabel || "Default"}</span>
                                                                {v.sku && <Badge variant="secondary" className="text-[10px] px-2 py-0 h-4 bg-muted border border-border/40 text-muted-foreground font-bold rounded-sm">{v.sku}</Badge>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-[11px] text-muted-foreground font-bold">{v.barcode || p.barcode}</td>
                                                        {tableColumns.sku && <td className="px-6 py-3 text-[11px] text-muted-foreground font-bold">{v.sku || p.sku}</td>}
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="text-xs text-muted-foreground font-bold">{v.stock_quantity || 0}</span>
                                                        </td>
                                                        {tableColumns.price && (
                                                            <td className="px-6 py-3 text-right font-bold text-foreground tabular-nums">
                                                                {formatCurrency(v.price || p.price || 0)}
                                                            </td>
                                                        )}
                                                        {tableColumns.mrpPrice && (
                                                            <td className="px-6 py-3 text-right font-bold text-foreground tabular-nums">
                                                                {formatCurrency(v.mrp_price || p.mrp_price || 0)}
                                                            </td>
                                                        )}
                                                        {tableColumns.sellerName && (
                                                            <td className="px-6 py-3 text-[11px] text-muted-foreground font-bold">
                                                                {p.supplier?.name || "N/A"}
                                                            </td>
                                                        )}
                                                        {tableColumns.sellerSku && (
                                                            <td className="px-6 py-3 text-[11px] text-muted-foreground font-bold">
                                                                {p.supplier_code || "N/A"}
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* LIVE PREVIEW WITH RULERS */}
                <Card className="h-[400px] border border-border/60 shadow-sm rounded-xl overflow-hidden bg-card flex flex-col shrink-0 mb-6 font-bold uppercase tracking-tight">
                    <div className="px-6 py-4 border-b border-border/40 bg-muted/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-foreground lowercase">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-3 bg-muted border border-border/40 px-3 py-1.5 rounded-md shadow-inner">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600 transition-colors" onClick={() => setZoomLevel([Math.max(0.5, zoomLevel[0] - 0.1)])}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Slider value={zoomLevel} onValueChange={setZoomLevel} min={0.5} max={2.0} step={0.1} className="w-40" />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600 transition-colors" onClick={() => setZoomLevel([Math.min(2.0, zoomLevel[0] + 0.1)])}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-muted/10 overflow-auto p-12 flex justify-center relative scrollbar-thin">
                        {/* Paper Visual */}
                        <div 
                            className="bg-white shadow-md transition-all origin-top box-content border border-border/20"
                            style={{ 
                                width: settings.paperType === 'roll' 
                                    ? (settings.perRow === 'auto' ? '100%' : `${(settings.labelWidth * (parseInt(settings.perRow) || 1)) + (settings.gapX * ((parseInt(settings.perRow) || 1) - 1)) + 20}mm`) 
                                    : '210mm', 
                                minHeight: settings.paperType === 'roll' ? 'auto' : '297mm', 
                                padding: settings.paperType === 'roll' ? '10mm' : '10mm',
                                transform: `scale(${zoomLevel[0]})`,
                                display: 'grid',
                                justifyContent: 'center',
                                alignContent: 'start',
                                gridTemplateColumns: (settings.perRow === 'auto' ? `repeat(auto-fill, ${settings.labelWidth}mm)` : `repeat(${settings.perRow}, ${settings.labelWidth}mm)`),
                                columnGap: `${settings.gapX}mm`, rowGap: `${settings.gapY}mm`,
                            }}
                        >
                            {itemsToPrint.length > 0 ? itemsToPrint.map((item, i) => (
                                <div key={i} className="relative group hover:z-10">
                                    <BarcodeSticker product={item} settings={settings} scale={1} showRulers={true} />
                                </div>
                            )) : (
                                <div className="col-span-full h-96 flex flex-col items-center justify-center text-muted-foreground/20">
                                    <ScanLine className="size-16 mb-4 opacity-10" />
                                    <p className="text-xs font-bold italic opacity-50">Preview Area</p>
                                    <p className="text-[10px] font-bold mt-2">Select items to visualize barcodes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>

      {/* --- RIGHT: SETTINGS --- */}
      <div className="w-[360px] rounded-l-xl bg-card h-full flex flex-col shadow-sm border-l border-border/40 z-20">
        <div className="p-6 border-b border-border/40 shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <Settings className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[14px] font-bold">Configuration</span>
          </h2>
        </div>

        <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-6 space-y-8">
                {/* Paper Settings */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Paper Settings</Label>
                    <Tabs value={settings.paperType} onValueChange={(v) => updateSetting('paperType', v)} className="w-full">
                        <TabsList className="w-full flex justify-start gap-8 px-1 h-auto bg-transparent rounded-none mb-2">
                            <TabsTrigger value="roll" className="text-xs font-bold px-0 pb-3 h-auto bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-none transition-all"><ScrollText className="h-4 w-4 mr-2" /> Label Roll</TabsTrigger>
                            <TabsTrigger value="a4" className="text-xs font-bold px-0 pb-3 h-auto bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-none transition-all"><Sheet className="h-4 w-4 mr-2" /> A4 Sheet</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Label Dimensions */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <Label className="text-xs font-bold text-foreground">Label Size</Label>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md">{settings.labelWidth}x{settings.labelHeight}mm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[ 
                            { w: 40, h: 20 }, 
                            { w: 50, h: 30 }, 
                            { w: 38, h: 25 }, 
                            { w: 50, h: 25 },
                            { w: 60, h: 40 }, 
                            { w: 100, h: 50 } 
                        ].map((size, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => { setSettings(p => ({...p, labelWidth: size.w, labelHeight: size.h})) }} 
                              className={`group border rounded-xl p-3 text-xs flex flex-col items-center justify-center gap-1.5 transition-all h-16 relative overflow-hidden ${settings.labelWidth === size.w && settings.labelHeight === size.h ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 ring-1 ring-emerald-500 shadow-sm" : "border-border/60 hover:border-emerald-500/40 text-muted-foreground bg-muted/20"}`}
                            >
                                <Maximize className={`h-3 w-3 transition-colors ${settings.labelWidth === size.w && settings.labelHeight === size.h ? "text-emerald-500" : "opacity-30 group-hover:text-emerald-500"}`} />
                                <span className="font-semibold">{size.w} x {size.h}</span>
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="relative space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Width (mm)</Label><Input type="number" value={settings.labelWidth} onChange={(e) => updateSetting('labelWidth', Number(e.target.value))} className="h-9 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                        <div className="relative space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Height (mm)</Label><Input type="number" value={settings.labelHeight} onChange={(e) => updateSetting('labelHeight', Number(e.target.value))} className="h-9 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                    </div>
                </div>

                <Separator />

                {/* ADVANCED BARCODE STYLING (NEW) */}
                <Accordion type="multiple" defaultValue={["styling", "layout"]} className="w-full">
                    <AccordionItem value="styling" className="border-b-0 space-y-2">
                        <AccordionTrigger className="py-2 text-[10px] font-bold text-muted-foreground hover:no-underline group">
                            <span className="flex items-center gap-2.5"><ScanLine className="h-3.5 w-3.5 text-emerald-600/80"/> Barcode Styling</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-5 px-1">
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs font-bold text-foreground">Bar Thickness</Label><span className="text-[10px] font-bold bg-muted border border-border px-2 py-0.5 rounded-md">{settings.barThickness}</span></div>
                                <Slider value={[settings.barThickness]} onValueChange={(v) => updateSetting('barThickness', v[0])} min={1} max={4} step={0.5} className="py-1" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs font-bold text-foreground">Bar Height</Label><span className="text-[10px] font-bold bg-muted border border-border px-2 py-0.5 rounded-md">{settings.barHeight}px</span></div>
                                <Slider value={[settings.barHeight]} onValueChange={(v) => updateSetting('barHeight', v[0])} min={10} max={100} step={5} className="py-1" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between"><Label className="text-xs font-bold text-foreground">Font Size</Label><span className="text-[10px] font-bold bg-muted border border-border px-2 py-0.5 rounded-md">{settings.barFontSize}px</span></div>
                                <Slider value={[settings.barFontSize]} onValueChange={(v) => updateSetting('barFontSize', v[0])} min={8} max={24} step={1} className="py-1" />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <Separator className="my-2 opacity-50" />

                    {/* LAYOUT & SPACING */}
                    <AccordionItem value="layout" className="border-b-0 space-y-2">
                        <AccordionTrigger className="py-2 text-[10px] font-bold text-muted-foreground hover:no-underline group">
                            <span className="flex items-center gap-2.5"><Ruler className="h-3.5 w-3.5 text-emerald-600/80"/> Layout & Spacing</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-5 px-1">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-foreground ml-1">Barcodes per Row</Label>
                                <div className="flex bg-muted p-1 rounded-md border border-border/40">
                                    {[1, 2, 3, 'auto'].map(val => (
                                        <button key={val} onClick={() => updateSetting('perRow', val)} className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${settings.perRow === val ? 'bg-background shadow-sm text-emerald-600 ring-1 ring-border/20' : 'text-muted-foreground hover:text-foreground'}`}>
                                            {val === 'auto' ? 'Auto' : `${val} Col`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Top Margin (mm)</Label><Input type="number" value={settings.marginTop} onChange={(e) => updateSetting('marginTop', Number(e.target.value))} className="h-8 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Left Margin (mm)</Label><Input type="number" value={settings.marginLeft} onChange={(e) => updateSetting('marginLeft', Number(e.target.value))} className="h-8 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Horiz. Gap (mm)</Label><Input type="number" value={settings.gapX} onChange={(e) => updateSetting('gapX', Number(e.target.value))} className="h-8 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                                <div className="space-y-1.5"><Label className="text-[10px] text-muted-foreground/60 font-bold uppercase ml-1">Vert. Gap (mm)</Label><Input type="number" value={settings.gapY} onChange={(e) => updateSetting('gapY', Number(e.target.value))} className="h-8 text-xs bg-muted/30 border-border/60 rounded-xl focus:ring-emerald-500/20 font-semibold"/></div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Separator />

                {/* Quantity Logic */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Quantity Control</Label>
                    <RadioGroup value={settings.qtyMode} onValueChange={(val) => updateSetting('qtyMode', val)} className="flex flex-col gap-3">
                        <div className={`flex items-center justify-between border p-3 rounded-xl transition-all cursor-pointer ${settings.qtyMode === 'grn' ? 'border-emerald-500/40 bg-emerald-500/5 shadow-sm' : 'border-border/60 hover:bg-muted/40'}`} onClick={() => updateSetting('qtyMode', 'grn')}>
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="grn" id="q-grn" className="text-emerald-600" />
                                <Label htmlFor="q-grn" className="text-xs font-bold cursor-pointer">Sync with Stock Count</Label>
                            </div>
                        </div>
                        <div className={`flex items-center justify-between border p-3 rounded-xl transition-all cursor-pointer ${settings.qtyMode === 'custom' ? 'border-emerald-500/40 bg-emerald-500/5 shadow-sm' : 'border-border/60 hover:bg-muted/40'}`} onClick={() => updateSetting('qtyMode', 'custom')}>
                            <div className="flex items-center space-x-3">
                                <RadioGroupItem value="custom" id="q-custom" className="text-emerald-600" />
                                <Label htmlFor="q-custom" className="text-xs font-bold cursor-pointer">Manual Fixed Amount</Label>
                            </div>
                            {settings.qtyMode === 'custom' && <Input type="number" value={settings.customQty} onChange={(e) => updateSetting('customQty', e.target.value)} className="h-8 w-14 text-center text-xs bg-background border-emerald-500/30 rounded-md p-0 font-bold text-emerald-600 focus:ring-emerald-500/20" />}
                        </div>
                    </RadioGroup>
                </div>

                <Separator />

                {/* Content Toggles */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Fields Visibility</Label>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-muted/40 p-4 rounded-xl border border-border/40 shadow-inner">
                        {Object.keys(settings.showFields).filter(k => k !== 'customTextContent').map((key) => {
                            const labelMap = {
                                name: "Product Name", variant: "Variant Info", sku: "SKU Number",
                                barcode: "Barcode ID", barcodeImage: "Barcode Graphic", price: "Selling Price",
                                customText: "Custom Footer"
                            };
                            return (
                                <div key={key} className="flex items-center space-x-2.5">
                                    <Checkbox id={`field-${key}`} checked={settings.showFields[key]} onCheckedChange={() => toggleField(key)} className="h-4 w-4 rounded-md border-border/60 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-none text-white shadow-none" />
                                    <Label htmlFor={`field-${key}`} className="text-xs cursor-pointer select-none font-bold text-foreground/80 hover:text-foreground transition-colors">{labelMap[key] || key}</Label>
                                </div>
                            );
                        })}
                    </div>
                    {settings.showFields.customText && <Input placeholder="E.g. 'Non-Refundable'" value={settings.customTextContent} onChange={(e) => updateSetting('customTextContent', e.target.value)} className="mt-2 h-9 text-xs bg-emerald-500/5 border-emerald-500/30 rounded-xl focus:ring-emerald-500/20 font-medium" />}

                    {!settings.showFields.barcodeImage && (
                        <div className="space-y-2 mt-4 animate-in fade-in duration-300">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Sticker Design Layout</Label>
                            <Tabs value={settings.layoutMode || "classic"} onValueChange={(v) => updateSetting('layoutMode', v)} className="w-full">
                                <TabsList className="w-full flex border-b border-border/40 bg-transparent h-auto p-0 rounded-none gap-6">
                                    <TabsTrigger value="classic" className="text-xs font-bold py-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 text-muted-foreground p-0 shadow-none">Classic Stack</TabsTrigger>
                                    <TabsTrigger value="price-tag" className="text-xs font-bold py-2 bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 text-muted-foreground p-0 shadow-none">Retail Price Tag</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>

        <div className="p-6 border-t border-border/40 bg-muted/30 shrink-0">
            <Button variant="outline" className="w-full h-11 border-border/60 text-muted-foreground hover:bg-background hover:text-foreground hover:border-emerald-600/30 rounded-md text-xs font-semibold shadow-none transition-all group">
                <Settings className="size-3.5 mr-2 group-hover:rotate-90 transition-transform duration-500" />
                Save Configuration
            </Button>
        </div>
      </div>
    </div>
  );
}