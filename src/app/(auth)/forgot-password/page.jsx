"use client";

import React, { useState, useCallback, memo } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
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

// --- Schema ---
const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .trim(),
});

// --- SUB-COMPONENTS ---

const ForgotHeader = memo(() => (
  <div className="mb-10">
    <div className="mb-6 inline-flex lg:hidden items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
      <KeyRound className="h-8 w-8" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
      Forgot password?
    </h2>
    <p className="text-slate-500 dark:text-zinc-400 mt-2">
      Enter your email address and we'll send you instructions to reset your
      password.
    </p>
  </div>
));
ForgotHeader.displayName = "ForgotHeader";

const SuccessView = memo(({ email, onRetry }) => (
  <div className="text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="mx-auto h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-8 shadow-sm">
      <CheckCircle2 className="h-10 w-10" />
    </div>

    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
      Check your mail
    </h2>

    <p className="text-slate-500 dark:text-zinc-400 mb-8 leading-relaxed">
      We have sent a password reset link to <br />
      <span className="font-semibold text-slate-900 dark:text-emerald-400">
        {email}
      </span>
    </p>

    <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 text-sm text-slate-500 dark:text-zinc-400 mb-8">
      Didn't receive the email? Check your spam filter or{" "}
      <button
        onClick={onRetry}
        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline underline-offset-2"
      >
        try another email address
      </button>
      .
    </div>

    <Link
      href="/login"
      className="w-full inline-flex justify-center items-center h-11 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-slate-200 dark:shadow-none"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Login
    </Link>
  </div>
));
SuccessView.displayName = "SuccessView";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = useCallback(async (values) => {
    setIsLoading(true);

    try {
      const api = (await import("@/lib/axios")).default;
      await api.post("/auth/forgot-password", { email: values.email });

      setIsSuccess(true);
      toast.success("Success! Check your email for further instructions.");
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => setIsSuccess(false), []);

  return (
    <AuthLayout
      title="Account Recovery"
      description="Don't worry, it happens to the best of us. We'll help you secure your account and get you back on track in seconds."
      icon={ShieldCheck}
      stats={[
        { value: "Secure", label: "Recovery Shield" },
        { value: "Instant", label: "Email Verification", highlight: true },
      ]}
    >
      {!isSuccess ? (
        <div className="animate-in fade-in duration-500">
          <ForgotHeader />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-zinc-300 font-medium">
                      Email Address
                    </FormLabel>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <FormControl>
                        <Input
                          placeholder="name@company.com"
                          type="email"
                          autoComplete="email"
                          className="pl-10 h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500 dark:text-white transition-all shadow-sm"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-emerald-200 dark:shadow-none shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Send Reset Link"
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
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <SuccessView email={form.getValues("email")} onRetry={handleRetry} />
      )}
    </AuthLayout>
  );
}
