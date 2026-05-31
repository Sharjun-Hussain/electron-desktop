"use client";
 
import React from "react";
import { 
  Store, 
  MessageSquare, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  Zap
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
 
export default function IntegrationCards() {
  const { business } = useAppSettings();
  const router = useRouter();
 
  // Only show if at least one integration is enabled
  if (
    !business?.shopify_enabled && 
    !business?.whatsapp_enabled && 
    !business?.textlk_enabled && 
    !business?.custom_ecommerce_enabled
  ) {
    return null;
  }
 
  const integrations = [
    {
      id: "shopify",
      name: "Shopify E-commerce",
      enabled: business?.shopify_enabled,
      icon: Store,
      color: "emerald",
      href: "/settings/shopify",
      description: "Sync products and inventory with your online store.",
      stats: "Real-time Sync Active"
    },
    {
      id: "custom-ecommerce",
      name: "Custom E-commerce",
      enabled: business?.custom_ecommerce_enabled,
      icon: Store,
      color: "purple",
      href: "/settings/custom-ecommerce",
      description: "Direct headless e-commerce sync and real-time inventory management.",
      stats: "Headless Engine Active"
    },
    {
      id: "whatsapp",
      name: "WhatsApp CRM",
      enabled: business?.whatsapp_enabled,
      icon: MessageSquare,
      color: "blue",
      href: "/crm/whatsapp",
      description: "Direct messaging and customer engagement platform.",
      stats: "CRM Engine Running"
    },
    {
      id: "textlk",
      name: "Text.lk SMS",
      enabled: business?.textlk_enabled,
      icon: MessageSquare,
      color: "indigo",
      href: "/crm/text-lk",
      description: "Sri Lankan bulk SMS broadcasting & campaign portal.",
      stats: "SMS Engine Ready"
    }
  ].filter(i => i.enabled);
 
  return (
    <div className="dashboard-item animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
          <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Active Integrations</h2>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium opacity-80">Manage your connected external ecosystems.</p>
        </div>
      </div>
 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div 
            key={item.id}
            onClick={() => router.push(item.href)}
            className={cn(
              "group relative bg-card hover:bg-muted/30 border border-border/60 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-500 cursor-pointer overflow-hidden",
              item.color === 'emerald' ? "hover:border-emerald-500/30" : 
              item.color === 'blue' ? "hover:border-blue-500/30" : 
              item.color === 'purple' ? "hover:border-purple-500/30" : 
              "hover:border-indigo-500/30"
            )}
          >
            {/* Background Decoration */}
            <div className={cn(
                "absolute -right-8 -top-8 w-32 h-32 opacity-5 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12",
                item.color === 'emerald' ? "bg-emerald-500" : 
                item.color === 'blue' ? "bg-blue-500" : 
                item.color === 'purple' ? "bg-purple-500" : 
                "bg-indigo-500"
            )} />
 
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                  item.color === 'emerald' 
                    ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : item.color === 'blue'
                    ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : item.color === 'purple'
                    ? "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    : "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "font-bold text-lg text-foreground transition-colors",
                      item.color === 'emerald' ? "group-hover:text-emerald-600" : 
                      item.color === 'blue' ? "group-hover:text-blue-600" : 
                      item.color === 'purple' ? "group-hover:text-purple-600" : 
                      "group-hover:text-indigo-600"
                    )}>
                      {item.name}
                    </h3>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full border",
                      item.color === 'emerald' 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : item.color === 'blue'
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                        : item.color === 'purple'
                        ? "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-400"
                        : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                    )}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 font-medium leading-relaxed max-w-[280px]">
                    {item.description}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "rounded-full transition-all text-muted-foreground group-hover:text-white",
                  item.color === 'emerald' ? "group-hover:bg-emerald-500" : 
                  item.color === 'blue' ? "group-hover:bg-blue-500" : 
                  item.color === 'purple' ? "group-hover:bg-purple-500" : 
                  "group-hover:bg-indigo-500"
                )}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
 
            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse", 
                      item.color === 'emerald' ? "bg-emerald-500" : 
                      item.color === 'blue' ? "bg-blue-500" : 
                      item.color === 'purple' ? "bg-purple-500" : 
                      "bg-indigo-500"
                    )} />
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{item.stats}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300",
                  item.color === 'emerald' ? "text-emerald-600 dark:text-emerald-400" : 
                  item.color === 'blue' ? "text-blue-600 dark:text-blue-400" : 
                  item.color === 'purple' ? "text-purple-600 dark:text-purple-400" : 
                  "text-indigo-600 dark:text-indigo-400"
                )}>
                    <span>Manage Connection</span>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
