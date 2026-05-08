import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function UsersPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header section skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px] bg-muted/60" />
          <Skeleton className="h-4 w-[350px] bg-muted/40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[120px] rounded-xl bg-emerald-500/20 border border-emerald-500/10" />
        </div>
      </div>

      {/* Tabs list skeleton */}
      <div className="flex gap-2 p-1 bg-muted/20 w-[400px] rounded-xl">
        <Skeleton className="h-8 flex-1 rounded-lg bg-muted/60" />
        <Skeleton className="h-8 flex-1 rounded-lg bg-muted/40" />
      </div>

      {/* Content skeleton */}
      <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden">
        {/* Toolbar Skeleton */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <Skeleton className="h-4 w-32 bg-muted/40" />
          <Skeleton className="h-10 w-[240px] rounded-xl bg-muted/60" />
        </div>

        {/* List Skeleton (Simulating User Table) */}
        <div className="p-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "px-6 py-4 border-b border-white/5 flex items-center gap-4",
                i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full bg-muted/60" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-muted/60" />
                  <Skeleton className="h-3 w-48 bg-muted/30" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full bg-muted/40" />
              <Skeleton className="h-4 w-32 bg-muted/40 hidden md:block" />
              <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
              <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
