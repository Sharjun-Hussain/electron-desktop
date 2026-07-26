"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "@/lib/date-utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Calendar, User, Hash, CreditCard, X, RotateCcw, Receipt, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "../ui/status-badge";
import { useSettingsStore } from "@/store/useSettingsStore";

const SaleDetailSheet = ({ isOpen, onOpenChange, sale, onReprint }) => {
  if (!sale) return null;

  const subtotal = parseFloat(sale.total_amount || 0);
  const tax = parseFloat(sale.tax_amount || 0);
  const discount = parseFloat(sale.discount_amount || 0);
  const adjustment = parseFloat(sale.adjustment || 0);
  const payable = parseFloat(sale.payable_amount || 0);
  const paid = parseFloat(sale.paid_amount || 0);
  const balance = paid > 0 ? paid - payable : 0;
  const { t } = useTranslation();
  const { general } = useSettingsStore();
  const currency = general?.localization?.currency || "LKR";
  const router = useRouter();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl flex flex-col h-full p-0 overflow-hidden border-l border-border/50 [&>button]:hidden">
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 h-14 w-14">
                <Receipt className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col justify-center">
                <SheetTitle className="text-2xl font-bold text-foreground">
                  {sale.invoice_number}
                </SheetTitle>
                <SheetDescription className="text-base font-medium text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("pos.transaction_processed_on")} {format(new Date(sale.created_at), 'MMMM dd, yyyy hh:mm a')}
                </SheetDescription>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 justify-center h-14">
              <StatusBadge value={sale.payment_status} className="text-sm px-3 py-1" />
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-muted/20 min-h-0">
          <div className="p-8 space-y-10">
            
            {/* Returns Banner */}
            {((sale.returns?.length > 0) || (sale.sale_returns?.length > 0) || (sale.return_status && sale.return_status !== 'none')) && (
              <div 
                onClick={() => {
                  if (sale.returns?.length > 0) router.push(`/sales/returns?returnId=${sale.returns[0].id}`);
                  else if (sale.sale_returns?.length > 0) router.push(`/sales/returns?returnId=${sale.sale_returns[0].id}`);
                  else router.push(`/sales/returns`);
                }}
                className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-6 rounded-2xl flex items-center gap-5 shadow-sm cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all"
                title="Click to view returns"
              >
                <div className="h-12 w-12 bg-white dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-600 shrink-0 border border-orange-100 dark:border-orange-500/30 shadow-sm">
                  <RotateCcw size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-orange-800 dark:text-orange-400 uppercase tracking-tight mb-1">{t("pos.return_history")}</h4>
                  <p className="text-sm font-medium text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                    {t("pos.transaction_returned_desc")}
                    <span className="text-orange-900 dark:text-orange-200 font-bold ml-2 bg-orange-200/50 dark:bg-orange-500/30 px-2 py-0.5 rounded-md">
                      {currency} {Math.round(
                        (sale.returns || sale.sale_returns || []).reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="text-orange-600 hover:bg-orange-200/50 dark:hover:bg-orange-500/30 rounded-full h-10 w-10">
                  <ArrowRightLeft size={20} />
                </Button>
              </div>
            )}

            {/* --- Info Grid --- */}
            <div className="grid grid-cols-2 gap-8">
              {/* Customer Profile */}
              <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("pos.customer_profile")}</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-xl font-bold text-foreground">{sale.customer?.name || sale.distributor?.name || t("pos.walk_in_customer")}</p>
                  <div className="flex flex-col gap-2">
                    <p className="text-base text-muted-foreground font-medium flex items-center gap-2">
                       {sale.customer?.phone || sale.distributor?.phone || t("pos.no_contact")}
                    </p>
                    {(sale.customer?.email || sale.distributor?.email) && (
                      <p className="text-base text-muted-foreground font-medium">{sale.customer?.email || sale.distributor?.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Routing */}
              <div className="bg-background rounded-2xl p-6 border border-border/50 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{t("pos.financial_routing")}</h4>
                </div>
                <div className="space-y-3">
                  {sale.payments && sale.payments.length > 0 ? (
                    sale.payments.map((pmt, i) => (
                      <div key={i} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/5 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400 uppercase">
                          {t(`pos.${pmt.payment_method.toLowerCase()}`)}
                        </span>
                        <span className="text-base font-bold text-foreground tabular-nums">
                          {currency} {parseFloat(pmt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-bold text-sm px-4 py-1.5 rounded-lg">
                      {t(`pos.${(sale.payment_method || 'CASH').toLowerCase()}`)}
                    </Badge>
                  )}
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                      <span className="text-muted-foreground/60">{t("pos.processed_by")}</span>
                      <span className="text-foreground font-semibold">{sale.cashier?.name || 'Main POS'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Items Table --- */}
            <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                    <Hash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">{t("pos.transaction_manifest")}</h4>
                </div>
                <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 text-sm font-bold px-3 py-1 rounded-full">
                  {sale.items?.length || 0} {t("pos.products")}
                </Badge>
              </div>

              <div className="w-full">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground">{t("pos.product_col")}</TableHead>
                      <TableHead className="py-4 text-sm font-semibold text-muted-foreground text-center w-24">{t("pos.qty_col")}</TableHead>
                      <TableHead className="py-4 text-sm font-semibold text-muted-foreground text-right w-32">{t("pos.price_col")}</TableHead>
                      <TableHead className="py-4 px-6 text-sm font-semibold text-muted-foreground text-right w-36">{t("pos.total_col")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item, idx) => (
                      <TableRow key={idx} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold text-foreground leading-tight">
                                {item.product?.name}
                              </span>
                              {(item.returned_quantity > 0 || item.quantity_returned > 0 || item.return_qty > 0) && (
                                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 text-xs font-bold px-2 py-0.5 rounded-md">
                                  {t("pos.returned")}: {item.returned_quantity || item.quantity_returned || item.return_qty}
                                </Badge>
                              )}
                            </div>
                            {item.variant?.name && (
                              <div className="inline-flex">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                  {item.variant.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-muted text-foreground text-base font-bold">
                            {parseFloat(item.quantity).toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right text-sm text-muted-foreground font-semibold tabular-nums">
                          {parseFloat(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="py-4 text-right px-6">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            {(parseFloat(item.unit_price) * parseFloat(item.quantity)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Financial Summary --- */}
            <div className="bg-emerald-950 dark:bg-emerald-950 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform duration-700 group-hover:scale-[1.2] group-hover:rotate-12 group-hover:opacity-20">
                <CreditCard className="w-48 h-48 text-emerald-400" />
              </div>

              <div className="space-y-4 pb-6 border-b border-emerald-800/50 relative z-10 w-full sm:w-2/3 ml-auto">
                <div className="flex justify-between items-center text-emerald-100">
                  <span className="text-sm font-medium">{t("pos.shipment_total")}</span>
                  <span className="text-base font-semibold tabular-nums">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-100">
                  <span className="text-sm font-medium">{t("pos.instant_reduction")}</span>
                  <span className="text-base font-semibold text-emerald-400 tabular-nums">- {currency} {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-100">
                  <span className="text-sm font-medium">{t("pos.tax_assessment")}</span>
                  <span className="text-base font-semibold tabular-nums">{currency} {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-widest">{t("pos.net_payable")}</h3>
                  <div className="flex items-baseline gap-2 text-white">
                    <span className="text-xl font-medium text-emerald-500">{currency}</span>
                    <span className="text-4xl font-black tabular-nums tracking-tight drop-shadow-md">{payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h3 className="text-sm font-medium text-emerald-400/80 uppercase tracking-widest">{t("pos.liquid_receipt")}</h3>
                  <div className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-xl font-bold px-5 py-2 rounded-xl shadow-inner">
                    {currency} {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {balance > 0 && (
                <div className="pt-6 mt-2 border-t border-emerald-800/50 flex justify-between items-center relative z-10">
                  <span className="text-sm font-medium text-emerald-400 uppercase tracking-widest">{t("pos.relocation_change")}</span>
                  <div className="flex items-center gap-2 text-white bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30">
                    <span className="text-base font-bold text-emerald-300">{currency}</span>
                    <span className="text-2xl font-black tabular-nums">{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* --- Sticky Footer --- */}
        <SheetFooter className="px-8 py-6 border-t border-border bg-background flex flex-row items-center justify-end gap-4 shrink-0 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto font-semibold text-base h-12 px-6 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-5 w-5" />
            {t("pos.close_details")}
          </Button>
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[160px] font-semibold text-base h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={() => onReprint(sale)}
          >
            <Printer className="mr-2 h-5 w-5" />
            {t("pos.reprint_receipt")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SaleDetailSheet;
