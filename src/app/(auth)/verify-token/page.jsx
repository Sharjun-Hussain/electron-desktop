"use client";

import React, { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, BadgeCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import AuthLayout from "@/components/auth/AuthLayout";

// Zod schema for the 6-digit token
const formSchema = z.object({
  token: z.string().min(6, { message: "Token must be 6 digits." }),
});

// --- SUB-COMPONENTS ---

const VerifyHeader = memo(() => (
  <div className="mb-10">
    <div className="mb-6 inline-flex lg:hidden items-center justify-center h-16 w-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
      <BadgeCheck className="h-8 w-8" />
    </div>
    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
      Verification Code
    </h2>
    <p className="text-slate-500 dark:text-zinc-400 mt-2">
      Please enter the 6-digit code sent to your email address.
    </p>
  </div>
));
VerifyHeader.displayName = "VerifyHeader";

const OTPFields = memo(({ control }) => (
  <FormField
    control={control}
    name="token"
    render={({ field }) => (
      <FormItem className="flex flex-col items-center lg:items-start">
        <FormLabel className="text-slate-700 dark:text-zinc-300 font-medium mb-4">
          6-Digit Token
        </FormLabel>
        <FormControl>
          <InputOTP
            maxLength={6}
            {...field}
            className="[&_input]:bg-white dark:[&_input]:bg-zinc-900 [&_input]:border-slate-200 dark:[&_input]:border-zinc-800 [&_input]:text-slate-900 dark:[&_input]:text-white focus-visible:ring-emerald-500"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot
                index={0}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
              <InputOTPSlot
                index={1}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
              <InputOTPSlot
                index={2}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
              <InputOTPSlot
                index={3}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
              <InputOTPSlot
                index={4}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
              <InputOTPSlot
                index={5}
                className="w-12 h-14 text-xl rounded-lg border-slate-200 dark:border-zinc-800"
              />
            </InputOTPGroup>
          </InputOTP>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
));
OTPFields.displayName = "OTPFields";

const VerifyActions = memo(({ isLoading }) => (
  <div className="pt-4">
    <Button
      type="submit"
      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-emerald-200 dark:shadow-none shadow-lg transition-all duration-200 hover:-translate-y-0.5"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verifying Code...</span>
        </div>
      ) : (
        "Verify Code"
      )}
    </Button>
  </div>
));
VerifyActions.displayName = "VerifyActions";

export default function VerifyTokenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { token: "" },
  });

  const onSubmit = useCallback(
    async (values) => {
      setIsLoading(true);

      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Example logic
      if (values.token !== "123456") {
        toast.error("Invalid Token", {
          description: "The token you entered is incorrect. Please try again.",
        });
        setIsLoading(false);
        form.reset();
        return;
      }

      toast.success("Token Verified!");
      setIsLoading(false);

      setTimeout(() => {
        router.push("/reset-password?token=verified-mock-token");
      }, 1000);
    },
    [router, form],
  );

  return (
    <AuthLayout
      title="Security Verification"
      description="Please enter the 6-digit verification code sent to your email to verify your identity and proceed with the password reset."
      icon={BadgeCheck}
      stats={[
        { value: "MFA", label: "Security Layer" },
        { value: "Trusted", label: "Identity Verified", highlight: true },
      ]}
    >
      <div className="animate-in fade-in duration-500">
        <VerifyHeader />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <OTPFields control={form.control} />
            <VerifyActions isLoading={isLoading} />
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
    </AuthLayout>
  );
}
