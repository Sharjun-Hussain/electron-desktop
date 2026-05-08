"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ChequePageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:px-8 md:pt-4 md:pb-12 space-y-8">
      {/* Premium Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-muted animate-pulse" />
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-60 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border border-border/40 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-16 w-16 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Card Skeleton */}
      <Card className="max-w-[1400px] mx-auto border border-border/60 shadow-xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-6 border-b border-border/40 flex justify-between items-center gap-4">
            <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 rounded-xl" />
              <Skeleton className="h-11 w-11 rounded-xl" />
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex justify-between border-b border-border/40 pb-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
