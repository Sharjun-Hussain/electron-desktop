'use client';

import { useSession } from '@/components/auth/DesktopAuthProvider';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CustomSidebar } from "@/components/custom-sidebar";
import { DashboardLayoutSkeleton } from '../skeletons/dashboard/dashboard-skeleton';
import { SystemBreadcrumb } from '@/components/general/breadcrumb/Breadcrumb';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings } from '@/app/hooks/useAppSettings';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useNavigationStore } from '@/store/useNavigationStore';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function AppLayout({ children }) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { business, general } = useAppSettings();
  const { track, history } = useNavigationStore();

  const density = general?.interface?.density || 'comfortable';
  const performance = general?.interface?.performance || 'standard';
  const fontSize = general?.interface?.fontSize || '14';

  const isPosScreen = pathname?.includes('/pos') || pathname?.includes('/customer-display');

  // Keep the screen awake on POS screens
  useWakeLock(isPosScreen);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router]);

  // Track navigation history
  useEffect(() => {
    if (status === 'authenticated') {
      const fullPath = searchParams.toString() 
        ? `${pathname}?${searchParams.toString()}` 
        : pathname;
      track(fullPath);
    }
  }, [pathname, searchParams, status, track]);

  const moduleGuards = [
    {
      enabled: business?.accounting_enabled,
      paths: ['/accounting', '/cheques', '/expenses', '/expense-categories']
    },
    {
      enabled: business?.shopify_enabled,
      paths: ['/settings/shopify']
    },
    {
      enabled: business?.daraz_enabled,
      paths: ['/daraz']
    },
    {
      enabled: business?.whatsapp_enabled,
      paths: ['/crm/whatsapp']
    },
    {
      enabled: business?.textlk_enabled,
      paths: ['/crm/text-lk']
    },
    {
      enabled: business?.business_type?.toLowerCase() === 'restaurant' || business?.business_type?.toLowerCase() === 'manufacturing',
      paths: ['/production']
    },
    {
      enabled: business?.business_type?.toLowerCase() === 'manufacturing',
      paths: ['/production/orders', '/production/raw-materials', '/production/wastage', '/distributors']
    },
    {
      enabled: business?.business_type?.toLowerCase() === 'restaurant',
      paths: ['/dining', '/kitchen', '/waiter']
    }
  ];

  const isBlocked = status === 'authenticated' && business && (() => {
    // Exempt Super Admins from feature flag blocks
    const isSuperAdmin = session?.user?.roles?.includes('Super Admin');
    if (isSuperAdmin) return false;

    return moduleGuards.some(guard => {
      if (guard.enabled === false) {
        return guard.paths.some(path => pathname === path || pathname.startsWith(path + '/'));
      }
      return false;
    });
  })();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <DashboardLayoutSkeleton />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  if (isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center select-none animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-600">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-3">
          Access Denied
        </h1>
        <p className="max-w-md text-sm text-muted-foreground mb-8">
          You do not have the required authority to perform this action. Please contact your system administrator if you believe this is an error.
        </p>
        <Button
          onClick={() => {
            let backPath = '/';
            if (history && history.length > 0) {
              for (let i = history.length - 1; i >= 0; i--) {
                const path = history[i];
                const isPathBlocked = moduleGuards.some(guard => {
                  if (guard.enabled === false) {
                    return guard.paths.some(p => path === p || path.startsWith(p + '/'));
                  }
                  return false;
                });
                if (!isPathBlocked && path !== pathname) {
                  backPath = path;
                  break;
                }
              }
            }
            router.push(backPath);
          }}
          className="px-8 h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200"
        >
          Go Back
        </Button>
      </div>
    );
  }

  // POS Screen - Full width, optimized for touch/speed
  if (isPosScreen) {
    return (
      <div
        className="min-h-screen w-full bg-background font-sans selection:bg-[#10b981] selection:text-white relative flex flex-col"
        data-density={density}
        data-performance={performance}
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

      </div>
    );
  }

  // Standard Dashboard Screens
  return (
    <>
      <div
        className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-[#10b981] selection:text-white transition-colors duration-500 overflow-hidden"
      data-density={density}
      data-performance={performance}
      style={{ fontSize: `${fontSize}px` }}
    >
      <CustomSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <SystemBreadcrumb />
        <main className="flex-1 overflow-y-auto scroll-smooth thin-scrollbar px-2">
          {children}
        </main>

        {/* Global Workstation Footer */}
        <footer className="px-8 py-4 bg-background border-t border-border/40 shrink-0 select-none">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
            <p>{t("footer.developed_by")}</p>
            <p>{t("footer.rights_reserved")}</p>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}