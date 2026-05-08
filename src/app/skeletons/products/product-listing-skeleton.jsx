import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductSkeleton() {
  return (
    <div className="flex flex-col p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      {/* Content */}
      <Card className="border border-border/60 shadow-xl shadow-foreground/2 rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm p-0 gap-0">
        <CardHeader className="p-5 border-b border-border/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <Skeleton className="h-11 w-full md:w-[300px] rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-24 rounded-xl" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-1 pb-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px] pl-4">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-32" />
                  </TableHead>{" "}
                  {/* Name */}
                  <TableHead>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>{" "}
                  {/* Category */}
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>{" "}
                  {/* Price */}
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>{" "}
                  {/* Stock */}
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>{" "}
                  {/* Status */}
                  <TableHead className="text-right pr-4">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 hover:bg-transparent">
                    <TableCell className="pl-4">
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />{" "}
                        {/* Product Image */}
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
