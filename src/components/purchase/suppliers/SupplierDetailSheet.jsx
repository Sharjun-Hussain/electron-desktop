"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Wallet,
  User,
  Activity,
  AlertTriangle,
  Loader2,
  Printer,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SupplierDetailSheet({ supplier, open, onOpenChange, accessToken, onSuccess, onSettle }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  const fetchLedger = useCallback(async () => {
    if (!supplier?.id || !accessToken) return;
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}/ledger`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const result = await response.json();
      if (result.status === "success") {
        setLedgerData(result.data.ledger || []);
        setCurrentBalance(result.data.current_balance || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, accessToken]);

  useEffect(() => {
    if (open && supplier) fetchLedger();
  }, [open, supplier, fetchLedger]);

  const handleToggleStatus = async () => {
    const action = supplier?.is_active ? "deactivate" : "activate";
    setIsToggling(true);

    toast.promise(
      fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier?.id}/${action}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
      {
        loading: `${action === "activate" ? "Activating" : "Deactivating"} supplier...`,
        success: () => {
          setIsToggling(false);
          if (onSuccess) onSuccess();
          return `Supplier ${action === "activate" ? "activated" : "deactivated"} successfully!`;
        },
        error: () => {
          setIsToggling(false);
          return `Failed to ${action} supplier`;
        },
      }
    );
  };

  if (!supplier) return null;

  const isLiability = currentBalance > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl flex flex-col h-full p-0 overflow-hidden bg-background shadow-2xl">
        {/* --- HEADER --- */}
        <SheetHeader className="px-6 py-6 pr-12 border-b border-border bg-card shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 rounded-lg border border-border shadow-sm shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {supplier.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-bold text-foreground">
                    {supplier.name}
                  </SheetTitle>
                  <Badge variant={supplier.is_active ? "default" : "destructive"} className="px-2 py-0.5 rounded-md font-medium text-xs">
                    {supplier.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <SheetDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4 opacity-70" />
                  Added {format(new Date(supplier.created_at || new Date()), "MMM dd, yyyy")}
                </SheetDescription>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Balance</p>
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">LKR</span>
                  <span className={cn(
                    "text-2xl font-bold tabular-nums leading-none",
                    isLiability ? "text-red-600" : "text-emerald-600"
                  )}>
                    {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-xs font-semibold px-2 py-0.5",
                  isLiability ? "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900" : "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900"
                )}>
                  {isLiability ? "You Owe Supplier" : "Supplier Owes You"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* --- CONTENT --- */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {!supplier.is_active && (
              <Alert variant="destructive" className="py-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">
                  This supplier is currently inactive. New purchase orders cannot be created.
                </AlertDescription>
              </Alert>
            )}

            {/* --- STATS --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Transactions</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{ledgerData.length}</span>
              </div>

              <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{supplier.is_active ? "Active" : "Inactive"}</span>
                  {supplier.is_active && (
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse mt-1" />
                  )}
                </div>
              </div>
            </div>

            {/* --- INFO GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Contact Details</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">{supplier.contact_person || "No contact person"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{supplier.phone || "No phone number"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{supplier.email || "No email address"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">Address</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {supplier.address || "No address provided."}
                </p>
              </div>
            </div>

            {/* --- LEDGER --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-foreground">Recent Transactions</h4>
              </div>

              <div className="rounded-xl border border-border overflow-x-auto bg-card shadow-sm w-full">
                <Table className="min-w-[500px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[120px] font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="text-right font-semibold">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></TableCell></TableRow>
                    ) : ledgerData.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-sm font-medium text-muted-foreground">No transactions found for this supplier.</TableCell></TableRow>
                    ) : (
                      ledgerData.slice(0, 15).map((t) => (
                        <TableRow key={t.id} className="group">
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(t.transaction_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-foreground">
                                {t.description}
                              </span>
                              <Badge variant="secondary" className="w-fit text-[10px] uppercase px-1.5 py-0 font-medium">
                                {t.reference_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={cn(
                              "text-sm font-medium flex items-center justify-end gap-1.5",
                              t.type === 'debit' ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                            )}>
                              {t.type === 'debit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                              {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-medium text-foreground">
                              {t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* --- FOOTER --- */}
        <SheetFooter className="px-6 py-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-sm"
            onClick={handleToggleStatus}
            disabled={isToggling}
          >
            {supplier.is_active ? "Deactivate Supplier" : "Activate Supplier"}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto text-sm flex items-center justify-center gap-2"
            onClick={() => {
              toast.info("Print functionality coming soon");
            }}
          >
            <Printer className="h-4 w-4" />
            Print Details
          </Button>
          <Button
            className="w-full sm:w-auto text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onSettle?.(supplier)}
          >
            <Wallet className="h-4 w-4" />
            Record Payment
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
