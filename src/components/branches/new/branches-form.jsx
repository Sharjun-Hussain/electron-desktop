"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import useSWR from "swr";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, X, Building, MapPin, Phone, Mail,
  User, Clock, Tag, Settings2, CheckCircle2,
  Lock, ArrowUpCircle
} from "lucide-react";
import { useAppSettings } from "@/app/hooks/useAppSettings";

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
import { Switch } from "@/components/ui/switch";

// ── Schema ──────────────────────────────────────────────
const formSchema = z.object({
  organization_id: z.string().optional(),
  name: z.string().min(3, "Branch name must be at least 3 characters."),
  code: z.string().min(1, "Branch code is required."),
  phone: z.string().min(10, "A valid phone number is required."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  manager_id: z.string().optional().or(z.literal("")),
  opening_time: z.string().optional().or(z.literal("")),
  closing_time: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  is_main_branch: z.boolean().default(false),
});

// ── Org fetcher ──────────────────────────────────────────
const organizationFetcher = async ([url, token]) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error((await res.json())?.message || "Failed to fetch organizations");
  const data = await res.json();
  if (data.status === "success") return data?.data?.data?.filter((o) => o?.is_active);
  throw new Error(data?.message || "Failed to fetch");
};

const employeeFetcher = async ([url, token]) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data = await res.json();
  return data.data; // getAllEmployees returns data as an object with data array
};

// ── Section header helper ────────────────────────────────
const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="p-1.5 rounded-md bg-emerald-500/10">
      <Icon className="w-3.5 h-3.5 text-emerald-600" />
    </div>
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
  </div>
);

// ── Input class helper ───────────────────────────────────
const inputCls = "h-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 text-sm font-medium";
const selectTriggerCls = "h-9 border-gray-200 focus:ring-emerald-500 text-sm font-medium";

// ── Main Form Component ──────────────────────────────────
export function BranchForm({ initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const isEditMode = !!initialData;
  const { business } = useAppSettings();
  const isEssential = business?.subscription_tier === "Essential";
  const isSuperAdmin = session?.user?.roles?.includes("Super Admin");

  // Allow Super Admin to bypass or allow editing existing branch even if Essential
  const isRestricted = isEssential && !isEditMode && !isSuperAdmin;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
        ...initialData,
        email: initialData.email || "",
        code: initialData.code || "",
        city: initialData.city || "",
        manager_id: initialData.manager_id || "",
        opening_time: initialData.opening_time || "",
        closing_time: initialData.closing_time || "",
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        is_main_branch: initialData.is_main || false,
        organization_id: initialData.organization_id,
      }
      : {
        organization_id: undefined,
        name: "", code: "", phone: "", address: "", city: "",
        email: "", manager_id: "",
        opening_time: "", closing_time: "",
        is_active: true, is_main_branch: false,
      },
  });

  // const isSuperAdmin = session?.user?.roles?.includes("Super Admin");

  const { data: organizations, error: orgError, isLoading: isFetchingOrgs } = useSWR(
    accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`, accessToken] : null,
    organizationFetcher,
    { revalidateOnFocus: false }
  );

  const { data: employeeData, isLoading: isFetchingEmployees } = useSWR(
    accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees?size=100`, accessToken] : null,
    employeeFetcher,
    { revalidateOnFocus: false }
  );

  const employees = employeeData?.data || [];

  useEffect(() => {
    if (orgError) toast.error(orgError.message || "Failed to load organizations.");
  }, [orgError]);

  const onSubmit = async (values) => {
    if (!accessToken) { toast.error("Authentication failed."); return; }
    setIsSubmitting(true);
    form.clearErrors("root.serverError");

    const url = isEditMode
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/${initialData?.id}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`;

    try {
      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((e) => {
            if (e.field && e.messages?.[0]) form.setError(e.field, { type: "server", message: e.messages[0] });
          });
        } else {
          form.setError("root.serverError", { type: "server", message: data.message });
        }
        toast.error(data.message || "Please fix the errors below.");
      } else {
        toast.success(`Branch ${isEditMode ? "updated" : "created"} successfully!`);
        router.back();
      }
    } catch (err) {
      toast.error(err.message || "A network error occurred.");
      form.setError("root.serverError", { type: "server", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRestricted) {
    return (
      <Card className="border-amber-200 bg-amber-50/20 overflow-hidden">
        <div className="h-1 bg-amber-500 w-full" />
        <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
          <div className="p-2 bg-amber-100 rounded-full">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 leading-tight">Multi-Location Support Restricted</h2>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>, optimized for single-location operations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl pt-1">
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-none">Professional</div>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">Up to 5 locations with centralized management.</p>
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-start gap-2 text-left">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-bold text-slate-900 leading-none">Enterprise</div>
                <p className="text-[9px] text-slate-400 mt-1 leading-tight">Unlimited branches with advanced inventory sync.</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.back()} className="h-8 px-4 text-[10px] font-semibold border-slate-200">
              <X className="w-3.5 h-3.5 mr-2" /> Cancel
            </Button>
            <Button size="sm" className="h-8 px-5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 text-[10px] font-bold" onClick={() => router.push('/settings?tab=subscription')}>
              <ArrowUpCircle className="w-3.5 h-3.5 mr-2" /> Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Branch Details ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Building} title="Branch Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="organization_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Organization</FormLabel>
                      <Select value={field.value ? String(field.value) : undefined} onValueChange={field.onChange} disabled={isFetchingOrgs}>
                        <FormControl>
                          <SelectTrigger className={selectTriggerCls}>
                            <SelectValue placeholder={isFetchingOrgs ? "Loading..." : "Select an organization"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!isFetchingOrgs && (organizations || []).length === 0 && (
                            <SelectItem value="none" disabled>No organizations found</SelectItem>
                          )}
                          {(organizations || []).map((org) => (
                            <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Branch Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input placeholder="e.g., Main Branch" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Branch Code <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input placeholder="e.g., BR001" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Phone <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input type="tel" placeholder="+1234567890" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input type="email" placeholder="branch@example.com" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Location & Hours ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={MapPin} title="Location & Hours" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input placeholder="123 Main Street" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">City <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="New York" className={inputCls} {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="opening_time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Opening Time <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input type="time" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="closing_time" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Closing Time <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <Input type="time" className={`${inputCls} pl-9`} {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Manager ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={User} title="Manager Selection" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Branch Manager</FormLabel>
                    <Select value={field.value ? String(field.value) : undefined} onValueChange={field.onChange} disabled={isFetchingEmployees}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue placeholder={isFetchingEmployees ? "Loading staff..." : "Select a manager"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (Unassigned)</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={String(emp.id)}>
                            {emp.name} ({emp.designation || "Staff"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Choose an employee to head this location.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Settings ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={Settings2} title="Settings" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <FormLabel className="text-sm font-medium text-foreground">Active Status</FormLabel>
                    </div>
                    <FormDescription className="text-xs text-muted-foreground">
                      Inactive branches are not visible to customers
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="is_main_branch" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-emerald-600" />
                      <FormLabel className="text-sm font-medium text-foreground">Main Branch</FormLabel>
                    </div>
                    <FormDescription className="text-xs text-muted-foreground">
                      Mark this as the primary branch for the organization
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Server error ── */}
        {form.formState.errors?.root?.serverError && (
          <p className="text-sm font-medium text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {form.formState.errors.root.serverError.message}
          </p>
        )}

        {/* ── Footer Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="h-10 px-5 font-semibold border-gray-200 text-sm"
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? "Saving..." : "Creating..."}</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />{isEditMode ? "Save Changes" : "Create Branch"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
