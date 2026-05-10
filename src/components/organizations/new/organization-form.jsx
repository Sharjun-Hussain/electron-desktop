"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, X, Building, MapPin, Phone, Mail,
  Settings2, Activity, Globe, CheckCircle2, Building2, Gift, Briefcase, Layout,
  Shield,
  Camera,
  CreditCard,
  Plus,
  User,
  Trash2,
  Calendar
} from "lucide-react";
import { mutate } from "swr";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useFormRestore } from "@/hooks/use-form-restore";

// ── Schema ──────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;

export const formSchema = z.object({
  logo: z.instanceof(File).optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Only .jpg, .jpeg, .png and .webp formats are supported."),
  website: z.string().optional().or(z.literal("")),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  address: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "Organization name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  city: z.string().min(2, "City must be at least 2 characters."),

  owner_name: z.string().optional().or(z.literal("")),
  owner_password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  owner_phone: z.string().optional(),
  branch_name: z.string().optional(),

  subscription_tier: z.enum(['Essential', 'Professional', 'Enterprise']).optional(),
  billing_cycle: z.enum(['Monthly', 'Yearly', 'Lifetime']).optional(),
  subscription_status: z.enum(['Active', 'Expired', 'Trial', 'Suspended']).optional(),
  subscription_expiry_date: z.string().optional(),
  amount: z.string().optional(),
  payment_method: z.string().optional(),

  subscription_plan: z.string().optional(),
  status: z.string({ required_error: "Please select a status." }),
  bank_accounts: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(2, "Bank name is required"),
    accountNo: z.string().min(5, "Account number is required"),
    currency: z.string().optional(),
    status: z.string().optional(),
  })).optional(),
  business_type: z.string({ required_error: "Please select a business type." }),
  business_mode: z.string({ required_error: "Please select a business mode." }),
  shopify_enabled: z.boolean().optional(),
  whatsapp_enabled: z.boolean().optional(),
});

// ── Section header helper ────────────────────────────────
const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col mb-5">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-md bg-emerald-500/10">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {description && <p className="text-xs text-muted-foreground mt-1 ml-9">{description}</p>}
  </div>
);

// ── Input class helper ───────────────────────────────────
const inputCls = "h-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 text-sm font-medium";
const selectTriggerCls = "h-9 border-gray-200 focus:ring-emerald-500 text-sm font-medium";

