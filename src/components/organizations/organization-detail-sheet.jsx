"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Building, Users, CreditCard, History,
  Zap, Shield, ShieldAlert, CheckCircle2, XCircle,
  Clock, Mail, Phone, ExternalLink, Activity, Info, Briefcase,
  ShieldCheck, Ban, Tag, DollarSign, Barcode, Loader2, Globe, MapPin,
  Fingerprint, Sparkles, LayoutGrid, Boxes, Landmark, Gift, Database,
  Layout, FileText, Bell, Repeat, PackageCheck,
  BookOpen, Users2, Receipt, Map, QrCode, CloudUpload, Download,
  ShoppingCart, Truck, Wallet, Filter, BarChart3, PieChart,
  Rocket, Crown, AlertCircle, CalendarDays, Lock,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

const MODULES = [
  // Dashboard
  { id: "dashboard_kpi_live", label: "Live KPI Overview", icon: Activity, category: "Analytics" },
  { id: "dashboard_health", label: "Operational Health View", icon: ShieldCheck, category: "Analytics" },
  { id: "dashboard_custom", label: "Custom Dashboard Layout", icon: Layout, category: "Analytics" },
  { id: "reports_basic", label: "Basic Business Reports", icon: BarChart3, category: "Analytics" },
  { id: "reports_advanced", label: "Advanced Analytics Reports", icon: PieChart, category: "Analytics" },

  // POS & Sales
  { id: "pos_billing", label: "POS Billing & Invoices", icon: ShoppingCart, category: "Sales" },
  { id: "pos_advanced", label: "Advanced POS Features", icon: Zap, category: "Sales" },
  { id: "invoice_customization", label: "Customizable Invoices", icon: FileText, category: "Sales" },
  { id: "pos_payments", label: "Split & Multi-Currency", icon: CreditCard, category: "Sales" },
  { id: "pos_offline", label: "Offline Mode Support", icon: Globe, category: "Sales" },

  // Inventory
  { id: "inventory_basic", label: "Stock & Alerts", icon: Bell, category: "Inventory" },
  { id: "inventory_ledger", label: "Advanced Stock Ledger", icon: History, category: "Inventory" },
  { id: "inventory_po", label: "Purchase Orders & Returns", icon: Truck, category: "Inventory" },
  { id: "inventory_transfers", label: "Transfers & Reconciliation", icon: Repeat, category: "Inventory" },
  { id: "inventory_advanced", label: "Batches & Stock Take", icon: PackageCheck, category: "Inventory" },

  // Finance
  { id: "accounting_basic", label: "Basic Financial Ledger", icon: Landmark, category: "Finance" },
  { id: "accounting_ledger_manual", label: "Manual Journal Entries", icon: BookOpen, category: "Finance" },
  { id: "accounting_ledger_customer", label: "Customer Credit Ledgers", icon: Users2, category: "Finance" },
  { id: "accounting_ledger_supplier", label: "Supplier Credit Ledgers", icon: Truck, category: "Finance" },
  { id: "accounting_reconciliation", label: "Bank Reconciliation", icon: Wallet, category: "Finance" },
  { id: "accounting_advanced", label: "P&L, Balance Sheet & Audit", icon: ShieldCheck, category: "Finance" },

  // Operations
  { id: "staff_management", label: "Roles & Permissions", icon: ShieldCheck, category: "Operations" },
  { id: "shift_management", label: "Shift Management", icon: Clock, category: "Operations" },
  { id: "multi_location", label: "Multi-Location Support", icon: Map, category: "Operations" },

  // Tech
  { id: "barcode_customization", label: "Customizable Barcodes", icon: QrCode, category: "System" },
  { id: "backup_manual", label: "Manual Data Backups", icon: Database, category: "System" },
  { id: "backup_automatic", label: "Automated Cloud Backups", icon: CloudUpload, category: "System" },
  { id: "data_export", label: "Advanced Data Export", icon: Download, category: "System" },
];

