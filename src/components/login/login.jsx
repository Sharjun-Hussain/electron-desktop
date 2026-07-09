"use client";

import React, { useState, memo, Suspense, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { desktopLogin } from "@/lib/desktop-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import logoImg from "../../../public/logo.png";

// Icons
import {
  Mail,
  Lock,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AuthLayout from "@/components/auth/AuthLayout";

// --- Constants ---
const formSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

const SHAKE_ANIMATION = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
  }
  .animate-shake {
    animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
  }
`;

// --- SUB-COMPONENTS (Memoized for Performance) ---

const AuthHeader = memo(() => (
  <div className="mb-10">
    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
      Welcome back
    </h2>
    <p className="text-slate-500 dark:text-zinc-400 mt-2">
      Enter your credentials to access the terminal.
    </p>
  </div>
));
AuthHeader.displayName = "AuthHeader";

const AuthFields = memo(({ control, showPassword, setShowPassword }) => (
  <div className="space-y-6">
    <FormField
      control={control}
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
                placeholder="admin@company.com"
                type="email"
                autoComplete="username"
                className="pl-10 h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500 dark:text-white"
                {...field}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel className="text-slate-700 dark:text-zinc-300 font-medium">
              Password
            </FormLabel>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <FormControl>
              <Input
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pl-10 pr-10 h-11 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus-visible:ring-emerald-500 dark:text-white"
                {...field}
              />
            </FormControl>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
));
AuthFields.displayName = "AuthFields";

const AuthActions = memo(({ isLoading, statusMessage, serverError }) => (
  <div className="space-y-6 pt-2">
    {serverError && (
      <Alert
        variant="destructive"
        className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200"
      >
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{serverError}</AlertDescription>
      </Alert>
    )}

    <Button
      type="submit"
      disabled={isLoading}
      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-emerald-200 dark:shadow-none shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span>Sign In</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </Button>
  </div>
));
AuthActions.displayName = "AuthActions";

// --- MAIN LOGIN FORM ---
function LoginForm() {
  const [loginState, setLoginState] = useState({
    isLoading: false,
    statusMessage: "Sign In",
    serverError: null,
    isShaking: false,
    isRedirecting: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateState = useCallback(
    (updates) => setLoginState((prev) => ({ ...prev, ...updates })),
    [],
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = useCallback(
    async (values) => {
      updateState({
        isLoading: true,
        serverError: null,
        isShaking: false,
        statusMessage: "Authenticating...",
      });

      try {
        const result = await desktopLogin(values.email, values.password);

        if (result?.error) {
          toast.error("Invalid Credentials");
          updateState({
            isLoading: false,
            isShaking: true,
            statusMessage: "Sign In",
            serverError:
              result.error === "CredentialsSignin"
                ? "The email or password you entered is incorrect."
                : result.error,
          });

          setTimeout(() => updateState({ isShaking: false }), 600);
          return;
        }

        if (result?.ok) {
          updateState({ statusMessage: "Redirecting...", isRedirecting: true });
          toast.success("Access Granted");

          setTimeout(() => {
            const returnUrl = searchParams.get("redirect") || "/";
            window.location.href = returnUrl;
          }, 600);
          return;
        }
      } catch (error) {
        updateState({
          isLoading: false,
          statusMessage: "Sign In",
          serverError: "Connection error. Please try again.",
        });
      }
    },
    [updateState, router, searchParams],
  );

  return (
    <AuthLayout
      title={"Advanced POS\nManagement System"}
      description="Secure, real-time access to your industrial operations, inventory management, and financial reporting."
      logo={logoImg.src}
      stats={[
        { value: "99.9%", label: "System Uptime" },
        { value: "Secure", label: "End-to-End Encrypted", highlight: true },
      ]}
      isRedirecting={loginState.isRedirecting}
    >
      <style>{SHAKE_ANIMATION}</style>

      <AuthHeader />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={`space-y-6 transition-transform ${loginState.isShaking ? "animate-shake" : ""}`}
        >
          <AuthFields
            control={form.control}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <AuthActions
            isLoading={loginState.isLoading}
            statusMessage={loginState.statusMessage}
            serverError={loginState.serverError}
          />
        </form>
      </Form>
    </AuthLayout>
  );
}

const SplashLoader = memo(() => (
  <div className="fixed inset-0 z-50 flex flex-col h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950 relative overflow-hidden animate-in fade-in duration-500">
    {/* Subtle background ambient glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

    <div className="relative flex flex-col items-center justify-center z-10">
      {/* Creative Geometric Loader */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-8">
        {/* Outer slow rotating square */}
        <div className="absolute inset-0 border-[1.5px] border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl animate-[spin_8s_linear_infinite]"></div>
        
        {/* Middle rotating square (reverse) */}
        <div className="absolute inset-2 border-[1.5px] border-teal-500/30 dark:border-teal-500/40 rounded-2xl animate-[spin_5s_linear_infinite_reverse]"></div>
        
        {/* Inner fast ring */}
        <div className="absolute inset-4 border-[2px] border-transparent border-t-emerald-500 border-r-teal-500 rounded-full animate-spin duration-700"></div>

        {/* Core glowing element */}
        <div className="absolute h-5 w-5 bg-linear-to-tr from-emerald-500 to-teal-400 rounded-md shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse rotate-45 flex items-center justify-center">
          <div className="h-1.5 w-1.5 bg-white rounded-full animate-ping"></div>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Inzeedo ERP</h2>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">
            Initializing Environment
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_5px_rgba(20,184,166,0.5)]" style={{ animationDelay: '300ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.5)]" style={{ animationDelay: '600ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
));
SplashLoader.displayName = "SplashLoader";

export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash ? (
        <SplashLoader />
      ) : (
        <div className="animate-in fade-in duration-700">
          <Suspense
            fallback={
              <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950" />
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      )}
    </>
  );
}
