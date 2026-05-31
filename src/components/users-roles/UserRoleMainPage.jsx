"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Users,
  Shield,
  Check,
  UserPlus,
  Loader2,
  RefreshCw,
  CheckSquare,
  Square,
  X,
  ShieldCheck,
  LayoutGrid,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building,
  Calendar,
  Settings,
  ShieldAlert,
  ChevronRight,
  Grid3X3,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFormRestore } from "@/hooks/use-form-restore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { ProtectedComponent } from "@/components/auth/ProtectedComponent";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import { cn, getImageUrl } from "@/lib/utils";
import UsersPageSkeleton from "@/app/skeletons/Users-skeleton";
import { useAppSettings } from "@/app/hooks/useAppSettings";

import { toast } from "sonner";

// --- HELPER: Group Permissions by 'group_name' ---
const groupPermissionsBySection = (permissions) => {
  if (!permissions || !Array.isArray(permissions)) return {};
  return permissions.reduce((groups, perm) => {
    // Robust fallback: group_name -> name prefix -> "Other Permissions"
    let group = perm.group_name;
    if (!group && perm.name && perm.name.includes(":")) {
      group = perm.name.split(":")[0];
    }
    if (!group) {
      group = "System Controls";
    }

    // Capitalize for display
    group = group.charAt(0).toUpperCase() + group.slice(1);

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(perm);
    return groups;
  }, {});
};

