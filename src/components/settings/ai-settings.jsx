"use client";

import { useState, useEffect } from "react";
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Network,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Lock, ArrowUpCircle } from "lucide-react";

export function AiSettings() {
  const { business, isLoading: isSettingsLoading } = useAppSettings();
  const isEssential = business?.subscription_tier === 'Essential';

  const { data: session } = useSession();
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(null); // 'openai' | 'claude'
  const [verified, setVerified] = useState({ openai: false, claude: false });
  const [showKey, setShowKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState("openai");
  const [settings, setSettings] = useState({
    openai_key: "",
    claude_key: "",
    active_model: "gpt-4o",
    enabled_features: ["ocr", "predictions"]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = session?.user?.accessToken || session?.accessToken;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/ai`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok && result.data) {
          setSettings(prev => ({ ...prev, ...result.data }));
          // If keys exist, assume verified for existing setup
          if (result.data.openai_key) setVerified(v => ({ ...v, openai: true }));
          if (result.data.claude_key) setVerified(v => ({ ...v, claude: true }));
        }
      } catch (err) {
        console.error("Failed to fetch AI settings", err);
      }
    };
    if (session) fetchSettings();
  }, [session]);

  if (isSettingsLoading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <Zap className="w-8 h-8 animate-spin text-emerald-500/50" />
      <p className="text-xs text-muted-foreground">Initializing neural nexus...</p>
    </div>
  );

  if (isEssential) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Card className="border-amber-200 bg-amber-50/20 overflow-hidden">
          <div className="h-1 bg-amber-500 w-full" />
          <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-amber-100 rounded-full shadow-inner">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Neural Core Restricted</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Cognitive AI modeling and OCR vision are premium capabilities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl pt-4 text-left">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Neural OCR Vision</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Extract structured data from supplier invoices and physical documents automatically.</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Predictive Analytics</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Unlock GPT-4o driven sales forecasting and inventory demand modeling.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                size="lg" 
                className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white shadow-xl shadow-amber-600/20 text-xs font-black uppercase tracking-widest gap-3" 
                onClick={() => (window.location.href = '/settings?tab=subscription')}
              >
                <ArrowUpCircle className="w-4 h-4" /> Upgrade To Professional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const testConnection = async (provider) => {
    setTesting(provider);
    try {
      const token = session?.user?.accessToken || session?.accessToken;
      const key = provider === 'openai' ? settings.openai_key : settings.claude_key;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/test-connection`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type: "ai",
          provider,
          config: { apiKey: key }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Connection failed");

      setVerified(v => ({ ...v, [provider]: true }));
      toast.success(`${provider.toUpperCase()} Pulse Verified`, {
        description: "Neural handshake successful. Models unlocked.",
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      });
    } catch (err) {
      setVerified(v => ({ ...v, [provider]: false }));
      toast.error("Neural Disconnect", {
        description: err.message,
        icon: <AlertCircle className="w-4 h-4 text-rose-500" />
      });
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = session?.user?.accessToken || session?.accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/ai`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          category: "ai",
          settings_data: settings
        })
      });

      if (!response.ok) throw new Error("Failed to synchronize AI core configuration");
      
      const result = await response.json();
      if (result.data) {
        setSettings(prev => ({ ...prev, ...result.data }));
      }

      toast.success("AI Configuration Saved");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const providers = [
    { 
      id: "openai", 
      name: "OpenAI", 
      desc: "GPT-4o & Vision (OCR)", 
      color: "bg-slate-900",
      models: ["gpt-4o", "gpt-4o-mini"]
    },
    { 
      id: "claude", 
      name: "Anthropic", 
      desc: "Claude 3.5 Sonnet Logic", 
      color: "bg-orange-600",
      models: ["claude-3-5-sonnet-20240620", "claude-3-haiku-20240307"]
    }
  ];

  const currentProvider = providers.find(p => p.id === activeProvider);

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* ─── STATUS HUD ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Integration Status</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", (verified.openai || verified.claude) ? "bg-emerald-500" : "bg-amber-500")} />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", (verified.openai || verified.claude) ? "text-emerald-600" : "text-amber-600")}>
                {(verified.openai || verified.claude) ? "Neural Engines Ready" : "Awaiting Configuration"}
              </span>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading || !hasPermission(PERMISSIONS.SETTINGS_AI)} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          {loading ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Update AI Core
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT: PROVIDER SELECTOR */}
        <div className="md:col-span-4 space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1 font-mono">Select Core Provider</p>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProvider(p.id)}
              className={cn(
                "w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group",
                activeProvider === p.id 
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-sm" 
                  : "border-border/50 bg-white dark:bg-slate-900 hover:border-border"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className={cn("text-[13px] font-bold", activeProvider === p.id ? "text-emerald-600" : "text-foreground")}>{p.name}</p>
                  {verified[p.id] && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">{p.desc}</p>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeProvider === p.id ? "text-emerald-600 translate-x-1" : "text-muted-foreground opacity-0 group-hover:opacity-100")} />
            </button>
          ))}
        </div>

        {/* RIGHT: SETUP PANEL */}
        <div className="md:col-span-8">
            <Card className="border-border/50 shadow-sm overflow-hidden h-full bg-white dark:bg-slate-950">
            <CardContent className="p-8 space-y-8">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-lg", currentProvider.color)}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground capitalize">{activeProvider} Configuration</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">Industrial neural link for {activeProvider}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowKey(!showKey)}
                  className="h-8 text-[10px] font-bold gap-2 text-muted-foreground hover:bg-slate-100"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showKey ? "Hide Secret" : "Reveal Key"}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1 font-mono">API Access Token</label>
                  <div className="flex gap-2">
                    <Input 
                      type={showKey ? "text" : "password"}
                      placeholder={activeProvider === 'openai' ? "sk-..." : "sk-ant-..."}
                      value={activeProvider === 'openai' ? settings.openai_key : settings.claude_key}
                      onChange={(e) => setSettings(s => ({ ...s, [`${activeProvider}_key`]: e.target.value }))}
                      className="h-11 bg-slate-50 dark:bg-slate-950/50 border-border/50 font-mono text-[12px] focus-visible:ring-emerald-500/20 transition-all"
                    />
                    <Button 
                      variant="outline" 
                      className="h-11 border-emerald-500/30 text-emerald-600 font-bold text-[11px] px-6 shrink-0 gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      onClick={() => testConnection(activeProvider)}
                      disabled={testing === activeProvider || !hasPermission(PERMISSIONS.SETTINGS_AI)}
                    >
                      {testing === activeProvider ? <Zap className="w-3.5 h-3.5 animate-spin" /> : <Network className="w-3.5 h-3.5" />}
                      Test Link
                    </Button>
                  </div>
                </div>

                {/* AUTOMATIC MODEL SELECTION REVEAL */}
                {verified[activeProvider] && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 pt-4 border-t border-border/50">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider ml-1 font-mono">Select Cognitive Model</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentProvider.models.map((model) => (
                        <button
                          key={model}
                          onClick={() => setSettings(s => ({ ...s, active_model: model }))}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                            settings.active_model === model 
                              ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/50" 
                              : "border-border/50 bg-slate-50/50 hover:bg-white"
                          )}
                        >
                          <div className="space-y-1">
                            <p className="text-[12px] font-bold text-foreground">{model}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{model.includes('mini') || model.includes('haiku') ? 'Fast / Low Cost' : 'Pro / High Logic'}</p>
                          </div>
                          {settings.active_model === model && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── USAGE ANALYTICS ─── */}
                <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Network className="w-4 h-4 text-slate-400" />
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Neural Consumption Metrics</h5>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/30">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Total Tokens</p>
                            <p className="text-sm font-bold text-foreground">{(settings.usage_stats?.total_tokens || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/30">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Requests</p>
                            <p className="text-sm font-bold text-foreground">{(settings.usage_stats?.total_requests || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/30">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Input (Prompt)</p>
                            <p className="text-sm font-bold text-foreground">{(settings.usage_stats?.prompt_tokens || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-border/30">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Output (Result)</p>
                            <p className="text-sm font-bold text-foreground">{(settings.usage_stats?.completion_tokens || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-3 italic font-medium opacity-60">
                        Last sync: {settings.usage_stats?.last_request_at ? new Date(settings.usage_stats.last_request_at).toLocaleString() : 'Never'}
                    </p>
                </div>

                {!verified[activeProvider] && (
                  <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border/50 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                      Test your connection to unlock model selection. Your credentials remain encrypted and safe.
                    </p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
