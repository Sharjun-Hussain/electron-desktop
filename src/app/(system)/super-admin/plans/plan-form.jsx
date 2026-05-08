"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  FileText,
  CreditCard,
  Bell,
  History,
  Repeat,
  PackageCheck,
  BookOpen,
  Users2,
  Receipt,
  Building2,
  ShieldCheck,
  Clock,
  Map,
  QrCode,
  CloudUpload,
  Download,
  ShoppingCart,
  Truck,
  Wallet,
  Layers,
  Save,
  Database
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price_monthly: z.coerce.number(),
  price_yearly: z.coerce.number(),
  price_per_additional_user: z.coerce.number().default(1000),
  max_branches: z.coerce.number().int(),
  max_users: z.coerce.number().int(),
  trial_days: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
  features: z.array(z.string()).default([]),
});

const MODULES = [
  // DASHBOARD & ANALYTICS
  { id: "dashboard_kpi_live", label: "Live KPI Overview", icon: Activity, category: "Analytics" },
  { id: "dashboard_health", label: "Operational Health View", icon: ShieldCheck, category: "Analytics" },
  { id: "dashboard_custom", label: "Customizable Business KPIs", icon: Activity, category: "Analytics" },
  { id: "reports_basic", label: "Basic Sales/Stock Reports", icon: FileText, category: "Analytics" },
  { id: "reports_advanced", label: "Advanced Financial Reports", icon: FileText, category: "Analytics" },
  { id: "reports_inventory", label: "Deep Inventory Analytics", icon: Activity, category: "Analytics" },

  // POS BILLING & SALES
  { id: "pos_billing", label: "Standard POS Terminal", icon: ShoppingCart, category: "Sales" },
  { id: "pos_advanced", label: "Advanced POS (Variants/Multi)", icon: ShoppingCart, category: "Sales" },
  { id: "invoice_customization", label: "Fully Customizable Invoices", icon: FileText, category: "Sales" },
  { id: "pos_payments", label: "Multi-Currency & Split Pay", icon: CreditCard, category: "Sales" },
  { id: "pos_offline", label: "Offline POS Operations", icon: CloudUpload, category: "Sales" },
  { id: "pos_orders", label: "Kitchen & Order Tracking", icon: Clock, category: "Sales" },

  // INVENTORY & WAREHOUSING
  { id: "inventory_basic", label: "Basic Stock Tracking", icon: Bell, category: "Inventory" },
  { id: "inventory_advanced", label: "Advanced Batch & Expiry", icon: PackageCheck, category: "Inventory" },
  { id: "inventory_ledger", label: "Detailed Stock Ledgers", icon: History, category: "Inventory" },
  { id: "inventory_po", label: "PO & GRN Workflow", icon: Truck, category: "Inventory" },
  { id: "inventory_transfers", label: "Branch Stock Transfers", icon: Repeat, category: "Inventory" },
  { id: "inventory_reconciliation", label: "Stock Count & Reconcile", icon: ShieldCheck, category: "Inventory" },
  { id: "inventory_raw_material", label: "Raw Materials & BOM", icon: Layers, category: "Inventory" },

  // ACCOUNTING & FINANCE
  { id: "accounting_basic", label: "Standard Bookkeeping", icon: Receipt, category: "Finance" },
  { id: "accounting_advanced", label: "Advanced ERP Accounting", icon: ShieldCheck, category: "Finance" },
  { id: "accounting_ledger_manual", label: "Manual General Ledgers", icon: BookOpen, category: "Finance" },
  { id: "accounting_ledger_supplier", label: "Supplier Ledgers & AP", icon: Truck, category: "Finance" },
  { id: "accounting_ledger_customer", label: "Customer Ledgers & AR", icon: Users2, category: "Finance" },
  { id: "accounting_reconciliation", label: "Bank & Cash Reconciliation", icon: Wallet, category: "Finance" },
  { id: "accounting_tax", label: "Tax Management & Filing", icon: FileText, category: "Finance" },

  // OPERATIONS & STAFF
  { id: "staff_management", label: "Staff Roles & Permissions", icon: ShieldCheck, category: "Operations" },
  { id: "shift_management", label: "Shift & Attendance Control", icon: Clock, category: "Operations" },
  { id: "multi_location", label: "Multi-Branch Management", icon: Map, category: "Operations" },
  { id: "branch_settings", label: "Location Specific Settings", icon: Building2, category: "Operations" },

  // SYSTEM & TECHNOLOGY
  { id: "barcode_customization", label: "Customizable Barcode Engine", icon: QrCode, category: "System" },
  { id: "backup_manual", label: "Manual Data Backups", icon: Database, category: "System" },
  { id: "backup_automatic", label: "Automated Cloud Backups", icon: CloudUpload, category: "System" },
  { id: "data_export", label: "Advanced Data Portability", icon: Download, category: "System" },
  { id: "audit_logs", label: "Full System Audit Trail", icon: History, category: "System" },

  // MASTER ACCESS
  { id: "all_features", label: "MASTER ACCESS (Wildcard)", icon: ShieldCheck, category: "System" },
];

