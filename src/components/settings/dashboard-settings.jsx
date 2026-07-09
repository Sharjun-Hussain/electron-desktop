"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { Save, Loader2, LayoutDashboard, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">{title}</h3>
    </div>
    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium pl-11">{description}</p>
  </div>
);

const ToggleRow = ({ label, desc, checked, onCheckedChange }) => (
  <div className="flex items-center justify-between py-2">
    <div className="space-y-1 pr-4">
      <Label className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-none">{label}</Label>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-emerald-500" />
  </div>
);

export function DashboardSettings() {
  const { data: session } = useSession();
  const { useModularSettings, updateModularSettings } = useSettings();
  const { data: posSettings, isLoading, mutate } = useModularSettings("pos");
  const { business } = useAppSettings();

  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (posSettings?.data) {
      setFormData(posSettings.data);
    }
  }, [posSettings]);

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    try {
      await updateModularSettings("pos", formData);
      toast.success("Dashboard settings updated successfully");
      mutate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save dashboard settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isRestaurant = business?.business_type?.toLowerCase() === 'restaurant';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-md overflow-hidden">
        <CardContent className="p-6">
          <SectionHeader 
            icon={LayoutDashboard} 
            title="Dashboard Interface" 
            description="Customize the widgets and sections displayed on your main dashboard" 
          />

          <div className="space-y-4 max-w-2xl">
            {isRestaurant && (
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <ToggleRow 
                  label="Show Table Setup Dashboard" 
                  desc="Display the dining floor manager and table seating metrics in the main dashboard" 
                  checked={formData.showTableMonitor ?? true} 
                  onCheckedChange={(c) => updateField('showTableMonitor', c)} 
                />
              </div>
            )}
            
            {/* Future settings can go here */}
            {!isRestaurant && (
              <div className="p-8 text-center text-slate-500 text-sm border border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <Monitor className="w-8 h-8 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                <p>No dashboard specific settings available for your current business type yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !isRestaurant} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 text-sm rounded-lg shadow-sm"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Apply Config"}
        </Button>
      </div>
    </div>
  );
}
