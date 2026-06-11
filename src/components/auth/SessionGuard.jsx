"use client";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Sparkles, Loader2 } from "lucide-react";

export default function SessionGuard({ children }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Auth Guarding
    const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-token"];
    if (status === "unauthenticated" && !publicPaths.includes(pathname)) {
      const returnUrl = pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // 2. Initial route handling for multi-window
    if (status === "authenticated" && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initRoute = params.get('initRoute');
      if (initRoute) {
        console.log(`🚀 Navigating to initial route: ${initRoute}`);
        // Clear the param from URL to avoid re-navigation on refresh
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        // Use router.push for smooth client-side navigation that preserves assets
        router.push(initRoute);
      }
    }
  }, [status, pathname, router]);

  // Don't render protected routes until we know the auth status
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-token"];
  if (status === "loading" && !publicPaths.includes(pathname)) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background relative overflow-hidden">
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
            <h2 className="text-xl font-bold tracking-tight text-foreground/90 mb-3">Inzeedo ERP</h2>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Loading Workspace
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
    );
  }

  return <>{children}</>;
}
