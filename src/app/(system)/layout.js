'use client';

import { useSession } from '@/components/auth/DesktopAuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CustomSidebar } from "@/components/custom-sidebar";
import { DashboardLayoutSkeleton } from '../skeletons/dashboard/dashboard-skeleton';
import { SystemBreadcrumb } from '@/components/general/breadcrumb/Breadcrumb';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppSettings } from '@/app/hooks/useAppSettings';

export default function AppLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const isPosScreen = pathname === '/pos';
  const { general } = useAppSettings();

  const density = general?.interface?.density || 'comfortable';
  const performance = general?.interface?.performance || 'standard';
  const fontSize = general?.interface?.fontSize || '14';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <DashboardLayoutSkeleton />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  // POS Screen - Full width, optimized for touch/speed
  if (isPosScreen) {
    return (
      <div 
        className="min-h-screen w-full bg-background font-sans selection:bg-[#10b981] selection:text-white relative"
        data-density={density}
        data-performance={performance}
        style={{ fontSize: `${fontSize}px` }}
      >
        {children}
        {/* Minimal POS Credit */}
        <div className="fixed bottom-2 right-4 z-[9999] pointer-events-none select-none">
          <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">{t("pos.credit")}</span>
        </div>
      </div>
    );
  }

  // Standard Dashboard Screens
  return (
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
  );
}