"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SalesHistorySkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header Section Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md bg-emerald-100 dark:bg-emerald-500/10" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/50 shadow-none bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg opacity-20" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16 opacity-50" />
                  <Skeleton className="h-7 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters/Toolbar Skeleton */}
        <Card className="border-border/50 shadow-none overflow-hidden bg-card">
          <div className="p-4 border-b border-border/40 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-64 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-32 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            
            {/* Filter grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                   <div className="flex gap-2 items-center">
                     <Skeleton className="h-3 w-3 rounded-full opacity-30" />
                     <Skeleton className="h-3 w-16 opacity-30" />
                   </div>
                   <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="p-0">
            {/* Table Header */}
            <div className="bg-muted/30 border-b border-border/40 h-10 px-4 flex items-center gap-4">
               <Skeleton className="h-3 w-24 opacity-40" />
               <Skeleton className="h-3 w-32 opacity-40" />
               <Skeleton className="h-3 w-20 opacity-40 ml-auto" />
               <Skeleton className="h-3 w-24 opacity-40" />
               <Skeleton className="h-3 w-20 opacity-40" />
            </div>
            {/* Table Rows */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border-b border-border/40 p-4 flex items-center gap-6 animate-pulse">
                <div className="space-y-2 w-32">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3 opacity-50" />
                </div>
                <div className="flex items-center gap-2 w-40">
                  <Skeleton className="h-3 w-3 rounded-full opacity-30" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="w-32">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="w-24 ml-auto">
                   <Skeleton className="h-8 w-full rounded-md opacity-20" />
                </div>
                <div className="w-24 text-right">
                  <Skeleton className="h-5 w-full rounded" />
                </div>
                <div className="w-20 text-center">
                  <Skeleton className="h-6 w-full rounded-full opacity-20" />
                </div>
                <div className="w-20 text-right">
                   <Skeleton className="h-8 w-full rounded-md opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
