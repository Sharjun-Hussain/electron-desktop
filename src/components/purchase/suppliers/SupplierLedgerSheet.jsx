"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "@/lib/date-utils";
import { toast } from "sonner";
import {
  Loader2,
  Wallet,
  FileText,
  CreditCard,
  Building2,
  Activity,
  User,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SupplierLedgerSheet({ supplier, open, onOpenChange, accessToken, isSettleMode = false }) {
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [settleOpen, setSettleOpen] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [payments, setPayments] = useState([
    { id: Date.now(), method: "cash", amount: 0, cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" } }
  ]);

  const totalAmountToPay = useMemo(() => {
    return payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [payments]);

  const addPaymentLine = useCallback(() => {
    setPayments(prev => [...prev, {
      id: Date.now(),
      method: "cash",
      amount: 0,
      cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" }
    }]);
  }, []);

  const removePaymentLine = useCallback((id) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePayment = useCallback((id, field, value) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const [description, setDescription] = useState("");

  // Pure JavaScript useRef (kept for potential future use)

  // Automatically open settlement dialog if accessed via specific settle action
  useEffect(() => {
    if (open && isSettleMode) {
      setSettleOpen(true);
      // Auto-populate amount based on current balance
      setPayments([{
        id: Date.now(),
        method: "cash",
        amount: Math.abs(currentBalance || 0),
        cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" }
      }]);
    }
  }, [open, isSettleMode, currentBalance]);

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
      toast.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  }, [supplier?.id, accessToken]);

  useEffect(() => {
    if (open && supplier) fetchLedger();
  }, [open, supplier, fetchLedger]);

  const handleSettleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    if (totalAmountToPay <= 0) {
      toast.error("Enter a valid settlement amount");
      return;
    }

    const payload = {
      total_amount: totalAmountToPay,
      payments: payments.map(p => ({
        payment_method: p.method,
        amount: parseFloat(p.amount),
        cheque_details: p.method === "cheque" ? p.cheque_details : null,
        notes: null,
        reference_number: null
      })),
      description: description,
      transaction_date: new Date().toISOString(),
    };

    try {
      setSettleLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${supplier.id}/payments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();

      if (result.status === "success") {
        toast.success("Settled successfully");
        setSettleOpen(false);
        fetchLedger();

        // Reset
        setPayments([{
          id: Date.now(),
          method: "cash",
          amount: 0,
          cheque_details: { bank_name: "", cheque_number: "", cheque_date: "" }
        }]);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to process settlement");
    } finally {
      setSettleLoading(false);
    }
  }, [supplier?.id, accessToken, payments, totalAmountToPay, description, fetchLedger]);

  const isPayable = currentBalance > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">

          {/* HEADER: Untinted, strict alignment, pr-14 to avoid close button overlap */}
          <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <SheetTitle className="text-xl font-bold text-foreground">
                    {supplier?.name}
                  </SheetTitle>
                </div>
                <SheetDescription className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Activity className="h-4 w-4" />
                  Supplier Ledger Archive
                </SheetDescription>
              </div>

              {/* Integrated Balance Display */}
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Current Exposure</p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    LKR {Math.abs(currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-bold border", isPayable ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50")}>
                    {isPayable ? "Liability" : "Surplus"}
                  </Badge>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* SCROLLABLE MAIN CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-foreground">Ledger Entries</h3>
              </div>
              <Button onClick={() => setSettleOpen(true)} size="sm" className="gap-2 shadow-sm font-semibold">
                <Wallet className="h-4 w-4" />
                Record Settlement
              </Button>
            </div>

            <div className="border border-border rounded-md shadow-sm overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold pl-4">Date</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold pr-4">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" /></TableCell></TableRow>
                  ) : ledgerData.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">No ledger entries found.</TableCell></TableRow>
                  ) : (
                    ledgerData.map((t) => (
                      <TableRow key={t.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="pl-4 text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(t.transaction_date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{t.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{t.reference_type}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn("text-sm font-medium tabular-nums", t.type === "debit" ? "text-emerald-600" : "text-amber-600")}>
                            {t.type === "debit" ? "+" : "-"}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <span className="text-sm font-medium text-foreground tabular-nums">
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
        </SheetContent>
      </Sheet>

      {/* SETTLEMENT DIALOG - Fixed height bounds for smaller 768px laptop screens */}
      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent className="sm:max-w-lg p-0 bg-background border shadow-xl flex flex-col max-h-[90vh] overflow-hidden">

          {/* DIALOG HEADER - Fixed at top */}
          <DialogHeader className="px-6 py-5 border-b border-border bg-background shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">Record Settlement</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">Reconcile liability for {supplier?.name}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* SCROLLABLE FORM CONTENT - Prevents off-screen buttons */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Summary Section */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Exposure</span>
                  <span className="text-sm font-bold text-foreground">LKR {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount to Pay</span>
                  <span className={cn("text-lg font-black tabular-nums", totalAmountToPay > currentBalance ? "text-amber-500" : "text-emerald-500")}>
                    LKR {totalAmountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {totalAmountToPay < currentBalance && (
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining Balance</span>
                    <span className="text-xs font-bold text-foreground">LKR {(currentBalance - totalAmountToPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* Payments Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-foreground">Payment Breakdown</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPaymentLine}
                    className="h-7 text-[10px] font-bold uppercase tracking-tighter"
                  >
                    Add Method
                  </Button>
                </div>

                <div className="space-y-2">
                  {payments.map((pmt, idx) => (
                    <div key={pmt.id} className="group relative flex flex-col gap-3 p-3 bg-background border border-border/60 rounded-xl shadow-sm transition-all hover:border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <select
                          value={pmt.method}
                          onChange={(e) => updatePayment(pmt.id, "method", e.target.value)}
                          className="h-9 px-2 text-xs font-bold rounded-lg bg-muted/20 border-none outline-none focus:ring-1 focus:ring-emerald-500 min-w-[120px]"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="card">Card Terminal</option>
                          <option value="cheque">Cheque</option>
                        </select>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">LKR</span>
                          <Input
                            type="number"
                            value={pmt.amount}
                            onChange={(e) => updatePayment(pmt.id, "amount", e.target.value)}
                            className="h-9 pl-10 text-xs font-bold border-none bg-muted/10 focus-visible:ring-1 focus-visible:ring-emerald-500 pr-8"
                          />
                        </div>
                        {payments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePaymentLine(pmt.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {pmt.method === "cheque" && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bank</Label>
                            <Input
                              placeholder="e.g. HNB"
                              value={pmt.cheque_details?.bank_name}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, bank_name: e.target.value })}
                              className="h-8 text-[11px] font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Number</Label>
                            <Input
                              placeholder="Cheque #"
                              value={pmt.cheque_details?.cheque_number}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, cheque_number: e.target.value })}
                              className="h-8 text-[11px] font-medium"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Cheque Date</Label>
                            <Input
                              type="date"
                              value={pmt.cheque_details?.cheque_date}
                              onChange={(e) => updatePayment(pmt.id, "cheque_details", { ...pmt.cheque_details, cheque_date: e.target.value })}
                              className="h-8 text-[11px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold text-foreground">Payment Memo</Label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Internal notes or reference numbers..."
                  className="w-full min-h-[80px] p-3 text-xs font-medium bg-muted/10 border border-border/60 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* DIALOG FOOTER - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-border bg-background shrink-0 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettleOpen(false)}
              className="font-bold shadow-sm h-11"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSettleSubmit}
              disabled={settleLoading || totalAmountToPay <= 0}
              className="font-bold shadow-sm h-11 min-w-[160px] bg-emerald-600 hover:bg-emerald-700"
            >
              {settleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Finalize Settlement
                </>
              )}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}