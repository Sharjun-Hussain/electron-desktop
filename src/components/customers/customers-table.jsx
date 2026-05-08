"use client";

import { Edit, Trash2, Mail, Phone, MapPin, ReceiptText, User, Activity, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditCustomerSheet } from "./EditCustomerSheet";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/use-permission";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export function CustomersTable({ customers, onUpdate, onDelete, onViewLedger }) {
  const { canUpdate, canDelete } = usePermission();
  const { formatCurrency, generateDocNumber } = useAppSettings();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const CUSTOMER = "customer";

  return (
    <div className="border border-slate-200/50 dark:border-slate-800/60 shadow-sm bg-white dark:bg-slate-900/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent bg-slate-50/50 dark:bg-slate-900/80">
              <TableHead className="pl-8 h-12 text-[13px] font-bold text-slate-900 dark:text-white">Client Identity Portfolio</TableHead>
              <TableHead className="h-12 text-[13px] font-bold text-slate-900 dark:text-white px-4">Communication Basis</TableHead>
              <TableHead className="text-right h-12 text-[13px] font-bold text-slate-900 dark:text-white px-4">LTV / Fiscal Equity</TableHead>
              <TableHead className="text-center h-12 text-[13px] font-bold text-slate-900 dark:text-white px-4">Loyalty Tier</TableHead>
              <TableHead className="text-center h-12 text-[13px] font-bold text-slate-900 dark:text-white px-4">Account Protocol</TableHead>
              <TableHead className="text-right pr-8 h-12 text-[13px] font-bold text-slate-900 dark:text-white min-w-[120px]">Intelligence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!Array.isArray(customers) || customers.length === 0) ? (
              <TableRow className="border-slate-50 dark:border-slate-800/50 hover:bg-transparent">
                <TableCell colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-200 dark:text-slate-800">
                      <User className="w-14 h-14" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-400 dark:text-slate-500 text-[12px] leading-none">Zero Matching Profiles</h4>
                      <p className="text-[11px] text-slate-400/60 font-semibold mt-2 leading-none">Verify filter parameters or synchronize with the master registry.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group border-slate-50 dark:border-slate-800/50 transition-colors">
                  <TableCell className="pl-8 py-3.5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800 group-hover:border-emerald-500/50 transition-all duration-300 shadow-sm">
                        <AvatarFallback className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[11px] group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-all">
                          {customer.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => onViewLedger(customer)}
                          className="text-[13px] font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors text-left leading-none"
                        >
                          {customer.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 opacity-70">
                          <span className="text-emerald-600/70">{generateDocNumber('customer', customer.id)}</span>
                          <span className="opacity-30 mx-1">•</span>
                          {customer.address?.split(",")[0] || "No Technical Anchor"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-none">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {customer.email || "No Identifier"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-500 tabular-nums leading-none mt-0.5">
                        <Phone className="h-3 w-3 text-emerald-500/30" />
                        {customer.phone || "--- --- ----"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-4 py-3.5">
                    <div className="flex flex-col items-end">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                        {formatCurrency(parseFloat(customer.totalSpent || 0))}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 leading-none opacity-60">
                        {customer.visits || 0} Invoices
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center px-4 py-3.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-none leading-none h-6",
                        (customer.loyaltyPoints || 0) >= 1000 
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                      )}
                    >
                      {customer.loyaltyPoints || 0} Points
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center px-4 py-3.5">
                    <Badge className={cn(
                        "text-[10px] font-bold px-3 py-1 rounded-full border shadow-none leading-none h-6",
                        customer.is_active 
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" 
                            : "border-rose-500/20 bg-rose-500/10 text-rose-600"
                    )}>
                        {customer.is_active ? 'Active Protocol' : 'Archived'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8 py-3.5 min-w-[120px]">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all"
                        onClick={() => onViewLedger(customer)}
                        title="Audit Ledger"
                      >
                        <ReceiptText className="h-4 w-4" />
                      </Button>
                      {canUpdate(CUSTOMER) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-xl transition-all"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete(CUSTOMER) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                          onClick={() => onDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditCustomerSheet
        customer={editingCustomer}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={(updates) => {
          onUpdate(editingCustomer.id, updates);
          setIsEditOpen(false);
        }}
      />
    </div>
  );
}
