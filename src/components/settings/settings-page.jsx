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
  History
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
import { useAppSettings } from "@/app/hooks/useAppSettings";

import { PERMISSIONS } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

const sidebarItems = [
  { id: "general", label: "General & Regional", icon: Settings2, desc: "App preferences & localization", permission: PERMISSIONS.SETTINGS_GENERAL },
  { id: "business", label: "Business Identity", icon: Store, desc: "Contact & address details", permission: PERMISSIONS.SETTINGS_BUSINESS },
  { id: "pos", label: "POS Terminal Basis", icon: Monitor, desc: "Checkout & device settings", permission: PERMISSIONS.SETTINGS_POS },
  { id: "communication", label: "Communication Hub", icon: Mail, desc: "Email & SMS gateway setup", permission: PERMISSIONS.SETTINGS_COMMUNICATION },
  { id: "import", label: "Bulk Data Migration", icon: Database, desc: "Synchronize master products", permission: PERMISSIONS.SETTINGS_IMPORT },
  { id: "ai", label: "AI Intelligence", icon: Brain, desc: "Neural processing & OCR nexus", permission: PERMISSIONS.SETTINGS_AI },
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
      // If the URL tab is not allowed, redirect to the first allowed tab
      if (allowedItems.length > 0 && !allowedItems.some(i => i.id === tab)) {
        handleTabChange(allowedItems[0].id);
      } else {
        setActiveTab(tab);
      }
    } else if (allowedItems.length > 0 && !allowedItems.some(i => i.id === activeTab)) {
      // Handle initial state if 'general' is not allowed
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
    <div className="flex bg-white dark:bg-slate-950 transition-colors duration-300">

      {/* ─── SIDEBAR: MINIMALIST PRO ─── */}
      <aside className="w-68 shrink-0 sticky top-4 h-[calc(100vh-120px)] border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 hidden md:flex flex-col overflow-hidden rounded-xl ml-4 my-4 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white leading-none">Settings</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-none">Configuration</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                <span className={cn("text-[13px] font-medium leading-none", isActive ? "text-emerald-600 dark:text-emerald-500" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200")}>
                  {item.label}
                </span>
                {['health', 'communication', 'import', 'ai'].includes(item.id) && business?.subscription_tier === 'Essential' && (
                  <Lock className="w-3 h-3 text-amber-500 ml-auto" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1">
            <span>Inzeedo POS</span>
            <span className="tabular-nums opacity-60">v1.1.9</span>
          </div>
        </div>
      </aside>

      {/* ─── CONTENT AREA: MINIMALIST PRO ─── */}
      <main className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 scroll-smooth">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 h-16 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeItem && (
              <>
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <activeItem.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">{activeItem.label}</h1>
                    {['health', 'communication', 'import', 'ai'].includes(activeItem.id) && business?.subscription_tier === 'Essential' && (
                      <Lock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-none">{activeItem.desc}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto pb-32">
          {activeTab === "general" && hasPermission(PERMISSIONS.SETTINGS_GENERAL) && <GeneralSettings />}
          {activeTab === "business" && hasPermission(PERMISSIONS.SETTINGS_BUSINESS) && <BusinessSettings />}
          {activeTab === "pos" && hasPermission(PERMISSIONS.SETTINGS_POS) && <PosSettings />}
          {activeTab === "communication" && hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION) && <CommunicationSettings />}
          {activeTab === "import" && hasPermission(PERMISSIONS.SETTINGS_IMPORT) && <DataImportSettings />}
          {activeTab === "ai" && hasPermission(PERMISSIONS.SETTINGS_AI) && <AiSettings />}
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