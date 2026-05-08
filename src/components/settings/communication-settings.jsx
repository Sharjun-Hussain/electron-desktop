"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import {
  Save, Server, Mail, Smartphone,
  CheckCircle2, Loader2, Zap, Send, PhoneCall,
  BellRing, ShieldAlert, Cpu, Activity, Info, ExternalLink,
  HelpCircle, Settings, Key, Globe, ShieldCheck, History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Lock, ArrowUpCircle } from "lucide-react";

const EMAIL_PROVIDERS = [
  { 
    id: "smtp", 
    name: "SMTP Server", 
    icon: Server, 
    desc: "Standard mail transfer protocol", 
    fields: ["Host", "Port", "Username", "Password", "Encryption", "From Email"],
    guide: {
      title: "SMTP Configuration Guide",
      steps: [
        "Obtain the SMTP host and port from your email provider (e.g., Gmail, Outlook).",
        "Enable 'App Passwords' if you use 2-Factor Authentication.",
        "Use Port 587 with STARTTLS for standard secure delivery.",
        "Test connection to ensure credentials are valid."
      ],
      docs: "https://support.google.com/a/answer/176600"
    }
  },
  { 
    id: "brevo", 
    name: "Brevo", 
    icon: Mail, 
    desc: "All-in-one marketing platform", 
    fields: ["API Key", "Username", "From Email"],
    guide: {
      title: "Brevo Setup Guide",
      steps: [
        "Login to Brevo and go to SMTP & API settings.",
        "Generate a new Master API Key (v3).",
        "Ensure your 'From Email' is a verified sender in Brevo.",
        "The SMTP relay (smtp-relay.brevo.com) is handled automatically."
      ],
      docs: "https://app.brevo.com/settings/keys/smtp"
    }
  },
  { 
    id: "sendgrid", 
    name: "SendGrid", 
    icon: Mail, 
    desc: "Cloud delivery API nexus", 
    fields: ["API Key", "From Email"],
    guide: {
      title: "SendGrid Integration Guide",
      steps: [
        "Login to SendGrid and go to Settings > API Keys.",
        "Create a new 'Full Access' or 'Mail Send' API Key.",
        "Ensure your 'From Email' is a verified sender.",
        "Server (smtp.sendgrid.net) and User (apikey) are handled automatically."
      ],
      docs: "https://app.sendgrid.com/settings/api_keys"
    }
  },
  { 
    id: "mailgun", 
    name: "Mailgun", 
    icon: Mail, 
    desc: "Transactional service basis", 
    fields: ["Domain", "API Key", "Region"],
    guide: {
      title: "Mailgun Setup Guide",
      steps: [
        "Find your API Key in the Mailgun Dashboard under API Keys.",
        "Verify your sending domain in the 'Sending' section.",
        "Select the correct region (US or EU) as per your account setup.",
        "DNS records (SPF/DKIM) must be correctly configured."
      ],
      docs: "https://app.mailgun.com/app/dashboard"
    }
  },
  { 
    id: "ses", 
    name: "Amazon SES", 
    icon: Send, 
    desc: "High-scale enterprise delivery", 
    fields: ["Access Key", "Secret Key", "Region"],
    guide: {
      title: "Amazon SES Implementation",
      steps: [
        "Create an IAM user with 'AmazonSESFullAccess' permissions.",
        "Generate 'Access Key ID' and 'Secret Access Key' for the user.",
        "Verify your sending identity in the SES console.",
        "The system will automatically calculate the regional SMTP endpoint."
      ],
      docs: "https://console.aws.amazon.com/ses"
    }
  },
];

const SMS_PROVIDERS = [
  { 
    id: "twilio", 
    name: "Twilio", 
    icon: Smartphone, 
    desc: "Programmable mobile gateway", 
    fields: ["Account SID", "Auth Token", "From Number"],
    guide: {
      title: "Twilio Connection Guide",
      steps: [
        "Find your Account SID and Auth Token on the Twilio Console homepage.",
        "Acquire a Twilio Phone Number from the 'Phone Numbers' section.",
        "Ensure your account has sufficient balance for SMS transmission.",
        "Verify your identity in the Twilio Trust Hub if required."
      ],
      docs: "https://www.twilio.com/console"
    }
  },
  { 
    id: "nexmo", 
    name: "Nexmo (Vonage)", 
    icon: PhoneCall, 
    desc: "Global messaging protocol", 
    fields: ["API Key", "API Secret", "From"],
    guide: {
      title: "Vonage API Integration",
      steps: [
        "Login to the Vonage API Dashboard to find your API Key and Secret.",
        "Configure the 'From' name or number in the dashboard settings.",
        "Verify your account status and available balance.",
        "Execute a link test to confirm API connectivity."
      ],
      docs: "https://dashboard.nexmo.com/settings"
    }
  },
];

