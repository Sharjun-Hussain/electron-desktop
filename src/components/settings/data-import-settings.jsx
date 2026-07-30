"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  HardDriveDownload, HardDriveUpload, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Trash2, RotateCcw,
  Database, Lock, ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 sm:p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">{title}</h3>
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">{description}</p>
      </div>
    </div>
  </div>
);

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
      toast.success("Database restored! Backend is restarting...");
      setTimeout(() => window.location.reload(), 10000);
    } catch (err) {
      setRestoreError(err.message || 'Restore failed. Please check the file and try again.');
      setRestoreStage('error');
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
        <SectionHeader 
          icon={Database} 
          title="Database Management" 
          description="Create backups or restore your entire system from a previous snapshot point." 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
          
          {/* BACKUP CARD */}
          <div className="flex flex-col h-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl overflow-hidden shadow-sm transition-all hover:border-emerald-500/30">
            <div className="bg-slate-100/50 dark:bg-slate-900/50 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-slate-900 dark:text-white">Download Backup</h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Save a copy of your entire database</p>
              </div>
            </div>
            
            <div className="p-5 space-y-6 flex-1 flex flex-col">
              <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-[13px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed font-medium">
                  Generates a complete <strong>.sql</strong> snapshot containing your entire business data history.
                </p>
              </div>
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span>FILE FORMAT</span>
                  <span className="text-slate-900 dark:text-slate-200">MySQL Snapshot (.sql)</span>
                </div>
                <div className="flex items-center justify-between text-[12px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span>DATA SCOPE</span>
                  <span className="text-slate-900 dark:text-slate-200">Full Database</span>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-lg shadow-sm transition-all mt-auto"
              >
                {isExporting
                  ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Preparing Snapshot...</>
                  : <><HardDriveDownload className="w-4 h-4 mr-2" /> Generate Backup File</>
                }
              </Button>
            </div>
          </div>

          {/* RESTORE CARD */}
          <div className="flex flex-col h-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl overflow-hidden shadow-sm transition-all hover:border-emerald-500/30">
            <div className="bg-slate-100/50 dark:bg-slate-900/50 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                <HardDriveUpload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-slate-900 dark:text-white">Restore System</h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">Upload a backup to restore your data</p>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              
              {/* IDLE */}
              {restoreStage === 'idle' && (
                <div className="space-y-6 flex-1 flex flex-col">
                  <div className="bg-orange-50 dark:bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-[13px] text-orange-900/80 dark:text-orange-300/80 leading-relaxed font-medium">
                      Upload a previously downloaded <strong>.sql</strong> file. This will rebuild the system to that exact point in time.
                    </p>
                  </div>
                  
                  <div
                    className="flex-1 relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group flex flex-col items-center justify-center min-h-[140px]"
                    onClick={() => sqlFileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]); }}
                  >
                    <input ref={sqlFileRef} type="file" accept=".sql" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-orange-500/10 transition-colors">
                      <HardDriveUpload className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white">Click or Drag & Drop</p>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium italic">Select your .sql backup archive</p>
                  </div>
                </div>
              )}

              {/* CONFIRM */}
              {restoreStage === 'confirm' && (
                <div className="space-y-5 animate-in fade-in duration-200 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <Database className="w-6 h-6 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{sqlFile?.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{sqlFile ? `${(sqlFile.size / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={cancelRestore}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[13px] text-red-900/80 dark:text-red-400 font-medium leading-relaxed">
                      <strong>Destructive Action:</strong> This will permanently overwrite all current live data. This operation is irreversible.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2 mt-auto">
                    <Button variant="outline" onClick={cancelRestore} className="flex-1 font-bold h-11 text-[13px]">Cancel</Button>
                    <Button onClick={confirmRestore} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] h-11 transition-all">
                      <RotateCcw className="w-4 h-4 mr-2" /> Start Restore
                    </Button>
                  </div>
                </div>
              )}

              {/* RESTORING */}
              {restoreStage === 'restoring' && (
                <div className="py-10 space-y-6 text-center animate-in fade-in duration-200 flex-1 flex flex-col justify-center">
                  <div className="relative inline-block mx-auto">
                    <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-900 dark:text-white uppercase tracking-tight">Restoring System...</h4>
                    <p className="text-[12px] text-slate-500 mt-1">Please keep this application open</p>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-orange-500 h-1.5 rounded-full w-2/3 animate-pulse"></div>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {restoreStage === 'success' && (
                <div className="py-10 space-y-4 text-center animate-in zoom-in-95 duration-200 flex-1 flex flex-col justify-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-[15px] text-slate-900 dark:text-white">Restoration Successful!</h4>
                  <p className="text-[12px] text-slate-500">Backend is restarting — refreshing in 10 seconds...</p>
                </div>
              )}

              {/* ERROR */}
              {restoreStage === 'error' && (
                <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col">
                  <div className="flex flex-col items-center gap-3 p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/40 text-center flex-1 justify-center">
                    <XCircle className="w-10 h-10 text-red-500" />
                    <div>
                      <h4 className="font-bold text-[15px] text-red-700 dark:text-red-400">Restoration Failed</h4>
                      <p className="text-[12px] text-red-600/70 dark:text-red-400/70 mt-1 font-medium">{restoreError}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={cancelRestore} className="w-full gap-2 font-bold h-11 text-[13px] border-red-500/20 text-red-600 hover:bg-red-500/5 mt-auto">
                    <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                  </Button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      <div className="pt-2 flex justify-center">
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Tip: Always perform a fresh backup before initiating a system restore.
        </p>
      </div>
    </div>
  );
}
