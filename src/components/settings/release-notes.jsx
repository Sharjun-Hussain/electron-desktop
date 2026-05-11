"use client";

import React from "react";
import { 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Rocket,
  ArrowRight,
  ShieldAlert,
  Users,
  Settings2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ReleaseNotes() {
  const releases = [
    {
      version: "1.2.1",
      date: "May 11, 2026",
      title: "Data Maintenance & Structural Snapshots",
      type: "Patch",
      changes: [
        {
          category: "System Maintenance",
          icon: Zap,
          items: [
            "Resolved SQL snapshot generation failure by implementing automated directory initialization and path sanitization.",
            "Hardened shell command execution for database backups with secure credential quoting and enhanced diagnostics.",
            "Improved database restoration reliability for large-scale structural snapshots."
          ]
        }
      ]
    },
    {
      version: "1.2.0",
      date: "May 11, 2026",
      title: "Major Milestone: Multi-Window Ecosystem",
      type: "Major Update",
      changes: [
        {
          category: "Navigation Architecture",
          icon: Rocket,
          items: [
            "Implemented Full Multi-Window Support with native 'Open in New Window' context menu functionality.",
            "Engineered root-based window initialization with client-side route hydration to ensure asset integrity across deep links.",
            "Synchronized authentication state across all independent windows via shared persistent partitions."
          ]
        },
        {
          category: "UX & Stability",
          icon: CheckCircle2,
          items: [
            "Refactored back-button logic with hierarchical module awareness to prevent application crashes during deep navigation.",
            "Standardized native desktop context menu actions (Copy/Paste/Cut/Select All)."
          ]
        }
      ]
    },
    {
      version: "1.1.9",
      date: "May 11, 2026",
      title: "Multi-Window Asset Integrity",
      type: "Patch",
      changes: [
        {
          category: "Stability Fixes",
          icon: Zap,
          items: [
            "Resolved 'Broken Window' issue by implementing root-based initialization with auth-gated internal redirects.",
            "Fixed relative path resolutions for JS/CSS in new windows within static production environments."
          ]
        }
      ]
    },
    {
      version: "1.1.8",
      date: "May 11, 2026",
      title: "Desktop Multitasking",
      type: "Patch",
      changes: [
        {
          category: "Performance & Features",
          icon: Rocket,
          items: [
            "Implemented native context-menu 'Open in New Window' for enhanced multi-tasking across all application modules.",
            "Optimized multi-window session persistence using dedicated partitions for real-time authentication state sharing."
          ]
        }
      ]
    },
    {
      version: "1.1.7",
      date: "May 11, 2026",
      title: "Navigation Stability & Data Integrity",
      type: "Patch",
      changes: [
        {
          category: "Bug Fixes",
          icon: Zap,
          items: [
            "Resolved application crashes during 'Back' button navigation by implementing hierarchical route parsing.",
            "Fixed critical JavaScript exceptions (ReferenceError) in Purchase Order detail views during attachment management.",
            "Verified and standardized Main/Sub Category Sales reports with audited revenue share calculations."
          ]
        }
      ]
    },
    {
      version: "1.1.5",
      date: "May 10, 2026",
      title: "Settings Standardization & UI Parity",
      type: "Patch",
      changes: [
        {
          category: "Settings Architecture",
          icon: Settings2,
          items: [
            "Standardized Settings UI across Web and Desktop with the new 'Floating Action Hub'.",
            "Enhanced Dark Mode styling for Organization management and standardized input field aesthetics.",
            "Synchronized 'Business Settings' and 'Report Settings' logic between platforms."
          ]
        },
        {
          category: "Security & Parity",
          icon: ShieldCheck,
          items: [
            "Enforced stricter RBAC (Role-Based Access Control) for administrative settings updates.",
            "Optimized settings tab transitions and improved responsive layouts."
          ]
        }
      ]
    },
    {
      version: "1.1.4",
      date: "May 10, 2026",
      title: "Offline Stability & Structural Integrity",
      type: "Patch",
      changes: [
        {
          category: "Offline-First POS",
          icon: ShieldCheck,
          items: [
            "Decoupled core POS operations from internet dependency for air-gapped environment stability.",
            "Prioritized local MySQL backend for sales processing and stock management.",
            "Standardized 'Export Actions' (Excel/CSV) across Inventory Catalog and Units Registry."
          ]
        },
        {
          category: "Structural Bug Fixes",
          icon: Zap,
          items: [
            "Resolved application crashes in Organization Edit workflow related to form state restoration.",
            "Implemented safe date parsing for subscription expiry to prevent RangeError crashes.",
            "Removed redundant 'Refresh Application' UI from Error Boundaries for smoother recovery."
          ]
        }
      ]
    },
    {
      version: "1.1.2",
      date: "May 10, 2026",
      title: "UI Standardisation & Insights Refinement",
      type: "Patch",
      changes: [
        {
          category: "UI/UX Enhancements",
          icon: Rocket,
          items: [
            "Renamed 'Inventory Insights' to 'Stock Reports' for clearer functional identification.",
            "Renamed 'Intelligent Insights' to 'Advanced Reports' to simplify analytical navigation.",
            "Standardized Supplier management interface with clean shadcn dropdowns and filters.",
            "Enhanced bulk action usability by implementing selective interaction based on row selection."
          ]
        }
      ]
    },
    {
      version: "1.1.1",
      date: "May 10, 2026",
      title: "Authentication & Parity Update",
      type: "Patch",
      changes: [
        {
          category: "Security & Stability",
          icon: ShieldCheck,
          items: [
            "Resolved authentication session hydration issues causing redirect loops.",
            "Improved consistency between web and desktop session guards.",
            "Optimized route guarding for better performance on slow networks."
          ]
        }
      ]
    },
    {
      version: "1.1.0",
      date: "May 09, 2026",
      title: "Organization Empowerment & UI Refinement",
      type: "Major Update",
      changes: [
        {
          category: "Administrative",
          icon: ShieldCheck,
          items: [
            "Added 'Reset Admin Password' functionality for Super Admins to securely manage organization credentials.",
            "Implemented PATCH-based API routing for administrative actions to ensure transaction integrity.",
            "Enhanced Organization Edit workflow with real-time plan tier synchronization."
          ]
        },
        {
          category: "UI/UX Enhancements",
          icon: Rocket,
          items: [
            "Renamed 'Suppliers' to 'Vendor Registry' for better industry alignment.",
            "Renamed 'Branch Hierarchy' to 'Branch Registry' to standardize resource management terminology.",
            "Standardized dropdown selectors across management sheets for a more cohesive experience."
          ]
        },
        {
          category: "Security & Stability",
          icon: ShieldAlert,
          items: [
            "Resolved 403 Forbidden access issues by refining subscription status enforcement during login.",
            "Optimized backend route ordering to prevent parameterized route shadowing.",
            "Enhanced audit logging for sensitive administrative actions."
          ]
        }
      ]
    },
    {
      version: "1.0.2",
      date: "May 08, 2026",
      title: "Core Stability Patch",
      type: "Patch",
      changes: [
        {
          category: "Bug Fixes",
          icon: Zap,
          items: [
            "Fixed application visibility issues on Linux distributions.",
            "Resolved licensing activation proxy conflicts (HTTP to HTTPS migration).",
            "Stabilized desktop database bootstrapping wizard."
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Software Evolution</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tracking the progress of Inzeedo POS Core</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Current v1.2.1</span>
        </div>
      </div>

      <div className="space-y-6">
        {releases.map((release, idx) => (
          <Card key={release.version} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm relative group">
            {idx === 0 && (
              <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                <Rocket className="w-24 h-24" />
              </div>
            )}
            
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge className={release.type === 'Major Update' ? 'bg-emerald-500 text-white border-none' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none'}>
                      {release.version}
                    </Badge>
                    <span className="text-xs font-bold text-slate-400">{release.date}</span>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">
                    {release.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {release.changes.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <group.icon className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{group.category}</h4>
                  </div>
                  <ul className="space-y-2.5 ml-1">
                    {group.items.map((item, iIdx) => (
                      <li key={iIdx} className="flex items-start gap-3">
                        <div className="mt-1.5 size-1.5 rounded-full bg-emerald-500/40 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:border-emerald-500/30 transition-all">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">System Engine Specification</p>
            <p className="text-[10px] text-slate-500 mt-1">Core build 1.2.1.0511 (Stable)</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}
