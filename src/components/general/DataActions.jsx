"use client";

import React from "react";
import { Download, FileText, Printer, ChevronDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

/**
 * A standardized, premium action group for data exporting and printing.
 * @param {Array} data - The dataset to be exported.
 * @param {string} fileName - Base name for the exported file.
 * @param {string} className - Optional styling classes.
 * @param {boolean} showPrint - Whether to show the print option.
 * @param {Function} onPrint - Custom print handler (defaults to window.print()).
 */
export const DataActions = ({ 
  data, 
  table,
  fileName = "Export", 
  className,
  showPrint = false,
  onPrint = () => window.print(),
  onExportCSV,
  onExportExcel,
  isExporting = false,
}) => {
  const { business } = useAppSettings();
  const orgName = business?.name || "";

  const filteredData = React.useMemo(() => {
    if (!table || !data) return data;
    
    const visibleColumns = table.getAllColumns().filter(col => 
      (col.getIsVisible() || 
       col.id === "sku" || 
       col.id === "barcode" || 
       col.id === "brand_name" || 
       col.id === "unit" ||
       col.columnDef.accessorKey === "brand.name" ||
       col.columnDef.accessorKey === "unit.name") && 
      col.id !== "select" && 
      col.id !== "actions"
    );

    return data.map(item => {
      const row = {};
      visibleColumns.forEach(col => {
        const id = col.columnDef.accessorKey || col.id;
        // Generate a readable header name
        let header = typeof col.columnDef.header === 'string' 
          ? col.columnDef.header 
          : id.replace(/_/g, ' ').toUpperCase();
        
        if (id === 'name') header = 'Product Name';
        if (id === 'sku') header = 'SKU';
        if (id === 'barcode') header = 'Barcode / PLU';
        if (id === 'main_category.name' || id === 'main_category_name') {
          header = 'Category';
          row['Sub Category'] = item.sub_category?.name || "-";
        }
        if (id === 'brand.name' || id === 'brand_name') header = 'Brand';
        if (id === 'unit.name' || id === 'unit') header = 'Unit';
        if (id === 'price') header = 'Retail Price';
        if (id === 'cost_price') header = 'Cost Price';
        if (id === 'mrp_price') header = 'MRP';
        if (id === 'wholesale_price') header = 'Wholesale Price';
        if (id === 'stock' || id === 'stock_quantity') header = 'Stock';
        
        // Extract value with support for nested paths (e.g., 'main_category.name')
        let value = item;
        const path = id.split('.');
        path.forEach(p => {
          value = value?.[p];
        });

        // Special handling for products with variants in the export
        if (id === 'variants' && Array.isArray(value)) {
          value = `${value.length} Variants`;
        }

        // If it's a price field and we have variants but no direct value, take the first variant's value
        if (['cost_price', 'mrp_price', 'price', 'wholesale_price'].includes(id) && !value && item.variants?.length > 0) {
          value = item.variants[0][id];
        }

        // If it's SKU or Barcode and we have variants but no direct value, combine variants' values
        if (id === 'sku' && !value && item.variants?.length > 0) {
          value = item.variants.map(v => v.sku).filter(Boolean).join(", ") || "-";
        }
        if (id === 'barcode' && !value && item.variants?.length > 0) {
          value = item.variants.map(v => v.barcode).filter(Boolean).join(", ") || "-";
        }
        
        // Handle Batch/Expiry from item itself (if it's a variant) or first variant (if it's a product)
        if (id === 'batch_number') {
           const batches = item.variants?.length > 0 ? item.variants[0].batches : item.batches;
           value = batches?.[0]?.batch_number || "-";
        }
        if (id === 'expiry_date') {
           const batches = item.variants?.length > 0 ? item.variants[0].batches : item.batches;
           const exp = batches?.[0]?.expiry_date;
           value = exp ? new Date(exp).toLocaleDateString() : "-";
        }

        row[header] = value ?? "";
      });
      return row;
    });
  }, [data, table]);

  const handleCSV = onExportCSV ?? (() => exportToCSV(filteredData, fileName, orgName));
  const handleExcel = onExportExcel ?? (() => exportToExcel(filteredData, fileName, orgName));

  const disabled = !data || data.length === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isExporting}
            className="h-9 px-4 gap-2 border-border hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all font-semibold shadow-xs"
          >
            {isExporting
              ? <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
              : <Download className="h-4 w-4 text-emerald-600" />}
            <span>{isExporting ? "Exporting…" : "Export Actions"}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-lg border-border bg-card/80 backdrop-blur-xl">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
            Output Protocols
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
          
          <DropdownMenuItem 
            onClick={handleExcel}
            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Microsoft Excel</span>
              <span className="text-[10px] text-muted-foreground">Standard (.xlsx) format</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={handleCSV}
            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Comma Separated</span>
              <span className="text-[10px] text-muted-foreground">Legacy (.csv) compatibility</span>
            </div>
          </DropdownMenuItem>

          {showPrint && (
            <>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={onPrint}
                className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  <Printer className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground">Print View</span>
                  <span className="text-[10px] text-muted-foreground">System dialog (Ctrl+P)</span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
