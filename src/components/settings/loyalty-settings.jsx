"use client";

import { useSettings } from "@/app/hooks/swr/useSettings";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Gift, Coins, DollarSign, Activity, Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoyaltySettings() {
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: response, isLoading } = useModularSettings('loyalty');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    points_per_currency: 1,
    redemption_rate: 0.01,
    min_redemption_points: 0,
    is_active: true
  });

  useEffect(() => {
    if (response?.data) {
      setSettings(response.data);
    }
  }, [response]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateModularSettings('loyalty', settings);
    if (result.success) {
      toast.success("Loyalty protocols synchronized successfully");
    } else {
      toast.error("Failed to update loyalty settings");
    }
    setIsSaving(false);
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Loyalty Ecosystem</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure customer reward thresholds and redemption logic</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 px-6 shadow-md shadow-emerald-500/20"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Protocols
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                  <Coins className="w-5 h-5" />
               </div>
               <div>
                  <CardTitle className="text-base font-bold">Accrual & Redemption Rules</CardTitle>
                  <CardDescription className="text-xs">Define how points are earned and spent</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Points Per Currency
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Coins className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <Input
                    type="number"
                    value={settings.points_per_currency}
                    onChange={(e) => updateField('points_per_currency', parseFloat(e.target.value))}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Example: If set to 1, a customer earns 100 points on a 100 unit purchase.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  Redemption Rate (Value per Point)
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    value={settings.redemption_rate}
                    onChange={(e) => updateField('redemption_rate', parseFloat(e.target.value))}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Example: 0.01 means 100 points equals 1 unit of currency in discount.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  Min Redemption Threshold
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Activity className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                  <Input
                    type="number"
                    value={settings.min_redemption_points}
                    onChange={(e) => updateField('min_redemption_points', parseInt(e.target.value))}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Customers cannot redeem points until they reach this specific balance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-50 dark:border-slate-800/50 bg-emerald-50/20 dark:bg-emerald-500/5">
                <div className="flex items-center gap-2">
                   <Gift className="w-4 h-4 text-emerald-600" />
                   <CardTitle className="text-sm font-bold">Operational Status</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">Live Status</p>
                    <p className="text-[10px] text-emerald-600/70 font-medium">Toggle accrual system</p>
                  </div>
                  <Switch 
                    checked={settings.is_active} 
                    onCheckedChange={(v) => updateField('is_active', v)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                   <Info className="w-4 h-4 text-slate-400 shrink-0" />
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                     When disabled, customers will neither earn nor be able to redeem points, but their existing balances will be preserved.
                   </p>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
