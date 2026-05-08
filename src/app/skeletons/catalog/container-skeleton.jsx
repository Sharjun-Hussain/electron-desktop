"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";

export default function ContainerSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background mt-4 sm:mt-6">
      <div className="flex bg-card/50 backdrop-blur-sm border border-border/60 shadow-xl shadow-foreground/5 rounded-3xl mx-2 sm:mx-6 overflow-hidden">
        <div className="flex flex-col w-full h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] lg:h-[calc(100vh-90px)]">
          {/* Header Section */}
          <div className="flex-none sm:h-28 p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 border-b border-border/50 bg-muted/20">
            {/* Title & Description */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden sm:flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/40 border border-border/50 text-muted-foreground shadow-sm">
                <Package className="h-6 w-6 sm:h-7 sm:w-7 opacity-20" />
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
                <Skeleton className="h-4 w-64 sm:w-80" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Skeleton className="h-10 w-24 sm:w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 sm:w-32 rounded-xl" />
            </div>
          </div>

          {/* Table Outline */}
          <div className="flex-1 overflow-auto bg-card/30">
            <div className="min-w-full">
              {/* Header Row */}
              <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_2fr_1fr_auto] gap-4 p-4 border-b border-border/50 bg-muted/30">
                <Skeleton className="h-5 w-5 rounded-md" /> {/* Checkbox */}
                <Skeleton className="h-5 w-24" />         {/* Container Name */}
                <Skeleton className="h-5 w-20" />         {/* Base Unit */}
                <Skeleton className="h-5 w-24" />         {/* Measurement Unit */}
                <Skeleton className="h-5 w-16" />         {/* Capacity */}
                <Skeleton className="h-5 w-32" />         {/* Description */}
                <Skeleton className="h-5 w-20" />         {/* Status */}
                <Skeleton className="h-5 w-8" />          {/* Actions */}
              </div>

              {/* Data Rows */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_2fr_1fr_auto] gap-4 p-4 items-center border-b border-border/30"
                >
                  <Skeleton className="h-5 w-5 rounded-md" /> {/* Checkbox */}
                  
                  {/* Container Name & Slug */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-md" /> {/* Icon */}
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-32" />
                       <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  
                  {/* Base Unit */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>

                  {/* Measurement Unit */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2 place-items-center">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  
                  {/* Description */}
                  <Skeleton className="h-4 w-48" />

                  {/* Status */}
                  <Skeleton className="h-6 w-20 rounded-full" />

                  {/* Actions */}
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer / Pagination Placeholder */}
          <div className="flex-none p-4 sm:p-6 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
