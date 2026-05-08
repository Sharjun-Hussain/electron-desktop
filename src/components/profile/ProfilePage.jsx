"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import axios from "axios";
import { toast } from "sonner";
import {
  User, Mail, Lock, Camera, Save, Eye, EyeOff,
  ShieldCheck, Pencil, KeyRound, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getImageUrl } from "@/lib/utils";



const SectionCard = ({ icon: Icon, title, subtitle, children, accent = "emerald" }) => {
  const accents = {
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
  };
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ name: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "", new_password: "", confirm_password: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false, new: false, confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState({
    current_password: "", new_password: "", confirm_password: "", general: ""
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setProfileForm({ name: session.user.name || "" });
      
      // If we don't have a local file selected, sync with session image
      // This ensures that on initial load or after session update, the correct image is shown
      if (!avatarFile) {
        setAvatarPreview(getImageUrl(session.user.image));
      }
    }
  }, [session, avatarFile]);

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", profileForm.name);
      if (avatarFile) formData.append("profile_image", avatarFile);

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const updatedUser = response.data?.data?.user;
      if (updatedUser) {
        // Update session state
        await update({
          name: updatedUser.name,
          image: updatedUser.profile_image
        });
        
        // Immediately update local UI state from the confirmed backend response
        // This bypasses any session update lag or caching issues
        setAvatarFile(null);
        setAvatarPreview(getImageUrl(updatedUser.profile_image));
        setProfileForm({ name: updatedUser.name });
      }

      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Reset errors
    setPasswordErrors({ current_password: "", new_password: "", confirm_password: "", general: "" });

    let hasError = false;
    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordErrors(p => ({ ...p, new_password: "New password cannot be the same as your current password." }));
      hasError = true;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors(p => ({ ...p, confirm_password: "New passwords do not match." }));
      hasError = true;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordErrors(p => ({ ...p, new_password: "Password must be at least 8 characters." }));
      hasError = true;
    }

    if (hasError) return;

    setSavingPassword(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/me`,
        {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        },
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      toast.success("Password changed successfully!");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to change password.";
      // Map API errors to the correct field intelligently
      if (msg.toLowerCase().includes("current password")) {
        setPasswordErrors(p => ({ ...p, current_password: msg }));
      } else {
        setPasswordErrors(p => ({ ...p, general: msg }));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-8 w-full space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
          <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your personal details and account security.</p>
        </div>
      </div>

      {/* Profile Photo + Name */}
      <SectionCard icon={Pencil} title="Personal Details" subtitle="Update your display name and profile photo." accent="emerald">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <Avatar className="h-20 w-20 border-2 border-border shadow-sm">
              <AvatarImage src={avatarPreview} className="object-cover" />
              <AvatarFallback className="text-xl font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600">
                {getUserInitials(profileForm.name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Fields */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-muted/40 cursor-not-allowed"
                  value={session?.user?.email || ""}
                  readOnly
                  disabled
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? (
              <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />Saving...</span>
            ) : (
              <><Save className="h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>
      </SectionCard>

      {/* Account Info */}
      <SectionCard icon={ShieldCheck} title="Account Info" subtitle="Your role and account status." accent="blue">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Role", value: session?.user?.roles?.[0] || "—" },
            { label: "Organisation", value: session?.user?.organization_id ? "Assigned" : "—" },
            { label: "Status", value: <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Active</span> }
          ].map(item => (
            <div key={item.label} className="bg-muted/40 border border-border rounded-lg px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
              <p className="text-sm font-bold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Change Password */}
      <SectionCard icon={KeyRound} title="Change Password" subtitle="Use a strong password of at least 8 characters." accent="violet">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "current", label: "Current Password", show: "current" },
            { key: "new", label: "New Password", show: "new" },
            { key: "confirm", label: "Confirm New Password", show: "confirm" }
          ].map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</Label>
              <div className="relative">
                <Lock className={cn("absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                  passwordErrors[field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password"]
                    ? "text-red-500" : "text-muted-foreground"
                )} />
                <Input
                  type={showPasswords[field.show] ? "text" : "password"}
                  className={cn("pl-9 pr-9",
                    passwordErrors[field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password"] && "border-red-500 focus-visible:ring-red-500/30"
                  )}
                  value={passwordForm[`${field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password"}`]}
                  onChange={e => {
                    const key = field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password";
                    setPasswordForm(p => ({ ...p, [key]: e.target.value }));
                    // clear error on type
                    if (passwordErrors[key]) setPasswordErrors(p => ({ ...p, [key]: "" }));
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(s => ({ ...s, [field.show]: !s[field.show] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswords[field.show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Field specific error output */}
              {passwordErrors[field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password"] && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  {passwordErrors[field.key === "confirm" ? "confirm_password" : field.key === "new" ? "new_password" : "current_password"]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Global error output */}
        {passwordErrors.general && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-500/20">
            {passwordErrors.general}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !passwordForm.current_password || !passwordForm.new_password}
            variant="outline"
            className="gap-2 border-violet-500/30 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10"
          >
            {savingPassword ? (
              <span className="flex items-center gap-2"><span className="animate-spin h-4 w-4 border-2 border-violet-400/40 border-t-violet-500 rounded-full" />Updating...</span>
            ) : (
              <><KeyRound className="h-4 w-4" />Update Password</>
            )}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
