"use client";

import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { useEffect } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

/**
 * ProtectedRoute - Wrapper component for route-level permission protection
 * 
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {boolean} requireAll - If true, user must have ALL permissions. If false, ANY permission is enough (default: false)
 * @param {ReactNode} children - Page content to render if authorized
 * @param {string} redirectTo - Optional redirect path if unauthorized (default: shows 403 page)
 */
export function ProtectedRoute({
    permission,
    requireAll = false,
    children,
    redirectTo = null,
}) {
    const { status } = useSession();
    const router = useRouter();
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoaded } =
        usePermission();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (status === "unauthenticated") {
            const returnUrl = window.location.pathname + window.location.search;
            router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        }
    }, [status, router]);

    // Show loading state while checking auth
    if (status === "loading" || !isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    // User is not authenticated
    if (status === "unauthenticated") {
        return null; // Will redirect via useEffect
    }

    // Check permissions
    let hasAccess = false;

    if (Array.isArray(permission)) {
        hasAccess = requireAll
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission);
    } else if (permission) {
        hasAccess = hasPermission(permission);
    } else {
        // No permission specified, allow access
        hasAccess = true;
    }

    // User has access, render children
    if (hasAccess) {
        return <>{children}</>;
    }

    // User doesn't have permission - redirect or show 403
    if (redirectTo) {
        router.push(redirectTo);
        return null;
    }

    // Show 403 Unauthorized page
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        You don't have permission to access this page
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-left">
                                <p className="text-slate-700 mb-2">
                                    <strong>Required Permission:</strong>
                                </p>
                                <code className="text-xs bg-white px-2 py-1 rounded border text-slate-600">
                                    {Array.isArray(permission)
                                        ? permission.join(
                                              requireAll ? " AND " : " OR "
                                          )
                                        : permission}
                                </code>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500">
                        If you believe this is an error, please contact your system
                        administrator to request access.
                    </p>
                </CardContent>
                <CardFooter className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => router.back()}>
                        Go Back
                    </Button>
                    <Button onClick={() => router.push("/")}>
                        Return to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
