"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Store,
  Receipt,
  Settings2,
  Monitor,
  Mail,
  Database,
  Settings,
  ChevronRight,
  Activity,
  Brain,
  Sparkles,
  FileText,
  Gift,
  Lock,
  History,
  Barcode as BarcodeIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import sub-components
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { GeneralSettings } from "./general-settings";
import { BusinessSettings } from "./business-settings";
import { PosSettings } from "./pos-settings";
import { CommunicationSettings } from "./communication-settings";
import { DataImportSettings } from "./data-import-settings";
import { SystemHealthSettings } from "./system-health-settings";
import { AiSettings } from "./ai-settings";
import { ReportSettings } from "./report-settings";
import { LoyaltySettings } from "./loyalty-settings";
import { BackupSettings } from "./backup-settings";
import { SubscriptionDetails } from "./subscription-details";
import { ReleaseNotes } from "./release-notes";
import { BarcodeSettings } from "./barcode-settings";
import { useAppSettings } from "@/app/hooks/useAppSettings";

import { PERMISSIONS } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

const sidebarItems = [
  { id: "general", label: "General & Regional", icon: Settings2, desc: "App preferences & localization", permission: PERMISSIONS.SETTINGS_GENERAL },
  { id: "business", label: "Business Identity", icon: Store, desc: "Contact & address details", permission: PERMISSIONS.SETTINGS_BUSINESS },
  { id: "pos", label: "POS Terminal Basis", icon: Monitor, desc: "Checkout & device settings", permission: PERMISSIONS.SETTINGS_POS },
  { id: "communication", label: "Communication Hub", icon: Mail, desc: "Email & SMS gateway setup", permission: PERMISSIONS.SETTINGS_COMMUNICATION },
  { id: "import", label: "Database Management", icon: Database, desc: "System backups & restoration nexus", permission: PERMISSIONS.SETTINGS_IMPORT },
  { id: "ai", label: "AI Intelligence", icon: Brain, desc: "Neural processing & OCR nexus", permission: PERMISSIONS.SETTINGS_AI },
  { id: "barcode", label: "Barcode Setup", icon: BarcodeIcon, desc: "Label dimensions & layout nexus", permission: PERMISSIONS.SETTINGS_POS },
  { id: "loyalty", label: "Loyalty System", icon: Gift, desc: "Points, rewards & customer nexus", permission: PERMISSIONS.SETTINGS_GENERAL },
  { id: "backup", label: "Backup", icon: Database, desc: "Data snapshots & security nexus", permission: PERMISSIONS.BACKUP_CONFIG },
  { id: "subscription", label: "Plan & Subscription", icon: Sparkles, desc: "Billing details & resource limits", permission: PERMISSIONS.SETTINGS_GENERAL },
  { id: "health", label: "System Health", icon: Activity, desc: "Database optimization & metrics", permission: PERMISSIONS.SETTINGS_HEALTH },
  { id: "changelog", label: "Release Notes", icon: History, desc: "Software version history", permission: PERMISSIONS.SETTINGS_GENERAL },
];

export function SettingsPage() {
  const { data: session } = useSession();
  const { hasPermission } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");

  const { business } = useAppSettings();
  const isLoyaltyEnabled = business?.loyalty_enabled;
  const isBackupEnabled = business?.backup_enabled;

  // Filter sidebar items based on permissions and feature flags
  const allowedItems = useMemo(() => {
    return sidebarItems.filter(item => {
      if (item.id === "loyalty" && !isLoyaltyEnabled) return false;
      if (item.id === "backup" && !isBackupEnabled) return false;
      return hasPermission(item.permission);
    });
  }, [hasPermission, isLoyaltyEnabled, isBackupEnabled]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      if (allowedItems.length > 0 && !allowedItems.some(i => i.id === tab)) {
        handleTabChange(allowedItems[0].id);
      } else {
        setActiveTab(tab);
      }
    } else if (allowedItems.length > 0 && !allowedItems.some(i => i.id === activeTab)) {
      handleTabChange(allowedItems[0].id);
    }
  }, [searchParams, allowedItems]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams();
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activeItem = sidebarItems.find(i => i.id === activeTab);

  return (
    <div className="flex bg-white dark:bg-slate-950 transition-colors duration-300 min-h-screen">

      {/* ─── SIDEBAR: MINIMALIST PRO ─── */}
      <aside className="w-64 shrink-0 sticky top-0 h-screen border-r border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/50 hidden md:flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Settings</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto thin-scrollbar pb-10">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                  isActive
                    ? "bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/30"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                )} />
                <div className="flex flex-col items-start text-left">
                  <span className={cn(
                    "text-[13px] font-semibold leading-none",
                    isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                  )}>
                    {item.label}
                  </span>
                </div>
                {['health', 'communication', 'import', 'ai'].includes(item.id) && business?.subscription_tier === 'Essential' && (
                  <Lock className="w-3 h-3 text-amber-500 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-900">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            <span>Inzeedo Core</span>
            <span className="tabular-nums opacity-60">v1.2.2</span>
          </div>
        </div>
      </aside>

      {/* ─── CONTENT AREA: MINIMALIST PRO ─── */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 scroll-smooth">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-900 px-8 h-14 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeItem && (
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white">{activeItem.label}</h1>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">{activeItem.desc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-8 md:p-10 max-w-7xl w-full mx-auto pb-32">
          {activeTab === "general" && hasPermission(PERMISSIONS.SETTINGS_GENERAL) && <GeneralSettings />}
          {activeTab === "business" && hasPermission(PERMISSIONS.SETTINGS_BUSINESS) && <BusinessSettings />}
          {activeTab === "pos" && hasPermission(PERMISSIONS.SETTINGS_POS) && <PosSettings />}
          {activeTab === "communication" && hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION) && <CommunicationSettings />}
          {activeTab === "import" && hasPermission(PERMISSIONS.SETTINGS_IMPORT) && <DataImportSettings />}
          {activeTab === "ai" && hasPermission(PERMISSIONS.SETTINGS_AI) && <AiSettings />}
          {activeTab === "barcode" && hasPermission(PERMISSIONS.SETTINGS_POS) && <BarcodeSettings />}
          {activeTab === "loyalty" && isLoyaltyEnabled && <LoyaltySettings />}
          {activeTab === "backup" && isBackupEnabled && <BackupSettings />}
          {activeTab === "subscription" && <SubscriptionDetails />}
          {activeTab === "health" && hasPermission(PERMISSIONS.SETTINGS_HEALTH) && <SystemHealthSettings />}
          {activeTab === "changelog" && <ReleaseNotes />}
        </div>
      </main>
    </div>
  );
}