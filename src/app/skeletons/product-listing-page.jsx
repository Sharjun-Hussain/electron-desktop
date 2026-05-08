import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function ProductsTableSkeleton() {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-6 px-6 pb-6 pt-3 md:flex">
      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" /> {/* Title */}
          <Skeleton className="h-4 w-64" /> {/* Subtitle */}
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-24" /> {/* Export Button */}
          <Skeleton className="h-10 w-32" /> {/* Add Product Button */}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" /> {/* Card Title */}
              <Skeleton className="h-4 w-48" /> {/* Card Description */}
            </div>
            <Skeleton className="h-4 w-20" /> {/* "Showing X products" */}
          </div>
        </CardHeader>
        <CardContent>
          {/* Toolbar Skeleton (Search Input) */}
          <div className="flex items-center py-4">
            <Skeleton className="h-10 w-full max-w-sm rounded-md" />
          </div>

          {/* Data Table Skeleton */}
          <div className="rounded-md border">
            {/* Table Header */}
            <div className="border-b h-12 flex items-center px-4 bg-muted/40">
              <Skeleton className="h-4 w-full" />
            </div>
            
            {/* Table Rows (Simulating 5 rows) */}
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 flex items-center px-4 gap-4">
                  <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                  <div className="flex items-center gap-3 w-[30%]">
                     <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
                     <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                     </div>
                  </div>
                  <Skeleton className="h-4 w-[15%]" /> {/* Category */}
                  <Skeleton className="h-4 w-[15%]" /> {/* Brand */}
                  <Skeleton className="h-6 w-[15%] rounded-full" /> {/* Status Badge */}
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" /> {/* Actions */}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}