const FIELD_HELP = {
  "Host": "The SMTP server address (e.g., smtp.relay.com).",
  "Port": "Port 587 is standard for TLS; 465 is for SSL.",
  "Encryption": "Method used to secure the transmission (STARTTLS, SSL/TLS).",
  "API Key": "Unique authentication string generated from the provider's dashboard.",
  "Account SID": "Twilio's unique identifier for your account workspace.",
  "Auth Token": "A private token used to authorize requests to the API.",
  "Region": "The geographic data center where your service is hosted."
};

function ProviderGuide({ guide }) {
  if (!guide) return null;
  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-emerald-600 text-white">
            <Info className="w-3.5 h-3.5" />
          </div>
          <h5 className="text-sm font-bold text-emerald-900 dark:text-emerald-400">{guide.title}</h5>
        </div>
        <a 
          href={guide.docs} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-white dark:bg-emerald-950 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900"
        >
          API Docs <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <ol className="space-y-2">
        {guide.steps.map((step, idx) => (
          <li key={idx} className="flex gap-3 text-[11px] text-emerald-800/70 dark:text-emerald-500/70 font-medium leading-relaxed">
            <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 text-[9px] font-bold border border-emerald-200 dark:border-emerald-900/50">
              {idx + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CommunicationSettings() {
  const { business, isLoading: isSettingsLoading } = useAppSettings();
  const isEssential = business?.subscription_tier === 'Essential';

  const { hasPermission } = usePermission();
  const { useModularSettings, updateModularSettings, testConnection } = useSettings();
  const { data: response, isLoading } = useModularSettings('communication');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);

  const [settings, setSettings] = useState({
    email: { 
      enabled: false, 
      provider: 'smtp', 
      config: {}, 
      fromName: '',
      alerts: {
        lowStock: { enabled: false, threshold: 10 },
        unusualLogin: { enabled: false },
        highSales: { enabled: false, threshold: 100000 },
        expiryAlert: { enabled: false }
      }
    },
    sms: { enabled: false, provider: 'twilio', config: {} }
  });

  useEffect(() => {
    if (response?.data) {
      setSettings(prev => ({ ...prev, ...response.data }));
    }
  }, [response]);

  const handleSave = async () => {
    if (!hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)) {
      toast.error("You do not have permission to modify communication settings");
      return;
    }
    setIsSaving(true);
    const result = await updateModularSettings('communication', settings);
    if (result.success) toast.success("Communication protocols synchronized");
    else toast.error(result.error || "Failed to synchronize protocols");
    setIsSaving(false);
  };

  const updateEmail = (updates) => setSettings(prev => ({ ...prev, email: { ...prev.email, ...updates } }));
  const updateSms = (updates) => setSettings(prev => ({ ...prev, sms: { ...prev.sms, ...updates } }));

  const updateEmailConfig = (key, value) => {
    setSettings(prev => ({ ...prev, email: { ...prev.email, config: { ...prev.email.config, [key]: value } } }));
  };

  const updateAlert = (type, updates) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        alerts: {
          ...prev.email.alerts,
          [type]: { ...prev.email.alerts[type], ...updates }
        }
      }
    }));
  };

  const updateSmsConfig = (key, value) => {
    setSettings(prev => ({ ...prev, sms: { ...prev.sms, config: { ...prev.sms.config, [key]: value } } }));
  };

  const handleTestConnection = async (type) => {
    const isEmail = type === 'email';
    const activeProvider = isEmail ? settings.email.provider : settings.sms.provider;
    const activeConfig = isEmail ? settings.email.config : settings.sms.config;

    if (isEmail) setIsTestingEmail(true); else setIsTestingSms(true);

    try {
      const result = await testConnection(type, activeProvider, activeConfig);
      if (result.success) toast.success(result.message || "Connection verified successfully");
      else toast.error(result.error || "Verification failed");
    } catch (err) {
      toast.error("An unexpected error occurred during test");
    } finally {
      if (isEmail) setIsTestingEmail(false); else setIsTestingSms(false);
    }
  };

  if (isLoading || isSettingsLoading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" />
      <p className="text-sm font-medium text-muted-foreground">Establishing gateway handshake...</p>
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
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Communication Hub Restricted</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. Advanced SMTP routing and global SMS gateways are premium features.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl pt-4 text-left">
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Enterprise SMTP Nexus</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Integrate with SendGrid, Mailgun, or Amazon SES for industrial-grade email delivery.</p>
                </div>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-bold text-slate-900">Global SMS Gateway</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed text-balance">Connect Twilio or Vonage to trigger automated SMS notifications to customers and staff.</p>
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

  const { email, sms } = settings;
  const activeEmailProvider = EMAIL_PROVIDERS.find(p => p.id === email.provider);
  const activeSmsProvider = SMS_PROVIDERS.find(p => p.id === sms.provider);
  
  const labelCls = "text-xs font-semibold text-muted-foreground flex items-center gap-1.5";
  const inputCls = "h-10 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-950 focus-visible:ring-emerald-500 transition-all";

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">


      <div className="grid grid-cols-1 gap-6">
        {/* ─── EMAIL INFRASTRUCTURE ─── */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden bg-card">
          <CardHeader className="py-4 px-6 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-emerald-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Email Infrastructure</CardTitle>
                <CardDescription className="text-xs font-medium">Transactional mail routing protocols</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground mr-1">Gateway Status</span>
                <Switch checked={email.enabled} onCheckedChange={(c) => updateEmail({ enabled: c })} className="data-[state=checked]:bg-emerald-600" />
              </div>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving || !hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)} 
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-bold gap-2 rounded-md shadow-sm transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!email.enabled ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-medium text-muted-foreground">Email delivery is currently offline.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {EMAIL_PROVIDERS.map((prov) => {
                    const Icon = prov.icon;
                    const isActive = email.provider === prov.id;
                    return (
                      <button
                        key={prov.id}
                        onClick={() => updateEmail({ provider: prov.id })}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border transition-all text-left group",
                          isActive
                            ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-600/20"
                            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-200"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 mb-2", isActive ? "text-emerald-600" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-bold", isActive ? "text-foreground" : "text-muted-foreground")}>{prov.name}</span>
                        <span className="text-[9px] text-muted-foreground mt-1 text-center hidden sm:block leading-tight">{prov.desc}</span>
                        {isActive && <div className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full animate-in zoom-in-50"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></div>}
                      </button>
                    );
                  })}
                </div>

                {/* Setup Guide for Email */}
                <ProviderGuide guide={activeEmailProvider?.guide} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <div className="space-y-2">
                    <Label className={labelCls}>Transmission Alias (From Name)</Label>
                    <div className="relative group">
                      <BellRing className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                      <Input
                        placeholder="e.g. Aetheria Transactional"
                        value={email.fromName}
                        onChange={(e) => updateEmail({ fromName: e.target.value })}
                        className={cn(inputCls, "pl-9")}
                      />
                    </div>
                  </div>
                  {activeEmailProvider?.fields.map(field => (
                    <div key={field} className="space-y-2">
                      <Label className={labelCls}>
                        {field} Parameter
                        {FIELD_HELP[field] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help hover:text-emerald-500 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {FIELD_HELP[field]}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </Label>
                      <Input
                        type={field.toLowerCase().includes('password') || field.includes('Key') || field.includes('Secret') ? "password" : "text"}
                        value={email.config?.[field] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          // If current value was mask, and new value is mask + char, just use the char
                          if (email.config?.[field] === '********' && val.length > 8) {
                            updateEmailConfig(field, val.slice(-1));
                          } else {
                            updateEmailConfig(field, val);
                          }
                        }}
                        className={inputCls}
                        placeholder={`Enter ${field.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-amber-500">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">Integrity Check</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">Test current transport parameters</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestConnection('email')}
                    disabled={isTestingEmail || !hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)}
                    className="h-8 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-bold text-[10px] gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center"
                  >
                    {isTestingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-500" />}
                    Execute Link Test
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── SMS GATEWAY ─── */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden bg-card">
          <CardHeader className="py-4 px-6 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-emerald-600">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">SMS Infrastructure</CardTitle>
                <CardDescription className="text-xs font-medium">Global mobile delivery protocols</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground mr-1">Gateway Status</span>
                <Switch checked={sms.enabled} onCheckedChange={(c) => updateSms({ enabled: c })} className="data-[state=checked]:bg-emerald-600" />
              </div>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isSaving || !hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)} 
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-bold gap-2 rounded-md shadow-sm transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!sms.enabled ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-medium text-muted-foreground">SMS gateway is currently offline.</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SMS_PROVIDERS.map((prov) => {
                    const Icon = prov.icon;
                    const isActive = sms.provider === prov.id;
                    return (
                      <button
                        key={prov.id}
                        onClick={() => updateSms({ provider: prov.id })}
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl border transition-all text-left group",
                          isActive
                            ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-600/20"
                            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-200"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 mb-2", isActive ? "text-emerald-600" : "text-muted-foreground")} />
                        <span className={cn("text-xs font-bold", isActive ? "text-foreground" : "text-muted-foreground")}>{prov.name}</span>
                        <span className="text-[9px] text-muted-foreground mt-1 text-center hidden sm:block leading-tight">{prov.desc}</span>
                        {isActive && <div className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 bg-emerald-600 rounded-full animate-in zoom-in-50"><CheckCircle2 className="w-2.5 h-2.5 text-white" /></div>}
                      </button>
                    );
                  })}
                  <div className="md:col-span-2" />
                </div>

                {/* Setup Guide for SMS */}
                <ProviderGuide guide={activeSmsProvider?.guide} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                  {activeSmsProvider?.fields.map(field => (
                    <div key={field} className="space-y-2">
                      <Label className={labelCls}>
                        {field} Parameter
                        {FIELD_HELP[field] && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted-foreground/50 cursor-help hover:text-emerald-500 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {FIELD_HELP[field]}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </Label>
                      <Input
                        type={field.includes('Token') || field.includes('Secret') ? "password" : "text"}
                        value={sms.config?.[field] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (sms.config?.[field] === '********' && val.length > 8) {
                            updateSmsConfig(field, val.slice(-1));
                          } else {
                            updateSmsConfig(field, val);
                          }
                        }}
                        className={inputCls}
                        placeholder={`Enter ${field.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm text-amber-500">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">Diagnostic Test</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">Verify structural handshake</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestConnection('sms')}
                    disabled={isTestingSms || !hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)}
                    className="h-8 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 font-bold text-[10px] gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center"
                  >
                    {isTestingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-amber-500" />}
                    Execute Link Test
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── EVENT NOTIFICATIONS ─── */}
        <Card className="border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden bg-card">
          <CardHeader className="py-4 px-6 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-amber-500">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Event Notifications</CardTitle>
                <CardDescription className="text-xs font-medium">Configure automated trigger alerts</CardDescription>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving || !hasPermission(PERMISSIONS.SETTINGS_COMMUNICATION)} 
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-bold gap-2 rounded-md shadow-sm transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Low Stock Alert */}
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <Switch 
                    checked={email.alerts?.lowStock?.enabled} 
                    onCheckedChange={(c) => updateAlert('lowStock', { enabled: c })} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Low Stock Warning</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Notify when inventory falls below limit.</p>
                </div>
                {email.alerts?.lowStock?.enabled && (
                  <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Qty Threshold</Label>
                    <Input 
                      type="number"
                      value={email.alerts?.lowStock?.threshold || 0}
                      onChange={(e) => updateAlert('lowStock', { threshold: parseInt(e.target.value) })}
                      className="h-8 text-xs rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Unusual Login Alert */}
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <Switch 
                    checked={email.alerts?.unusualLogin?.enabled} 
                    onCheckedChange={(c) => updateAlert('unusualLogin', { enabled: c })} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Security Notification</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Notify about unusual login activity.</p>
                </div>
              </div>

              {/* High Sales Alert */}
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600">
                    <Activity className="w-4 h-4" />
                  </div>
                  <Switch 
                    checked={email.alerts?.highSales?.enabled} 
                    onCheckedChange={(c) => updateAlert('highSales', { enabled: c })} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">High Sales Alert</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Notify for transactions above limit.</p>
                </div>
                {email.alerts?.highSales?.enabled && (
                  <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Amount Threshold</Label>
                    <Input 
                      type="number"
                      value={email.alerts?.highSales?.threshold || 0}
                      onChange={(e) => updateAlert('highSales', { threshold: parseFloat(e.target.value) })}
                      className="h-8 text-xs rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Expiry Alert */}
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600">
                    <History className="w-4 h-4" />
                  </div>
                  <Switch 
                    checked={email.alerts?.expiryAlert?.enabled} 
                    onCheckedChange={(c) => updateAlert('expiryAlert', { enabled: c })} 
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Expiry Date Alert</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Notify about products nearing expiration.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
    </TooltipProvider>
  );
}
