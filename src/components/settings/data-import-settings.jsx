"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  HardDriveDownload, HardDriveUpload, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Trash2, RotateCcw,
  Database, Lock, ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export function DataImportSettings() {
  const { business, isLoading: isSettingsLoading } = useAppSettings();
  const isEssential = business?.subscription_tier === 'Essential';
  const { data: session } = useSession();

  const [sqlFile, setSqlFile] = useState(null);
  const [restoreStage, setRestoreStage] = useState('idle'); // idle | confirm | restoring | success | error
  const [restoreError, setRestoreError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const sqlFileRef = useRef(null);

  if (isSettingsLoading) return (
    <div className="flex items-center justify-center p-12 gap-3">
      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );

  if (isEssential) {
    return (
      <Card className="border-amber-200 bg-amber-50/20 overflow-hidden">
        <div className="h-1 bg-amber-500 w-full" />
        <CardContent className="p-12 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-amber-100 rounded-full">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Feature Not Available</h2>
          <p className="text-sm text-slate-500 max-w-md">
            Database backup and restore is available on the <span className="font-semibold text-amber-700">Professional</span> plan and above.
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            onClick={() => (window.location.href = '/settings?tab=subscription')}
          >
            <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      toast.loading("Preparing backup...");
      const token = session?.user?.accessToken || session?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/db/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.dismiss();
      toast.success("Backup downloaded successfully!");
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file || !file.name.endsWith('.sql')) {
      toast.error('Please select a valid .sql backup file.');
      return;
    }
    setSqlFile(file);
    setRestoreStage('confirm');
    setRestoreError('');
  };

  const cancelRestore = () => {
    setSqlFile(null);
    setRestoreStage('idle');
    setRestoreError('');
    if (sqlFileRef.current) sqlFileRef.current.value = '';
  };

  const confirmRestore = async () => {
    if (!sqlFile) return;
    setRestoreStage('restoring');
    try {
      const token = session?.user?.accessToken || session?.accessToken;
      const formData = new FormData();
      formData.append('sql', sqlFile);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/maintenance/db/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Restore failed");
      setRestoreStage('success');
      toast.success("Database restored successfully!");
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      setRestoreError(err.message || 'Restore failed. Please check the file and try again.');
      setRestoreStage('error');
    }
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* BACKUP CARD */}
        <Card className="border-border/60 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Download Backup</CardTitle>
                <CardDescription>Save a copy of your entire database</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
              <p className="text-sm text-blue-900/70 dark:text-blue-300/70 leading-relaxed">
                Generates a complete <strong>.sql</strong> snapshot containing your entire business data history.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground border-b border-border/40 pb-2">
                <span>FILE FORMAT</span>
                <span className="text-foreground">MySQL Snapshot (.sql)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground border-b border-border/40 pb-2">
                <span>DATA SCOPE</span>
                <span className="text-foreground">Full Database</span>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95 shadow-md"
            >
              {isExporting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Preparing Snapshot...</>
                : <><HardDriveDownload className="w-4 h-4" /> Generate Backup File</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* RESTORE CARD */}
        <Card className="border-border/60 shadow-sm overflow-hidden h-full">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <HardDriveUpload className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Restore System</CardTitle>
                <CardDescription>Upload a backup to restore your data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            
            {/* IDLE */}
            {restoreStage === 'idle' && (
              <div className="space-y-6">
                <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                  <p className="text-sm text-orange-900/70 dark:text-orange-300/70 leading-relaxed">
                    Upload a previously downloaded <strong>.sql</strong> file. This will rebuild the system to that exact point in time.
                  </p>
                </div>
                
                <div
                  className="relative border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/30 transition-all group"
                  onClick={() => sqlFileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
                >
                  <input ref={sqlFileRef} type="file" accept=".sql" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500/10 transition-colors">
                    <HardDriveUpload className="w-6 h-6 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Click or Drag & Drop</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium italic">Select your .sql backup archive</p>
                </div>
              </div>
            )}

            {/* CONFIRM */}
            {restoreStage === 'confirm' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                  <Database className="w-6 h-6 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground truncate">{sqlFile?.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{sqlFile ? `${(sqlFile.size / 1024).toFixed(1)} KB` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={cancelRestore}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-500/5 dark:bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900/80 dark:text-red-400 font-medium leading-relaxed">
                    <strong>Destructive Action:</strong> This will permanently overwrite all current live data. This operation is irreversible.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={cancelRestore} className="flex-1 font-bold h-11 border-border/80">Cancel</Button>
                  <Button onClick={confirmRestore} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-11 gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    <RotateCcw className="w-4 h-4" /> Start Restore
                  </Button>
                </div>
              </div>
            )}

            {/* RESTORING */}
            {restoreStage === 'restoring' && (
              <div className="py-10 space-y-6 text-center animate-in fade-in duration-200">
                <div className="relative inline-block">
                  <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                </div>
                <div>
                  <p className="font-bold text-lg text-foreground uppercase tracking-tight">Restoring System...</p>
                  <p className="text-sm text-muted-foreground mt-1">Please keep this application open</p>
                </div>
                <Progress className="h-2 rounded-full overflow-hidden" value={66} />
              </div>
            )}

            {/* SUCCESS */}
            {restoreStage === 'success' && (
              <div className="py-10 space-y-4 text-center animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="font-bold text-lg text-foreground">Restoration Successful!</p>
                <p className="text-sm text-muted-foreground">The application will refresh in 3 seconds...</p>
              </div>
            )}

            {/* ERROR */}
            {restoreStage === 'error' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col items-center gap-3 p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/40 text-center">
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div>
                    <p className="font-bold text-red-700 dark:text-red-400">Restoration Failed</p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1 font-medium">{restoreError}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={cancelRestore} className="w-full gap-2 font-bold h-11 border-red-500/20 text-red-600 hover:bg-red-500/5">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

      </div>

      <div className="pt-6 border-t border-border/40 flex justify-center">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Tip: Always perform a fresh backup before initiating a system restore.
        </p>
      </div>
    </div>
  );
}
