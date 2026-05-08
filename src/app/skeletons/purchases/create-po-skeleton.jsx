import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CreatePOSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6 bg-background/50 min-h-screen">
      {/* --- HEADER SKELETON --- */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" /> {/* Title */}
          <Skeleton className="h-4 w-48" /> {/* Subtitle */}
        </div>
      </div>

      {/* --- TOP SECTION SKELETON --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Details Card */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="lg:col-span-1 border-none shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- ITEMS SECTION SKELETON --- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-28 mb-2" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          {/* Table Header Mock */}
          <div className="hidden md:grid grid-cols-12 gap-4 mb-4">
            <Skeleton className="col-span-6 h-4 w-32" />
            <Skeleton className="col-span-2 h-4 w-20" />
            <Skeleton className="col-span-2 h-4 w-16" />
            <Skeleton className="col-span-2 h-4 w-24 ml-auto" />
          </div>

          {/* Table Rows */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-card dark:bg-card/40">
                <div className="col-span-1 md:col-span-6 space-y-2">
                  <Skeleton className="h-4 w-16 md:hidden" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Skeleton className="h-4 w-16 md:hidden" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Skeleton className="h-4 w-16 md:hidden" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end h-10 gap-4">
                  <Skeleton className="h-4 w-12 md:hidden" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <Skeleton className="mt-6 h-16 w-full rounded-lg" />

          {/* Summary Section */}
          <div className="mt-8 flex justify-end">
            <div className="w-full md:w-1/3 space-y-4 p-6 border rounded-lg">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- FOOTER SKELETON --- */}
      <div className="flex items-center justify-end gap-4 p-4 md:p-0">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
export { CreatePOSkeleton };
