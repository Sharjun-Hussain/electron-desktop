"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useReactToPrint } from "react-to-print";
import {
  Sparkles, Download, Eye, EyeOff, Printer, Layout, Maximize2, RefreshCw, CheckSquare, Square, Check, X, SlidersHorizontal, Settings2, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Dynamically import the Barcode component
const Barcode = dynamic(() => import("react-barcode"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
      Loading generator...
    </div>
  ),
});

export function BarcodeGenerator({ data, onDataChange }) {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [selectedVariantIds, setSelectedVariantIds] = useState(new Set());

  // Initialize selection
  useEffect(() => {
    if (data?.items) {
      setSelectedVariantIds(new Set(data.items.map(item => item.id)));
    }
  }, [data?.id]); // Only re-init when product changes
  const [barcodeType, setBarcodeType] = useState("CODE128");

  const hasMultipleItems = data?.items && data.items.length > 1;
  const currentItem = data?.items ? data.items[selectedItemIndex] : data;

  // Advanced barcode settings
  const [barcodeSettings, setBarcodeSettings] = useState({
    height: 40,
    width: 1.5,
    fontSize: 14,
    showValue: true,
    showTitle: true,
    showPrice: true,
    showSize: true,
    showSKU: false,
    textMargin: 2,
    margin: 10,
    flat: false,
    printMode: "label", // "label" or "a4"
    printScope: "all",
    quantity: 1,
    columns: 3,
    pagePadding: 10,
    gap: 5,
    showCompanyName: true,
    companyName: "INZEEDO POS",
  });

  const printRef = useRef(null);
  const { useModularSettings } = useAppSettings();
  const { data: posResponse } = useModularSettings("pos");
  
  const handleStandardPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes-${currentItem?.barcodeValue || "Batch"}`,
  });

  const handlePrint = async () => {
    if (!printRef.current) return;

    // Desktop Silent Printing logic
    if (window.api?.printSilent && posResponse?.data?.silentPrint) {
      try {
        const printerName = posResponse?.data?.barcodePrinterName || "DEFAULT";
        const html = printRef.current.innerHTML;
        
        const fullHtml = `
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; }
                @page { margin: 0; }
              </style>
            </head>
            <body>${html}</body>
          </html>
        `;

        const result = await window.api.printSilent({ 
          html: fullHtml, 
          printerName: printerName === "DEFAULT" ? "" : printerName 
        });

        if (result.success) {
          // toast.success("Barcodes printed silently");
        } else {
          handleStandardPrint();
        }
      } catch (err) {
        handleStandardPrint();
      }
    } else {
      handleStandardPrint();
    }
  };

  const barcodeFormats = [
    { value: "CODE128", label: "CODE 128" },
    { value: "EAN13", label: "EAN-13" },
    { value: "EAN8", label: "EAN-8" },
    { value: "UPC", label: "UPC-A" },
    { value: "CODE39", label: "CODE 39" },
  ];

  const toggleVariantSelection = (id) => {
    setSelectedVariantIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVariants = () => {
    if (data?.items) {
      setSelectedVariantIds(new Set(data.items.map(item => item.id)));
    }
  };

  const clearAllVariants = () => {
    setSelectedVariantIds(new Set());
  };

  const handleSettingChange = (key, value) => {
    setBarcodeSettings((prev) => ({ ...prev, [key]: value }));
  };

  // --- Reusable Sub-components ---
  const BarcodeItem = ({ isGrid = false, itemData = currentItem }) => (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-white text-black",
        isGrid ? "p-2 border border-slate-100" : "p-4 rounded-xl border border-slate-100 shadow-sm"
      )}
      style={{ width: isGrid ? "auto" : "100%", minHeight: isGrid ? "auto" : "120px" }}
    >
      {barcodeSettings.showCompanyName && (
        <p className="text-xs font-semibold text-slate-400 mb-1 leading-none">
          {barcodeSettings.companyName}
        </p>
      )}
      {barcodeSettings.showTitle && itemData?.title && (
        <h3 className="font-semibold text-center leading-tight mb-1 text-slate-800" style={{ fontSize: `${barcodeSettings.fontSize - 1}px` }}>
          {itemData.title}
        </h3>
      )}
      {itemData?.barcodeValue && (
        <div className="scale-[0.85] origin-center -my-1">
          <Barcode
            value={itemData.barcodeValue}
            format={barcodeType}
            height={barcodeSettings.height}
            width={barcodeSettings.width}
            fontSize={barcodeSettings.fontSize}
            margin={0}
            displayValue={barcodeSettings.showValue}
            background="#ffffff"
            lineColor="#000000"
            textColor="#000000"
            textMargin={barcodeSettings.textMargin}
            flat={barcodeSettings.flat}
          />
        </div>
      )}
      <div className="flex justify-center items-center gap-3 mt-1 text-xs font-semibold text-slate-600">
        {barcodeSettings.showSize && itemData?.size && <p>{itemData.size}</p>}
        {barcodeSettings.showPrice && itemData?.price && <p className="border-l border-slate-200 pl-3">{itemData.price}</p>}
      </div>
    </div>
  );

  const PrintPreview = () => {
    const itemsToPrint = (barcodeSettings.printScope === "all" && data?.items) ? data.items.filter(item => selectedVariantIds.has(item.id)) : [currentItem];
    return (
      <div className="hidden">
        <div ref={printRef} className="bg-white">
          {barcodeSettings.printMode === "label" ? (
            <div className="flex flex-col gap-0">
              {itemsToPrint.map((item, itemIdx) =>
                Array.from({ length: barcodeSettings.quantity }).map((_, i) => (
                  <div key={`${itemIdx}-${i}`} className="break-after-page"><BarcodeItem itemData={item} /></div>
                ))
              )}
            </div>
          ) : (
            <div
              className="grid bg-white"
              style={{
                gridTemplateColumns: `repeat(${barcodeSettings.columns}, 1fr)`,
                padding: `${barcodeSettings.pagePadding}mm`,
                gap: `${barcodeSettings.gap}mm`,
              }}
            >
              {itemsToPrint.map((item, itemIdx) =>
                Array.from({ length: barcodeSettings.quantity }).map((_, i) => (
                  <div key={`${itemIdx}-${i}`} className="border border-dashed border-slate-200 break-inside-avoid"><BarcodeItem itemData={item} isGrid /></div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };


  const ToggleControl = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-1.5">
      <Label className="text-xs font-medium text-slate-600 cursor-pointer">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} className="scale-75" />
    </div>
  );

  const SizeControl = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2 py-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium text-slate-600">{label}</Label>
        <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([val]) => onChange(val)} className="w-full" />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* COMPACT TOOLBAR (Like Filter Bar Style) */}
      <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm sticky top-0 z-10">

        {/* Section 1: Target & Format */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          <Select value={selectedItemIndex.toString()} onValueChange={(v) => setSelectedItemIndex(parseInt(v))}>
            <SelectTrigger className="h-8 border-none bg-slate-50 dark:bg-slate-950 text-xs font-medium w-[180px] rounded-2xl focus:ring-0">
              <span className="text-slate-400 mr-1.5 shrink-0">Target:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {data.items.map((item, idx) => (
                <SelectItem key={idx} value={idx.toString()} className="text-sm">{item.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={barcodeType} onValueChange={setBarcodeType}>
            <SelectTrigger className="h-8 border-none bg-slate-50 dark:bg-slate-950 text-xs font-medium w-[140px] rounded-2xl focus:ring-0">
              <span className="text-slate-400 mr-1.5">Type:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {barcodeFormats.map(f => <SelectItem key={f.value} value={f.value} className="text-sm">{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />

        {/* Section 2: Value Display (Read-only) */}
        <div className="flex-1 flex items-center gap-2 min-w-0 px-2 overflow-hidden">
          <Search className="h-3 w-3 text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 leading-none">Barcode id</span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5">
              {currentItem?.barcodeValue || "No data"}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />

        {/* Section 3: Print Config */}
        <div className="flex items-center gap-2 px-2">
          <div className="flex bg-slate-50 dark:bg-slate-950 p-0.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => handleSettingChange("printMode", "label")} className={cn("px-2.5 py-1 text-xs font-medium rounded-xl transition-all", barcodeSettings.printMode === "label" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-400")}>Roll</button>
            <button type="button" onClick={() => handleSettingChange("printMode", "a4")} className={cn("px-2.5 py-1 text-xs font-medium rounded-xl transition-all", barcodeSettings.printMode === "a4" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-400")}>A4</button>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1">
            <span className="text-xs text-slate-400 ">Qty</span>
            <input
              type="number"
              value={barcodeSettings.quantity}
              onChange={(e) => handleSettingChange("quantity", parseInt(e.target.value) || 1)}
              className="w-6 bg-transparent border-none text-sm font-medium text-slate-600 dark:text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1" />

        {/* Section 4: Display & Advanced Popover */}
        <div className="flex items-center gap-2 px-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 rounded-2xl gap-1.5 font-medium text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Settings2 className="h-3 w-3" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4 rounded-2xl shadow-2xl border-none bg-white dark:bg-slate-900" align="end">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-slate-400 border-b pb-2">Visibility matrix</p>
                    <ToggleControl label="Barcode ID" checked={barcodeSettings.showValue} onChange={(v) => handleSettingChange("showValue", v)} />
                    <ToggleControl label="Product Title" checked={barcodeSettings.showTitle} onChange={(v) => handleSettingChange("showTitle", v)} />
                    <ToggleControl label="Price & Size" checked={barcodeSettings.showPrice} onChange={(v) => { handleSettingChange("showPrice", v); handleSettingChange("showSize", v); }} />
                    <ToggleControl label="Company Logo" checked={barcodeSettings.showCompanyName} onChange={(v) => handleSettingChange("showCompanyName", v)} />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-slate-400 border-b pb-2">Label dimensions</p>
                    <SizeControl label="Height" value={barcodeSettings.height} min={20} max={80} step={1} onChange={(v) => handleSettingChange("height", v)} />
                    <SizeControl label="Bar Width" value={barcodeSettings.width} min={1} max={3} step={0.1} onChange={(v) => handleSettingChange("width", v)} />
                    <SizeControl label="Font Size" value={barcodeSettings.fontSize} min={10} max={24} step={1} onChange={(v) => handleSettingChange("fontSize", v)} />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* MAIN BODY AREA */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* Left/Middle: Preview Zone ([8/12]) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex-1 flex flex-col">
            <div className="px-3 pb-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3 w-3 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Master preview</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded">
                  {barcodeSettings.printScope === 'all' && hasMultipleItems ? selectedVariantIds.size * barcodeSettings.quantity : barcodeSettings.quantity} labels
                </span>
              </div>
            </div>

            <CardContent className="p-3 bg-white dark:bg-slate-950/20 flex flex-col items-center justify-center min-h-[300px]">
              {currentItem?.barcodeValue ? (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-white transform hover:scale-[1.01] transition-all duration-500">
                  <BarcodeItem />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 opacity-10">
                  <Layout className="h-16 w-16" />
                  <p className="text-sm font-medium">Live engine ready</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 bg-white dark:bg-slate-900 border-t flex flex-col sm:flex-row gap-4 items-center justify-between text-center sm:text-left">
              <div className="flex flex-col">
                <p className="text-xs font-medium text-slate-400 ">Target variant</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[200px]">{currentItem?.title} • {barcodeSettings.printMode === 'label' ? 'Roll' : 'A4'}</p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <PrintPreview />
                <Button onClick={handlePrint} disabled={!currentItem?.barcodeValue} className="flex-1 sm:px-6 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-2xl shadow-sm transition-all active:scale-95">
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print labels
                </Button>
                <Button variant="outline" onClick={() => handlePrint()} disabled={!currentItem?.barcodeValue} className="h-9 w-9 rounded-2xl border-slate-200 flex-shrink-0">
                  <Download className="h-3 w-3 text-slate-400" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Right: Variant Selection Zone ([4/12]) */}
        <div className="xl:col-span-4">
          <Card className="border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-xl h-full flex flex-col">
            <div className="px-3 pb-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-3 w-3 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Variant selection</h3>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={selectAllVariants} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">All</button>
                <button type="button" onClick={clearAllVariants} className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors">None</button>
              </div>
            </div>
            <CardContent className="p-2 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
              <div className="grid gap-1.5">
                {data?.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer",
                      selectedVariantIds.has(item.id)
                        ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm"
                        : "bg-transparent border-transparent opacity-40 hover:opacity-100"
                    )}
                    onClick={() => toggleVariantSelection(item.id)}
                  >
                    <Checkbox
                      checked={selectedVariantIds.has(item.id)}
                      onCheckedChange={() => toggleVariantSelection(item.id)}
                      className="rounded-lg h-5 w-5 border-2"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 font-mono er mt-0.5">{item.barcodeValue || '---'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-100/50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t rounded-b-xl">
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg w-full border border-slate-200/40">
                <button type="button" onClick={() => handleSettingChange("printScope", "all")} className={cn("flex-1 text-xs py-1.5 rounded-md transition-all font-medium", barcodeSettings.printScope === "all" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500")}>Selected variants</button>
                <button type="button" onClick={() => handleSettingChange("printScope", "current")} className={cn("flex-1 text-xs py-1.5 rounded-md transition-all font-medium", barcodeSettings.printScope === "current" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-500")}>Target only</button>
              </div>
            </CardFooter>
          </Card>
        </div>

      </div>
    </div>
  );
}