"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { safeMergeSettings } from "@/lib/settings-utils";

export default function SalesReturnDialog({ open, onOpenChange, sale, onSuccess }) {
  const { data: session } = useSession();
  const [returnItems, setReturnItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const { useModularSettings } = useSettings();
  const { data: posSettingsResponse } = useModularSettings("pos");

  useEffect(() => {
    if (sale && sale.items) {
      setReturnItems(
        sale.items.map((item) => ({
          ...item,
          return_qty: 0,
          selected: false,
          reason: "",
        }))
      );
      setRefundAmount(0);
      setNotes("");
    }
  }, [sale]);

  const handleCheckboxChange = (id) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newSelected = !item.selected;
          return {
            ...item,
            selected: newSelected,
            return_qty: newSelected ? item.quantity : 0,
          };
        }
        return item;
      })
    );
  };

  const handleQtyChange = (id, val) => {
    const qty = parseFloat(val) || 0;
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          // Calculate remaining balance
          const alreadyReturned = parseFloat(item.returned_quantity || item.quantity_returned || item.return_qty || 0);
          const maxAllowed = parseFloat(item.quantity) - alreadyReturned;
          
          const finalQty = Math.max(0, Math.min(qty, maxAllowed));
          return { ...item, return_qty: finalQty, selected: finalQty > 0 };
        }
        return item;
      })
    );
  };

  // Calculate suggested refund (total of selected items)
  const totalReturnVal = returnItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.return_qty * (parseFloat(item.unit_price) || parseFloat(item.price)), 0);

  useEffect(() => {
    setRefundAmount(totalReturnVal);
  }, [totalReturnVal]);

  const handleSubmit = async () => {
    const itemsToReturn = returnItems.filter((item) => item.selected && item.return_qty > 0);
    if (itemsToReturn.length === 0) {
      toast.error(t("pos.select_item_error"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken || session?.accessToken}`,
        },
        body: JSON.stringify({
          sale_id: sale.id,
          items: itemsToReturn.map((item) => ({
            product_id: item.product_id,
            product_variant_id: item.product_variant_id,
            quantity: item.return_qty,
            reason: item.reason,
          })),
          refund_amount: refundAmount,
          refund_method: refundMethod,
          notes,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success(t("pos.return_success_msg"));
        onSuccess?.();
        onOpenChange(false);
      } else {
        throw new Error(result.message || t("pos.return_failed_msg"));
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            {t("pos.process_sales_return")}
          </DialogTitle>
          <DialogDescription>
            {t("pos.original_invoice")}: <span className="font-mono font-bold text-foreground">{sale.invoice_number}</span> | {t("pos.customer")}: {sale.customer?.name || t("pos.walk_in")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t("pos.product_col")}</TableHead>
                <TableHead className="text-center">{t("pos.purchased")}</TableHead>
                <TableHead className="text-center w-32">{t("pos.return_qty")}</TableHead>
                <TableHead className="text-right">{t("pos.price_col")}</TableHead>
                <TableHead className="text-right">{t("pos.total_col")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnItems.map((item) => (
                <TableRow key={item.id} className={item.selected ? "bg-orange-50/30" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleCheckboxChange(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.product?.name}</div>
                    {item.variant?.name && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-bold">{parseFloat(item.quantity).toFixed(0)}</div>
                    {(parseFloat(item.returned_quantity || item.quantity_returned || 0) > 0) && (
                      <div className="text-[10px] text-orange-600 font-bold bg-orange-50 rounded px-1 mt-1">
                        -{parseFloat(item.returned_quantity || item.quantity_returned || 0)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      size="sm"
                      className="h-8 text-center"
                      value={item.return_qty}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                      disabled={!item.selected}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {(parseFloat(item.unit_price) || parseFloat(item.price)).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {(item.return_qty * (parseFloat(item.unit_price) || parseFloat(item.price))).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("pos.notes_reason")}</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border border-border/50 text-sm"
                  placeholder={t("pos.notes_placeholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">{t("pos.total_return_value")}</span>
                <span className="text-lg font-bold">LKR {totalReturnVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="space-y-2">
                <Label>{t("pos.refund_amount_label")}</Label>
                <Input
                  type="number"
                  className="text-lg font-bold"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                />
                <p className="text-[10px] text-muted-foreground">
                  {refundAmount < totalReturnVal ? 
                    t("pos.partial_refund_notice") : 
                    t("pos.full_refund_notice")}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t("pos.refund_method")}</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger className="h-9 w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-[13px] font-bold text-slate-900 dark:text-white transition-all shadow-none">
                    <SelectValue placeholder={t("pos.select_method")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {(safeMergeSettings({}, posSettingsResponse?.data)?.activePaymentMethods || ["cash"]).map((methodId) => {
                      const labels = {
                        cash: t("pos.cash") || "Cash",
                        card: "Card Terminal",
                        online: "Online Transfer",
                        qr: "QR Payment",
                        wallet: "Digital Wallet",
                        cheque: "Cheque Basis"
                      };
                      return (
                        <SelectItem key={methodId} value={methodId} className="text-xs font-medium">
                          {labels[methodId] || methodId}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="store_credit" className="text-xs font-medium">{t("pos.store_credit") || "Store Credit"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t items-center shadow-inner">
           <div className="flex-1 text-sm text-muted-foreground flex items-center gap-2">
             <AlertTriangle className="h-4 w-4 text-orange-500" />
             {t("pos.restoring_items").replace("{count}", returnItems.filter(i=>i.selected).length)}
           </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("pos.cancel")}
          </Button>
          <Button 
            className="bg-orange-600 hover:bg-orange-700 font-bold px-8"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            {t("pos.confirm_return")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
