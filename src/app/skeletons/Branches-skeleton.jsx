import { Skeleton } from "@/components/ui/skeleton";

export default function BranchesPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header section skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px] bg-muted/60" />
          <Skeleton className="h-4 w-[350px] bg-muted/40" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-11 w-11 rounded-xl bg-muted/60 shrink-0" />
          <Skeleton className="h-11 w-[140px] rounded-xl bg-[#10b981]/10 shrink-0" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-10 rounded-xl bg-muted/40" />
              <Skeleton className="h-5 w-16 rounded-full bg-muted/30" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-[100px] bg-muted/40" />
              <Skeleton className="h-8 w-[80px] bg-muted/60" />
            </div>
          </div>
        ))}
      </div>

      {/* Table section skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/30 bg-muted/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Skeleton className="h-10 w-full sm:w-[300px] bg-background/60 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[100px] bg-background/60 rounded-xl" />
            <Skeleton className="h-10 w-[100px] bg-background/60 rounded-xl" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border-b border-border/20 last:border-0 hover:bg-muted/10">
              <div className="flex items-center gap-4 w-1/3">
                <Skeleton className="h-5 w-5 rounded bg-muted/60" />
                <Skeleton className="h-10 w-10 rounded-xl bg-muted/40 shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px] bg-muted/60" />
                  <Skeleton className="h-3 w-[100px] bg-muted/40" />
                </div>
              </div>
              <div className="hidden md:block w-1/4 space-y-2">
                <Skeleton className="h-4 w-[120px] bg-muted/60" />
                <Skeleton className="h-3 w-[180px] bg-muted/40" />
              </div>
              <div className="w-1/6">
                <Skeleton className="h-6 w-[80px] rounded-full bg-muted/40" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-between items-center">
          <Skeleton className="h-4 w-[150px] bg-muted/40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg bg-muted/50" />
            <Skeleton className="h-8 w-8 rounded-lg bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
