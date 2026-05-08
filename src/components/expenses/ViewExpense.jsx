"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Receipt, 
  Calendar, 
  Tag, 
  CreditCard, 
  User, 
  FileText, 
  Download, 
  Printer,
  Building2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export default function ViewExpense({ id }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { formatCurrency } = useAppSettings();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpense() {
      if (!session?.accessToken || !id) return;
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/expenses/${id}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          setExpense(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch expense");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchExpense();
  }, [session, id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <p className="text-muted-foreground">Expense record not found.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const formatDateSafe = (dateStr, formatStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, formatStr);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
          <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Expense Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reference: {expense.reference_no || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                Expenditure Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2">
                <div className="p-6 border-b border-r border-gray-100">
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(expense.amount)}</p>
                </div>
                <div className="p-6 border-b border-gray-100">
                  <p className="text-sm text-muted-foreground mb-1">Date of Transaction</p>
                  <p className="text-lg font-medium text-foreground">
                    {formatDateSafe(expense.expense_date, "MMMM dd, yyyy")}
                  </p>
                </div>
                <div className="p-6 border-r border-gray-100">
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline" className="font-medium">
                    {expense.category?.name || "Uncategorized"}
                  </Badge>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm flex items-center gap-1.5">
                       <CreditCard className="h-4 w-4 text-emerald-600" />
                       {expense.payment_method?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50/10 border-t border-gray-100">
                <p className="text-sm text-muted-foreground mb-1">Note / Description</p>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {expense.notes || "No additional notes provided for this record."}
                </p>
              </div>
            </CardContent>
          </Card>

          {expense.payment_method === 'cheque' && (
            <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Cheque Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                  <p className="font-medium text-sm">{expense.cheque_details?.bank_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cheque #</p>
                  <p className="font-medium text-sm tabular-nums">{expense.cheque_details?.cheque_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Cheque Date</p>
                  <p className="font-medium text-sm">{expense.cheque_details?.cheque_date || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Payee Name</p>
                  <p className="font-medium text-sm">{expense.cheque_details?.payee_payor_name || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                Administrative Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Serving Branch</p>
                  <p className="font-medium text-sm">{expense.branch?.name || "Main Branch"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Recorded By</p>
                  <p className="font-medium text-sm">{expense.recorded_by_user?.name || "System"}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground">Last Updated At</p>
                <p className="text-[13px] font-medium text-foreground">
                  {formatDateSafe(expense.updatedAt, "PPP p")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-semibold text-foreground">
                Verified Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              {expense.receipt_image ? (
                <div className="space-y-4">
                  <div className="aspect-square rounded-lg border border-gray-100 bg-gray-50/50 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${expense.receipt_image}`} 
                      alt="Verified Receipt" 
                      className="object-contain max-h-full"
                    />
                  </div>
                  <Button variant="outline" className="w-full text-xs font-semibold h-9 border-gray-200" asChild>
                    <a href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${expense.receipt_image}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-3 w-3" />
                      View Full Document
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-2 opacity-30">
                  <Receipt className="h-10 w-10 text-muted-foreground" />
                  <p className="text-xs font-medium">No Attachment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
