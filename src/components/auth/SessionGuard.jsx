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

  useEffect(() => {
    // Optional: Check for token expiration periodically if not handled by NextAuth
    // NextAuth's session strategy: "jwt" with maxAge usually handles this, 
    // but the status will flip to "unauthenticated" when it expires.
  }, [session]);

  return <>{children}</>;
}
