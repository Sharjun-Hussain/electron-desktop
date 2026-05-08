"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  PackagePlus
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

const TEMPLATE_HEADERS = [
  "Name",
  "Code",
  "SKU",
  "Barcode",
  "Main Category",
  "Sub Category",
  "Brand",
  "Unit",
  "Cost Price",
  "Selling Price",
  "Wholesale Price",
  "Stock Qty",
  "Low Stock Threshold",
  "Description"
];

const SAMPLE_DATA = [
  {
    "Name": "Sample Product 1",
    "Code": "PRD-001",
    "SKU": "SKU-001",
    "Barcode": "123456789",
    "Main Category": "Electronics",
    "Sub Category": "Smartphones",
    "Brand": "Brand A",
    "Unit": "pcs",
    "Cost Price": 500,
    "Selling Price": 750,
    "Wholesale Price": 650,
    "Stock Qty": 100,
    "Low Stock Threshold": 10,
    "Description": "High quality sample product"
  }
];

export function OpeningStockImportDialog({ open, onOpenChange, accessToken, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(SAMPLE_DATA, { header: TEMPLATE_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Template");

    // Auto-size columns
    const colWidths = TEMPLATE_HEADERS.map(h => ({ wch: h.length + 5 }));
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Inventory_Opening_Stock_Template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("The file appears to be empty");
          return;
        }

        // Validate headers (basic check)
        const firstRow = data[0];
        const missingHeaders = TEMPLATE_HEADERS.filter(h => !(h in firstRow) && !["Sub Category", "Brand", "Barcode", "Description"].includes(h));

        if (missingHeaders.length > 0) {
          toast.warning(`Possible missing required columns: ${missingHeaders.join(", ")}`);
        }

        setFile(selectedFile);
        setPreviewData(data);
        toast.success(`Successfully parsed ${data.length} items`);
      } catch (err) {
        toast.error("Failed to parse Excel file");
        console.error(err);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    try {
      // Map Excel headers to backend fields (case-insensitive)
      const mappedProducts = previewData.map(row => {
        // Create a normalized row with lowercase keys
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        });

        const getVal = (possibleKeys) => {
          for (const key of possibleKeys) {
            if (normalizedRow[key.toLowerCase()] !== undefined) {
              return normalizedRow[key.toLowerCase()];
            }
          }
          return undefined;
        };

        return {
          name: getVal(["Name", "Product Name", "Product"]),
          code: getVal(["Code", "Product Code", "Item Code"]),
          sku: getVal(["SKU", "Stock Keeping Unit"]),
          barcode: getVal(["Barcode", "Bar Code", "EAN", "UPC"]),
          main_category: getVal(["Main Category", "Category", "Department"]),
          sub_category: getVal(["Sub Category", "SubCategory"]),
          brand: getVal(["Brand", "Manufacturer"]),
          unit: getVal(["Unit", "UOM", "Measurement"]),
          cost_price: getVal(["Cost Price", "Cost", "Purchase Price"]),
          selling_price: getVal(["Selling Price", "Price", "Retail Price", "Rate"]),
          wholesale_price: getVal(["Wholesale Price", "Wholesale"]),
          stock_qty: getVal(["Stock Qty", "Quantity", "Qty", "Stock"]),
          low_stock_threshold: getVal(["Low Stock Threshold", "Min Stock", "Alert Level"]),
          description: getVal(["Description", "Notes", "Details"])
        };
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ products: mappedProducts })
      });

      const result = await response.json();

      if (result.status === "success") {
        toast.success(`Import completed: ${result.data.success} successful, ${result.data.failed} failed`);
        if (result.data.failed > 0) {
          console.table(result.data.logs);
        }
        onSuccess?.();
        onOpenChange(false);
        resetState();
      } else {
        toast.error(result.message || "Import failed");
      }
    } catch (err) {
      toast.error("A network error occurred during import");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background border shadow-2xl rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-8 py-6 bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl border border-emerald-500/20 shadow-sm">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Bulk Inventory Import</DialogTitle>
              <DialogDescription className="text-sm font-medium opacity-70">
                Upload your product catalog using an Excel file.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto thin-scrollbar p-8 py-8 space-y-6">
          {/* Step 1: Download Template */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 group hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Excel Template</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Download and fill the data</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="rounded-xl border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 font-bold text-xs gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Get Template
            </Button>
          </div>

          {/* Step 2: Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-500 group",
              file
                ? "bg-emerald-500/5 border-emerald-500/30 ring-4 ring-emerald-500/5"
                : "bg-muted/10 border-border hover:bg-muted/20 hover:border-emerald-500/20"
            )}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />

            <div className={cn(
              "p-4 rounded-2xl shadow-md mb-4 transition-all duration-500 group-hover:scale-110 border",
              file ? "bg-emerald-600 text-white border-emerald-400" : "bg-background text-muted-foreground border-border"
            )}>
              {file ? <CheckCircle2 className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
            </div>

            <p className="text-base font-bold text-foreground">
              {file ? file.name : "Upload Excel Sheet"}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-2 text-center max-w-[300px]">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB recognized. Validating entries...`
                : "Drop your populated spreadsheet here or click to browse files"}
            </p>

            {file && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); resetState(); }}
                className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Validation Status */}
          {previewData.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-blue-700">File Validated</p>
                <p className="text-[11px] font-medium text-blue-600/80">
                  Found <span className="font-bold underline">{previewData.length}</span> products ready to import.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 py-6 bg-muted/10 border-t border-border flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs"
              disabled={loading}
            >
              Abort
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || previewData.length === 0}
              className="flex-1 sm:flex-none min-w-[160px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <PackagePlus className="h-4 w-4 mr-2" />
                  Import Products
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
