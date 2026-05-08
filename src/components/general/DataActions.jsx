"use client";

import React from "react";
import { Download, FileText, Printer, ChevronDown, FileSpreadsheet, FileJson } from "lucide-react";
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
  fileName = "Export", 
  className,
  showPrint = false,
  onPrint = () => window.print()
}) => {
  const { business } = useAppSettings();
  const orgName = business?.name || "";

  const handleCSV = () => exportToCSV(data, fileName, orgName);
  const handleExcel = () => exportToExcel(data, fileName, orgName);

  const disabled = !data || data.length === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-9 px-4 gap-2 border-border hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all font-semibold shadow-xs"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Actions</span>
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
