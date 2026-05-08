"use client";

import React, { useCallback } from"react";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetDescription,
 SheetFooter,
} from"@/components/ui/sheet";
import { Badge } from"@/components/ui/badge";
import {
 Landmark,
 Calendar,
 User,
 Activity,
 CheckCircle2,
 Clock,
 AlertCircle,
 FileText,
 CreditCard,
 Building2,
 Receipt,
 X,
 Info,
 Hash,
 Banknote,
 CalendarDays,
 UserCircle2,
 Tag,
} from"lucide-react";
import { cn } from"@/lib/utils";
import { format } from"date-fns";
import { Button } from"@/components/ui/button";
import { Card } from"@/components/ui/card";
import { Separator } from"@/components/ui/separator";

export function ChequeDetailsSheet({ open, onOpenChange, cheque }) {
 if (!cheque) return null;

 // Optimized helper for status badge rendering
 const renderStatusBadge = useCallback((status) => {
  switch (status) {
   case"cleared":
    return (
     <Badge variant="outline"className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 px-2.5 py-1 font-normal">
      <CheckCircle2 className="h-3 w-3"/>
      Cleared
     </Badge>
    );
   case"pending":
    return (
     <Badge variant="outline"className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 gap-1.5 px-2.5 py-1 font-normal">
      <Clock className="h-3 w-3"/>
      Pending
     </Badge>
    );
   case"bounced":
    return (
     <Badge variant="outline"className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 gap-1.5 px-2.5 py-1 font-normal">
      <AlertCircle className="h-3 w-3"/>
      Bounced
     </Badge>
    );
   default:
    return (
     <Badge variant="outline"className="bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5 px-2.5 py-1 font-normal capitalize">
      <Activity className="h-3 w-3"/>
      {status}
     </Badge>
    );
  }
 }, []);

 const isReceivable = cheque.type ==="receivable";

 return (
  <Sheet open={open} onOpenChange={onOpenChange}>
   <SheetContent side="right"className="sm:max-w-lg w-full p-0 flex flex-col h-full bg-background">

    <SheetHeader className="px-5 py-4 border-b border-border bg-card/10 shrink-0 text-left">
     <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
       <Landmark className="w-5 h-5 text-emerald-600"/>
      </div>
      <div className="text-left">
       <SheetTitle className="text-base font-bold">Instrument Registry</SheetTitle>
       <SheetDescription className="text-xs text-muted-foreground mt-0.5">
        Reference ID: <span className="text-foreground font-semibold">CHR-{cheque.id.toString().padStart(6, '0')}</span>
       </SheetDescription>
      </div>
     </div>
    </SheetHeader>

    {/* SCROLLABLE CONTENT */}
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

     <div className="bg-muted/30 rounded-lg border border-border/40 p-5 shadow-inner">
      <div className="flex items-center justify-between mb-3 text-left">
       <div className="flex items-center gap-2">
        <Banknote className="h-3.5 w-3.5 text-emerald-600"/>
        <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Cheque Amount (LKR)</span>
       </div>
       <Badge variant="outline"className="text-[9px] font-bold text-emerald-600 bg-emerald-50/50 border-emerald-500/20 rounded px-1.5 py-0">
        {isReceivable ?"RECEIVABLE":"PAYABLE"}
       </Badge>
      </div>
      <div className="flex items-baseline gap-2">
       <span className="text-2xl font-black text-foreground tabular-nums">
        {parseFloat(cheque.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
       </span>
      </div>
     </div>

     {/* Status & Type Section */}
     <div className="grid grid-cols-2 gap-3">
      <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
       <div className="flex items-center gap-2 mb-2">
        <Activity className="h-3.5 w-3.5 text-muted-foreground"/>
        <span className="text-[10px] font-bold uppercase text-muted-foreground/60">Status</span>
       </div>
       {renderStatusBadge(cheque.status)}
      </div>

      <div className="bg-muted/20 rounded-lg p-3 border border-border/40">
       <div className="flex items-center gap-2 mb-2">
        <Tag className="h-3.5 w-3.5 text-muted-foreground"/>
        <span className="text-[10px] font-bold uppercase text-muted-foreground/60">Type</span>
       </div>
       <Badge variant="secondary"className="bg-background text-foreground border-border/60 font-semibold py-0.5 text-xs">
        {isReceivable ?"Customer Cheque":"Supplier Cheque"}
       </Badge>
      </div>
     </div>

     {/* Bank & Instrument Details */}
     <div className="space-y-4">
      <div className="flex items-center gap-2">
       <Building2 className="h-3.5 w-3.5 text-emerald-600"/>
       <h3 className="text-xs font-bold text-foreground uppercase">Bank & Instrument</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
       <div className="bg-card/40 rounded-lg border border-border/60 p-3 shadow-sm">
        <div className="flex items-center gap-1.5 mb-1 text-left">
         <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Bank Name</span>
        </div>
        <p className="text-sm font-bold text-foreground">{cheque.bank_name}</p>
       </div>

       <div className="bg-card/40 rounded-lg border border-border/60 p-3 shadow-sm">
        <div className="flex items-center gap-1.5 mb-1 text-left">
         <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Instrument #</span>
        </div>
        <p className="text-sm font-mono font-black text-foreground">{cheque.cheque_number}</p>
       </div>
      </div>

      <div className="bg-card/40 rounded-lg border border-border/60 p-3 shadow-sm">
       <div className="flex items-center gap-1.5 mb-1 text-left">
        <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Maturity Date</span>
       </div>
       <p className="text-[13px] font-bold text-foreground">
        {format(new Date(cheque.cheque_date),"PPP")}
       </p>
      </div>

      <div className="bg-card/40 rounded-lg border border-border/60 p-3 shadow-sm">
       <div className="flex items-center gap-1.5 mb-1 text-left">
        <span className="text-[10px] font-bold uppercase text-muted-foreground/70">
         {isReceivable ?"PAYOR":"PAYEE"}
        </span>
       </div>
       <p className="text-[13px] font-bold text-foreground">
        {cheque.payee_payor_name ||"—"}
       </p>
      </div>
     </div>

     {/* Remarks Section */}
     <div className="space-y-3">
      <div className="flex items-center gap-2">
       <FileText className="h-3.5 w-3.5 text-emerald-600"/>
       <h3 className="text-xs font-bold text-foreground uppercase">Notes & Remarks</h3>
      </div>

      <div className="bg-muted/10 rounded-lg border border-border/40 p-3">
       {cheque.remarks ? (
        <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">{cheque.remarks}</p>
       ) : (
        <div className="flex items-center gap-2">
         <Info className="h-3.5 w-3.5 text-muted-foreground/40"/>
         <p className="text-xs text-muted-foreground/60 italic">No additional transaction memos</p>
        </div>
       )}
      </div>
     </div>

     {/* Activity Timeline */}
     <div className="space-y-4">
      <div className="flex items-center gap-2">
       <Clock className="h-3.5 w-3.5 text-emerald-600"/>
       <h3 className="text-xs font-bold text-foreground uppercase">Timeline</h3>
      </div>

      <div className="space-y-3">
       <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
         <Calendar className="h-3.5 w-3.5 text-muted-foreground"/>
        </div>
        <div className="flex-1 text-left">
         <p className="text-[10px] font-bold uppercase text-muted-foreground/60">Execution Date</p>
         <p className="text-[13px] font-bold text-foreground">
          {format(new Date(cheque.created_at || cheque.cheque_date),"dd MMM yyyy")}
         </p>
        </div>
       </div>

       {cheque.updated_at && cheque.updated_at !== cheque.created_at && (
        <div className="flex items-start gap-3">
         <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground"/>
         </div>
         <div className="flex-1 text-left">
          <p className="text-[10px] font-bold uppercase text-muted-foreground/60">Registry Update</p>
          <p className="text-[13px] font-bold text-foreground">
           {format(new Date(cheque.updated_at),"dd MMM yyyy")}
          </p>
         </div>
        </div>
       )}
      </div>
     </div>
    </div>


   </SheetContent>
  </Sheet>
 );
}