"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import axios from "axios";

import { useSettingsStore } from "@/store/useSettingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Globe, Palette, Hash,
  Save, CreditCard, Search,
  Check, Trash2, Plus, Loader2,
  Calendar, Clock, DollarSign,
  Activity, Settings2, Sparkles,
  Command,
  ShoppingBag,
  FileText,
  Users,
  MapPin,
  Monitor,
  ChevronRight,
  ChevronDown,
  Languages,
  Coins,
  ArrowRight,
  Sun,
  Moon,
  Laptop,
  UserCheck,
  Brain,
  Gift,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// --- CONSTANTS: Time Zones & Currencies ---
const TIMEZONES = [
  "Etc/UTC", "Pacific/Midway", "Pacific/Honolulu", "America/Anchorage",
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Europe/Moscow", "Africa/Cairo", "Africa/Johannesburg", "Asia/Dubai",
  "Asia/Karachi", "Asia/Kolkata", "Asia/Bangkok", "Asia/Shanghai",
  "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland"
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "QAR", symbol: "QR", name: "Qatari Riyal" },
  { code: "SAR", symbol: "SR", name: "Saudi Riyal" },
];

import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

export function GeneralSettings() {
  const { hasPermission } = usePermission();
  const { useModularSettings, updateModularSettings, useGlobalSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('general');
  const { data: loyaltyResponse, isLoading: isLoyaltyLoading } = useModularSettings('loyalty');
  const { data: globalData } = useGlobalSettings();
  const { setTheme } = useTheme();
  const { setGlobalSettings } = useSettingsStore();
  const { t } = useTranslation();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("config") || "localization");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingLedger, setIsCreatingLedger] = useState(false);

  useEffect(() => {
    const config = searchParams.get("config");
    if (config) setActiveTab(config);
  }, [searchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("config", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [settings, setSettings] = useState({
    localization: { currency: "LKR", timeZone: "Asia/Kolkata", dateFormat: "ymd", timeFormat: "12", language: "en" },
    finance: { fyStart: "jan", precision: "2", currencyPos: "before", taxRate: "8" },
    interface: { theme: "system", color: "blue", fontSize: 14, sidebar: "fixed" },
    modules: { inventory: true, pos: true, accounting: true, hrm: false, crm: false },
    prefixes: { sale: "INV", purchase: "PO", estimate: "EST", customer: "CUS", supplier: "SUP", employee: "EMP" },
    bankAccounts: [],
    force_onboarding: false,
    personal_onboarding_enabled: true,
    loyalty: { points_per_currency: 1, redemption_rate: 0.01, min_redemption_points: 0 }
  });

  useEffect(() => {
    const fetchOnboarding = async () => {
      if (!session?.accessToken) return;
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/onboarding`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        if (res.data.status === "success") {
          setSettings(prev => ({ ...prev, force_onboarding: res.data.data.force_onboarding }));
        }
      } catch (err) { console.error("Failed to fetch onboarding policy", err); }
    };

    if (response?.data) {
      setSettings(prev => ({
        ...prev,
        ...response.data,
        prefixes: response.data.prefixes || prev.prefixes,
        bankAccounts: response.data.bankAccounts || prev.bankAccounts,
        personal_onboarding_enabled: localStorage.getItem("onboarding_disabled") === "false"
      }));
      fetchOnboarding();
    }
  }, [response, session?.accessToken, session?.user?.id]);

  useEffect(() => {
    if (loyaltyResponse?.data) {
      setSettings(prev => ({
        ...prev,
        loyalty: {
          ...prev.loyalty,
          ...loyaltyResponse.data
        }
      }));
    }
  }, [loyaltyResponse]);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value }
    }));

    // Instant Feedback: Language
    if (section === 'localization' && key === 'language') {
      setGlobalSettings({ language: value });
    }

    // Instant Feedback: Personal Onboarding
    if (key === 'personal_onboarding_enabled') {
      localStorage.setItem("onboarding_disabled", value ? "false" : "true");
    }

    // Instant Feedback: Theme
    if (section === 'interface' && key === 'theme') {
      setTheme(value);
    }

    // Instant Feedback: Font Size
    if (section === 'interface' && key === 'fontSize') {
      document.documentElement.style.fontSize = `${value}px`;
    }
  };

  const handleSave = async () => {
    if (!hasPermission(PERMISSIONS.SETTINGS_GENERAL)) {
      toast.error("You do not have permission to modify general settings");
      return;
    }
    setIsSaving(true);

    // Save General Settings
    const result = await updateModularSettings('general', {
      localization: settings.localization,
      finance: settings.finance,
      interface: settings.interface,
      modules: settings.modules,
      prefixes: settings.prefixes,
      bankAccounts: settings.bankAccounts
    });

    // Save Loyalty Settings if active or enabled
    if (globalData?.data?.business?.loyalty_enabled) {
      await updateModularSettings('loyalty', settings.loyalty);
    }

    // Also save onboarding policy
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/onboarding/policy`,
        { force_onboarding: settings.force_onboarding },
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
    } catch (err) { console.error("Failed to update onboarding policy", err); }

    if (result.success) {
      // Save personal preference to localStorage
      localStorage.setItem("onboarding_disabled", settings.personal_onboarding_enabled ? "false" : "true");
      toast.success("General settings saved successfully");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const filteredTimezones = useMemo(() => {
    return TIMEZONES.filter(tz => tz.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const fetchLedgerAccounts = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setLedgerAccounts(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch ledger accounts:", error);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (activeTab === 'localization') {
      fetchLedgerAccounts();
    }
  }, [activeTab, fetchLedgerAccounts]);

  const generateNextAccountCode = () => {
    const assetAccounts = ledgerAccounts.filter(acc => acc.type === 'asset');
    const codes = assetAccounts.map(acc => parseInt(acc.code)).filter(c => !isNaN(c));
    const nextCode = codes.length > 0 ? Math.max(...codes) + 1 : 1010;
    return nextCode.toString();
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500/50" />
      <p className="text-sm font-medium text-muted-foreground">Fetching workspace config...</p>
    </div>
  );

  return (
    <div className="space-y-6">

      <Tabs defaultValue="localization" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
          <TabsList className="bg-transparent h-auto p-0 flex gap-8 justify-start rounded-none">
            {[
              { id: "localization", label: t("settings.localization"), icon: Globe },
              { id: "interface", label: t("settings.look_feel"), icon: Palette },
              { id: "prefixes", label: t("settings.prefixes"), icon: Hash },
            ].filter(Boolean).map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-500 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 dark:data-[state=active]:border-emerald-500 data-[state=active]:shadow-none font-semibold text-sm h-12 px-0 transition-all border-b-2 border-transparent text-muted-foreground hover:text-foreground"
              >
                <tab.icon className="w-4 h-4 transition-colors" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasPermission(PERMISSIONS.SETTINGS_GENERAL)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 rounded-md font-semibold text-xs transition-all active:scale-95 gap-2 mb-2 sm:mb-0"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </div>

        {/* 1. REGION & FINANCE */}
        <TabsContent value="localization" className="mt-6 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
              <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Operational Basis</CardTitle>
                    <CardDescription className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Language, Time & Formats</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("settings.language")}</Label>
                  <Select value={settings.localization.language} onValueChange={(v) => updateSetting('localization', 'language', v)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90 focus:ring-emerald-500/20"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t("settings.timezone")}</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90 hover:bg-slate-50 transition-all shadow-none">
                        {settings.localization.timeZone}
                        <Search className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl p-0 overflow-hidden max-w-md">
                      <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Time Zone Basis</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Search the global registry</DialogDescription>
                      </DialogHeader>
                      <div className="p-6 pt-4">
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            placeholder="Search timezones..."
                            className="h-10 pl-11 rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus-visible:ring-emerald-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-[280px] mt-4 rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                          {filteredTimezones.map((tz) => (
                            <div
                              key={tz}
                              className={cn(
                                "p-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-xs font-bold rounded-md text-slate-500 transition-all flex justify-between items-center",
                                settings.localization.timeZone === tz && "text-emerald-600 dark:text-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10"
                              )}
                              onClick={() => updateSetting('localization', 'timeZone', tz)}
                            >
                              {tz}
                              {settings.localization.timeZone === tz && <Check className="w-3.5 h-3.5" />}
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date Format</Label>
                    <Select value={settings.localization.dateFormat} onValueChange={(v) => updateSetting('localization', 'dateFormat', v)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="ymd">YYYY/MM/DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time Format</Label>
                    <Select value={settings.localization.timeFormat} onValueChange={(v) => updateSetting('localization', 'timeFormat', v)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="12">12 Hour (AM/PM)</SelectItem>
                        <SelectItem value="24">24 Hour (ISO)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
              <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <Coins className="h-4 w-4 text-emerald-600" />
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Fiscal Nexus</CardTitle>
                    <CardDescription className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Currency & Tax Protocols</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trading Currency</Label>
                  <Select value={settings.localization.currency} onValueChange={(v) => updateSetting('localization', 'currency', v)}>
                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-md">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Placement</Label>
                    <Select value={settings.finance.currencyPos} onValueChange={(v) => updateSetting('finance', 'currencyPos', v)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="before">Leading ($XXX)</SelectItem>
                        <SelectItem value="after">Trailing (XXX$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">FY Start</Label>
                    <Select value={settings.finance.fyStart} onValueChange={(v) => updateSetting('finance', 'fyStart', v)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-md">
                        <SelectItem value="jan">January 01</SelectItem>
                        <SelectItem value="apr">April 01</SelectItem>
                        <SelectItem value="jul">July 01</SelectItem>
                        <SelectItem value="oct">October 01</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">Tax Calculation</Label>
                      <p className="text-[10px] text-slate-400 font-medium">Apply global tax to all sales</p>
                    </div>
                    <Switch
                      checked={settings.finance.enableTax !== false}
                      onCheckedChange={(c) => updateSetting('finance', 'enableTax', c)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                  {settings.finance.enableTax !== false && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tax Rate (%)</Label>
                      <Input
                        type="number"
                        className="h-10 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-sm text-foreground/90 focus-visible:ring-emerald-500"
                        value={settings.finance.taxRate}
                        onChange={(e) => updateSetting('finance', 'taxRate', e.target.value)}
                        placeholder="e.g. 8"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* THE "REFERENCE" TOGGLE BOX */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-all shrink-0",
                    settings.personal_onboarding_enabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                  )}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">Personal Guidance</span>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Interactive tour for this session</p>
                  </div>
                </div>
                <Switch
                  checked={settings.personal_onboarding_enabled}
                  onCheckedChange={(v) => {
                    updateSetting('personal', 'personal_onboarding_enabled', v);
                    setSettings(prev => ({ ...prev, personal_onboarding_enabled: v }));
                  }}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-between md:pl-6 md:border-l border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center transition-all shrink-0",
                      settings.force_onboarding ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                    )}>
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">Global Force</span>
                        <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500 text-white border-none font-bold uppercase">Admin</Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Override all system members</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.force_onboarding}
                    onCheckedChange={(v) => setSettings(prev => ({ ...prev, force_onboarding: v }))}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              )}
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-card">
            <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-tight">Bank & Payment Accounts</CardTitle>
                  <CardDescription className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Financial settlements registry</CardDescription>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 px-3 border-emerald-600/20 text-emerald-600 hover:bg-emerald-50 transition-all font-bold text-[11px] gap-1.5 uppercase tracking-wide"><Plus className="w-3.5 h-3.5" /> Register Account</Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-950 shadow-2xl p-0 overflow-hidden max-w-md">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-base font-bold text-foreground uppercase tracking-tight">Register New Account</DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Automatic link to financial ledger</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("name");
                    const accountNo = formData.get("accountNo");
                    const currency = formData.get("currency");

                    setIsCreatingLedger(true);
                    try {
                      // 1. Create Ledger Account automatically (Appending Account No for clarity)
                      const ledgerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                        name: `${name} - ${accountNo}`,
                        code: generateNextAccountCode(),
                        type: 'asset',
                        balance: 0
                      }, {
                        headers: { Authorization: `Bearer ${session.accessToken}` }
                      });

                      if (ledgerResponse.status === 201 || ledgerResponse.status === 200) {
                        // 2. Add to Local Settings State
                        const newAccount = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: name,
                          accountNo: accountNo,
                          currency: currency,
                          status: "active",
                          ledgerId: ledgerResponse.data.data.id // Link them
                        };

                        setSettings(prev => ({
                          ...prev,
                          bankAccounts: [...(prev.bankAccounts || []), newAccount]
                        }));

                        toast.success("Bank account & Ledger entry created successfully.");
                        e.target.reset();
                        fetchLedgerAccounts(); // Refresh codes
                      }
                    } catch (error) {
                      console.error("Ledger creation failed:", error);
                      toast.error(error.response?.data?.message || "Failed to create ledger entry. Bank registration cancelled.");
                    } finally {
                      setIsCreatingLedger(false);
                    }
                  }} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Institutional Title</Label>
                      <Input name="name" placeholder="e.g. Primary Savings" className="h-10 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 font-medium focus-visible:ring-emerald-500" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account No</Label>
                      <Input name="accountNo" placeholder="**** 4242" className="h-10 rounded-md border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 font-medium focus-visible:ring-emerald-500" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currency</Label>
                      <Select name="currency" defaultValue="LKR">
                        <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900 rounded-md font-medium text-sm text-foreground/90"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-md">
                          {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter className="mt-2">
                      <Button type="submit" disabled={isCreatingLedger} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-10 rounded-md text-white uppercase tracking-wide text-xs">
                        {isCreatingLedger ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing...</> : "Register Bank Account"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(!settings.bankAccounts || settings.bankAccounts.length === 0) ? (
                  <div className="md:col-span-2 flex flex-col items-center justify-center py-10 rounded-md border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No operational accounts discovered</p>
                  </div>
                ) : (
                  settings.bankAccounts.map((acc) => (
                    <div key={acc.id} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50 hover:bg-slate-50 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white leading-none">{acc.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-2">
                            <span className="font-mono">{acc.accountNo}</span>
                            <span className="text-emerald-600/50">•</span>
                            <span className="text-emerald-600">{acc.currency}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            bankAccounts: prev.bankAccounts.filter(a => a.id !== acc.id)
                          }));
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. INTERFACE */}
        <TabsContent value="interface" className="mt-6 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-card">
              <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4 text-emerald-600" />
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground uppercase tracking-tight">Look & Feel</CardTitle>
                    <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Environmental appearance and scaling</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Appearance Mode</Label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Laptop },
                    ].map(mode => {
                      const Icon = mode.icon;
                      const isActive = settings.interface.theme === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => updateSetting('interface', 'theme', mode.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-md text-[10px] transition-all font-bold border outline-none",
                            isActive
                              ? "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-500 shadow-sm border-gray-200 dark:border-gray-700"
                              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-white/50"
                          )}
                        >
                          <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground")} />
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Universal Scaling</Label>
                      <p className="text-[10px] text-muted-foreground font-medium">Global font-size adjustment</p>
                    </div>
                    <span className="font-bold tabular-nums text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-100">{settings.interface.fontSize}px</span>
                  </div>
                  <Slider
                    value={[settings.interface.fontSize]}
                    max={18} min={12} step={1}
                    onValueChange={(val) => updateSetting('interface', 'fontSize', val[0])}
                    className="py-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-card">
              <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground uppercase tracking-tight">Workspace Experience</CardTitle>
                    <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Performance & interaction feedback</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-[13px] font-bold text-foreground leading-none uppercase tracking-tight">Compact Workspace</Label>
                    <p className="text-[10px] font-medium text-muted-foreground">Minimize sidebars automatically</p>
                  </div>
                  <Switch
                    checked={settings.interface.sidebar === 'collapsed'}
                    onCheckedChange={(c) => updateSetting('interface', 'sidebar', c ? 'collapsed' : 'fixed')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="space-y-1">
                    <Label className="text-[13px] font-bold text-foreground leading-none uppercase tracking-tight">Visual Density</Label>
                    <p className="text-[10px] font-medium text-muted-foreground">Tighten spacing in tables and lists</p>
                  </div>
                  <Switch
                    checked={settings.interface.density === 'compact'}
                    onCheckedChange={(c) => updateSetting('interface', 'density', c ? 'compact' : 'comfortable')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="space-y-1">
                    <Label className="text-[13px] font-bold text-foreground leading-none uppercase tracking-tight">High Performance</Label>
                    <p className="text-[10px] font-medium text-muted-foreground">Reduce animations for speed</p>
                  </div>
                  <Switch
                    checked={settings.interface.performance === 'high'}
                    onCheckedChange={(c) => updateSetting('interface', 'performance', c ? 'high' : 'standard')}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. PREFIXES */}
        <TabsContent value="prefixes" className="mt-6 outline-none animate-in fade-in slide-in-from-bottom-2">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-lg overflow-hidden bg-card">
            <CardHeader className="py-3 px-6 border-b border-slate-50 dark:border-slate-800/50 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-emerald-600" />
                <div>
                  <CardTitle className="text-sm font-bold text-foreground uppercase tracking-tight">Document Prefix Registry</CardTitle>
                  <CardDescription className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Logical identifiers for transactional documents</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Sales Invoicing', key: 'sale', placeholder: 'INV', icon: DollarSign },
                  { label: 'Purchase Orders', key: 'purchase', placeholder: 'PO', icon: ShoppingBag },
                  { label: 'Estimates', key: 'estimate', placeholder: 'EST', icon: FileText },
                  { label: 'Customer ID', key: 'customer', placeholder: 'CUS', icon: Users },
                  { label: 'Supplier Descriptor', key: 'supplier', placeholder: 'SUP', icon: Settings2 },
                  { label: 'Personnel Logical', key: 'employee', placeholder: 'EMP', icon: Command },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <item.icon className="w-3 h-3" />
                      {item.label}
                    </Label>
                    <div className="group flex transition-all">
                      <div className="bg-gray-50 dark:bg-gray-900 border-slate-200 dark:border-slate-800 border border-r-0 rounded-l-md px-3 flex items-center text-muted-foreground/40 text-[10px] font-bold">
                        #
                      </div>
                      <Input
                        className="h-9 rounded-md rounded-l-none font-medium text-sm text-foreground/90 border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-950 focus-visible:ring-1 focus-visible:ring-emerald-500 text-foreground placeholder:text-slate-200"
                        placeholder={item.placeholder}
                        value={settings.prefixes?.[item.key] || ""}
                        onChange={(e) => updateSetting('prefixes', item.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. LOYALTY SETTINGS */}

      </Tabs>
    </div>
  );
}