export default function PlanForm({ initialData, onSubmit, onCancel, isSubmitting }) {
  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If it's a comma-separated string or just a single string
      if (typeof features === "string" && features.startsWith("[")) return [];
      return typeof features === "string" ? features.split(",").filter(Boolean) : [];
    }
  };

  const form = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: initialData ? {
      ...initialData,
      features: parseFeatures(initialData.features),
    } : {
      name: "",
      description: "",
      price_monthly: 0,
      price_yearly: 0,
      price_per_additional_user: 1000,
      max_branches: 1,
      max_users: 5,
      trial_days: 14,
      is_active: true,
      features: ["pos_billing", "inventory_basic"],
    },
  });

  // 🔄 Sync form when initialData changes (crucial for Sheets/Modals)
  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        features: parseFeatures(initialData.features),
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price_monthly: 0,
        price_yearly: 0,
        price_per_additional_user: 1000,
        max_branches: 1,
        max_users: 5,
        trial_days: 14,
        is_active: true,
        features: ["pos_billing", "inventory_basic"],
      });
    }
  }, [initialData, form]);

  const currentFeatures = form.watch("features");
  const isMasterPlan = Array.isArray(currentFeatures) && currentFeatures.includes("all_features");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

        {/* CORE CONFIGURATION */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Core Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Plan Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Professional ERP" className="shadow-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trial_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Trial Period (Days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      className="shadow-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-foreground">Service Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Highlight the key value proposition..." className="resize-none shadow-xs" rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* PRICING STRUCTURE */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Pricing Structure</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <FormField
              control={form.control}
              name="price_monthly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground text-[11px] uppercase tracking-wider opacity-70">Monthly (Rs)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="shadow-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_yearly"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground text-[11px] uppercase tracking-wider opacity-70">Yearly (Rs)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="shadow-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price_per_additional_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground text-[11px] uppercase tracking-wider opacity-70">Extra User (Rs/mo)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="shadow-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* RESOURCE LIMITS */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Resource Architecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-muted/30 rounded-xl border border-border/50">
            <FormField
              control={form.control}
              name="max_branches"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Max Branches</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      className="bg-background shadow-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">Use -1 for unlimited locations.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_users"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-foreground">Max Staff Licenses</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      className="bg-background shadow-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">Total concurrent user accounts allowed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* FEATURE MATRIX */}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">ERP Feature Matrix</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMasterPlan && (
                      <Badge variant="success" className="text-[9px] uppercase font-black bg-emerald-500 text-white border-0 shadow-sm px-2">Master Bypass Active</Badge>
                    )}
                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                      {isMasterPlan ? "Unlimited" : `${(Array.isArray(field.value) ? field.value : []).filter(id => MODULES.some(m => m.id === id)).length || 0} Modules Active`}
                    </div>
                  </div>
                </div>

                {["Analytics", "Sales", "Inventory", "Finance", "Operations", "System"].map(category => (
                  <div key={category} className="space-y-3 mt-6 first:mt-0">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">{category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {MODULES.filter(m => m.category === category)
                        .filter(m => !(form.watch("name")?.toLowerCase() === "essential" && ["staff_management", "shift_management"].includes(m.id)))
                        .map((module) => {
                          const isModuleActive = (field.value || []).includes(module.id);
                          const isActive = isMasterPlan || isModuleActive;
                          const isWildcard = module.id === "all_features";

                        const handleToggle = (checked) => {
                          const currentValues = field.value || [];
                          let newValue;

                          if (isWildcard) {
                            newValue = checked ? ["all_features"] : [];
                          } else {
                            newValue = checked
                              ? [...currentValues, module.id]
                              : currentValues.filter((v) => v !== module.id);
                          }

                          if (JSON.stringify(newValue) !== JSON.stringify(currentValues)) {
                            field.onChange(newValue);
                          }
                        };

                        return (
                          <label
                            key={module.id}
                            className={`flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-3 transition-all cursor-pointer select-none ${isActive
                              ? isWildcard ? "bg-indigo-50/50 border-indigo-200 shadow-xs" : "bg-emerald-50/50 border-emerald-200 shadow-xs"
                              : "bg-background/50 border-border/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                              } ${isMasterPlan && !isWildcard ? "opacity-80 cursor-default" : ""}`}
                          >
                            <Checkbox
                              checked={isActive}
                              onCheckedChange={handleToggle}
                              disabled={isMasterPlan && !isWildcard}
                            />
                            <div className="flex items-center gap-2">
                              <module.icon className={`size-4 ${isActive ? isWildcard ? "text-indigo-600" : "text-emerald-600" : "text-muted-foreground"}`} />
                              <span className={`font-bold text-[11px] mt-0! ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                {module.label}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <FormMessage />
              </>
            )}
          />
        </div>

        {/* STATUS & SUBMIT */}
        <div className="pt-6 border-t border-border flex flex-col gap-6">
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/20 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-foreground">Operational Status</FormLabel>
                  <FormDescription className="text-[10px]">Toggles public visibility of this tier.</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] font-bold shadow-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {initialData ? "Update Matrix" : "Deploy Plan"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
