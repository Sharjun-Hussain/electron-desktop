"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings,
  ShieldCheck,
  Zap,
  Globe,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TextLkDashboard } from "./text-lk/TextLkDashboard";
import { TextLkContacts } from "./text-lk/TextLkContacts";
import { TextLkMessages } from "./text-lk/TextLkMessages";
import { TextLkSettings } from "./text-lk/TextLkSettings";
import { TextLkTemplates } from "./text-lk/TextLkTemplates";
import { TextLkCampaigns } from "./text-lk/TextLkCampaigns";

export function TextLkManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");

  // Keep state in sync with URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("dashboard");
    }
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Module Header */}
      <div className="px-6 py-6 border-b border-border bg-card transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/5">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-foreground tracking-tight">Text.lk SMS Manager</h1>
                <Badge className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">Sri Lanka Integration</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-80">
                Official REST v3 Gateway Implementation
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-80">Connection Status</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active Handshake</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-card border border-border p-1 rounded-xl shadow-xs h-12 flex flex-wrap max-w-fit">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Users className="h-4 w-4" />
              Contact Groups
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <MessageSquare className="h-4 w-4" />
              Direct SMS
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Zap className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 font-bold text-xs gap-2 transition-all cursor-pointer">
              <Settings className="h-4 w-4" />
              API Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkDashboard setActiveTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="contacts" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkContacts />
          </TabsContent>

          <TabsContent value="templates" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkTemplates />
          </TabsContent>

          <TabsContent value="messages" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkMessages />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkCampaigns />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 border-none p-0 focus-visible:ring-0">
            <TextLkSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
