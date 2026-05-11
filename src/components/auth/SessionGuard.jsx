"use client";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}
