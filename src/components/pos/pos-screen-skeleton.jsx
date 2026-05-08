// src/components/pos/pos-screen-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function PosScreenSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
      {/* Top Header Skeleton */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" /> {/* Menu Icon */}
          <Skeleton className="h-6 w-32" /> {/* POS Name/Register */}
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48" /> {/* Search Customer */}
          <Skeleton className="h-10 w-10 rounded-full" /> {/* User Avatar */}
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-3">
        {/* Left Column: Cart & Billing */}
        <div className="flex flex-col rounded-lg border bg-background lg:col-span-1">
          {/* Cart Header */}
          <div className="border-b p-4">
            <Skeleton className="h-6 w-1/2" />
          </div>

          {/* Cart Items */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>

          {/* Cart Summary & Actions */}
          <div className="mt-auto border-t bg-muted/40 p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="my-2 border-t"></div>
              <div className="flex justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
            <Skeleton className="mt-4 h-12 w-full" />
          </div>
        </div>

        {/* Right Column: Product Grid */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Product Search and Filter */}
          <div className="rounded-lg border bg-background p-4">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Product Items */}
          <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto rounded-lg border bg-background p-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
