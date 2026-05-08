import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function EmployeesPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header section skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px] bg-muted/60" />
          <Skeleton className="h-4 w-[350px] bg-muted/40" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-[100px] rounded-xl bg-muted/60" />
          <Skeleton className="h-10 w-[150px] rounded-xl bg-emerald-500/20 border border-emerald-500/10" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-muted/40" />
              <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-7 w-16 bg-muted/60" />
              <Skeleton className="h-3 w-32 bg-muted/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Table section skeleton */}
      <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden">
        {/* Table Toolbar Skeleton */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5">
          <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[320px] rounded-xl bg-muted/60" />
            <Skeleton className="h-10 w-[140px] rounded-xl bg-muted/60 hidden sm:block" />
            <Skeleton className="h-10 w-[140px] rounded-xl bg-muted/60 hidden sm:block" />
          </div>
          <Skeleton className="h-10 w-[100px] rounded-xl bg-muted/60" />
        </div>

        {/* Table Body Skeleton */}
        <div className="p-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "px-4 py-4 border-b border-white/5 flex items-center gap-4",
                i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
              )}
            >
              <Skeleton className="h-4 w-4 rounded-md bg-muted/60" />
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-full bg-muted/60" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-muted/60" />
                  <Skeleton className="h-3 w-48 bg-muted/30" />
                </div>
              </div>
              <Skeleton className="h-4 w-24 bg-muted/40 hidden md:block" />
              <Skeleton className="h-4 w-24 bg-muted/40 hidden md:block" />
              <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
              <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
            </div>
          ))}
        </div>

        {/* Table Pagination Skeleton */}
        <div className="p-4 flex items-center justify-between border-t border-white/5 bg-white/5">
          <Skeleton className="h-4 w-[150px] bg-muted/40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[80px] rounded-lg bg-muted/60" />
            <div className="flex items-center gap-1 mx-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-lg bg-muted/60" />
              ))}
            </div>
            <Skeleton className="h-9 w-[80px] rounded-lg bg-muted/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
