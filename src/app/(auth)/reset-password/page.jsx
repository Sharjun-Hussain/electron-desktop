"use client";

import React, { useState, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Lock,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Terminal,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/auth/AuthLayout";

// Zod schema for password validation
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please try again.",
    path: ["confirmPassword"],
  });

// --- SUB-COMPONENTS ---

const ResetHeader = memo(() => (
  <div className="mb-10">
    <div className="mb-6 inline-flex lg:hidden items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
      <ShieldCheck className="h-8 w-8" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
      New Password
    </h2>
    <p className="text-slate-500 dark:text-zinc-400 mt-2">
      Please enter and confirm your new access credentials.
    </p>
  </div>
));
ResetHeader.displayName = "ResetHeader";

const ResetFields = memo(({ control }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 dark:text-zinc-300 font-medium">
              New Password
            </FormLabel>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10 h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500 dark:text-white transition-all shadow-sm"
                  {...field}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-700 dark:text-zinc-300 font-medium">
              Confirm Password
            </FormLabel>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type={showConfirmPassword ? "text" : "password"}
                  className="pl-10 pr-10 h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500 dark:text-white transition-all shadow-sm"
                  {...field}
                />
              </FormControl>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
ResetFields.displayName = "ResetFields";

const SuccessView = memo(({ onLogin }) => (
  <div className="text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="mx-auto h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-8 shadow-sm">
      <CheckCircle2 className="h-10 w-10" />
    </div>

    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
      Password reset!
    </h2>

    <p className="text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
      Your password has been successfully updated. <br />
      You will be redirected to the login page momentarily.
    </p>

    <Button
      onClick={onLogin}
      className="w-full h-11 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all"
    >
      Go to Login Now
    </Button>
  </div>
));
SuccessView.displayName = "SuccessView";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const token = searchParams?.get("token");

  const onSubmit = useCallback(
    async (values) => {
      if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
      }

      setIsLoading(true);

      try {
        const api = (await import("@/lib/axios")).default;
        await api.post("/auth/reset-password", {
          token,
          password: values.password,
        });

        setIsSuccess(true);
        toast.success("Password Updated Successfully");

        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error) {
        console.error("Reset password error:", error);
        const errorMessage =
          error.response?.data?.message ||
          "Failed to reset password. The link may have expired.";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router, token],
  );

  const handleLoginClick = useCallback(() => router.push("/login"), [router]);

  return (
    <AuthLayout
      title="Reset Password"
      description="Create a strong, new password to secure your industrial terminal access and financial data."
      icon={Terminal}
      stats={[
        { value: "AES-256", label: "Encryption Standard" },
        { value: "90 Days", label: "Recommended Rotation", highlight: true },
      ]}
    >
      {!isSuccess ? (
        <div className="animate-in fade-in duration-500">
          <ResetHeader />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ResetFields control={form.control} />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-emerald-200 dark:shadow-none shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel and Return
            </Link>
          </div>
        </div>
      ) : (
        <SuccessView onLogin={handleLoginClick} />
      )}
    </AuthLayout>
  );
}
