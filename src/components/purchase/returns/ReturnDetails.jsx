"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import {
  Printer,
  ArrowLeft,
  Loader2,
  RotateCcw,
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  Package,
  Hash,
  DollarSign,
  Info,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "@/lib/date-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount || 0));
};

const getStatusConfig = (status) => {
  switch (status) {
    case "completed":
      return {
        icon: CheckCircle2,
        label: "Completed",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconClassName: "text-emerald-600"
      };
    case "pending":
      return {
        icon: Clock,
        label: "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        iconClassName: "text-amber-600"
      };
    case "cancelled":
      return {
        icon: XCircle,
        label: "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200",
        iconClassName: "text-red-600"
      };
    default:
      return {
        icon: Info,
        label: status,
        className: "bg-gray-50 text-gray-700 border-gray-200",
        iconClassName: "text-gray-600"
      };
  }
};

export default function ReturnDetails({ id: propId }) {
  const router = useRouter();
  const params = useParams();
  const id = propId || params?.id;

  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [returnData, setReturnData] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken || !id) {
        if (session?.accessToken === undefined || id === undefined) {
          // Still waiting for hooks to initialize
        } else {
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-returns/${id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });

        if (!response.ok) throw new Error("Failed to fetch return details");

        const result = await response.json();
        if (result.status === 'success') {
          setReturnData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch return");
        }
      } catch (error) {
        console.error("Error fetching Return:", error);
        toast.error("Failed to load Purchase Return details");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, session?.accessToken]);

  const statusConfig = useMemo(() =>
    getStatusConfig(returnData?.status), [returnData?.status]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-muted-foreground font-medium text-sm">Loading return details...</span>
      </div>
    );
  }

  if (!returnData) return <div className="p-8 text-center text-red-500">Return Not Found</div>;

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-md border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 h-9 w-9 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <RotateCcw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Purchase Return
                </h1>
                <Badge variant="outline" className="font-mono text-xs bg-gray-50 border-gray-200">
                  #{returnData.return_number}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 px-2.5 py-1 font-normal", statusConfig.className)}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {returnData.return_date ? format(new Date(returnData.return_date), "PPP") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Details Card */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold text-foreground">Supplier Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Supplier Name</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {returnData.supplier?.name || "N/A"}
                  </p>
                </div>
              </div>

              {returnData.supplier?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      {returnData.supplier?.email}
                    </p>
                  </div>
                </div>
              )}

              {returnData.supplier?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Phone Number</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {returnData.supplier?.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Return Meta Card */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold text-foreground">Return Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Created By</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {returnData.created_by_user?.name || "System"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">Return Date</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {returnData.return_date ? format(new Date(returnData.return_date), "PPP") : "N/A"}
                  </p>
                </div>
              </div>

              {returnData.branch?.name && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Branch</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {returnData.branch?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section (if exists) */}
      {returnData.notes && (
        <Card className="border border-amber-200 bg-amber-50/30 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-amber-800 mt-1">{returnData.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold text-foreground">Returned Items</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-6 h-10">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide h-10">
                    Reason
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide h-10">
                    Batch Number
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right h-10">
                    Quantity
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right h-10">
                    Unit Cost
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right pr-6 h-10">
                    Total Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnData.items?.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-gray-50 hover:bg-gray-50/30 last:border-0">
                    <TableCell className="pl-6 py-4">
                      <div className="font-medium text-foreground text-sm">
                        {item.product?.name || "Unknown"}
                      </div>
                      {item.variant && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Variant: {item.variant.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm text-muted-foreground">{item.reason || "-"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-mono text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">
                        {item.batch_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-4 font-medium text-foreground text-sm">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right py-4 text-muted-foreground text-sm">
                      {formatCurrency(item.unit_cost)}
                    </TableCell>
                    <TableCell className="text-right pr-6 py-4 font-semibold text-foreground text-sm">
                      {formatCurrency(item.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Financial Summary Footer */}
          <div className="flex justify-end px-6 py-5 bg-gray-50/50 border-t border-gray-100">
            <div className="space-y-1">
              <div className="flex justify-between gap-12 items-baseline">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Return Amount
                </span>
                <span className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(returnData.total_amount)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Including all returned items
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}