// ── Main Form Component ──────────────────────────────────
export function OrganizationForm({ initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const router = useRouter();

  const isEditMode = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      logo: undefined,
      website: initialData.website || "",
      address: initialData.address || "",
      phone: initialData.phone || "",
      email: initialData.email || "",
      city: initialData.city || "",
      subscription_plan: initialData.subscription_plan || undefined,
      subscription_tier: initialData.subscription_tier || undefined,
      billing_cycle: initialData.billing_cycle || undefined,
      subscription_status: initialData.subscription_status || undefined,
      subscription_expiry_date: (initialData.subscription_expiry_date && !isNaN(new Date(initialData.subscription_expiry_date).getTime()) && initialData.subscription_expiry_date !== '1970-01-01T00:00:00.000Z') 
        ? new Date(initialData.subscription_expiry_date).toISOString().split('T')[0] 
        : "",
      amount: "",
      payment_method: "",
      status: initialData.status || "active",
      owner_name: "", owner_password: "", owner_phone: "",
      branch_name: "Main Branch",
      bank_accounts: initialData.bank_accounts || [],
      business_type: initialData.business_type || "Retail",
      business_mode: initialData.business_mode || "Retailer",
      shopify_enabled: !!initialData.shopify_enabled,
      whatsapp_enabled: !!initialData.whatsapp_enabled,
    } : {
      logo: undefined, name: "", phone: "", website: "", address: "", email: "", city: "",
      subscription_plan: undefined, subscription_tier: undefined, billing_cycle: undefined,
      subscription_status: undefined, subscription_expiry_date: "", amount: "", payment_method: "",
      status: "active", owner_name: "", owner_password: "", owner_phone: "",
      branch_name: "Main Branch", bank_accounts: [],
      loyalty_enabled: false,
      business_type: "Retail",
      business_mode: "Retailer",
      shopify_enabled: false,
      whatsapp_enabled: false,
    },
  });

  const { fields: bankAccounts, append: appendBank, remove: removeBank } = useFieldArray({
    control: form.control,
    name: "bank_accounts",
  });

  const { clearSavedData } = useFormRestore(form);

  const logo = form.watch("logo");
  const newLogoPreview = (logo instanceof Blob || logo instanceof File) ? URL.createObjectURL(logo) : null;
  const previewUrl = newLogoPreview || (initialData?.logo ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${initialData.logo}` : "");

  async function onSubmit(data) {
    if (!accessToken) { return toast.error("Authentication failed. Please log in again."); }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("city", data.city);
    formData.append("phone", data.phone);
    if (data.address) formData.append("address", data.address);
    if (data.website) formData.append("website", data.website);

    formData.append("branch_name", data.branch_name || "Main Branch");
    formData.append("branch_address", data.address || "");
    formData.append("branch_phone", data.phone || "");

    formData.append("owner_name", data.owner_name);
    formData.append("owner_email", data.email);
    if (data.owner_password) formData.append("owner_password", data.owner_password);
    formData.append("owner_phone", data.owner_phone || data.phone);

    if (data.subscription_plan) formData.append("subscription_plan", data.subscription_plan);
    if (data.subscription_tier) formData.append("subscription_tier", data.subscription_tier);
    if (data.billing_cycle) formData.append("billing_cycle", data.billing_cycle);
    if (data.subscription_status) formData.append("subscription_status", data.subscription_status);
    if (data.subscription_expiry_date) formData.append("subscription_expiry_date", data.subscription_expiry_date);
    if (data.amount) formData.append("amount", data.amount);
    if (data.payment_method) formData.append("payment_method", data.payment_method);
    if (data.bank_accounts?.length) formData.append("bank_accounts", JSON.stringify(data.bank_accounts));
    formData.append("status", data.status);
    formData.append("loyalty_enabled", data.loyalty_enabled ? "true" : "false");
    formData.append("business_type", data.business_type);
    formData.append("business_mode", data.business_mode);
    formData.append("shopify_enabled", data.shopify_enabled ? "true" : "false");
    formData.append("whatsapp_enabled", data.whatsapp_enabled ? "true" : "false");
    if (data.logo) formData.append("logo", data.logo);

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/create`;

    if (isEditMode) formData.append("_method", "PUT");

    try {
      const response = await fetch(url, {
        method: "POST", // Standardize on POST with _method override
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? "update" : "create"} organization.`);
      }

      toast.success(`Organization ${isEditMode ? "updated" : "created"} successfully!`);
      clearSavedData();
      
      // Invalidate settings cache to refresh sidebar and entitlements
      mutate(`${process.env.NEXT_PUBLIC_API_BASE_URL}/settings/global`);
      
      router.back();
      router.refresh();
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Business Details ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Building} title="Business Details" description="Core business identity and contact information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Business Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input placeholder="e.g. Apex Global" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Business Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="email" placeholder="contact@business.com" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting || isEditMode} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Contact Phone <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input type="tel" placeholder="+1234567890" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-sm font-medium">Headquarters Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input placeholder="Full physical address..." className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">City <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Colombo" className={inputCls} {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel className="text-sm font-medium">Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                      <Input placeholder="https://www.business.com" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField control={form.control} name="business_type" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Business Category <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerCls}>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground/50" />
                          <SelectValue placeholder="Select type" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Retail">Retail & General Store</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing & Production</SelectItem>
                      <SelectItem value="Pharmacy">Pharmacy & Healthcare</SelectItem>
                      <SelectItem value="Restaurant">Restaurant & F&B</SelectItem>
                      <SelectItem value="Hardware">Hardware & Construction</SelectItem>
                      <SelectItem value="Apparel">Apparel & Fashion</SelectItem>
                      <SelectItem value="Salon">Salon & Spa</SelectItem>
                      <SelectItem value="Wholesale">Wholesale & Distribution</SelectItem>
                      <SelectItem value="Other">Other Business</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              <FormField control={form.control} name="business_mode" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Operation Mode <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerCls}>
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4 text-muted-foreground/50" />
                          <SelectValue placeholder="Select mode" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Retailer">Retailer (B2C)</SelectItem>
                      <SelectItem value="Wholesaler">Wholesaler (B2B)</SelectItem>
                      <SelectItem value="Manufacturer">Manufacturer (Factory)</SelectItem>
                      <SelectItem value="Service">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Primary Administrator ── */}
        {!isEditMode && (
          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Shield} title="Primary Administrator" description="Root account and default branch setup" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="owner_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Manager Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input placeholder="Primary login name" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="owner_password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Secure Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className={inputCls} {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="branch_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Main Branch Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input placeholder="e.g. Main Hub" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Subscription Status ── */}
        {isEditMode && (
          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Calendar} title="Subscription Setup" description="Plan management and billing cycles" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="subscription_tier" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Plan Tier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Identify plan" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Essential">Basic Edition</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Enterprise">Enterprise Elite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="billing_cycle" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select cycle" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Yearly">Yearly (Save 20%)</SelectItem>
                        <SelectItem value="Lifetime">Lifetime License</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Billing Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input type="number" placeholder="0.00" className={`${inputCls} pl-9`} {...field} disabled={isSubmitting} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField control={form.control} name="subscription_expiry_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" className={inputCls} {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Brand Identity & Operational Status ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Camera} title="Brand Identity" description="Organization logo" />
              <FormField control={form.control} name="logo" render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24 rounded-lg border border-border shadow-sm">
                      <AvatarImage src={previewUrl} alt="Logo" className="object-cover" />
                      <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
                        <Building className="w-10 h-10 opacity-20" />
                      </AvatarFallback>
                    </Avatar>

                    <FormControl>
                      <Input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" id="file-upload"
                        onChange={(e) => field.onChange(e.target.files?.[0] ?? null)} disabled={isSubmitting} />
                    </FormControl>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold" disabled={isSubmitting}>
                      <label htmlFor="file-upload">{previewUrl ? "Change Logo" : "Upload Logo"}</label>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Square PNG or WEBP (Max 5MB)</p>
                  </div>
                  <FormMessage className="text-center mt-2 text-xs" />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Activity} title="Operational Status" description="Control system access" />
              <div className="space-y-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">System Access</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                {isEditMode && (
                  <FormField control={form.control} name="subscription_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={selectTriggerCls}><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Trial">Trial Period</SelectItem>
                          <SelectItem value="Expired">Payment Due</SelectItem>
                          <SelectItem value="Suspended">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="loyalty_enabled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-amber-50/5 mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold flex items-center gap-2">
                        <Gift className="h-4 w-4 text-amber-600" />
                        Loyalty System
                      </FormLabel>
                      <FormDescription className="text-[10px]">Enable customer points and rewards nexus</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="shopify_enabled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-slate-50/5 mt-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <Layout className="h-4 w-4 text-emerald-600" />
                        Shopify Integration
                      </FormLabel>
                      <FormDescription className="text-[10px]">Enable Shopify POS & Inventory sync</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="whatsapp_enabled" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-slate-50/5 mt-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <Phone className="h-4 w-4 text-blue-600" />
                        WhatsApp CRM
                      </FormLabel>
                      <FormDescription className="text-[10px]">Enable WhatsApp Cloud API / Chatwoot</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Bank Accounts ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Bank Accounts</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Corporate accounts for financial settlements</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="h-8"
                onClick={() => appendBank({ name: "", accountNo: "", currency: "LKR", status: "active" })}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Account
              </Button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border bg-muted/20">
                <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No accounts registered</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 relative group">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100"
                      onClick={() => removeBank(index)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded block w-fit mb-3">Account {index + 1}</span>
                    <div className="space-y-3">
                      <FormField control={form.control} name={`bank_accounts.${index}.name`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">Bank Name</FormLabel>
                          <FormControl><Input placeholder="Bank Name" className="h-8 text-xs" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name={`bank_accounts.${index}.accountNo`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Account No</FormLabel>
                            <FormControl><Input placeholder="Account #" className="h-8 text-xs font-mono" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`bank_accounts.${index}.currency`} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium">Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="CUR" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="LKR">LKR</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="h-10 px-5 font-semibold text-sm">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? "Saving..." : "Creating..."}</>
              : <><Save className="mr-2 h-4 w-4" />{isEditMode ? "Save Changes" : "Create Organization"}</>}
          </Button>
        </div>

      </form>
    </Form>
  );
}