const InfoCard = ({ icon: Icon, label, value, subValue, accent = "emerald" }) => {
  const accents = {
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    slate: "bg-slate-500/10 text-slate-600 border-slate-500/20"
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs group hover:border-emerald-500/30 transition-all duration-300">
      <div className="flex items-center gap-3 mb-2.5">
        <div className={cn("p-2 rounded-lg border shrink-0 transition-transform group-hover:scale-110", accents[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subValue && <span className="text-[11px] font-medium text-muted-foreground">{subValue}</span>}
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col mb-5">
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {description && <p className="text-[11px] text-muted-foreground mt-1.5 ml-10 font-medium leading-relaxed">{description}</p>}
  </div>
);

export default function OrganizationDetailSheet({
  organizationId,
  isOpen,
  onOpenChange,
  accessToken,
  onUpdate
}) {
  const { hasPermission } = usePermission();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [updateFields, setUpdateFields] = useState({
    status: "Active",
    cycle: "Monthly",
    amount: 0,
    notes: ""
  });
  const [extendingTrial, setExtendingTrial] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [isExtending, setIsExtending] = useState(false);

  // Password Reset State
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDataDialogOpen, setIsResetDataDialogOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [isResettingData, setIsResettingData] = useState(false);

  const fetchDetails = async () => {
    if (!organizationId || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/full-details`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        setData(resData.data);
        const org = resData.data.organization;
        setSelectedPlanId(org?.plan_id || "");
        setUpdateFields({
          status: org?.subscription_status || "Active",
          cycle: org?.billing_cycle || "Monthly",
          amount: org?.plan?.price_monthly || 0,
          notes: ""
        });
      }
    } catch (err) {
      toast.error("Structural sync failure: Unable to fetch organization identity.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/plans`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        setPlans(resData.data?.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch plans");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
      fetchPlans();
    }
  }, [isOpen, organizationId]);

  const handleUpdatePlan = async () => {
    if (!selectedPlanId) return;
    try {
      setIsUpdatingPlan(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/plan`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            plan_id: selectedPlanId,
            subscription_status: updateFields.status,
            billing_cycle: updateFields.cycle,
            amount: updateFields.amount,
            notes: updateFields.notes
          }),
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success("Package updated successfully");
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update package");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleToggleShopify = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/shopify`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(`Shopify integration ${resData.data.shopify_enabled ? 'enabled' : 'disabled'} successfully`);
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle Shopify integration");
    }
  };

  const handleToggleWhatsApp = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/whatsapp`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(`WhatsApp CRM integration ${resData.data.whatsapp_enabled ? 'enabled' : 'disabled'} successfully`);
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle WhatsApp CRM integration");
    }
  };

  const handleToggleLoyalty = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/loyalty`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(`Customer Loyalty system ${resData.data.loyalty_enabled ? 'enabled' : 'disabled'} successfully`);
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle Customer Loyalty system");
    }
  };

  const handleToggleBackup = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/backup`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(`Automated Backup ${resData.data.backup_enabled ? 'enabled' : 'disabled'} successfully`);
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle Automated Backup");
    }
  };

  const handleUpdateBackupPolicy = async (updates) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/backups/admin/${organizationId}/config`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updates),
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success("Organization backup policy updated successfully");
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        throw new Error(resData.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update backup policy");
    }
  };

  const handleExtendTrial = async () => {
    if (!trialDays || isNaN(trialDays) || trialDays <= 0) {
      toast.error("Please enter a valid number of days");
      return;
    }

    try {
      setIsExtending(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/extend-trial`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ days: trialDays }),
        }
      );

      const resData = await response.json();

      if (response.ok) {
        toast.success(`Trial extended by ${trialDays} days`);
        setExtendingTrial(false);
        fetchDetails();
        if (onUpdate) onUpdate();
      } else {
        toast.error(resData.message || "Failed to extend trial");
      }
    } catch (err) {
      toast.error("An error occurred while extending the trial");
    } finally {
      setIsExtending(false);
    }
  };

  const handleToggleModule = async (moduleKey) => {
    try {
      const newOverrides = { ...(org.module_overrides || {}) };

      if (newOverrides[moduleKey] === undefined || newOverrides[moduleKey] === null) {
        const planFeatures = org.plan?.features || [];
        const isCurrentlyEnabled = planFeatures.includes(moduleKey);
        newOverrides[moduleKey] = !isCurrentlyEnabled;
      } else {
        newOverrides[moduleKey] = !newOverrides[moduleKey];
        const planFeatures = org.plan?.features || [];
        const isPlanEnabled = planFeatures.includes(moduleKey);
        if (newOverrides[moduleKey] === isPlanEnabled) {
          delete newOverrides[moduleKey];
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/modules`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ module_overrides: newOverrides }),
        }
      );
      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(`Module override updated`);
        fetchDetails();
      }
    } catch (err) {
      toast.error("Failed to update module override");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Security Protocol: Password must be at least 6 characters for institutional compliance.");
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/reset-admin-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      const resData = await response.json();
      if (resData.status === "success") {
        toast.success(resData.message || "Administrative credentials successfully synchronized.");
        setIsResetPasswordDialogOpen(false);
        setNewPassword("");
      } else {
        throw new Error(resData.message || "Credential synchronization failed.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to reset admin password");
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetData = async () => {
    if (confirmationName !== org?.name) {
      toast.error("Confirmation Mismatch: Please enter the exact organization name.");
      return;
    }

    try {
      setIsResettingData(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${organizationId}/reset-data`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const resData = await response.json();
      if (resData.status === "success") {
        toast.success("Institutional Reset Successful: All transactional and master data has been wiped.");
        setIsResetDataDialogOpen(false);
        setConfirmationName("");
        fetchDetails();
      } else {
        throw new Error(resData.message || "Reset failure.");
      }
    } catch (err) {
      toast.error(err.message || "A system error occurred during the reset protocol.");
    } finally {
      setIsResettingData(false);
    }
  };

  const org = data?.organization;
  const stats = data?.stats;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-[95vw] p-0 overflow-hidden flex flex-col rounded-l-3xl border-l border-border bg-background shadow-2xl">

        {/* Modern Header */}
        <SheetHeader className="px-8 pt-8 pb-6 bg-linear-to-br from-emerald-500/5 via-transparent to-transparent shrink-0">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-xl bg-white dark:bg-slate-900 border border-border shadow-sm flex items-center justify-center shrink-0">
              {org?.logo ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${org.logo}`}
                  alt="Logo"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Building className="h-7 w-7 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-xl font-bold text-foreground truncate">
                  {loading ? "Synchronizing..." : (org?.name || "No Name")}
                </SheetTitle>
                {org && <StatusBadge value={org?.is_active} />}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-medium text-[10px] px-2 py-0">
                  {org?.business_type || "Retail"}
                </Badge>
                <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/20 font-medium text-[10px] px-2 py-0">
                  {org?.business_mode || "Retailer"}
                </Badge>
                <span className="text-[11px] font-medium text-muted-foreground/60">
                  ID: {org?.code || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          <Tabs defaultValue="profile" className="w-full">
            <div className="px-8 sticky top-0 bg-background/80 backdrop-blur-md z-20 pt-2">
              <div className="border-b border-border/40">
                <TabsList className="bg-transparent h-10 w-full justify-start p-0 border-b-0 space-x-1">
                  <TabsTrigger
                    value="profile"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all gap-2"
                  >
                    <Activity className="h-4 w-4" /> Profile
                  </TabsTrigger>
                  <TabsTrigger
                    value="billing"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> Billing
                  </TabsTrigger>
                  <TabsTrigger
                    value="modules"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all gap-2"
                  >
                    <Boxes className="h-4 w-4" /> Modules
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all gap-2"
                  >
                    <History className="h-4 w-4" /> Audit Log
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="px-8 mt-8">
              <TabsContent value="profile" className="space-y-8 mt-0 outline-none animate-in fade-in duration-500">

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4">
                  <InfoCard icon={LayoutGrid} label="Active Branches" value={stats?.totalBranches || 0} subValue="Branches" accent="emerald" />
                  <InfoCard icon={Users} label="Total Members" value={stats?.totalUsers || 0} subValue="Users" accent="blue" />
                </div>

                {/* Management Control Section */}
                <div className="space-y-5">
                  <SectionHeader icon={Zap} title="Administrative Controls" description="Manage fundamental organizational access and states" />

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsResetPasswordDialogOpen(true)}
                      className="justify-between h-14 rounded-xl border-border bg-card/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-medium text-sm group transition-all"
                    >
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <Lock className="h-5 w-5 text-emerald-600" />
                        Reset Admin Password
                      </div>
                      <ExternalLink className="h-4 w-4 opacity-30" />
                    </Button>

                    <Button
                      variant="outline"
                      className={cn(
                        "justify-between h-14 rounded-xl border-border bg-card/50 font-medium text-sm group transition-all",
                        org?.is_active ? "hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600" : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className={cn("h-5 w-5", org?.is_active ? "text-rose-500" : "text-emerald-500")} />
                        {org?.is_active ? "Suspend Organization" : "Restore Organization"}
                      </div>
                      <div className={cn("size-2 rounded-full", org?.is_active ? "bg-rose-500" : "bg-emerald-500")} />
                    </Button>
                  </div>
                </div>

                {/* App Activation Section */}
                <div className="space-y-5">
                  <SectionHeader icon={Boxes} title="Connected Applications" description="Authorize third-party integrations and modular apps" />

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">Shopify Integration</h4>
                          <p className="text-[11px] font-medium text-muted-foreground">Multi-channel inventory synchronization</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={org?.shopify_enabled ? "destructive" : "outline"}
                        onClick={handleToggleShopify}
                        className="h-8 rounded-md font-semibold text-[11px] px-4"
                      >
                        {org?.shopify_enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">WhatsApp CRM</h4>
                          <p className="text-[11px] font-medium text-muted-foreground">Supplier communication & template engine</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={org?.whatsapp_enabled ? "destructive" : "outline"}
                        onClick={handleToggleWhatsApp}
                        className="h-8 rounded-md font-semibold text-[11px] px-4"
                      >
                        {org?.whatsapp_enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">Customer Loyalty</h4>
                          <p className="text-[11px] font-medium text-muted-foreground">Point tracking & reward redemption system</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={org?.loyalty_enabled ? "destructive" : "outline"}
                        onClick={handleToggleLoyalty}
                        className="h-8 rounded-md font-semibold text-[11px] px-4"
                      >
                        {org?.loyalty_enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>

                    {hasPermission(PERMISSIONS.BACKUP_ADMIN) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                              <Database className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">Backup Provisioning</h4>
                              <p className="text-[11px] font-medium text-muted-foreground">Master switch for organization backup services</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={org?.backup_enabled ? "destructive" : "outline"}
                            onClick={handleToggleBackup}
                            className="h-8 rounded-md font-semibold text-[11px] px-4"
                          >
                            {org?.backup_enabled ? "Disable" : "Enable"}
                          </Button>
                        </div>

                        {org?.backup_enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-bold text-foreground leading-none">Manual Downloads</p>
                                <p className="text-[9px] text-muted-foreground leading-none">Allow user export</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleUpdateBackupPolicy({ manual_download_enabled: !org.manual_download_enabled })}
                              >
                                <div className={cn(
                                  "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                                  org.manual_download_enabled ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                )}>
                                  {org.manual_download_enabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                                </div>
                              </Button>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30">
                              <div className="space-y-0.5">
                                <p className="text-[11px] font-bold text-foreground leading-none">Auto Snapshots</p>
                                <p className="text-[9px] text-muted-foreground leading-none">Periodic background runs</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleUpdateBackupPolicy({ auto_backup_enabled: !org.auto_backup_enabled })}
                              >
                                <div className={cn(
                                  "size-4 rounded-full border-2 flex items-center justify-center transition-all",
                                  org.auto_backup_enabled ? "bg-indigo-500 border-indigo-500" : "border-slate-300"
                                )}>
                                  {org.auto_backup_enabled && <CheckCircle2 className="h-3 w-3 text-white" />}
                                </div>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-5">
                  <SectionHeader icon={Info} title="General Information" description="Registered contact details and headquarters location" />

                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: "Email Address", value: org?.email || "N/A" },
                      { icon: Phone, label: "Phone Number", value: org?.phone || "N/A" },
                      { icon: Briefcase, label: "Business Category", value: org?.business_type || "N/A" },
                      { icon: Layout, label: "Operational Style", value: org?.business_mode || "N/A" },
                      { icon: MapPin, label: "Address", value: org?.address || "N/A" },
                      { icon: Calendar, label: "Member Since", value: org?.created_at ? new Date(org.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) : "N/A" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-foreground">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institutional Reset Section (Danger Zone) */}
                <div className="space-y-5">
                  <SectionHeader 
                    icon={ShieldAlert} 
                    title="Institutional Safety Operations" 
                    description="High-priority actions requiring executive authorization" 
                  />

                  <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-rose-900 dark:text-rose-400">Institutional Data Reset</p>
                        <p className="text-[11px] font-medium text-rose-700/70 leading-relaxed">
                          This operation will permanently erase all transactional data, products, stocks, and financial records for this organization. 
                          <span className="font-bold underline ml-1 text-rose-900 dark:text-rose-300">User accounts and login credentials will be preserved.</span>
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setIsResetDataDialogOpen(true)}
                      className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Execute Data Purge
                    </Button>
                  </div>
                </div>

              </TabsContent>

              <TabsContent value="billing" className="space-y-6 mt-0 outline-none animate-in fade-in duration-500">
                {/* Subscription Header */}
                <div className="p-6 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Rocket className="h-4 w-4" />
                        <span className="text-xs font-semibold">Current Subscription</span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {org?.plan?.name || org?.subscription_tier || "No Active Plan"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Expires: {org?.subscription_expiry_date ? new Date(org.subscription_expiry_date).toLocaleDateString() : "Never"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={org?.subscription_status === 'Active' ? 'default' : 'secondary'} className="mb-2">
                        {org?.subscription_status || "N/A"}
                      </Badge>
                      <p className="text-xs font-medium text-muted-foreground">{org?.billing_cycle || "Monthly"} Cycle</p>
                    </div>
                  </div>
                </div>

                {/* Plan Update Section */}
                <div className="space-y-4">
                  <SectionHeader
                    icon={Zap}
                    title="Plan Setup & Synchronization"
                    description="Configure subscription details and resource allocation"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl border border-border bg-card">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Select Plan</label>
                      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Subscription Status</label>
                      <Select
                        value={updateFields.status}
                        onValueChange={(val) => setUpdateFields(prev => ({ ...prev, status: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Trial">Trial</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Billing Cycle</label>
                      <Select
                        value={updateFields.cycle}
                        onValueChange={(val) => setUpdateFields(prev => ({ ...prev, cycle: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="6 Months">6 Months</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                          <SelectItem value="Lifetime">Lifetime</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Amount (USD)</label>
                      <Input
                        type="number"
                        value={updateFields.amount}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Internal Notes</label>
                      <Input
                        value={updateFields.notes}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Reason for change..."
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <Button
                        onClick={handleUpdatePlan}
                        disabled={isUpdatingPlan}
                        className="w-full h-11"
                      >
                        {isUpdatingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                        Update Subscription Settings
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Trial Extension Section */}
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Trial Extension</h4>
                        <p className="text-xs text-amber-700/70">Manually extend organization trial period</p>
                      </div>
                    </div>
                    {!extendingTrial && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-200 bg-white hover:bg-amber-100 text-amber-700"
                        onClick={() => setExtendingTrial(true)}
                      >
                        Extend Period
                      </Button>
                    )}
                  </div>

                  {extendingTrial && (
                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                      <Input
                        type="number"
                        value={trialDays}
                        onChange={e => setTrialDays(e.target.value)}
                        className="h-10 bg-white"
                        placeholder="Days"
                      />
                      <Button
                        onClick={handleExtendTrial}
                        className="h-10 px-6"
                        disabled={isExtending}
                      >
                        {isExtending ? "Processing..." : "Confirm"}
                      </Button>
                      <Button variant="ghost" onClick={() => setExtendingTrial(false)} className="h-10" disabled={isExtending}>Cancel</Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-6 mt-0 outline-none animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Boxes} title="Module Management" description="Granular control over specific system features and ERP modules" />
                  <Badge variant="outline" className="gap-1.5 py-1 px-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-600">
                    <Filter className="h-3 w-3" />
                    <span>Super Admin Mode</span>
                  </Badge>
                </div>

                <div className="space-y-8">
                  {["Analytics", "Sales", "Inventory", "Finance", "Operations", "System"].map(category => (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="h-px flex-1 bg-border/60" />
                        <h4 className="text-[10px] font-bold text-muted-foreground/60">{category}</h4>
                        <span className="h-px flex-1 bg-border/60" />
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {MODULES.filter(m => m.category === category).map((module) => {
                          const planFeatures = org?.plan?.features || [];
                          const isEnabledByPlan = planFeatures.includes(module.id) || planFeatures.includes('all_features');
                          const overrideStatus = org?.module_overrides?.[module.id];
                          const isEnabled = overrideStatus !== undefined ? overrideStatus : isEnabledByPlan;
                          const hasOverride = overrideStatus !== undefined;

                          return (
                            <div key={module.id} className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                              isEnabled ? "bg-card border-border/60 shadow-xs" : "bg-slate-50/50 border-border/40 opacity-70"
                            )}>
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "p-2.5 rounded-xl border transition-colors",
                                  isEnabled ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-slate-200"
                                )}>
                                  <module.icon className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-foreground">{module.label}</h4>
                                    {hasOverride && (
                                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        Override
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-medium text-muted-foreground">
                                    {isEnabledByPlan ? "Included in Plan" : "Not in Plan"}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant={isEnabled ? "default" : "outline"}
                                onClick={() => handleToggleModule(module.id)}
                                className="h-8 text-[10px] font-bold px-4"
                              >
                                {isEnabled ? "Active" : "Disabled"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6 mt-0 outline-none animate-in fade-in duration-500">
                <SectionHeader icon={History} title="System Audit Logs" description="Historical records of structural changes and subscription events" />

                <div className="space-y-6 relative ml-4 border-l-2 border-border/60 pl-8 pb-10">
                  {org?.subscription_histories?.length > 0 ? (
                    org.subscription_histories.map((h, i) => (
                      <div key={h.id} className="relative group">
                        <div className="absolute left-[-41px] top-1 size-5 rounded-full border-4 border-background bg-emerald-500 shadow-sm transition-transform group-hover:scale-125 z-10" />
                        <div className="bg-card/50 border border-border rounded-xl p-5 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-xs duration-300">
                          <div className="flex justify-between items-center mb-3">
                            <p className="font-bold text-xs text-foreground">{h.subscription_tier} Deployment</p>
                            <span className="text-[10px] font-medium opacity-50">{new Date(h.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed">
                            Authorized <span className="text-foreground font-semibold">{h.billing_cycle}</span> cycle via <span className="text-emerald-600 font-bold">{h.payment_method}</span>.
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                              {h.amount} {h.currency || "USD"}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium italic truncate opacity-40">"{h.notes || "System update"}"</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                      <History size={40} strokeWidth={1.5} />
                      <p className="font-bold text-[10px] tracking-widest uppercase">Zero records</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>

      {/* Reset Admin Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Lock className="w-5 h-5 text-emerald-600" />
              </div>
              Reset Admin Credentials
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground pt-2">
              This will forcefully update the primary administrative password for <span className="text-foreground font-bold">{org?.name}</span>. Ensure institutional clearance before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-muted-foreground uppercase  ml-1 mb-2">New Administrative Password</label>
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className=" rounded-md mt-3 border-border bg-card/50 px-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg tracking-widest"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">
                Security requirement: Minimum 6 characters with alpha-numeric complexity.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
              className="rounded-xl h-11 px-6 font-semibold"
            >
              Abort
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResetting || !newPassword}
              className="rounded-xl h-11 px-8 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 gap-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Update Credentials
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Institutional Reset Confirmation Dialog */}
      <Dialog open={isResetDataDialogOpen} onOpenChange={setIsResetDataDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-rose-500/20 bg-white dark:bg-slate-900 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto size-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="h-7 w-7 text-rose-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-rose-950 dark:text-rose-400">Security Authorization Required</DialogTitle>
            <DialogDescription className="text-center text-slate-500 font-medium">
              You are about to initiate an institutional reset. This action is irreversible. All inventory, sales, and accounts for <span className="font-bold text-slate-900 dark:text-slate-200">"{org?.name}"</span> will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center block">
                Type the organization name to confirm
              </label>
              <Input
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                placeholder={org?.name}
                className="h-12 text-center font-bold text-lg border-rose-200 focus-visible:ring-rose-500 bg-slate-50"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsResetDataDialogOpen(false)}
              className="rounded-xl font-bold px-6"
              disabled={isResettingData}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetData}
              disabled={isResettingData || confirmationName !== org?.name}
              className="rounded-xl px-8 font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20"
            >
              {isResettingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purging Data...
                </>
              ) : (
                "Authorize Purge"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}


