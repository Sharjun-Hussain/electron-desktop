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
  FileText,
  Wallet,
  User,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Loader2,
  Building2,
  Printer,
  ChevronRight,
  TrendingUp,
  X,
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
        loading: `${action === "activate" ? "Activating" : "Suspending"} partner operations...`,
        success: () => {
          setIsToggling(false);
          if (onSuccess) onSuccess();
          return `Supplier operations ${action === "activate" ? "resumed" : "suspended"} successfully!`;
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
      <SheetContent className="sm:max-w-xl flex flex-col h-full p-0 overflow-hidden border-l border-border/50 bg-white/95 dark:bg-slate-950/95 shadow-2xl">

        {/* --- PROFESSIONAL ENTERPRISE HEADER --- */}
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                <AvatarFallback className="bg-emerald-600 text-white text-lg font-black">
                  {supplier.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-bold text-foreground leading-none">
                    {supplier.name}
                  </SheetTitle>
                  <Badge className={cn(
                    "px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider",
                    supplier.is_active ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {supplier.is_active ? "Verified Supply" : "Hold / Risk"}
                  </Badge>
                </div>
                <SheetDescription className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 opacity-50" />
                  Partner since {format(new Date(supplier.created_at || new Date()), "MMMM yyyy")}
                </SheetDescription>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 opacity-60">Settlement Position</p>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground">LKR</span>
                  <span className={cn(
                    "text-2xl font-black tabular-nums leading-none",
                    isLiability ? "text-amber-600" : "text-emerald-600"
                  )}>
                    {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-black border uppercase px-1.5 h-4",
                  isLiability ? "text-amber-600 border-amber-200 bg-amber-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"
                )}>
                  {isLiability ? "Liability Account" : "Surplus Balance"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* --- MASTER MANIFEST CONTENT --- */}
        <ScrollArea className="flex-1 bg-card min-h-0">
          <div className="p-8 space-y-8">

            {!supplier.is_active && (
              <Alert className="bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-500/20 py-3 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs font-bold">
                  Entity is currently flagged. All procurement operations for this vendor are suspended.
                </AlertDescription>
              </Alert>
            )}

            {/* --- TOP HIGH-FIDELITY STATS --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background border border-border p-4 rounded-xl shadow-xs group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Procurement Vol.</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-foreground leading-none">{ledgerData.length} <small className="text-[10px] opacity-40">Records</small></span>
                  <Badge variant="outline" className="text-[8px] font-bold bg-muted/50 border-none">Last 30 Days</Badge>
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl shadow-xs group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Engagement Basis</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-foreground leading-none">Active</span>
                  <div className="flex gap-1">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="size-1.5 rounded-full bg-emerald-500/40" />
                    <div className="size-1.5 rounded-full bg-emerald-500/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* --- ENTITY IDENTITY GRID --- */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <User className="h-3.5 w-3.5 text-emerald-600/60" />
                  <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Authorized Liaison</h4>
                </div>
                <div className="space-y-1 ml-1">
                  <p className="text-sm font-bold text-foreground">{supplier.contact_person || "Not Assigned"}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
                    <Phone className="h-3 w-3" />
                    <span>{supplier.phone || "No terminal access"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
                    <Mail className="h-3 w-3" />
                    <span>{supplier.email || "No digital registry"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600/60" />
                  <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Operational Geography</h4>
                </div>
                <div className="space-y-1 ml-1">
                  <p className="text-xs font-bold text-foreground/80 leading-relaxed max-w-[180px]">
                    {supplier.address || "Universal Registry (No specific address provided)"}
                  </p>
                </div>
              </div>
            </div>

            {/* --- TRANSACTION MANIFEST (LEDGER) --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                  <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Financial Traceability Journal</h4>
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Archive Status: Live
                </Badge>
              </div>

              <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm bg-background transition-all hover:shadow-md">
                <Table>
                  <TableHeader className="bg-muted/30 border-b border-border/40">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="h-10 text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter px-6 w-24">Timestamp</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Narrative</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter text-right w-24">Cr / Dr</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter text-right w-28 px-6">Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" /></TableCell></TableRow>
                    ) : ledgerData.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-32 text-center text-xs font-bold text-muted-foreground/40">Financial Trail Empty</TableCell></TableRow>
                    ) : (
                      ledgerData.slice(0, 15).map((t, idx) => (
                        <TableRow key={t.id} className={cn(
                          "border-border/40 group hover:bg-emerald-500/5 transition-colors",
                          idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                        )}>
                          <TableCell className="py-3 px-6 text-[10px] font-bold text-muted-foreground leading-none tabular-nums">
                            {format(new Date(t.transaction_date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-bold text-foreground leading-tight">
                                {t.description}
                              </span>
                              <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">
                                {t.reference_type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className={cn(
                              "text-[10px] font-black tabular-nums leading-none flex items-center justify-end gap-1",
                              t.type === 'debit' ? "text-emerald-600" : "text-amber-600"
                            )}>
                              {t.type === 'debit' ? <ArrowDownLeft className="h-2.5 w-2.5" /> : <ArrowUpRight className="h-2.5 w-2.5" />}
                              {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right px-6">
                            <span className="text-[11px] font-black text-foreground tabular-nums opacity-80">
                              {t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <p className="text-[9px] font-bold text-muted-foreground text-center opacity-40">Viewing recent transactional audit trail for {supplier.name}</p>
            </div>

          </div>
        </ScrollArea>

        {/* --- STICKY PROFESSIONAL FOOTER --- */}
        <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto font-bold text-xs h-10 border-border/60 hover:bg-muted/50"
            onClick={handleToggleStatus}
            disabled={isToggling}
          >
            {supplier.is_active ? "Suspend Partner" : "Resume Partner"}
          </Button>
          <Button
            className="w-full sm:w-auto font-bold text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2"
            onClick={() => onSettle?.(supplier)}
          >
            <Wallet className="h-4 w-4" />
            Record Settlement
          </Button>
          <Button
            variant="ghost"
            className="w-full sm:w-auto font-bold text-xs h-10 border border-border/40 hover:bg-muted/50 flex items-center justify-center gap-2"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            <Printer className="h-4 w-4" />
            Print Master File
          </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
