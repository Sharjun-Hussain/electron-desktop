"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  HardDriveDownload, HardDriveUpload, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Trash2, RotateCcw,
  Database, Lock, ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";

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
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">

      {/* BACKUP CARD */}
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <HardDriveDownload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Download Backup</h3>
              <p className="text-sm text-muted-foreground">Save a copy of your entire database</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This will download a complete <strong>.sql</strong> file containing all your data — products, sales, customers, settings, and more. Keep this file safe as it can be used to restore your system at any time.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExporting
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Preparing...</>
              : <><HardDriveDownload className="w-4 h-4" /> Download Backup</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* RESTORE CARD */}
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
              <HardDriveUpload className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Restore from Backup</h3>
              <p className="text-sm text-muted-foreground">Upload a .sql backup file to restore your system</p>
            </div>
          </div>

          {/* IDLE */}
          {restoreStage === 'idle' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a previously downloaded <strong>.sql</strong> backup file. Your system will be fully restored to the state when that backup was created.
              </p>
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => sqlFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
              >
                <input ref={sqlFileRef} type="file" accept=".sql" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
                <HardDriveUpload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to select a backup file</p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop your .sql file here</p>
              </div>
            </div>
          )}

          {/* CONFIRM */}
          {restoreStage === 'confirm' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                <Database className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{sqlFile?.name}</p>
                  <p className="text-xs text-muted-foreground">{sqlFile ? `${(sqlFile.size / 1024).toFixed(1)} KB` : ''}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={cancelRestore}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Are you sure?</strong> This will replace all current data with the data from this backup. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={cancelRestore} className="flex-1">Cancel</Button>
                <Button onClick={confirmRestore} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <RotateCcw className="w-4 h-4" /> Yes, Restore
                </Button>
              </div>
            </div>
          )}

          {/* RESTORING */}
          {restoreStage === 'restoring' && (
            <div className="py-6 space-y-4 text-center animate-in fade-in duration-200">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
              <div>
                <p className="font-medium text-foreground">Restoring your database...</p>
                <p className="text-sm text-muted-foreground mt-1">Please do not close this window</p>
              </div>
              <Progress className="h-1.5" />
            </div>
          )}

          {/* SUCCESS */}
          {restoreStage === 'success' && (
            <div className="py-6 space-y-3 text-center animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-medium text-foreground">Restore Complete!</p>
              <p className="text-sm text-muted-foreground">The page will reload shortly...</p>
            </div>
          )}

          {/* ERROR */}
          {restoreStage === 'error' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/40">
                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Restore failed</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{restoreError}</p>
                </div>
              </div>
              <Button variant="outline" onClick={cancelRestore} className="w-full gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center pb-4">
        💡 Tip: Download a fresh backup before restoring to avoid losing recent data.
      </p>
    </div>
  );
}
