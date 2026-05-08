"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Save, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  Info,
  Server,
  Key,
  Database,
  Hash,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function WhatsAppSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    apiUrl: "",
    apiKey: "",
    accountId: "",
    inboxId: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/whatsapp/settings`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setConfig({
        enabled: data.data.enabled,
        ...data.data.settings
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving configuration...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/whatsapp/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-muted-foreground font-medium">Synchronizing settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-8 max-w-full mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                WhatsApp CRM Configuration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 opacity-70">
                Connect your self-hosted Chatwoot instance to enable WhatsApp communications.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="gap-2 h-9 border-gray-200 font-bold text-xs" asChild>
              <a href={config.apiUrl || "#"} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Launch Chatwoot
              </a>
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9 px-6 font-bold text-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Configuration
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200 dark:border-white/5 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 dark:bg-muted/10 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold">API Connectivity</CardTitle>
                    <CardDescription className="text-[11px] font-medium">Define your Chatwoot instance credentials.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Module Active</span>
                    <Switch 
                      checked={config.enabled} 
                      onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
                      className="data-[state=checked]:bg-emerald-600 scale-90"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl" className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Server className="h-3 w-3" /> API Base URL
                    </Label>
                    <Input 
                      id="apiUrl" 
                      placeholder="https://chat.yourdomain.com" 
                      value={config.apiUrl}
                      onChange={(e) => setConfig({...config, apiUrl: e.target.value})}
                      className="h-10 bg-muted/30 border-gray-200 focus:bg-background transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey" className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Key className="h-3 w-3" /> Access Token
                    </Label>
                    <Input 
                      id="apiKey" 
                      type="password"
                      placeholder="Personal access token" 
                      value={config.apiKey}
                      onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                      className="h-10 bg-muted/30 border-gray-200 focus:bg-background transition-all font-medium text-sm"
                    />
                  </div>
                </div>

                <Separator className="bg-gray-100 dark:bg-white/5" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="accountId" className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Database className="h-3 w-3" /> Account ID
                    </Label>
                    <Input 
                      id="accountId" 
                      placeholder="e.g. 1" 
                      value={config.accountId}
                      onChange={(e) => setConfig({...config, accountId: e.target.value})}
                      className="h-10 bg-muted/30 border-gray-200 focus:bg-background transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inboxId" className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                      <Hash className="h-3 w-3" /> WhatsApp Inbox ID
                    </Label>
                    <Input 
                      id="inboxId" 
                      placeholder="e.g. 5" 
                      value={config.inboxId}
                      onChange={(e) => setConfig({...config, inboxId: e.target.value})}
                      className="h-10 bg-muted/30 border-gray-200 focus:bg-background transition-all font-medium text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-blue-50/50 border-blue-200/50 text-blue-800 dark:bg-blue-500/5 dark:border-blue-500/20 rounded-xl">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-xs font-bold uppercase tracking-wider">Configuration Tip</AlertTitle>
              <AlertDescription className="text-[11px] font-medium leading-relaxed opacity-80">
                The Account ID and Inbox ID can be extracted from your Chatwoot URL. 
                Ensure your WhatsApp channel is verified and the API is reachable from our server.
              </AlertDescription>
            </Alert>
          </div>

          {/* Info Sidebar Column */}
          <div className="space-y-6">
            <Card className="border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/5 shadow-none rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                   <Sparkles className="h-4 w-4" />
                   <CardTitle className="text-xs font-bold uppercase tracking-widest">Capabilities</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Send Purchase Orders directly",
                  "Automated Supplier notifications",
                  "Template-based messaging",
                  "Centralized chat history"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground/80">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="px-4 py-6 border border-dashed border-gray-200 dark:border-white/10 rounded-xl text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">Security Protocol</p>
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed px-2">
                Your API credentials are encrypted at rest using industry-standard AES-256 protocols.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
