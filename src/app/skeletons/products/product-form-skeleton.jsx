import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProductFormSkeleton() {
  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" /> {/* Back Button */}
              <Skeleton className="h-8 w-48" /> {/* Title */}
            </div>
            <Skeleton className="h-4 w-64 ml-14" /> {/* Subtitle */}
          </div>
          <div className="hidden md:flex gap-3">
            <Skeleton className="h-10 w-24" /> {/* Reset Button */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- LEFT COLUMN --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Card 1: Identity Skeleton */}
            <Card className="border-t-4 border-muted shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Code Input */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  {/* Name Input */}
                  <div className="md:col-span-2 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                {/* Description Textarea */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Classification Skeleton */}
            <Card className="border-t-4 border-muted shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-64 mt-1" />
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Simulate 6 Select Inputs */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="lg:col-span-4 space-y-8">
            {/* Configuration Skeleton */}
            <Card className="border-t-4 border-muted shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-3 pt-6">
                {/* Switch 1 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
                {/* Switch 2 */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons Skeleton */}
            <div className="grid gap-3 sticky top-4">
              <Skeleton className="h-12 w-full rounded-md" /> {/* Save & Add */}
              <Skeleton className="h-12 w-full rounded-md" /> {/* Save */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}