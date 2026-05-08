// src/components/layout/dashboard-layout-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden h-screen w-64 flex-col border-r bg-muted/40 p-4 md:flex">
        <div className="flex h-14 items-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="mt-8 flex flex-1 flex-col space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="mt-auto">
          <Skeleton className="h-12 w-full" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header Skeleton */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          {/* Left side of header (e.g., page title) */}
          <div>
            <Skeleton className="h-6 w-48" />
          </div>
          {/* Right side of header (e.g., search and user avatar) */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>

        {/* Dashboard Content Skeleton */}
        <main className="flex-1 space-y-8 p-8">
          {/* Title and Button Skeleton */}
          <div className="flex items-center justify-between space-y-2">
            <div>
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Analytics Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          {/* Main Content Skeleton (e.g., a table) */}
          <div className="space-y-4">
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
            <Skeleton className="h-[50px] w-full rounded-lg" />
          </div>
        </main>
      </div>
    </div>
  );
}
