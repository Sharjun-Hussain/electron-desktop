"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { 
  Save, 
  Download, 
  Loader2, 
  Database, 
  Mail, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  History,
  CheckCircle2,
  Settings
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Lock, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BackupSettings() {
  const { hasPermission } = usePermission();
  const { useBusinessSettings, updateBackupConfig, manualDownloadBackup } = useSettings();
  const { data: response, isLoading } = useBusinessSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { business } = useAppSettings();
  
  const isEssential = business?.subscription_tier === 'Essential';
  const isProfessional = business?.subscription_tier === 'Professional';
  const isEnterprise = business?.subscription_tier === 'Enterprise';

  // Essential: No backups at all
  // Professional: Manual only
  // Enterprise: Manual + Automatic

  const canUseManual = !isEssential;
  const canUseAuto = isEnterprise; // Only Enterprise for auto backup per request (Professional is "premium" here but only manual allowed)
  
  const [formData, setFormData] = useState({
    auto_backup_enabled: false,
    backup_frequency: 'Weekly',
    backup_email: ''
  });

  useEffect(() => {
    if (response?.data) {
      const org = response.data;
      setFormData({
        auto_backup_enabled: !!org.auto_backup_enabled,
        backup_frequency: org.backup_frequency || 'Weekly',
        backup_email: org.backup_email || org.email || ''
      });
    }
  }, [response]);

  const handleSave = async () => {
    if (!hasPermission(PERMISSIONS.BACKUP_CONFIG)) {
      toast.error("Unauthorized: You do not have permission to modify backup configurations");
      return;
    }
    setIsSaving(true);
    const result = await updateBackupConfig(formData);
    if (result.success) {
      toast.success("Backup configuration synchronized successfully");
    } else {
      toast.error(result.error || "Failed to synchronize backup configuration");
    }
    setIsSaving(false);
  };

  const handleDownload = async () => {
    if (!hasPermission(PERMISSIONS.BACKUP_MANUAL)) {
      toast.error("Unauthorized: You do not have permission to trigger manual backups");
      return;
    }
    setIsDownloading(true);
    toast.info("Generating secure data snapshot. This may take a moment...");
    const result = await manualDownloadBackup();
    if (!result.success) {
      toast.error(result.error || "Failed to generate manual backup");
    } else {
      toast.success("Snapshot generated and download initialized.");
    }
    setIsDownloading(false);
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col mb-5">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-indigo-500/10">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{title}</h3>
      </div>
      {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 ml-9 leading-none">{description}</p>}
    </div>
  );

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>;

  const org = response?.data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Feature Status Banner */}
      {isEssential && (
        <Card className="border-amber-200 bg-amber-50/20 overflow-hidden mb-6">
          <div className="h-1 bg-amber-500 w-full" />
          <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 leading-tight">Data Redundancy Restricted</h2>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Advanced backup protocols are premium features.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-1">
              <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-none">Professional</div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-tight">Manual snapshots and data exports enabled.</p>
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-none">Enterprise</div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-tight">Automated hourly snapshots and cloud sync.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button size="sm" className="h-8 px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 text-[10px] font-bold" onClick={() => (window.location.href = '/settings?tab=subscription')}>
                <ArrowUpCircle className="w-3.5 h-3.5 mr-2" /> Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEssential ? (
        <div className="opacity-40 grayscale pointer-events-none select-none space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <SectionHeader icon={Download} title="Manual Data Snapshot" description="Generate and download a complete state archive of your organization" />
              <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                    <h4 className="text-sm font-bold leading-none">Instant Export Protocol</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                    Creates a comprehensive ZIP archive containing JSON blueprints of every record associated with your organization.
                  </p>
                </div>
                <Button disabled className="h-11 px-8 bg-slate-200 text-slate-400">Generate Snapshot</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden opacity-50">
            <CardContent className="p-6">
              <SectionHeader icon={Settings} title="Automation Protocol" description="Configure periodic snapshots and automated email dispatch" />
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-400">Active Automation</h4>
                  <p className="text-[11px] text-slate-400">Enable scheduled background processing</p>
                </div>
                <div className="w-11 h-6 rounded-full bg-slate-200 relative" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Manual Snapshot Section */}
          <Card className={cn(
            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden",
            !canUseManual && "opacity-50 pointer-events-none"
          )}>
            <CardContent className="p-6">
              <SectionHeader icon={Download} title="Manual Data Snapshot" description="Generate and download a complete state archive of your organization" />
              
              <div className="p-5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Instant Export Protocol</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                    Creates a comprehensive ZIP archive containing JSON blueprints of every record associated with your organization. Highly recommended before major bulk operations.
                  </p>
                </div>
                
                <Button 
                  disabled={(!org?.manual_download_enabled && !hasPermission(PERMISSIONS.BACKUP_ADMIN)) || isDownloading || !hasPermission(PERMISSIONS.BACKUP_MANUAL) || !canUseManual}
                  onClick={handleDownload}
                  className="w-full md:w-auto h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-2 rounded-lg transition-all active:scale-95 shadow-sm"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Generate Snapshot
                </Button>
              </div>

              {!org?.manual_download_enabled && !hasPermission(PERMISSIONS.BACKUP_ADMIN) && (
                 <p className="text-[10px] text-rose-500 font-bold mt-3 flex items-center gap-1.5 ml-1">
                    <AlertCircle className="w-3 h-3" /> Manual downloads are disabled by Super Admin policy.
                 </p>
              )}
              {/* ... other manual messages ... */}
            </CardContent>
          </Card>

          {/* Automation Protocol Section */}
          <Card className={cn(
            "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden transition-opacity duration-300",
            (!org?.backup_enabled || !hasPermission(PERMISSIONS.BACKUP_CONFIG) || !canUseAuto) && "opacity-50 pointer-events-none"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                 <SectionHeader icon={Settings} title="Automation Protocol" description="Configure periodic snapshots and automated email dispatch" />
                 {!canUseAuto && !isEssential && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] h-5 px-2 font-black uppercase tracking-tighter">Enterprise Exclusive</Badge>
                 )}
              </div>
              
              <div className="space-y-6">
                {/* Toggle Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/20 bg-indigo-50/20 dark:bg-indigo-500/5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Automation</h4>
                    <p className="text-[11px] text-slate-500">Enable scheduled background processing for this organization</p>
                  </div>
                  <div 
                    className={cn(
                      "w-11 h-6 rounded-full relative cursor-pointer transition-all duration-300",
                      formData.auto_backup_enabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700",
                      !canUseAuto && "cursor-not-allowed opacity-50"
                    )}
                    onClick={() => canUseAuto && updateField('auto_backup_enabled', !formData.auto_backup_enabled)}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                      formData.auto_backup_enabled ? "left-6" : "left-1"
                    )} />
                  </div>
                </div>

                {/* Config Fields */}
                <div className={cn(
                  "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300",
                  !formData.auto_backup_enabled && "opacity-40 grayscale"
                )}>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Recipient Email
                    </Label>
                    <Input 
                      value={formData.backup_email} 
                      onChange={(e) => updateField('backup_email', e.target.value)} 
                      disabled={!formData.auto_backup_enabled}
                      placeholder="e.g. backup@organization.com" 
                      className="h-10 rounded-md border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 font-medium" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Snapshot Frequency
                    </Label>
                    <Select 
                      value={formData.backup_frequency} 
                      onValueChange={(v) => updateField('backup_frequency', v)}
                      disabled={!formData.auto_backup_enabled}
                    >
                      <SelectTrigger className="h-10 rounded-md border-slate-200 dark:border-slate-800 focus:ring-indigo-500 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                        <SelectItem value="Daily" className="text-xs font-medium">Every 24 Hours (Daily)</SelectItem>
                        <SelectItem value="Weekly" className="text-xs font-medium">Every 7 Days (Weekly)</SelectItem>
                        <SelectItem value="Monthly" className="text-xs font-medium">Every 30 Days (Monthly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Last Execution Info */}
                {org?.last_backup_date && (
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Last Snapshot Success
                      </div>
                      <div className="tabular-nums">
                        {new Date(org.last_backup_date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                      </div>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          {canUseAuto && org?.backup_enabled && hasPermission(PERMISSIONS.BACKUP_CONFIG) && (
            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 active:scale-95 transition-all shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Backup Protocol
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
