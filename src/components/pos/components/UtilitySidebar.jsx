"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  History, List, FileText, Search,
  BarChart3, ShoppingCart, Package, Zap, TrendingUp
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const UTILITY_ACTIONS = [
  { label: "Hold Sale", key: "hold", icon: ShoppingCart, color: "text-amber-500", bg: "bg-amber-500/10", shortcut: "F3" },
  { label: "Hold List", key: "holdList", icon: List, color: "text-blue-500", bg: "bg-blue-500/10", shortcut: "F4" },
  { label: "Sale List", key: "saleList", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10", shortcut: "F7" },
  { label: "Check Stock", key: "checkStock", icon: Search, color: "text-purple-500", bg: "bg-purple-500/10", shortcut: "F9" },
  { label: "Open Drawer", key: "openDrawer", icon: Zap, color: "text-orange-500", bg: "bg-orange-500/10", shortcut: "F11" },
  { label: "Sales by Product", key: "salesByProduct", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { label: "Reports", key: "reports", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-500/10" },
  { label: "Inventory", key: "inventory", icon: Package, color: "text-slate-500", bg: "bg-slate-500/10" },
];

export const UtilitySidebar = memo(({ onAction, cartEmpty, isRestaurant }) => {
  return (
    <aside className={cn(
      "fixed right-0 bottom-0 z-40 w-24 flex flex-col items-center py-2 bg-card/95 backdrop-blur-2xl border-l border-border/40 shadow-[-15px_0_40px_-20px_rgba(0,0,0,0.15)] overflow-y-auto custom-scrollbar",
      isRestaurant ? "top-0" : "top-[65px]"
    )}>
      <div className="flex-1 flex flex-col justify-center space-y-6 w-full px-2">
        <TooltipProvider delayDuration={0}>
          {UTILITY_ACTIONS.map((action) => {
            const Icon = action.icon;

            return (
              <div key={action.key} className="flex flex-col items-center gap-1 group shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-14 w-14 flex items-center justify-center rounded-2xl transition-all duration-300",
                        action.bg,
                        action.color,
                        " active:scale-80 shadow-sm border border-transparent hover:border-border/50"
                      )}
                      onClick={() => onAction(action.key)}
                    >
                      <Icon size={24} className="min-w-8 min-h-8" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="font-bold bg-slate-900 text-white border-none shadow-xl">
                    {action.label} {action.shortcut && `(${action.shortcut})`}
                  </TooltipContent>
                </Tooltip>

                <div className="flex flex-col items-center">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-tight text-center leading-tight transition-colors",
                    action.color,
                    "opacity-60 group-hover:opacity-100 px-0.5"
                  )}>
                    {action.label.split(' ')[0]}<br />
                    {action.label.split(' ')[1] || ''}
                  </span>
                  {action.shortcut && (
                    <kbd className="mt-1 px-1.5 py-0.5 bg-muted/50 border border-border/40 rounded text-[9px] font-black text-muted-foreground/60 uppercase">
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              </div>
            );
          })}
        </TooltipProvider>
      </div>
    </aside>
  );
});

UtilitySidebar.displayName = "UtilitySidebar";
