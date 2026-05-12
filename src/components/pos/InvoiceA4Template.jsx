import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import Barcode from "react-barcode";

export const InvoiceA4Template = forwardRef(({ sale, settings, business, branch, terminalName }, ref) => {
  if (!sale) return null;
  const { t } = useTranslation();

  const {
    showLogo = true,
    showFooter = true,
    footerText = "",
    refundPolicy = "",
    showTax = true,
    showDiscount = true,
    showUser = true,
    showCustomer = true,
  } = settings || {};

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace("/api/v1", "");
    return `${baseUrl}/${logoPath}`;
  };

  const totals = {
    subtotal: parseFloat(sale.total_amount || 0),
    discount: parseFloat(sale.discount_amount || 0),
    tax: parseFloat(sale.tax_amount || 0),
    adjustment: parseFloat(sale.adjustment || 0),
    payable: parseFloat(sale.payable_amount || sale.net_total || 0),
    paid: parseFloat(sale.paid_amount || 0)
  };

  return (
    <div
      ref={ref}
      className="bg-white text-slate-900 p-8 w-[210mm] max-w-full min-h-[297mm] mx-auto font-sans print:p-8"
      style={{ colorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-8">
        <div className="space-y-4">
          {showLogo && business?.logo && (
            <img
              src={getLogoUrl(business.logo)}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-black text-emerald-700 uppercase tracking-tight">
              {business?.name || "Business Invoice"}
            </h1>
            <div className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
              <p className="font-bold text-slate-700">{branch?.name || "Main Branch"}</p>
              <p>{business?.address || branch?.address}</p>
              <p>{t("pos.tel_label")}: {business?.phone || branch?.phone}</p>
              {business?.tax_id && <p className="font-bold">{t("pos.vat_label")}: {business.tax_id}</p>}
            </div>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-bl-xl inline-block mb-4">
            <h2 className="text-xl font-bold uppercase tracking-widest">Tax Invoice</h2>
          </div>
          <div className="text-[11px]">
            <p className="text-slate-400 uppercase font-bold text-[9px] tracking-widest">{t("pos.invoice_label")}</p>
            <p className="text-lg font-black text-slate-900">#{sale.invoice_number || "DRAFT"}</p>
          </div>
          <div className="text-[11px] pt-2">
            <p className="text-slate-400 uppercase font-bold text-[9px] tracking-widest">{t("pos.date_label")}</p>
            <p className="font-bold">{sale.created_at ? format(new Date(sale.created_at), "PPP p") : format(new Date(), "PPP p")}</p>
          </div>
        </div>
      </div>

      {/* Bill To / Details Row */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-3 border-b border-emerald-100 pb-1">Bill To</h3>
          {showCustomer && (sale.customer || sale.distributor) ? (
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{sale.customer?.name || sale.distributor?.name}</p>
              <p className="text-[11px] text-slate-500">{sale.customer?.address || sale.distributor?.address}</p>
              <p className="text-[11px] text-slate-500">{sale.customer?.phone || sale.distributor?.phone}</p>
              {(sale.customer?.email || sale.distributor?.email) && (
                <p className="text-[11px] text-slate-400">{sale.customer?.email || sale.distributor?.email}</p>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-400 italic">Walk-in Customer</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-3 border-b border-emerald-100 pb-1">Payment</h3>
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-slate-700 uppercase">
                {sale.payment_method || (sale.payments?.[0]?.payment_method) || "N/A"}
              </p>
              <p className={cn(
                "inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase",
                sale.payment_status === 'paid' || sale.paid_amount >= sale.payable_amount 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-amber-100 text-amber-700"
              )}>
                {sale.payment_status || (sale.paid_amount >= sale.payable_amount ? 'paid' : 'partial')}
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-3 border-b border-emerald-100 pb-1">Sale Info</h3>
            <div className="space-y-1 text-[11px]">
              <p className="font-bold text-slate-700 uppercase">
                {sale.is_wholesale ? "Wholesale B2B" : "Direct Retail"}
              </p>
              {showUser && sale.sellers && (
                <p className="text-slate-500">Rep: {sale.sellers.map(s => s.name).join(", ")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 overflow-hidden rounded-t-xl">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
            <th className="py-4 px-4 text-left">#</th>
            <th className="py-4 px-4 text-left">Description</th>
            <th className="py-4 px-4 text-center">Qty</th>
            <th className="py-4 px-4 text-right">Unit Price</th>
            {showDiscount && <th className="py-4 px-4 text-right">Disc</th>}
            {showTax && <th className="py-4 px-4 text-right">Tax</th>}
            <th className="py-4 px-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="text-[11px] divide-y divide-slate-100">
          {sale.items?.map((item, idx) => (
            <tr key={idx} className={cn(idx % 2 === 1 ? "bg-slate-50/30" : "bg-white")}>
              <td className="py-4 px-4 text-slate-400 font-bold">{idx + 1}</td>
              <td className="py-4 px-4">
                <p className="font-black text-slate-800 uppercase leading-none mb-1">
                  {item.product_name || item.product?.name || item.name}
                </p>
                {(item.product_variant?.name || item.variant_name) && (
                  <p className="text-[9px] text-emerald-600 font-bold">{item.product_variant?.name || item.variant_name}</p>
                )}
                {item.product?.code && <p className="text-[9px] text-slate-400 mt-0.5">SKU: {item.product.code}</p>}
              </td>
              <td className="py-4 px-4 text-center font-bold">
                {parseFloat(item.quantity || 0).toLocaleString()}
                <span className="text-[9px] text-slate-400 ml-1">{item.unit || ""}</span>
              </td>
              <td className="py-4 px-4 text-right">{parseFloat(item.unit_price || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              {showDiscount && (
                <td className="py-4 px-4 text-right text-red-500 font-medium">
                  {parseFloat(item.discount_amount || 0) > 0 ? `-${parseFloat(item.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                </td>
              )}
              {showTax && (
                <td className="py-4 px-4 text-right text-slate-500">
                  {parseFloat(item.tax_amount || 0) > 0 ? parseFloat(item.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                </td>
              )}
              <td className="py-4 px-4 text-right font-black text-slate-900">
                {parseFloat(item.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Section */}
      <div className="flex justify-end mb-12">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-[11px] px-2">
            <span className="text-slate-500 font-bold uppercase tracking-widest">Sub Total</span>
            <span className="font-bold text-slate-900">{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {showDiscount && totals.discount > 0 && (
            <div className="flex justify-between text-[11px] px-2 text-red-500">
              <span className="font-bold uppercase tracking-widest">Total Savings</span>
              <span className="font-bold">-{totals.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {showTax && totals.tax > 0 && (
            <div className="flex justify-between text-[11px] px-2">
              <span className="text-slate-500 font-bold uppercase tracking-widest">Total Tax</span>
              <span className="font-bold text-slate-900">{totals.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {totals.adjustment !== 0 && (
            <div className="flex justify-between text-[11px] px-2">
              <span className="text-slate-500 font-bold uppercase tracking-widest">Adjustment</span>
              <span className="font-bold text-slate-900">{totals.adjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          
          <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-lg shadow-emerald-600/20">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Grand Total</span>
              <span className="text-xl font-black">{totals.payable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[8px] text-emerald-100 font-bold uppercase mt-1 text-right">LKR Currency Units</p>
          </div>

          <div className="pt-2 px-2 space-y-1">
             <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase">Paid Amount</span>
                <span className="text-slate-700">{totals.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             {totals.paid < totals.payable && (
                <div className="flex justify-between text-[10px] font-black text-amber-600 border-t border-amber-100 pt-1">
                  <span className="uppercase">Balance Due</span>
                  <span>{(totals.payable - totals.paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
             )}
          </div>

          <div className="mt-6 flex justify-center pt-4 border-t border-slate-100">
             <Barcode 
               value={sale.invoice_number || "000000"} 
               width={1.2} 
               height={40} 
               fontSize={10}
               margin={0}
             />
          </div>
        </div>
      </div>

      {/* Terms and Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-auto pt-12 border-t border-slate-100">
        <div>
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Notes & Policies</h4>
          <div className="text-[10px] text-slate-500 leading-relaxed space-y-3">
             {refundPolicy && (
               <div>
                 <p className="font-bold text-slate-700 mb-0.5 underline decoration-emerald-500/30">Standard Policy:</p>
                 <p>{refundPolicy}</p>
               </div>
             )}
             {showFooter && footerText && (
               <div className="whitespace-pre-wrap italic bg-slate-50 p-2 rounded border-l-2 border-slate-200">
                 {footerText}
               </div>
             )}
          </div>
        </div>

        <div className="flex flex-col justify-end space-y-8">
          <div className="flex justify-between gap-8">
             <div className="flex-1 text-center">
                <div className="h-16 border-b border-slate-200 mb-2"></div>
                <p className="text-[9px] font-black uppercase text-slate-400">Customer Signature</p>
             </div>
             <div className="flex-1 text-center">
                <div className="h-16 border-b border-emerald-200 mb-2 flex items-center justify-center">
                   <p className="text-[8px] font-serif italic text-emerald-800 opacity-20 select-none">Authorized Signatory</p>
                </div>
                <p className="text-[9px] font-black uppercase text-emerald-600">Issued By {business?.name}</p>
             </div>
          </div>
          <div className="text-center opacity-40">
             <p className="text-[8px] font-black tracking-widest uppercase mb-1">Generated by Inzeedo Enterprise POS</p>
             <p className="text-[7px]">This is a computer generated document. No signature required for validation.</p>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceA4Template.displayName = "InvoiceA4Template";
