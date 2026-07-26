"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, LayoutDashboard, DollarSign, Receipt, Clock, FileText, TrendingDown, AlertTriangle, Users, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSettings } from "@/hooks/swr/useSettings";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 sm:p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">{title}</h3>
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const ToggleCard = ({ icon: Icon, label, desc, checked, onCheckedChange }) => (
  <Card 
    className={cn(
      "relative overflow-hidden transition-all duration-300 border-2 cursor-pointer group shadow-none",
      checked 
        ? "border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5 hover:border-emerald-500" 
        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none"
    )}
    onClick={() => onCheckedChange(!checked)}
  >
    <CardContent className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-xl transition-all duration-300 shadow-sm",
          checked 
            ? "bg-emerald-500 text-white shadow-emerald-500/20" 
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-500/20"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <Switch 
          checked={checked} 
          onCheckedChange={onCheckedChange}
          onClick={(e) => e.stopPropagation()} 
          className="data-[state=checked]:bg-emerald-500" 
        />
      </div>
      <div className="mt-auto">
        <h4 className={cn(
          "font-bold text-sm mb-1.5 transition-colors duration-300",
          checked 
            ? "text-slate-900 dark:text-white" 
            : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100"
        )}>
          {label}
        </h4>
        <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
          {desc}
        </p>
      </div>
    </CardContent>
  </Card>
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
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
          <SectionHeader 
            icon={LayoutDashboard} 
            title="Dashboard Modules & Widgets" 
            description="Customize exactly which sections and KPI metrics display on your main dashboard." 
          />

          <div className="space-y-8">
            {isRestaurant && (
              <div>
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4 px-1">Restaurant Specific</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ToggleCard 
                    icon={LayoutTemplate}
                    label="Dining Floor Setup" 
                    desc="Display the visual floor manager and table seating metrics in the dashboard." 
                    checked={formData.showTableMonitor ?? true} 
                    onCheckedChange={(c) => updateField('showTableMonitor', c)} 
                  />
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4 px-1">Key Performance Indicators</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <ToggleCard 
                  icon={DollarSign}
                  label="Daily Revenue" 
                  desc="Display daily revenue metrics and performance vs the daily average." 
                  checked={formData.showWidgetRevenue ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetRevenue', c)} 
                />
                <ToggleCard 
                  icon={Receipt}
                  label="Daily Transactions" 
                  desc="Display the total number of checkout transactions processed today." 
                  checked={formData.showWidgetTodaySales ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetTodaySales', c)} 
                />
                <ToggleCard 
                  icon={Clock}
                  label="Active Shifts" 
                  desc="Display the total number of cash drawer shifts opened today." 
                  checked={formData.showWidgetTodayShifts ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetTodayShifts', c)} 
                />
                <ToggleCard 
                  icon={FileText}
                  label="Pending Invoices" 
                  desc="Display a summary of active unpaid or partially paid credit invoices." 
                  checked={formData.showWidgetInvoices ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetInvoices', c)} 
                />
                <ToggleCard 
                  icon={TrendingDown}
                  label="Low Stock Alerts" 
                  desc="Display critical warnings for inventory items nearing depletion limits." 
                  checked={formData.showWidgetLowStock ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetLowStock', c)} 
                />
                <ToggleCard 
                  icon={AlertTriangle}
                  label="Expiring Batches" 
                  desc="Display timely alerts for product batches approaching their expiration dates." 
                  checked={formData.showWidgetExpiring ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetExpiring', c)} 
                />
                <ToggleCard 
                  icon={Users}
                  label="Customer Growth" 
                  desc="Display customer acquisition metrics and engagement growth." 
                  checked={formData.showWidgetNewCustomers ?? true} 
                  onCheckedChange={(c) => updateField('showWidgetNewCustomers', c)} 
                />
              </div>
            </div>
          </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 text-sm rounded-lg shadow-sm"
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Apply Config"}
        </Button>
      </div>
    </div>
  );
}
