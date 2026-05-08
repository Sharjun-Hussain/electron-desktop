"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  User, Mail, Phone, Lock, Save, X, Loader2,
  ShieldCheck, Fingerprint, Building, UserCircle, Briefcase,
  KeyRound
} from "lucide-react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { JoinedDatePicker } from "./JoinedDatePicker";

// ── Schema ──────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  profile_image: z.any().optional(),
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  nic: z.string().optional(),
  
  // Placement
  branch_id: z.string().min(1, "Primary branch is required"),
  additional_branch_ids: z.array(z.string()).optional(),
  designation: z.string().optional(),
  joined_date: z.date({ required_error: "Joined date is required" }),

  // System Access
  grant_login: z.boolean().default(false),
  password: z.string().optional(),
  role_id: z.string().optional(),
});

// ── Section header helper (Original Style) ────────────────
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

// ── Input class helper (Original Style) ──────────────────
const inputCls = "h-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 text-sm font-medium";
const selectTriggerCls = "h-9 border-gray-200 focus:ring-emerald-500 text-sm font-medium";

// ── Main Form Component ──────────────────────────────────
export function EmployeeForm({ initialData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);

  const isEditMode = !!initialData;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      nic: initialData.nic || "",
      designation: initialData.designation || "",
      joined_date: initialData.joined_date ? new Date(initialData.joined_date) : new Date(),
      branch_id: initialData.branch_id?.toString() || "",
      additional_branch_ids: initialData.branches?.filter(b => b.id !== initialData.branch_id).map(b => b.id.toString()) || [],
      grant_login: !!initialData.user_id,
      role_id: initialData.user?.roles?.[0]?.id?.toString() || "",
      password: "",
    } : {
      first_name: "", last_name: "", email: "", phone: "",
      nic: "", designation: "", joined_date: new Date(), 
      branch_id: "", additional_branch_ids: [],
      grant_login: false, role_id: "", password: "",
    },
  });

  const grantLogin = form.watch("grant_login");

  const [previewUrl, setPreviewUrl] = useState(
    initialData?.user?.profile_image 
      ? `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://apipos.inzeedo.lk'}/${initialData.user.profile_image}` 
      : null
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        setFetchingData(true);
        const [rolesRes, branchesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches/active/list`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }),
        ]);

        const rolesData = await rolesRes.json();
        const branchesData = await branchesRes.json();

        if (rolesData.status === "success") setRoles(rolesData.data.data || []);
        if (branchesData.status === "success") setBranches(branchesData.data || []);
      } catch (err) {
        toast.error("Failed to load roles or branches");
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [session]);

  const handleImageChange = (e, onChange) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error("Unsupported file format");
        return;
      }
      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    }
  };

  async function onSubmit(values) {
    if (!session?.accessToken) return;
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("email", values.email || "");
      formData.append("phone", values.phone);
      formData.append("nic", values.nic || "");
      formData.append("designation", values.designation || "");
      formData.append("joined_date", values.joined_date.toISOString());
      
      // Multi-Branch Handling
      formData.append("branch_id", values.branch_id);
      formData.append("additional_branch_ids", JSON.stringify(values.additional_branch_ids || []));

      // System Access
      formData.append("grant_login", values.grant_login);
      if (values.grant_login) {
        if (!isEditMode || values.password) {
          formData.append("password", values.password);
        }
        formData.append("role_ids", JSON.stringify(values.role_id ? [values.role_id] : []));
      }

      if (values.profile_image instanceof File) {
        formData.append("profile_image", values.profile_image);
      }

      if (isEditMode) {
        formData.append("_method", "PATCH");
      }

      const url = isEditMode
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`;

      const response = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.status === "success") {
        toast.success(`Staff member ${isEditMode ? "updated" : "created"} successfully`);
        router.push("/employees");
      } else {
        throw new Error(data.message || `Failed to ${isEditMode ? "update" : "create"} staff member`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm font-medium">Loading dependencies...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Profile & Identity (Restored Original Layout) ── */}
        <Card className="border-border/40 rounded-xl shadow-sm">
          <CardContent className="p-6">
            <SectionHeader icon={UserCircle} title="Identity & Contact" description="Basic personal details and communication info" />
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Upload */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="w-24 h-24 rounded-lg border border-border shadow-sm">
                  <AvatarImage src={previewUrl} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground rounded-lg">
                    <UserCircle className="w-10 h-10 opacity-20" />
                  </AvatarFallback>
                </Avatar>
                <FormField control={form.control} name="profile_image" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="file" accept="image/*" className="hidden" id="photo-upload"
                        onChange={(e) => handleImageChange(e, field.onChange)} disabled={loading} />
                    </FormControl>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold" disabled={loading}>
                      <label htmlFor="photo-upload">Upload Photo</label>
                    </Button>
                  </FormItem>
                )} />
              </div>

              {/* Identity Fields */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="first_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">First Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                          <Input placeholder="John" className={`${inputCls} pl-9`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="last_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Last Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" className={inputCls} {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                          <Input placeholder="07XXXXXXXX" className={`${inputCls} pl-9`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="nic" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">National ID (NIC)</FormLabel>
                      <FormControl>
                        <Input placeholder="Identification Number" className={inputCls} {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Deployment & Integration (Restored Original Style with New Multi-Branch) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Building} title="Branch Assignments" description="Manage primary and secondary deployments" />
              <div className="space-y-4">
                <FormField control={form.control} name="branch_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Primary Master Branch <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerCls}>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="additional_branch_ids" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Secondary Assignmets</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Assign additional branches..."
                        options={branches
                          .filter(b => b.id.toString() !== form.watch('branch_id'))
                          .map(b => ({ label: b.name, value: b.id.toString() }))
                        }
                        selected={field.value?.map(id => ({ 
                          label: branches.find(b => b.id.toString() === id)?.name || id, 
                          value: id 
                        })) || []}
                        onChange={(selected) => field.onChange(selected.map(s => s.value))}
                      />
                    </FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 rounded-xl shadow-sm">
            <CardContent className="p-6">
              <SectionHeader icon={Briefcase} title="Employment Info" description="Deployment details" />
              <div className="space-y-4">
                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sales Manager" className={inputCls} {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="joined_date" render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5 pt-1.5">
                    <FormLabel className="text-sm font-medium">Joined Date</FormLabel>
                    <FormControl>
                      <JoinedDatePicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── System Access Section ── */}
        <Card className="border-border/40 rounded-xl shadow-sm overflow-hidden bg-muted/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Grant System Access</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow this staff member to log in to the system</p>
                </div>
              </div>
              <FormField control={form.control} name="grant_login" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            {grantLogin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                <div className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">System Email <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                          <Input placeholder="staff@company.com" className={`${inputCls} pl-9 bg-white`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Password {!isEditMode && <span className="text-red-500">*</span>}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                          <Input type="password" placeholder="••••••••" className={`${inputCls} pl-9 bg-white`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4">
                  <FormField control={form.control} name="role_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Authorized Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={`${selectTriggerCls} bg-white`}>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles
                            .filter(role => role.name !== 'Super Admin')
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="h-10 px-5 font-semibold text-sm">
            Cancel Changes
          </Button>
          <Button type="submit" disabled={loading} className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              : <><Save className="mr-2 h-4 w-4" />{isEditMode ? "Save Changes" : "Create Employee"}</>}
          </Button>
        </div>

      </form>
    </Form>
  );
}