// --- HELPER: Get Avatar Color based on name ---
const getAvatarColor = (name) => {
  const colors = [
    "bg-emerald-500/20 text-emerald-600",
    "bg-blue-500/20 text-blue-600",
    "bg-purple-500/20 text-purple-600",
    "bg-orange-500/20 text-orange-600",
    "bg-pink-500/20 text-pink-600",
    "bg-red-500/20 text-red-600",
    "bg-cyan-500/20 text-cyan-600",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};



// --- ZOD SCHEMA ---
const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permissions: z.array(z.string()).default([]),
});

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
  organizationId: z.string().min(1, "Organization is required"),
  roleId: z.string().min(1, "Role is required"),
  branchIds: z.array(z.any()).min(1, "Select at least one branch"),
  isActive: z.boolean().default(true),
}).refine((data) => {
  if (data.password && data.password !== data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

// --- COMPONENT: ROLE FORM SHEET ---
const RoleFormDialog = ({
  isOpen,
  onClose,
  initialData,
  allPermissions,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetPermSearch, setSheetPermSearch] = useState("");

  const groupedPermissions = useMemo(() => {
    const filtered = sheetPermSearch
      ? allPermissions.filter(p =>
        p.name.toLowerCase().includes(sheetPermSearch.toLowerCase()) ||
        p.group_name?.toLowerCase().includes(sheetPermSearch.toLowerCase())
      )
      : allPermissions;
    return groupPermissionsBySection(filtered);
  }, [allPermissions, sheetPermSearch]);

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", permissions: [] },
  });

  const { clearSavedData } = useFormRestore(form, "user_role_dialog_form");
  const { setValue, watch, handleSubmit: hookFormSubmit, reset } = form;
  const selectedPermIds = watch("permissions");

  useEffect(() => {
    if (isOpen) {
      setSheetPermSearch("");
      if (initialData) {
        reset({ name: initialData.name, permissions: initialData.permissions ? initialData.permissions.map(p => p.id) : [] });
      } else {
        reset({ name: "", permissions: [] });
      }
    }
  }, [isOpen, initialData, reset]);

  const togglePermission = (id) => {
    const perm = allPermissions.find(p => p.id === id);
    if (perm && !perm.can_assign) {
      toast.error("Access Restricted: You cannot assign permissions beyond your own authority level.");
      return;
    }
    const current = selectedPermIds || [];
    setValue("permissions", current.includes(id) ? current.filter(p => p !== id) : [...current, id], { shouldDirty: true });
  };

  const toggleGroup = (groupName) => {
    const groupPerms = groupedPermissions[groupName];
    // Only include permissions that the user is allowed to assign
    const assignableGroupIds = groupPerms.filter(p => p.can_assign).map(p => p.id);
    const current = selectedPermIds || [];

    // Check if ALL assignable permissions in this group are already selected
    const allAssignableSelected = assignableGroupIds.every(id => current.includes(id));

    if (allAssignableSelected) {
      // Deselect only the assignable ones
      setValue("permissions", current.filter(id => !assignableGroupIds.includes(id)), { shouldDirty: true });
    } else {
      // Select all assignable ones
      setValue("permissions", [...new Set([...current, ...assignableGroupIds])], { shouldDirty: true });
    }
  };

  const toggleAll = () => {
    const assignableIds = allPermissions.filter(p => p.can_assign).map(p => p.id);
    const current = selectedPermIds || [];

    // If all assignable are already selected, deselect all. Otherwise, select all assignable.
    const allAssignableSelected = assignableIds.length > 0 && assignableIds.every(id => current.includes(id));

    setValue("permissions",
      allAssignableSelected ? [] : assignableIds,
      { shouldDirty: true }
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    await onSave(data, initialData?.id);
    clearSavedData();
    setIsSubmitting(false);
    onClose();
  };

  const sortedGroups = Object.keys(groupedPermissions).sort();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col w-full sm:max-w-2xl p-0 overflow-hidden bg-background border-l border-border/40">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md shrink-0">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-bold text-foreground">
                {initialData ? "Edit Role" : "Create Role"}
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                {initialData ? `Editing permissions for "${initialData.name}"` : "Define a new access role and assign permissions"}
              </p>
            </div>
            {selectedPermIds.length > 0 && (
              <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium text-xs">
                {selectedPermIds.length} selected
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Role Name */}
        <div className="px-6 py-5 border-b border-border/40 shrink-0">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Role Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Inventory Manager, Cashier..."
              {...form.register("name")}
              className="h-9 border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 text-sm font-medium"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500 font-medium">{form.formState.errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Permissions toolbar */}
        <div className="px-6 py-3 border-b border-border/40 shrink-0 flex items-center gap-3 bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter permissions..."
              value={sheetPermSearch}
              onChange={e => setSheetPermSearch(e.target.value)}
              className="h-8 pl-8 text-xs border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 bg-white"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAll}
            className={cn(
              "h-8 px-3 rounded-md text-xs font-medium shrink-0 transition-all",
              selectedPermIds.length === allPermissions.length
                ? "text-red-600 hover:bg-red-500/5"
                : "text-emerald-600 hover:bg-emerald-500/5 border border-emerald-500/20"
            )}
          >
            {selectedPermIds.length === allPermissions.length ? "Deselect All" : "Select All"}
          </Button>
        </div>

        {/* Permissions scrollable list */}
        <div className="flex-1 overflow-y-auto">
          {sortedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Lock className="w-8 h-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No permissions match your filter</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {sortedGroups.map((group) => {
                const groupPerms = groupedPermissions[group];
                const selectedInGroup = groupPerms.filter(p => selectedPermIds.includes(p.id)).length;
                const allInGroupSelected = selectedInGroup === groupPerms.length && groupPerms.length > 0;
                const someInGroupSelected = selectedInGroup > 0 && !allInGroupSelected;

                return (
                  <div key={group} className="px-6 py-4">
                    {/* Group header row */}
                    <div
                      className="flex items-center justify-between mb-3 cursor-pointer group/grp"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                          allInGroupSelected ? "bg-emerald-600 border-emerald-600" :
                            someInGroupSelected ? "bg-emerald-100 border-emerald-500 dark:bg-emerald-500/20" : "border-gray-300 bg-white dark:bg-card dark:border-border"
                        )}>
                          {allInGroupSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          {someInGroupSelected && <div className="w-2 h-0.5 bg-emerald-600 rounded-full" />}
                        </div>
                        <span className="text-xs font-bold text-foreground group-hover/grp:text-emerald-600 transition-colors">
                          {group}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {selectedInGroup}/{groupPerms.length}
                      </span>
                    </div>

                    {/* Permission items grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {groupPerms.map((perm) => {
                        const isSelected = selectedPermIds.includes(perm.id);
                        return (
                          <button
                            key={perm.id}
                            type="button"
                            onClick={() => perm.can_assign && togglePermission(perm.id)}
                            disabled={!perm.can_assign}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-150",
                              isSelected
                                ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30"
                                : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50 dark:bg-card dark:border-border/60 dark:hover:bg-muted/40",
                              !perm.can_assign && "opacity-50 cursor-not-allowed bg-muted/20"
                            )}
                          >
                            <div className={cn(
                              "w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                              isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-300 dark:border-border",
                              !perm.can_assign && "bg-gray-200 border-gray-200"
                            )}>
                              {isSelected ? <Check className="w-2 h-2 text-white stroke-[4]" /> : !perm.can_assign && <Lock className="w-2 h-2 text-gray-500" />}
                            </div>
                            <span className={cn(
                              "text-xs font-medium leading-tight truncate",
                              isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-foreground/80",
                              !perm.can_assign && "text-muted-foreground"
                            )}>
                              {perm.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/40 shrink-0">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10 font-semibold border-gray-200 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={hookFormSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{initialData ? "Saving..." : "Creating..."}</>
              ) : (
                <>{initialData ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{initialData ? "Save Changes" : "Create Role"}</>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// --- COMPONENT: USER FORM DIALOG ---
const UserFormDialog = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  roles,
  organizations,
  branches,
  isSuperAdmin,
  session,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      password_confirmation: "",
      roleId: "",
      organizationId: "",
      branchIds: [],
      isActive: true,
    },
  });

  const { reset, handleSubmit, control, watch, setValue } = form;
  const selectedOrgId = watch("organizationId");
  const currentBranchIds = watch("branchIds");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          password: "",
          password_confirmation: "",
          roleId: String(initialData.roleId || ""),
          organizationId: String(initialData.organization_id || ""),
          branchIds: initialData.branchIds || [],
          isActive: initialData.isActive ?? true,
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          password_confirmation: "",
          roleId: "",
          organizationId: isSuperAdmin ? "" : String(session?.user?.organization_id || ""),
          branchIds: [],
          isActive: true,
        });
      }
      // Reset verification state on open
      setEmailVerified(false);
      setVerificationRequested(false);
      setOtpValue("");
    }
  }, [isOpen, initialData, reset, isSuperAdmin, session]);

  const handleRequestCode = async () => {
    const email = watch("email");
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

      // Check if already verified (handles case where form was closed but email was verified)
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
    const email = watch("email");
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

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onSave(data, initialData?.id);
      onClose();
    } catch (error) {
      console.error("Failed to save user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = branches.filter(b =>
    !selectedOrgId || String(b.organization_id) === String(selectedOrgId)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 border-none bg-card/95 backdrop-blur-xl shadow-3xl rounded-3xl overflow-hidden">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader className="px-6 py-4 bg-emerald-500/5 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 shadow-sm">
                  {initialData ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">
                    {initialData ? "Record Refinement" : "Provision Member"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-medium">
                    {initialData ? "Update system identity and access scope" : "Create a high-access system account"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 py-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-muted-foreground ml-1">First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px] font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px] font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Authorization Email</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="staff@enterprise.com"
                          {...field}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val);
                            if (emailVerified) setEmailVerified(false);
                          }}
                          className={cn(
                            "h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm flex-1",
                            emailVerified && "border-emerald-500 bg-emerald-500/5 text-emerald-700",
                            verificationRequested && !emailVerified && "bg-muted/50 border-emerald-500/30"
                          )}
                          disabled={!!initialData || emailVerified || verificationRequested}
                        />
                      </FormControl>
                      {!initialData && !emailVerified && !verificationRequested && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRequestCode}
                          disabled={isRequesting}
                          className="h-9 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5 px-4 font-bold"
                        >
                          {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email"}
                        </Button>
                      )}
                      {!initialData && verificationRequested && !emailVerified && (
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
                          Change Email?
                        </Button>
                      )}
                      {emailVerified && (
                        <div className="flex items-center gap-1.5 px-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-xs font-bold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          VERIFIED
                        </div>
                      )}
                    </div>
                    <FormMessage className="text-[10px] font-medium" />
                  </FormItem>
                )}
              />

              {verificationRequested && !emailVerified && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      ENTER VERIFICATION CODE
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setVerificationRequested(false)}
                      className="h-6 w-6 p-0 hover:bg-emerald-500/10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
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
                      {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Please check your inbox. If you don't see it, check your spam folder.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-muted-foreground ml-1">
                        {initialData ? "Override Password" : "Password"}
                      </FormLabel>
                      <div className="relative group">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all pr-10 font-medium text-sm"
                          />
                        </FormControl>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-emerald-500 transition-colors">
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <FormMessage className="text-[10px] font-medium" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Confirm Password</FormLabel>
                      <div className="relative group">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all pr-10 font-medium text-sm"
                          />
                        </FormControl>
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-emerald-500 transition-colors">
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <FormMessage className="text-[10px] font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              <div className={cn("grid gap-4", isSuperAdmin ? "grid-cols-2" : "grid-cols-1")}>
                {isSuperAdmin && (
                  <FormField
                    control={control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Organization</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            setValue("branchIds", []);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm">
                              <div className="flex items-center gap-2">
                                <Building className="w-3.5 h-3.5 text-emerald-600" />
                                <SelectValue placeholder="Select Org" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border-border/40 bg-card/95 backdrop-blur-xl p-1 shadow-2xl">
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={String(org.id)} className="rounded-lg py-2 font-medium text-sm">
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-medium" />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Security Privilege</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-emerald-600" />
                              <SelectValue placeholder="Identify Role" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border/40 bg-card/95 backdrop-blur-xl p-1 shadow-2xl">
                          {roles.filter(r => isSuperAdmin || r.name !== 'Super Admin').map((r) => (
                            <SelectItem key={r.id} value={String(r.id)} className="rounded-lg py-2 font-medium text-sm">
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-medium" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="branchIds"
                render={() => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium text-muted-foreground ml-1">Operations Domain (Branches)</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-border/60 bg-muted/30 dark:bg-muted/10 rounded-xl">
                      {filteredBranches.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            const bId = String(b.id);
                            const stringIds = currentBranchIds.map(id => String(id));
                            const newIds = stringIds.includes(bId)
                              ? stringIds.filter(id => id !== bId)
                              : [...stringIds, bId];
                            setValue("branchIds", newIds, { shouldValidate: true });
                          }}
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all",
                            currentBranchIds.some(id => String(id) === String(b.id))
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-sm"
                              : "hover:bg-white/5 border-transparent opacity-60"
                          )}
                        >
                          {currentBranchIds.some(id => String(id) === String(b.id)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          <span className="text-xs font-bold">{b.name}</span>
                        </div>
                      ))}
                    </div>
                    <FormMessage className="text-[10px] font-medium" />
                  </FormItem>
                )}
              />

              {initialData && (
                <FormField
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/40 mt-4">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">Operational Status</h4>
                        <p className="text-xs font-medium text-muted-foreground opacity-60">Grant or suspend system compute access</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 dark:bg-muted/5 flex flex-row items-center justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting} className="h-9 px-5 border-border/60 font-medium text-sm transition-all">
                {initialData ? "Reject Changes" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || (!initialData && !emailVerified)} 
                className={cn(
                  "h-9 px-8 text-white font-medium text-sm shadow-sm transition-all active:scale-95 border-none",
                  !initialData && !emailVerified ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (initialData ? <Check className="w-4 h-4 mr-2" /> : <Settings className="w-4 h-4 mr-2" />)}
                {initialData ? "Commit Refinement" : "Initialize Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


// --- COMPONENT: PERMISSION MATRIX ---
const PermissionMatrix = ({ roles, permissions, onToggle, isUpdating }) => {
  const groupedPermissions = useMemo(
    () => groupPermissionsBySection(permissions),
    [permissions]
  );

  return (
    <div className="relative rounded-3xl border border-white/5 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto custom-scrollbar">
        <Table className="border-collapse">
          <TableHeader className="bg-muted/30 backdrop-blur-md sticky top-0 z-30">
            <TableRow className="hover:bg-transparent border-white/10">
              <TableHead className="w-[300px] min-w-[300px] sticky left-0 z-40 bg-card/95 backdrop-blur-xl border-r border-border/40 py-4 px-8 text-sm font-medium text-muted-foreground">
                Permission Capabilities
              </TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="min-w-[180px] text-center py-4 px-4 border-r border-border/40 last:border-r-0">
                  <div className="flex flex-col items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-foreground">{role.name}</span>
                    <Badge variant="outline" className="mt-1 bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-xs font-medium">
                      {role.permissions?.length || 0} PERMS
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(groupedPermissions).map((group) => (
              <React.Fragment key={group}>
                <TableRow className="bg-muted group/group border-border/40">
                  <TableCell className="sticky left-0 z-20 bg-muted border-r border-border/40 py-2.5 px-8 text-xs font-bold text-emerald-600 shadow-sm" colSpan={1}>
                    {group}
                  </TableCell>
                  <TableCell colSpan={roles.filter(role => isSuperAdmin || role.name !== 'Super Admin').length} className="bg-muted/30" />
                </TableRow>

                {groupedPermissions[group].map((perm) => (
                  <TableRow key={perm.id} className="hover:bg-muted/30 group/row border-border/40 transition-colors">
                    <TableCell className="sticky left-0 z-20 bg-card/95 backdrop-blur-md border-r border-border/40 py-3 px-8 group-hover/row:bg-emerald-500/5 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground group-hover/row:text-emerald-600 transition-colors">
                          {perm.name}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground/60">
                          {perm.guard_name}
                        </span>
                      </div>
                    </TableCell>
                    {roles.map((role) => {
                      const isSelected = role.permissions?.some(p => p.id === perm.id);
                      return (
                        <TableCell key={`${role.id}-${perm.id}`} className="text-center p-0 border-r border-white/5 last:border-r-0">
                          <div
                            className={cn(
                              "flex items-center justify-center h-14 w-full cursor-pointer transition-all duration-300",
                              isSelected ? "bg-emerald-500/5" : "hover:bg-white/2"
                            )}
                            onClick={() => {
                              if (isUpdating) return;
                              if (!perm.can_assign) {
                                toast.error("Security Lock: You are not authorized to modify this specific permission for any role.");
                                return;
                              }
                              onToggle(role, perm.id, isSelected);
                            }}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-white/5 border-white/10 group-hover/row:border-white/20",
                              !perm.can_assign && "bg-gray-200/50 border-gray-300 opacity-50 grayscale cursor-not-allowed"
                            )}>
                              {isSelected ? (
                                <Check className="w-4 h-4 stroke-4" />
                              ) : !perm.can_assign ? (
                                <Lock className="w-3 h-3 text-muted-foreground/40" />
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      {isUpdating && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="bg-card/80 p-4 rounded-xl shadow-2xl border border-border/40 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-sm font-medium text-foreground">Syncing Permissions...</span>
          </div>
        </div>
      )}
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
export default function UserManagement() {
  const { data: session, status } = useSession();
  const { business } = useAppSettings();
  const router = useRouter();
  const { canView } = usePermission();

  // Tab State
  const [activeTab, setActiveTab] = useState("users");
  const fetchedTabs = useState(() => new Set())[0];

  // Data States
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Per-tab loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isUpdatingMatrix, setIsUpdatingMatrix] = useState(false);

  // UI States
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");
  const isSuperAdmin = session?.user?.roles?.includes('Super Admin');

  const maxUsers = business?.plan?.max_users || (business?.is_master ? Infinity : 0);
  const userLimitReached = !isSuperAdmin && !business?.is_master && users.length >= maxUsers;
  const canManageRBAC = isSuperAdmin || business?.is_master || (business?.subscription_tier !== 'Essential');

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const groupedUsers = useMemo(() => {
    if (!isSuperAdmin) return { [session?.user?.organization?.name || "Member Access"]: filteredUsers };

    return filteredUsers.reduce((acc, user) => {
      const orgName = user.organization?.name || "System Base";
      if (!acc[orgName]) acc[orgName] = [];
      acc[orgName].push(user);
      return acc;
    }, {});
  }, [filteredUsers, isSuperAdmin, session]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter(p =>
      !permSearch || p.name.toLowerCase().includes(permSearch.toLowerCase()) || p.group_name?.toLowerCase().includes(permSearch.toLowerCase())
    );
  }, [permissions, permSearch]);

  const groupedPermissions = useMemo(() => groupPermissionsBySection(filteredPermissions), [filteredPermissions]);

  useEffect(() => {
    if (!canManageRBAC && (activeTab === "roles" || activeTab === "permissions")) {
      setActiveTab("users");
    }
  }, [canManageRBAC, activeTab]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnUrl = window.location.pathname + window.location.search;
      router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`);
    }
  }, [router, status]);

  const fetchUsers = async () => {
    if (!session?.accessToken) return;
    setLoadingUsers(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [usersRes, branchesRes, rolesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers }),
      ]);
      const usersData = await usersRes.json();
      const branchesData = await branchesRes.json();
      const rolesData = await rolesRes.json();

      if (usersRes.ok && usersData.status === "success") {
        setUsers(usersData.data.data || usersData.data);
      }
      if (branchesRes.ok && branchesData.status === "success") {
        setBranches(branchesData.data.data || branchesData.data);
      }
      if (rolesRes.ok && rolesData.status === "success") {
        setRoles(rolesData.data.data || rolesData.data);
      }
    } catch (err) {
      console.error("FetchUsers Error:", err);
      toast.error("Fetch Failure: The system could not synchronize member records. Please verify your connection.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    if (!session?.accessToken) return;
    setLoadingRoles(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const [rolesRes, permsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/permissions?per_page=250`, { headers }),
      ]);
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      if (rolesData.status === "success") setRoles(rolesData.data.data || rolesData.data);
      if (permsData.status === "success") setPermissions(permsData.data.data || permsData.data);
    } catch { toast.error("Failed to load roles"); } finally { setLoadingRoles(false); }
  };

  const fetchPermissions = async () => {
    if (!session?.accessToken) return;
    setLoadingPermissions(true);
    try {
      const headers = { Authorization: `Bearer ${session.accessToken}` };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/permissions?per_page=250`, { headers });
      const data = await res.json();
      if (data.status === "success") setPermissions(data.data.data || data.data);
    } catch { toast.error("Failed to load permissions"); } finally { setLoadingPermissions(false); }
  };

  // Lazy fetch: only fetch a tab's data the first time it's activated
  useEffect(() => {
    if (status !== "authenticated") return;
    if (fetchedTabs.has(activeTab)) return;
    fetchedTabs.add(activeTab);
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "roles") fetchRoles();
    else if (activeTab === "permissions") fetchPermissions();
  }, [activeTab, status, session]);

  // PROACTIVE DATA FETCHING: Ensure branches and roles are loaded upfront for modals
  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      const headers = { Authorization: `Bearer ${session.accessToken}` };

      // Fetch Branches if missing
      if (branches.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/branches`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.status === "success" || Array.isArray(d.data)) {
              setBranches(d.data.data || d.data);
            }
          }).catch(e => console.error("Proactive Branches Load Error", e));
      }

      // Fetch Roles if missing
      if (roles.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.status === "success" || Array.isArray(d.data) || d.data?.data) {
              setRoles(d.data.data || d.data);
            }
          }).catch(e => console.error("Proactive Roles Load Error", e));
      }

      // Fetch Organizations if Super Admin and missing
      const isSuperAdmin = session?.user?.roles?.includes('Super Admin');
      if (isSuperAdmin && organizations.length === 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.status === "success") {
              setOrganizations(d.data.data || d.data);
            }
          }).catch(e => console.error("Proactive Organizations Load Error", e));
      }
    }
  }, [status, session]);

  // Re-fetch helper for mutations
  const fetchData = async () => {
    fetchedTabs.delete(activeTab);
    if (activeTab === "users") await fetchUsers();
    else if (activeTab === "roles") await fetchRoles();
    else if (activeTab === "permissions") await fetchPermissions();
  };

  const loading = loadingUsers && activeTab === "users";

  const handleOpenCreateRole = () => { setEditingRole(null); setIsRoleDialogOpen(true); };
  const handleOpenEditRole = (role) => { setEditingRole(role); setIsRoleDialogOpen(true); };

  const handleSaveRole = async (payload, roleId) => {
    try {
      const url = roleId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/roles`;
      const method = roleId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { toast.success(roleId ? "Role Updated Successfully" : "Role Created Successfully"); fetchData(); } else { throw new Error(data.message || "Failed to save role"); }
    } catch (error) { toast.error(error.message); }
  };

  const handleDeleteRole = async (roleId) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${roleId}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.accessToken}` } });
      if (res.ok) { toast.success("Role Deleted"); fetchData(); } else { toast.error("Failed to delete role"); }
    } catch (e) { toast.error("Network error"); }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser({
      id: user.id,
      firstName: user.name.split(' ')[0] || "",
      lastName: user.name.split(' ').slice(1).join(' ') || "",
      email: user.email,
      roleId: user.roles?.[0]?.id || "",
      branchIds: user.branches?.map(b => b.id) || [],
      isActive: user.is_active,
      organization_id: user.organization_id,
      organization_name: user.organization?.name || "Organization"
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async (formData, userId = null) => {
    const isEdit = !!userId;
    if (!isEdit && userLimitReached) {
      toast.error("Account Limit Reached: Please upgrade your subscription to provision more system members.");
      return;
    }

    const selectedRole = roles.find(r => String(r.id) === String(formData.roleId));
    const payload = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      is_active: formData.isActive,
      role: selectedRole?.name || "",
      roles: [selectedRole?.name].filter(Boolean),
      role_ids: [formData.roleId],
      branch_ids: formData.branchIds,
      organization_id: formData.organizationId,
    };

    if (formData.password) {
      payload.password = formData.password;
      payload.password_confirmation = formData.password_confirmation;
    }

    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`;

    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success(isEdit ? "User record refined successfully" : "New member provisioned successfully");
      fetchData();
    } else {
      throw new Error(data.message || "Failed to process user record");
    }
  };

  const handleToggleMatrixPermission = async (role, permId, isRemoving) => {
    // FINAL SERVER-SIDE & CLIENT-SIDE SYNC: Double check can_assign
    const perm = permissions.find(p => p.id === permId);
    if (!perm?.can_assign) {
      toast.error("Security Violation: Unauthorized permission modification attempt blocked.");
      return;
    }

    setIsUpdatingMatrix(true);
    try {
      const currentPermIds = role.permissions?.map(p => p.id) || [];
      const updatedPermIds = isRemoving
        ? currentPermIds.filter(id => id !== permId)
        : [...currentPermIds, permId];

      const payload = {
        name: role.name,
        permissions: updatedPermIds
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roles/${role.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Access updated for ${role.name}`, { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> });
        await fetchData();
      } else {
        throw new Error("Failed to sync permission");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdatingMatrix(false);
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (!confirm("Are you sure you want to revoke system compute access for this member? This will lock their account immediately.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Access revoked and account locked successfully", {
          icon: <ShieldAlert className="w-4 h-4 text-emerald-500" />
        });
        fetchData();
      } else {
        // FULL EXPLAINED TOAST
        toast.error(`Revocation Failed: ${data.message || "Unknown system error"}`);
      }
    } catch (error) {
      toast.error("Connectivity Failure: Could not reach the authentication server");
    }
  };


  const handleResendWelcome = async (userId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/${userId}/resend-welcome-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Invitation credentials re-provisioned and sent");
      } else {
        throw new Error(data.message || "Failed to resend credentials");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading && users.length === 0) return <div className="p-10"><UsersPageSkeleton /></div>;

  return (
    <div className="flex-1 min-h-screen bg-background p-6 md:p-8 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">User Access Control</h1>
            <p className="text-xs text-muted-foreground font-semibold mt-1 opacity-70 flex items-center gap-1.5">
              Global system permissions & protocol management.
              <a href="/employees" className="text-emerald-600 hover:underline flex items-center gap-1">
                Manage staff accounts in Employees <ChevronRight className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProtectedComponent permission={PERMISSIONS.USER_CREATE}>
            <Button
              onClick={() => setIsUserDialogOpen(true)}
              disabled={userLimitReached}
              className={cn(
                "h-9 px-5 rounded-md text-white font-medium text-sm shadow-sm transition-all active:scale-95 border-none",
                userLimitReached
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {userLimitReached ? (
                <><ShieldAlert className="w-4 h-4 mr-2" /> Limit Reached</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Provision System Account</>
              )}
            </Button>
            {userLimitReached && (
              <p className="text-[10px] text-red-500 font-bold mt-1 text-right animate-pulse">
                Upgrade plan to add more users
              </p>
            )}
          </ProtectedComponent>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="border-b border-border/40">
          <TabsList className="bg-transparent h-10 w-full justify-start p-0 border-b-0 space-x-1">
            {canView("User") && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all"
              >
                <Users className="w-4 h-4 mr-2" /> Users
              </TabsTrigger>
            )}
            {canView("Role") && canManageRBAC && (
              <TabsTrigger
                value="roles"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all"
              >
                <Shield className="w-4 h-4 mr-2" /> Roles
              </TabsTrigger>
            )}
            {canManageRBAC && (
              <TabsTrigger
                value="permissions"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-sm h-full px-4 transition-all"
              >
                <Lock className="w-4 h-4 mr-2" /> Permissions
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ================= USERS TAB ================= */}
        <TabsContent value="users" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative group w-full sm:w-[400px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                <Input placeholder="Search users by name or email..." className="pl-10 h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loadingUsers && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <p className="text-xs font-medium text-muted-foreground hidden sm:block">{filteredUsers.length} Members</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/5 transition-all"
                onClick={fetchUsers}
                disabled={loadingUsers}
                title="Refresh user list"
              >
                <RefreshCw className={cn("w-4 h-4", loadingUsers && "animate-spin")} />
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-card overflow-hidden rounded-3xl border-border/10">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 backdrop-blur-md">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="py-4 pl-8 text-sm font-medium text-muted-foreground">Name & Profile</TableHead>
                    <TableHead className="py-4 text-sm font-medium text-muted-foreground">Assigned Role</TableHead>
                    <TableHead className="py-4 text-sm font-medium text-muted-foreground">Branch Access</TableHead>
                    <TableHead className="py-4 text-sm font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="py-4 text-sm font-medium text-muted-foreground">Last Activity</TableHead>
                    <TableHead className="py-4 pr-8 text-right text-sm font-medium text-muted-foreground">Execution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    Object.keys(groupedUsers).sort().map((orgName) => (
                      <React.Fragment key={orgName}>
                        {isSuperAdmin && (
                          <TableRow className="bg-muted/20 hover:bg-muted/30 border-y border-border/40 select-none">
                            <TableCell colSpan={6} className="py-2 pl-8">
                              <div className="flex items-center gap-3">
                                <div className="p-1 rounded bg-white dark:bg-zinc-800 border border-border/40 shadow-sm">
                                  <Building className="w-3 h-3 text-emerald-600" />
                                </div>
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground/70">
                                  {orgName}
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent ml-2" />
                                <Badge variant="outline" className="text-[9px] font-bold h-4 px-1.5 bg-background border-border/60 text-muted-foreground">
                                  {groupedUsers[orgName].length} Seats
                                </Badge>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {groupedUsers[orgName].map((user) => (
                          <TableRow key={user.id} className="hover:bg-muted/30 group border-border/20 transition-all duration-300">
                            <TableCell className="pl-8 py-4">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Avatar className="h-11 w-11 border-2 border-white/10">
                                    <AvatarImage
                                      src={getImageUrl(user.profile_image)}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className={cn("font-bold text-sm", getAvatarColor(user.name))}>
                                      {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground">{user.name}</span>
                                    {user.employee ? (
                                      <Badge className="h-5 px-1.5 bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold uppercase tracking-wider">
                                        {user.employee.designation || "Staff"}
                                      </Badge>
                                    ) : (
                                      <Badge className="h-5 px-1.5 bg-blue-500/10 text-blue-600 border-none text-[10px] font-bold uppercase tracking-wider">
                                        System Account
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs font-medium text-muted-foreground/60 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {user.email}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1.5">
                                {user.roles?.map((r) => (
                                  <Badge key={r.id} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-medium text-xs py-0.5 px-2 rounded-md">
                                    <Shield className="w-2.5 h-2.5 mr-1" /> {r.name}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.branches?.map((b) => (
                                  <Badge key={b.id} variant="outline" className="font-medium text-xs border-border text-muted-foreground px-2 py-0 rounded-md">
                                    {b.name}
                                  </Badge>
                                ))}
                                {(!user.branches || user.branches.length === 0) && <span className="text-xs font-medium text-muted-foreground/40 italic">Global Restricted</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? "outline" : "destructive"} className={cn("px-2.5 py-0.5 rounded-full font-medium text-xs", user.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
                                {user.is_active ? "Active" : "Locked"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground">
                              {user.last_login_at ? (
                                <div className="flex flex-col gap-0.5">
                                  <span>{new Date(user.last_login_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  <span className="text-xs text-muted-foreground opacity-60 font-medium">{new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              ) : <span className="text-xs italic opacity-40">No Record</span>}
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50 transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-xl border-border/40 shadow-xl p-1">
                                  <DropdownMenuLabel className="font-medium text-xs text-muted-foreground/70 px-3 py-2">Account Control</DropdownMenuLabel>
                                  <ProtectedComponent permission={PERMISSIONS.USER_EDIT}>
                                    <DropdownMenuItem onClick={() => handleOpenEditUser(user)} className="rounded-lg py-2 focus:bg-emerald-500/10 focus:text-emerald-600 cursor-pointer font-medium text-sm"><Pencil className="w-4 h-4 mr-2" /> Edit Records</DropdownMenuItem>
                                  </ProtectedComponent>

                                  {/* Resend Welcome: Only for users who have NEVER logged in */}
                                  {!user.last_login_at && (
                                    <ProtectedComponent permission={PERMISSIONS.USER_EDIT}>
                                      <DropdownMenuItem onClick={() => handleResendWelcome(user.id)} className="rounded-lg py-2 focus:bg-emerald-500/10 focus:text-emerald-600 cursor-pointer font-medium text-sm">
                                        <Mail className="w-4 h-4 mr-2" /> Resend Welcome
                                      </DropdownMenuItem>
                                    </ProtectedComponent>
                                  )}

                                  <DropdownMenuSeparator className="bg-border/40" />
                                  <ProtectedComponent permission={PERMISSIONS.USER_DELETE}>
                                    <DropdownMenuItem
                                      className="text-red-500 rounded-lg py-2 focus:bg-red-500/10 focus:text-red-600 cursor-pointer font-medium text-sm"
                                      onClick={() => handleRevokeAccess(user.id)}
                                    >
                                      {user.is_active ? (
                                        <><Lock className="w-4 h-4 mr-2" /> Revoke Access</>
                                      ) : (
                                        <><ShieldCheck className="w-4 h-4 mr-2" /> Restore Access</>
                                      )}
                                    </DropdownMenuItem>
                                  </ProtectedComponent>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center text-muted-foreground font-bold opacity-40 italic">No users matching criteria found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ================= ROLES TAB ================= */}
        <TabsContent value="roles" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "roles" && (
            <Card className="border-border/40 rounded-xl shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-foreground">Access Roles</span>
                  <Badge variant="outline" className="text-xs font-medium bg-emerald-500/5 text-emerald-600 border-emerald-500/20 ml-1">
                    {roles.filter(role => isSuperAdmin || role.name !== 'Super Admin').length}
                  </Badge>
                </div>
                <ProtectedComponent permission={PERMISSIONS.ROLE_CREATE}>
                  <Button onClick={handleOpenCreateRole} className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-all active:scale-95 border-none">
                    <Plus className="mr-2 h-4 w-4" /> New Role
                  </Button>
                </ProtectedComponent>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground px-5 w-[220px]">Role Name</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-[100px]">Guard</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Permissions</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground w-[120px]">Created</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right px-5 w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles
                      .filter(role => isSuperAdmin || role.name !== 'Super Admin')
                      .length > 0 ? roles
                        .filter(role => isSuperAdmin || role.name !== 'Super Admin')
                        .map((role) => (
                          <TableRow key={role.id} className="border-border/40 hover:bg-muted/30 transition-colors group">
                            {/* Name */}
                            <TableCell className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                  <Shield className="h-4 w-4 text-emerald-600" />
                                </div>
                                <span className="text-sm font-semibold text-foreground">{role.name}</span>
                              </div>
                            </TableCell>
                            {/* Guard */}
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-medium bg-muted/30 border-border/60 text-muted-foreground">
                                {role.guard_name || "web"}
                              </Badge>
                            </TableCell>
                            {/* Permissions */}
                            <TableCell>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-none shrink-0">
                                  {role.permissions?.length || 0}
                                </Badge>
                                <div className="flex gap-x-2 gap-y-0.5 flex-wrap">
                                  {role.permissions?.slice(0, 4).map((p) => (
                                    <span key={p.id} className="text-xs text-muted-foreground font-medium">
                                      {p.name}
                                    </span>
                                  ))}
                                  {(role.permissions?.length || 0) > 4 && (
                                    <span className="text-xs text-muted-foreground/50 font-medium">+{role.permissions.length - 4} more</span>
                                  )}
                                  {!role.permissions?.length && (
                                    <span className="text-xs italic text-muted-foreground/40">No permissions</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {/* Created */}
                            <TableCell>
                              <span className="text-xs text-muted-foreground font-medium">
                                {new Date(role.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            {/* Actions */}
                            <TableCell className="text-right px-5">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ProtectedComponent permission={PERMISSIONS.ROLE_EDIT}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEditRole(role)}
                                    disabled={!isSuperAdmin && (role.name === 'Super Admin' || role.name === 'Organization Admin')}
                                    className="h-8 px-3 text-xs font-medium rounded-md hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                                  </Button>
                                </ProtectedComponent>
                                <ProtectedComponent permission={PERMISSIONS.ROLE_DELETE}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRole(role.id)}
                                    disabled={role.name === 'Super Admin' || (!isSuperAdmin && role.name === 'Organization Admin')}
                                    className="h-8 px-3 text-xs font-medium rounded-md hover:bg-red-500/10 hover:text-red-600 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                  </Button>
                                </ProtectedComponent>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-40 text-center text-sm font-medium text-muted-foreground opacity-50 italic">
                          No roles configured yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ================= PERMISSIONS TAB ================= */}
        <TabsContent value="permissions" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === "permissions" && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative group w-full sm:w-[400px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Search permissions..."
                    className="pl-10 h-9 bg-background border-border rounded-md focus-visible:ring-emerald-500 transition-all font-medium text-sm"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {loadingPermissions && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Badge variant="outline" className="text-xs font-medium bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                    {permissions.length} Total Permissions
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={fetchPermissions} disabled={loadingPermissions}>
                    <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                {Object.keys(groupedPermissions).sort().map((group) => (
                  <div key={group}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-1.5 rounded-md bg-emerald-500/10">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">{group}</h3>
                      <Badge variant="outline" className="text-xs font-medium bg-muted/30 border-border/40 text-muted-foreground">
                        {groupedPermissions[group].length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {groupedPermissions[group].map((perm) => (
                        <div key={perm.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-card/60 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200">
                          <div className="p-1 rounded-md bg-emerald-500/10 shrink-0 mt-0.5">
                            <Lock className="w-3 h-3 text-emerald-600" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-medium text-foreground leading-tight truncate">{perm.name}</span>
                            <span className="text-xs text-muted-foreground/60 font-medium truncate">{perm.group_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedPermissions).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Lock className="w-10 h-10 text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-medium text-muted-foreground">No permissions found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── ROLE FORM DIALOG ─── */}
      <RoleFormDialog isOpen={isRoleDialogOpen} onClose={() => setIsRoleDialogOpen(false)} initialData={editingRole} allPermissions={permissions} onSave={handleSaveRole} />

      <UserFormDialog
        isOpen={isUserDialogOpen}
        onClose={() => {
          setIsUserDialogOpen(false);
          setEditingUser(null);
        }}
        initialData={editingUser}
        onSave={handleSaveUser}
        roles={roles}
        organizations={organizations}
        branches={branches}
        isSuperAdmin={isSuperAdmin}
        session={session}
      />
    </div>
  );
}
