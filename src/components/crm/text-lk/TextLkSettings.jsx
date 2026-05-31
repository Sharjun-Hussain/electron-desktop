"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  ShieldCheck, 
  Save, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Smartphone,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function TextLkSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  const [config, setConfig] = useState({
    apiKey: "",
    senderId: "",
    enabled: false
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/config`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig({
          apiKey: data.data.config.apiKey || "",
          senderId: data.data.config.senderId || "",
          enabled: data.data.enabled || false
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ apiKey: config.apiKey })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Connection verified");
      } else {
        toast.error(data.message || "Connection failed");
      }
    } catch (error) {
      toast.error("Handshake failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Credentials */}
        <Card className="lg:col-span-2 border-border bg-card shadow-xs rounded-xl">
          <CardHeader className="border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">API Integration</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Configure your Text.lk v3 credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <div className="space-y-1">
                <Label className="text-sm font-bold flex items-center gap-2 text-foreground">
                  Enable Text.lk Integration
                  <Badge className="bg-indigo-600 dark:bg-indigo-500 h-4 text-[9px]">REST.V3</Badge>
                </Label>
                <p className="text-xs text-muted-foreground font-medium">Activate the SMS engine and digital receipts</p>
              </div>
              <Switch 
                checked={config.enabled} 
                onCheckedChange={(val) => setConfig(prev => ({ ...prev, enabled: val }))}
                className="data-[state=checked]:bg-indigo-600 dark:data-[state=checked]:bg-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Key</Label>
                <div className="relative group">
                  <Input 
                    type={showKey ? "text" : "password"} 
                    placeholder="Enter your Text.lk API v3 Token" 
                    className="pr-10 h-11 font-mono text-sm bg-muted/40 border-border focus-visible:ring-indigo-500 text-foreground"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-9 w-9 p-0 hover:bg-background rounded-md text-muted-foreground active:scale-90 transition-transform"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sender ID</Label>
                <Input 
                  placeholder="e.g. INZEEDO" 
                  className="h-11 font-bold text-sm bg-muted/40 border-border focus-visible:ring-indigo-500 text-foreground"
                  value={config.senderId}
                  onChange={(e) => setConfig(prev => ({ ...prev, senderId: e.target.value.toUpperCase() }))}
                />
                <p className="text-[10px] text-muted-foreground font-medium">Must be approved on your Text.lk portal</p>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-bold shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/5 active:scale-95 transition-transform"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
              <Button 
                variant="outline" 
                className="h-10 px-6 font-bold border-border text-foreground hover:bg-muted/40 active:scale-95 transition-transform"
                onClick={handleTest}
                disabled={testing || !config.apiKey}
              >
                <Zap className={`mr-2 h-4 w-4 ${testing ? 'animate-pulse text-amber-500' : ''}`} />
                Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Card */}
        <Card className="border-border bg-card shadow-xs rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
              <div className="flex items-center gap-3 text-foreground">
                <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold">Text.lk Dashboard</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Log in to your Text.lk portal to acquire your API Token and register your Sender ID for Sri Lanka.
              </p>
              <Button 
                variant="link" 
                className="h-auto p-0 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold hover:underline"
                onClick={() => window.open('https://app.text.lk/', '_blank')}
              >
                Open Dashboard <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-80">Requirements</h4>
              <ul className="space-y-2">
                {[
                  "Account Balance (Prepaid/Postpaid)",
                  "Verified Business Profile",
                  "Approved Header (Sender ID)",
                  "DLT Approved Templates"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
