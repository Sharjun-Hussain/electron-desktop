"use client";

import { useSession, signOut } from "@/components/auth/DesktopAuthProvider";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SessionGuard({ children }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If we are unauthenticated and not already on the login page, redirect to login
    const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-token"];
    if (status === "unauthenticated" && !publicPaths.includes(pathname)) {
      const returnUrl = pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [status, pathname, router]);

  // Don't render protected routes until we know the auth status
  // This prevents SWR from firing requests before window.fetch is patched
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
