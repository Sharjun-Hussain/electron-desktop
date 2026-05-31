"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number is required"),
  nic: z.string().min(1, "NIC is required"),

  // Placement
  branch_id: z.string().min(1, "Primary branch is required"),
  additional_branch_ids: z.array(z.string()).default([]),
  designation: z.string().min(1, "Designation is required"),
  joined_date: z.date({ required_error: "Joined date is required" }),

  // System Access
  grant_login: z.boolean().default(false),
  password: z.string().optional(),
  role_id: z.string().optional(),
}).refine((data) => {
  if (data.grant_login) {
    if (!data.email) return false;
    if (!data.role_id) return false;
  }
  return true;
}, {
  message: "Email and Role are required when granting system access",
  path: ["grant_login"],
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
const inputCls = "focus-visible:ring-emerald-500";
const selectTriggerCls = "focus:ring-emerald-500";

// ── Main Form Component ──────────────────────────────────
export function EmployeeForm({ initialData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);

  // Email Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

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

  const handleRequestCode = async () => {
    const email = form.watch("email");
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error("Please enter a valid email address first.");
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-email/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send verification code");

      if (data.data?.verified) {
        setEmailVerified(true);
        toast.success(data.message || "Email already verified.");
        return;
      }

      setVerificationRequested(true);
      toast.success("Verification code sent to " + email);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    const email = form.watch("email");
    if (!otpValue || otpValue.length < 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-email/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ email, code: otpValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code");

      setEmailVerified(true);
      setVerificationRequested(false);
      toast.success("Email verified successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsVerifying(false);
    }
  };

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
    <div className="pb-20">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* ── Profile & Identity ── */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
            <CardContent className="p-8">
              <SectionHeader icon={UserCircle} title="Identity & Identity" description="Basic personal details and communication info" />
              <div className="flex flex-col md:flex-row gap-10">
                {/* Profile Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-32 h-32 rounded-3xl border-2 border-border shadow-xl group-hover:border-emerald-500/50 transition-all duration-300">
                      <AvatarImage src={previewUrl} className="object-cover" />
                      <AvatarFallback className="bg-emerald-500/5 text-emerald-600 rounded-3xl">
                        <UserCircle className="w-12 h-12 opacity-20" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <Save className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <FormField control={form.control} name="profile_image" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="file" accept="image/*" className="hidden" id="photo-upload"
                          onChange={(e) => handleImageChange(e, field.onChange)} disabled={loading} />
                      </FormControl>
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold" disabled={loading}>
                        <label htmlFor="photo-upload" className="cursor-pointer">Change Avatar</label>
                      </Button>
                    </FormItem>
                  )} />
                </div>

                {/* Identity Fields */}
                <div className="flex-1 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="first_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Legal First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input placeholder="John" className={`${inputCls} pl-10`} {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="last_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Legal Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" className={inputCls} {...field} disabled={loading} />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Contact Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input placeholder="07XXXXXXXX" className={`${inputCls} pl-10`} {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="nic" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">National ID (NIC)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input placeholder="Identity Number" className={`${inputCls} pl-10`} {...field} disabled={loading} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Deployment & Info ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden">
              <CardContent className="p-8">
                <SectionHeader icon={Building} title="Branch Assignments" description="Primary and secondary deployments" />
                <div className="space-y-5">
                  <FormField control={form.control} name="branch_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Primary Master Branch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={selectTriggerCls}>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()} className="font-medium text-sm">{branch.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="additional_branch_ids" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Secondary Assignments</FormLabel>
                      <FormControl>
                        <MultiSelect
                          placeholder="Grant domain access..."
                          options={branches
                            .filter(b => b.id.toString() !== form.watch('branch_id'))
                            .map(b => ({ label: b.name, value: b.id.toString() }))
                          }
                          selected={field.value?.map(id => ({
                            label: branches.find(b => b.id.toString() === id)?.name || id,
                            value: id
                          })) || []}
                          onChange={(selected) => field.onChange(selected.map(s => s.value))}
                          className="rounded-xl"
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden">
              <CardContent className="p-8">
                <SectionHeader icon={Briefcase} title="Employment Profile" description="Internal designation & history" />
                <div className="space-y-5">
                  <FormField control={form.control} name="designation" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Functional Role</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                          <Input placeholder="e.g. Sales Executive" className={`${inputCls} pl-10`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="joined_date" render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Onboarding Date</FormLabel>
                      <FormControl>
                        <JoinedDatePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── System Access ── */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-xl rounded-[2rem] overflow-hidden bg-emerald-500/5">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm">
                    <KeyRound className="size-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">Grant Cloud Access</h4>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Authorize this employee to interact with the POS platform</p>
                  </div>
                </div>
                <FormField control={form.control} name="grant_login" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600 shadow-md" />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              {grantLogin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-300">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Authentication Email</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <div className="relative flex-1">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                              placeholder="staff@company.com"
                              className={cn(
                                inputCls,
                                "pl-10",
                                emailVerified && "border-emerald-500 bg-emerald-500/5 text-emerald-700"
                              )}
                              {...field}
                              disabled={loading || isEditMode || emailVerified || verificationRequested}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(val);
                                if (emailVerified) setEmailVerified(false);
                              }}
                            />
                          </div>
                        </FormControl>
                        {!isEditMode && !emailVerified && !verificationRequested && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRequestCode}
                            disabled={isRequesting}
                            className="h-9 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5 px-4 font-bold"
                          >
                            {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                          </Button>
                        )}
                        {!isEditMode && verificationRequested && !emailVerified && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVerificationRequested(false);
                              setOtpValue("");
                            }}
                            className="h-9 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
                          >
                            Change?
                          </Button>
                        )}
                        {emailVerified && (
                          <div className="flex items-center gap-1.5 px-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-[10px] font-bold">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            VERIFIED
                          </div>
                        )}
                      </div>
                      <FormMessage className="text-[10px] font-bold" />

                      {verificationRequested && !emailVerified && (
                        <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-emerald-700 flex items-center gap-2">
                              <KeyRound className="h-3 w-3" />
                              ENTER OTP CODE
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="6-digit code"
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              className="h-9 bg-white border-emerald-500/30 focus-visible:ring-emerald-500 font-mono tracking-widest text-center text-base font-bold"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isVerifying || otpValue.length < 6}
                              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5"
                            >
                              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                          <Input type="password" placeholder="••••••••" className={`${inputCls} pl-10`} {...field} disabled={loading} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="role_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">Assign System Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={selectTriggerCls}>
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles
                            .filter(role => role.name !== 'Super Admin')
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()} className="font-medium text-sm">{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Footer Actions ── */}
          <div className="flex justify-end items-center gap-4 pt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading} className="h-11 px-8 font-bold text-sm text-muted-foreground hover:text-foreground transition-all">
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={loading || (!isEditMode && form.watch("email") && !emailVerified)}
              className={cn(
                "h-10 px-8 text-white font-bold text-sm shadow-md transition-all active:scale-95 border-none",
                (!isEditMode && form.watch("email") && !emailVerified) ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Syncing...</>
                : <><Save className="mr-2 h-4 w-4" />{isEditMode ? "Save Changes" : "Create Employee"}</>}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
