"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Sparkles } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function TeamSwitcher({ teams }) {
  const { isMobile, state } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-16 transition-all duration-300 rounded-2xl group",
                "bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/50 hover:border-blue-500/30 shadow-sm",
                "data-[state=open]:bg-slate-800/80 data-[state=open]:border-blue-500/40"
              )}
            >
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden relative">
                {activeTeam.logo ? (
                  <activeTeam.logo className="size-5 relative z-10" />
                ) : (
                  <Sparkles className="size-5 relative z-10" />
                )}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {state !== "collapsed" && (
                <div className="flex flex-1 flex-col truncate gap-0.5 ml-1">
                  <span className="truncate text-[13px] font-black text-white tracking-tight">
                    {activeTeam.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                      {activeTeam.plan} SYSTEM
                    </span>
                  </div>
                </div>
              )}
              
              {state !== "collapsed" && (
                <ChevronsUpDown className="ml-auto size-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-2xl bg-slate-900 border-slate-800 p-2 shadow-2xl shadow-black/50"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-2">
              Organization Pulse
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800 mx-2" />
            {teams.map((team, index) => (
              <DropdownMenuItem 
                key={team.name} 
                onClick={() => setActiveTeam(team)} 
                className="gap-3 p-3 rounded-xl focus:bg-slate-800 focus:text-white group"
              >
                <div className="flex size-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 group-focus:border-blue-500/50 overflow-hidden">
                  <team.logo className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-slate-200">{team.name}</span>
                    <span className="text-[10px] text-slate-500">{team.plan} License</span>
                </div>
                <DropdownMenuShortcut className="text-slate-600 font-mono text-[10px]">CTRL+{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-800 mx-2" />
            <DropdownMenuItem className="gap-3 p-3 rounded-xl focus:bg-slate-800 focus:text-white text-slate-400">
              <div className="flex size-8 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-transparent group-focus:border-blue-500/50">
                <Plus className="size-4" />
              </div>
              <div className="text-[12px] font-bold">Register New Entity</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
