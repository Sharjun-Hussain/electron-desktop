import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CreateGRNSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* --- HEADER SKELETON --- */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 bg-blue-100" /> {/* Badge */}
          <Skeleton className="h-10 w-64" /> {/* Title */}
        </div>
        <Skeleton className="h-10 w-32" /> {/* Back Button */}
      </div>

      {/* --- INFO CARD SKELETON --- */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Supplier Info */}
            <div className="space-y-2 col-span-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* PO Info */}
            <div className="space-y-2 col-span-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Inputs */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="col-span-2 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- TABLE SKELETON --- */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-gray-50 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <div className="text-right">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
        </CardHeader>
        <div className="p-0">
          <div className="space-y-4 p-4">
            {/* Table Header Mock */}
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Table Rows (Create 5 mock rows) */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-1/4" /> {/* Product Select */}
                <Skeleton className="h-10 w-16" />  {/* Batch */}
                <Skeleton className="h-10 w-24" />  {/* Expiry */}
                <Skeleton className="h-10 w-12" />  {/* Ordered */}
                <Skeleton className="h-10 w-16" />  {/* Received */}
                <Skeleton className="h-10 w-12" />  {/* Free */}
                <Skeleton className="h-10 w-20" />  {/* Cost */}
                <Skeleton className="h-10 w-20" />  {/* Sell */}
                <Skeleton className="h-10 w-24 ml-auto" /> {/* Total */}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* --- FOOTER SKELETON --- */}
      <div className="flex gap-4 justify-end mt-6">
        <Skeleton className="h-11 w-24" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}