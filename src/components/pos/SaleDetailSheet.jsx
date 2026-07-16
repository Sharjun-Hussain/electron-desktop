"use client";

import React from "react";
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
import { Printer, Calendar, User, Hash, CreditCard, X } from "lucide-react";
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col h-full p-0 overflow-hidden border-l border-border/50">
        <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <Hash className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <SheetTitle className="text-xl font-bold text-foreground">
                  {sale.invoice_number}
                </SheetTitle>
              </div>
              <SheetDescription className="text-sm font-medium text-muted-foreground mt-1">
                {t("pos.transaction_processed_on")} {format(new Date(sale.created_at), 'MMMM dd, yyyy hh:mm a')}
              </SheetDescription>
            </div>

            <div className="flex flex-col items-end gap-3">
              <StatusBadge value={sale.payment_status} />
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{t("pos.settlement_total")}</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                  <span className="text-xl font-black text-foreground tabular-nums leading-none">
                    {payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-card min-h-0">
          <div className="p-6 space-y-8">
            {((sale.returns?.length > 0) || (sale.sale_returns?.length > 0) || (sale.return_status && sale.return_status !== 'none')) && (
              <div className="bg-orange-500/5 border border-orange-500/20 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-600 shrink-0 border border-orange-500/20">
                  <RotateCcw size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-black text-orange-800 uppercase tracking-tight mb-0.5">{t("pos.return_history")}</h4>
                  <p className="text-[12px] font-semibold text-orange-700/80 leading-relaxed">
                    {t("pos.transaction_returned_desc")}
                    <span className="text-orange-900 font-black ml-1.5 tabular-nums underline decoration-orange-500/30 underline-offset-4">
                      {currency} {Math.round(
                        (sale.returns || sale.sale_returns || []).reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* --- Info Grid --- */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <User className="h-3.5 w-3.5 text-emerald-600/60" />
                  <h4 className="text-xs font-semibold text-muted-foreground/60">{t("pos.customer_profile")}</h4>
                </div>
                <div className="space-y-1 ml-1">
                  <p className="text-sm font-bold text-foreground">{sale.customer?.name || t("pos.walk_in_customer")}</p>
                  <p className="text-xs text-muted-foreground/80 font-medium flex items-center gap-2">
                    {sale.customer?.phone || t("pos.no_contact")}
                  </p>
                  {sale.customer?.email && <p className="text-xs text-muted-foreground/80 font-medium">{sale.customer.email}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600/60" />
                  <h4 className="text-xs font-semibold text-muted-foreground/60">{t("pos.financial_routing")}</h4>
                </div>
                  <div className="space-y-2 ml-1">
                    {sale.payments && sale.payments.length > 0 ? (
                      sale.payments.map((pmt, i) => (
                        <div key={i} className="flex items-center justify-between bg-emerald-500/5 px-2.5 py-1.5 rounded-md border border-emerald-500/10">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            {t(`pos.${pmt.payment_method.toLowerCase()}`)}
                          </span>
                          <span className="text-xs font-black text-foreground">
                            {currency} {parseFloat(pmt.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <Badge variant="secondary" className="bg-emerald-500/5 text-emerald-700 border-emerald-500/10 font-bold text-xs px-2.5 rounded-md">
                          {t(`pos.${(sale.payment_method || 'CASH').toLowerCase()}`)}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 font-medium">{t("pos.processed_by")} {sale.cashier?.name || 'Main POS'}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* --- Items Table --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                  <h4 className="text-xs font-semibold text-muted-foreground/60">{t("pos.transaction_manifest")}</h4>
                </div>
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/10 text-xs font-bold px-2 py-0.5 rounded-full">
                  {sale.items?.length || 0} {t("pos.products")}
                </Badge>
              </div>

              <div className="rounded-md border border-border/40 overflow-hidden shadow-sm bg-background">
                <Table>
                  <TableHeader className="bg-muted/30 border-b border-border/40">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="h-8 text-xs font-semibold text-muted-foreground/60 px-6">{t("pos.product_col")}</TableHead>
                      <TableHead className="h-8 text-xs font-semibold text-muted-foreground/60 text-center w-20">{t("pos.qty_col")}</TableHead>
                      <TableHead className="h-8 text-xs font-semibold text-muted-foreground/60 text-right w-24">{t("pos.price_col")}</TableHead>
                      <TableHead className="h-8 text-xs font-semibold text-muted-foreground/60 text-right w-28 px-6">{t("pos.total_col")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.items?.map((item, idx) => (
                      <TableRow key={idx} className="border-border/40 group hover:bg-emerald-500/5 transition-colors">
                        <TableCell className="py-3 px-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground leading-tight transition-colors whitespace-normal break-words max-w-[200px] sm:max-w-[250px] inline-block">
                                {item.product?.name}
                              </span>
                              {(item.returned_quantity > 0 || item.quantity_returned > 0 || item.return_qty > 0) && (
                                <Badge variant="outline" className="bg-orange-500/5 text-orange-600 border-orange-500/20 text-[9px] font-black px-1.5 py-0 rounded-md">
                                  {t("pos.returned")}: {item.returned_quantity || item.quantity_returned || item.return_qty}
                                </Badge>
                              )}
                            </div>
                            {item.variant?.name && (
                              <div className="inline-flex">
                                <span className="text-[9px] font-bold text-emerald-600 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                  {item.variant.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-muted/60 text-foreground text-xs font-bold">
                            {parseFloat(item.quantity).toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right text-xs text-muted-foreground/60 font-bold tabular-nums">
                          {parseFloat(item.unit_price).toLocaleString()}
                        </TableCell>
                        <TableCell className="py-3 text-right px-6">
                          <span className="text-sm font-bold text-foreground tabular-nums transition-colors">
                            {(parseFloat(item.unit_price) * parseFloat(item.quantity)).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Financial Summary --- */}
            <div className="bg-emerald-500/5 rounded-md p-6 space-y-4 border border-emerald-500/10 shadow-sm shadow-emerald-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.05] -mr-4 -mt-4 transition-transform group-hover:scale-110">
                <CreditCard className="size-20 text-emerald-600" />
              </div>

              <div className="space-y-3 pb-4 border-b border-emerald-500/20 relative z-10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60 font-medium">{t("pos.shipment_total")}</span>
                  <span className="font-bold text-foreground tabular-nums">{currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60 font-medium">{t("pos.instant_reduction")}</span>
                  <span className="font-bold text-red-500 tabular-nums">- {currency} {discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground/60 font-medium">{t("pos.tax_assessment")}</span>
                  <span className="font-bold text-foreground tabular-nums">{currency} {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 relative z-10">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-emerald-600/60">{t("pos.net_payable")}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-emerald-600/40">{currency}</span>
                    <span className="text-2xl font-black text-foreground tabular-nums">{payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h3 className="text-xs font-semibold text-emerald-600/60">{t("pos.liquid_receipt")}</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-sm font-black px-4 py-1 rounded-md shadow-sm">
                    {currency} {paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              </div>

              {balance > 0 && (
                <div className="pt-4 border-t border-emerald-500/20 flex justify-between items-center relative z-10">
                  <span className="text-xs font-semibold text-muted-foreground/60 leading-none">{t("pos.relocation_change")}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-emerald-600/40">{currency}</span>
                    <span className="text-base font-black text-emerald-600 tabular-nums">{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* --- Sticky Footer --- */}
        <SheetFooter className="px-8 py-5 border-t border-border bg-background flex flex-row items-center justify-end gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto font-semibold"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2 h-4 w-4" />
            {t("pos.close_details")}
          </Button>
          <Button
            className="w-full sm:w-auto min-w-[140px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => onReprint(sale)}
          >
            <Printer className="mr-2 h-4 w-4" />
            {t("pos.reprint_receipt")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SaleDetailSheet;
