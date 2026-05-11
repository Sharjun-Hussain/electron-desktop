"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Activity, ShieldCheck, FileCheck, RefreshCw, XCircle,
  FileCode, History, AlertTriangle, ShieldAlert,
  Database,
  UploadCloud,
  ArrowUpFromLine,
  Download,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Lock, ArrowUpCircle } from "lucide-react";

const SYSTEM_FIELDS = [
  { id: "ignore", label: "Skip Basis (Ignore)", required: false },
  { id: "name", label: "Asset Name (Product)", required: true },
  { id: "variant_name", label: "Variant Attribute (e.g. Size/Color)", required: false },
  { id: "code", label: "Structural Identifier (Product Code)", required: true },
  { id: "sku", label: "SKU (Variant Level)", required: false },
  { id: "barcode", label: "Barcode (Variant Level)", required: false },
  { id: "brand", label: "Brand Logic", required: true },
  { id: "main_category", label: "Main Category", required: true },
  { id: "selling_price", label: "Trading Price (Sale)", required: true },
  { id: "cost_price", label: "Investment Basis (Cost)", required: false },
  { id: "unit", label: "Standard Unit", required: false },
  { id: "stock_qty", label: "Operational Stock", required: false },
];

export function DataImportSettings() {
  const { business, isLoading: isSettingsLoading } = useAppSettings();
  const isEssential = business?.subscription_tier === 'Essential';

  const { data: session } = useSession();
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Import
  const [fileData, setFileData] = useState({ data: [], headers: [], fileName: "" });
  const [mapping, setMapping] = useState({});
  const [importStats, setImportStats] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState([]);

  if (isSettingsLoading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <RefreshCw className="w-8 h-8 animate-spin text-emerald-500/50" />
      <p className="text-xs text-muted-foreground">Initializing logistics core...</p>
    </div>
  );

  if (isEssential) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Card className="border-amber-200 bg-amber-50/20 overflow-hidden">
          <div className="h-1 bg-amber-500 w-full" />
          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-amber-100 rounded-full shadow-inner">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Data Logistics Restricted</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Advanced bulk data migration and structural snapshots are premium features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl pt-4 text-left">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Bulk Catalog Migration</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Import thousands of products, variants, and inventory levels via industrial CSV mapping.</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Structural SQL Archival</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Generate and restore full system snapshots to maintain a robust data safety nexus.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20 text-xs font-black uppercase tracking-widest gap-3"
                onClick={() => (window.location.href = '/settings?tab=subscription')}
              >
                <ArrowUpCircle className="w-4 h-4" /> Upgrade To Professional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metadata = { brands: 12, categories: 8, units: 5 };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setFileData({
          data: results.data,
          headers: results.meta.fields || [],
          fileName: file.name
        });

        const initialMap = {};
        results.meta.fields.forEach(h => {
          const match = SYSTEM_FIELDS.find(f =>
            f.id !== 'ignore' && f.label.toLowerCase().includes(h.toLowerCase())
          );
          initialMap[h] = match ? match.id : "ignore";
        });
        setMapping(initialMap);
        setStep(2);
      }
    });
  };

  const startImport = async () => {
    setStep(3);
    setImportStats({ total: fileData.data.length, current: 0, success: 0, failed: 0 });
    setLogs([]);

    const productsToImport = fileData.data.map(row => {
      const product = {};
      Object.keys(mapping).forEach(header => {
        const systemField = mapping[header];
        if (systemField !== 'ignore') product[systemField] = row[header];
      });
      return product;
    });

    try {
      const token = session?.user?.accessToken || session?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: productsToImport })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Import baseline failure");

      const { success, failed, logs: importLogs } = result.data;

      setImportStats({ total: productsToImport.length, current: productsToImport.length, success, failed });
      setLogs(importLogs || []);

      if (failed === 0) toast.success(`Synchronized ${success} assets successfully`);
      else toast.warning(`Synchronized ${success} assets with ${failed} structural failures`);
    } catch (error) {
      toast.error(error.message || "Platform communication error");
      setStep(2);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Preparing CSV transition...");
      const token = session?.user?.accessToken || session?.accessToken;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Export baseline failure");

      const csv = Papa.unparse(result.data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `structural_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success("Structural inventory transitioned successfully");
    } catch (error) {
      toast.dismiss();
      toast.error("Export failure: " + error.message);
    }
  };

  const exportDatabaseSql = async () => {
    try {
      toast.loading("Sequencing structural snapshot...");
      const token = session?.user?.accessToken || session?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/db/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "SQL extraction failure");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos_snapshot_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.dismiss();
      toast.success("Structural snapshot generated successfully");
    } catch (err) {
      toast.dismiss();
      console.error("SQL Export Error:", err);
      toast.error(err.message || "Snapshot generation failed");
    }
  };

  const importDatabaseSql = async (file) => {
    if (!file) return;
    if (!confirm("CAUTION: This will overwrite the entire database structural basis. This action is irreversible. Proceed?")) return;

    try {
      toast.loading("Restoring structural nexus...");
      const token = session?.user?.accessToken || session?.accessToken;
      const formData = new FormData();
      formData.append('sql', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/db/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Restoration failure");

      toast.dismiss();
      toast.success("Structural restoration finalized. System rebooting...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.dismiss();
      toast.error(err.message);
    }
  };

  const StepIndicatorMinimal = () => (
    <div className="flex items-center justify-center mb-8 gap-2 flex-wrap">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={cn(
            "h-9 px-4 rounded-md flex items-center gap-2 text-[11px] font-bold transition-all border",
            step === s
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
              : step > s
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-muted/30 text-muted-foreground border-transparent "
          )}>
            <div className={cn(
              "h-4 w-4 rounded-full flex items-center justify-center text-[9px] shrink-0",
              step === s ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
            )}>
              {step > s ? <CheckCircle2 className="w-3 h-3" /> : s}
            </div>
            {s === 1 ? "FILE INITIALIZATION" : s === 2 ? "STRUCTURAL MAPPING" : "LOGISTICS MIGRATION"}
          </div>
          {s !== 3 && <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-700 mx-1" />}
        </div>
      ))}
    </div>
  );

  const selectTriggerCls = "h-10 bg-white dark:bg-gray-950 border-slate-200 dark:border-slate-800 rounded-md text-[12px] font-semibold text-foreground transition-all shadow-sm";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* GLOBAL LOGISTICS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Data Logistics Engine</h2>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">Industrial data synchronization and restoration nexus — v3.1 Basis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="h-9 text-[10px] font-bold border-border/50 gap-2 transition-all active:scale-95">
              <RefreshCw className="w-3.5 h-3.5" /> Initialize New Migration
            </Button>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-md border border-emerald-500/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600">ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT COLUMN: EXTRACTION (SAFE ARCHIVAL) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-border/50 rounded-lg p-6 space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-600">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-none">Extraction Portal</h3>
                <p className="text-[10px] text-muted-foreground mt-1.5">Safe structural archival and data backups</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* CSV EXPORT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest opacity-60">Product Hub</h4>
                  <Badge variant="outline" className="text-[8px] bg-blue-500/5 text-blue-600 border-none px-1.5">CSV FORMAT</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Download your entire product catalog and inventory structural basis in flattened CSV format.</p>
                <Button variant="outline" onClick={handleExport} className="w-full h-10 border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all text-[11px] font-bold gap-2">
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV Blueprint
                </Button>
              </div>

              <div className="h-px bg-border/30" />

              {/* SQL EXPORT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-foreground uppercase tracking-widest opacity-60">System Database</h4>
                  <Badge variant="outline" className="text-[8px] bg-blue-600/5 text-blue-700 border-none px-1.5 font-bold">SQL SNAPSHOT</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Generate a full native SQL snapshot including architectures, relational data, and system logs.</p>
                <Button type="button" onClick={exportDatabaseSql} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white transition-all text-[11px] font-bold gap-2 shadow-md">
                  <History className="w-4 h-4" /> Sequence SQL Snapshot
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/20 rounded-md border border-dashed border-border/50 text-[10px] text-muted-foreground font-medium italic">
            Note: Sequential extraction does not modify any active system state. It is safe to run at any time during operational hours.
          </div>
        </div>

        {/* RIGHT COLUMN: INJECTION (ACTIVE RESTORATION) */}
        <div className="xl:col-span-8 flex flex-col">
          <Card className="bg-white dark:bg-slate-900 border-border/50 shadow-none rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="bg-amber-500/5 border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded bg-amber-500/10 text-amber-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-none">Injection Engine</h3>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/50 mt-1.5">Structural restoration and data synchronization</p>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-bold">HAZARD MODE ACTIVE</Badge>
            </div>

            <CardContent className="p-8 flex-1 flex flex-col">
              <StepIndicatorMinimal />

              {/* INJECTION STEP 1: INITIALIZATION */}
              {step === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-6 animate-in fade-in duration-500">
                  <div className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CSV INJECTION PORTAL */}
                    <div className="relative group overflow-hidden border border-border/50 rounded-lg p-6 bg-slate-50/10 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-lg">
                      <div className="h-10 w-10 rounded bg-emerald-500/10 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h4 className="text-[13px] font-bold text-foreground">Catalog Injection</h4>
                      <p className="text-[10px] text-muted-foreground mt-2 mb-6">Import structural CSV product assets to scale your local catalog.</p>

                      <div className="relative">
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <Button className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 h-10 rounded font-bold text-[10px] gap-2">
                          <ArrowUpFromLine className="w-4 h-4" /> Upload CSV Hub
                        </Button>
                      </div>
                    </div>

                    {/* SQL INJECTION PORTAL */}
                    <div className="relative group overflow-hidden border border-rose-500/20 rounded-lg p-6 bg-rose-500/5 hover:bg-rose-500/10 transition-all hover:shadow-lg">
                      <div className="h-10 w-10 rounded bg-rose-500/10 flex items-center justify-center mb-4">
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      </div>
                      <h4 className="text-[13px] font-bold text-rose-700 dark:text-rose-400">Structural Overwrite</h4>
                      <p className="text-[10px] text-rose-600/60 dark:text-rose-400/50 mt-2 mb-6">OVERWRITE current architecture with a native SQL snapshot basis.</p>

                      <div className="relative">
                        <input type="file" accept=".sql" onChange={(e) => importDatabaseSql(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <Button variant="outline" className="w-full h-10 border-rose-500/20 text-rose-600 font-bold text-[10px] gap-2">
                          <RefreshCw className="w-4 h-4" /> Restore SQL Nexus
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[10px] text-muted-foreground font-medium">Warning: Injection operations modify the active system structure permanently.</p>
                  </div>
                </div>
              )}

              {/* STEP 2: MAPPING */}
              {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="lg:col-span-8 space-y-3">
                    <div className="border border-border/50 rounded-md overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-border/50">
                          <tr>
                            <th className="px-6 py-3 text-left font-bold text-[10px]  text-muted-foreground ">CSV Header Basis</th>
                            <th className="px-6 py-3 text-center w-16 text-slate-300 dark:text-slate-700"><ArrowRight className="w-4 h-4 mx-auto" /></th>
                            <th className="px-6 py-3 text-left font-bold text-[10px]  text-muted-foreground ">System Structural Logic</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {fileData.headers.map((header) => (
                            <tr key={header} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/20 transition-colors">
                              <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-[11px] ">{header}</td>
                              <td className="px-6 py-3 text-center opacity-30"><ArrowRight className="w-3 h-3 mx-auto" /></td>
                              <td className="px-6 py-2">
                                <Select value={mapping[header]} onValueChange={(v) => setMapping(p => ({ ...p, [header]: v }))}>
                                  <SelectTrigger className="h-8 bg-card border-border/50 rounded-md text-[11px] font-medium shadow-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-md border-border/50 bg-white dark:bg-slate-900 shadow-xl">
                                    {SYSTEM_FIELDS.map(f => (
                                      <SelectItem key={f.id} value={f.id} className="text-[11px] font-medium ">
                                        {f.label} {f.required && <span className="text-rose-500 ml-1  opacity-60">*</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-md p-4 border border-border/50 space-y-4 sticky top-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Validation Suite</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: "Brands", val: metadata.brands },
                          { label: "Categories", val: metadata.categories },
                          { label: "Units", val: metadata.units }
                        ].map(m => (
                          <div key={m.label} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded-md border border-border/30">
                            <span className="text-[10px] font-bold text-muted-foreground">{m.label}</span>
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono border-none bg-muted/50">{m.val}</Badge>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 space-y-2">
                        <Button className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] shadow-sm gap-2" onClick={startImport}>
                          <Save className="w-3.5 h-3.5" /> Initialize Migration
                        </Button>
                        <div className="flex items-center gap-2 p-2 bg-amber-500/5 rounded-md border border-amber-500/10">
                          <Activity className="w-3 h-3 text-amber-500 shrink-0" />
                          <p className="text-[9px] text-amber-700/60 dark:text-amber-400/60 font-medium">Verify required fields (*)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PROGRESS */}
              {step === 3 && (
                <div className="max-w-2xl mx-auto space-y-6 text-center py-4 animate-in zoom-in-95 duration-500">
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white ">{importStats.current === importStats.total ? "Migration Finalized" : "Assembling Structural Basis..."}</h3>
                    </div>
                    <div className="relative pt-1">
                      <Progress value={(importStats.current / importStats.total) * 100} className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[9px] text-muted-foreground">Logistics Record {importStats.current} / {importStats.total}</span>
                        <span className="text-[9px] font-bold text-emerald-600">{Math.round((importStats.current / importStats.total) * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-md relative overflow-hidden group">
                      <div className="text-2xl font-bold text-emerald-600 tabular-nums">{importStats.success}</div>
                      <p className="text-[9px] font-bold text-emerald-600 opacity-60">Success Protocol</p>
                      <FileCheck className="absolute -bottom-1 -right-1 w-8 h-8 opacity-10" />
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-md relative overflow-hidden group">
                      <div className="text-2xl font-bold text-rose-600 tabular-nums">{importStats.failed}</div>
                      <p className="text-[9px] font-bold text-rose-600 opacity-60">Structural Failures</p>
                      <XCircle className="absolute -bottom-1 -right-1 w-8 h-8 opacity-10" />
                    </div>
                  </div>

                  {logs.length > 0 && (
                    <div className="text-left border border-border/50 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 px-3 py-1.5 text-[9px] font-bold text-muted-foreground border-b border-border/50">Audit Trail</div>
                      <ScrollArea className="h-32">
                        {logs.map((l, i) => (
                          <div key={i} className="text-[10px] font-medium py-1.5 px-3 border-b border-border/30 last:border-0 hover:bg-slate-50/50 flex items-center gap-2">
                            <span className="text-rose-600 font-bold">ROW {l.row}:</span>
                            <span className="text-muted-foreground">{l.msg}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
