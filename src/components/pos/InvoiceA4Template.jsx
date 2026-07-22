import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "@/lib/date-utils";
import { useTranslation } from "@/hooks/useTranslation";
import { QRCodeSVG } from 'qrcode.react';

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

  const businessLogo = getLogoUrl(business?.logo);
  const businessName = business?.name || "Inzeedo Manufacturing";
  const businessAddress = branch?.address || business?.address || "";
  const businessPhone = branch?.phone || business?.phone || "";
  const businessEmail = branch?.email || business?.email || "";
  const taxId = business?.tax_id || "";

  const qrData = JSON.stringify({
    invoice: sale.invoice_number || "Draft",
    date: sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    total: (sale.payable_amount || sale.net_total || 0).toString()
  });

  return (
    <div
      ref={ref}
      className="bg-white text-black p-8 font-sans text-xs leading-relaxed w-[210mm] min-h-[297mm] mx-auto print:p-0 flex flex-col"
      style={{ colorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <style type="text/css" media="print">{`@page { size: A4; margin: 8mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } } * { font-family: Arial, Helvetica, sans-serif !important; }`}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
        <div className="text-left">
          {showLogo && businessLogo && (
            <img src={businessLogo} alt="Logo" className="h-12 object-contain mb-4" style={{ filter: "grayscale(100%) contrast(150%)" }} />
          )}
          <h1 className="text-2xl font-black text-black m-0 tracking-tight uppercase">{businessName}</h1>

          {businessAddress && (
            <div className="mt-2 flex items-start gap-1.5 text-gray-800 font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{businessAddress}</span>
            </div>
          )}
          {businessPhone && (
            <div className="mt-1 flex items-center gap-1.5 text-gray-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>{businessPhone}</span>
            </div>
          )}
          {businessEmail && (
            <div className="mt-0.5 flex items-center gap-1.5 text-gray-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>{businessEmail}</span>
            </div>
          )}
          {taxId && (
            <div className="mt-0.5 flex items-center gap-1.5 text-gray-700 font-bold">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>VAT/TIN: {taxId}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black text-black tracking-tighter m-0 uppercase border-b-2 border-black inline-block pb-1">INVOICE</h2>
          <div className="mt-4 flex flex-col gap-1 text-right items-end">
            <div className="flex gap-2 justify-end w-full">
              <span className="text-black font-bold w-20">INV NO:</span>
              <span className="text-black font-normal">{sale.invoice_number || 'DRAFT'}</span>
            </div>
            <div className="flex gap-2 justify-end w-full">
              <span className="text-black font-bold w-20">DATE:</span>
              <span className="text-black font-normal">{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distributor details */}
      <div className="mb-8">
        <h3 className="text-[10px] font-black text-white bg-black uppercase tracking-widest mb-3 py-1.5 px-3 inline-block rounded-sm">Billed To</h3>
        {showCustomer && (sale.customer || sale.distributor) ? (
          <div>
            <p className="text-lg font-black text-black m-0">{sale.customer?.name || sale.distributor?.name}</p>
            {(sale.customer?.phone || sale.distributor?.phone) && <p className="mt-1 m-0 text-black font-bold text-sm">P: {sale.customer?.phone || sale.distributor?.phone}</p>}
            {(sale.customer?.email || sale.distributor?.email) && <p className="mt-0.5 m-0 text-black font-bold text-sm">E: {sale.customer?.email || sale.distributor?.email}</p>}
            {(sale.customer?.address || sale.distributor?.address) && <p className="mt-2 m-0 text-gray-800 font-medium max-w-xs">{sale.customer?.address || sale.distributor?.address}</p>}
          </div>
        ) : (
          <p className="m-0 font-bold text-gray-500">Walk-in / No Distributor Selected</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-left">
              <th className="px-3 py-2 text-white font-black text-[11px] uppercase">#</th>
              <th className="px-3 py-2 text-white font-black text-[11px] uppercase w-1/2">Item Description</th>
              <th className="px-3 py-2 text-white font-black text-[11px] uppercase text-center">Qty</th>
              <th className="px-3 py-2 text-white font-black text-[11px] uppercase text-right">Unit Price</th>
              <th className="px-3 py-2 text-white font-black text-[11px] uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300 border-b-2 border-black">
            {(sale.items || sale.sale_items || []).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-black font-normal">{idx + 1}</td>
                <td className="px-3 py-2">
                  <span className="text-black text-sm font-normal">
                    {item.product_name || item.product?.name || item.name || 'Item'}
                  </span>
                  {(item.product_variant?.name || item.variant_name) && (
                    <span className="block text-[9px] text-gray-600 mt-0.5">{item.product_variant?.name || item.variant_name}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center font-normal text-black">{Number(item.quantity)}</td>
                <td className="px-3 py-2 text-right text-black font-normal">{parseFloat(item.unit_price || item.price || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right font-normal text-black">{parseFloat((item.unit_price || item.price || 0) * item.quantity).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer/Totals */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
        <div className="w-full sm:w-1/3 text-center sm:text-left">
          {/* <div className="inline-block p-2 border-2 border-black bg-white mb-2">
            <QRCodeSVG value={qrData} size={70} level="M" fgColor="#000000" />
          </div>
          <p className="text-[10px] text-black font-bold max-w-[150px] sm:mx-0 mx-auto text-center uppercase tracking-wider">Scan to Verify Authenticity</p> */}
        </div>

        <div className="w-full sm:w-2/3 max-w-sm ml-auto">
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-black">
              <span className="font-bold">Subtotal</span>
              <span className="font-bold">{parseFloat(sale.total_amount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
            </div>
            {showDiscount && parseFloat(sale.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-black">
                <span className="font-bold">Discount</span>
                <span className="font-bold">- {parseFloat(sale.discount_amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {showTax && parseFloat(sale.tax_amount || 0) > 0 && (
              <div className="flex justify-between text-black">
                <span className="font-bold">VAT / Tax</span>
                <span className="font-bold">{parseFloat(sale.tax_amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {parseFloat(sale.adjustment || 0) !== 0 && (
              <div className="flex justify-between text-black">
                <span className="font-bold">Adjustment</span>
                <span className="font-bold">{parseFloat(sale.adjustment).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xl font-black text-white bg-black p-4 mt-4 mb-6 rounded-sm">
            <span className="uppercase">Total Payable</span>
            <span>{parseFloat(sale.payable_amount || sale.net_total || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs font-black text-black mb-2 uppercase">
              <span>Amount Paid ({sale.payments?.[0]?.payment_method || sale.payment_method || 'CASH'})</span>
              <span>{parseFloat(sale.paid_amount || sale.payable_amount || sale.net_total || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
            </div>
            {parseFloat(sale.paid_amount || 0) > parseFloat(sale.payable_amount || sale.net_total || 0) && (
              <div className="flex justify-between text-xs font-black text-black uppercase border-t border-dashed border-gray-400 pt-2">
                <span>Change Due</span>
                <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount || sale.net_total || 0)).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8">
        <div className="border-t-2 border-black flex justify-between items-end pt-8">
          <div className="text-left text-black max-w-lg">
            {refundPolicy && (
              <div className="mb-4">
                <strong className="text-[10px] border-b border-black pb-1 mb-2 inline-block font-bold">Terms &amp; Conditions</strong>
                <p className="mt-2 text-[10px] font-medium leading-relaxed">{refundPolicy}</p>
              </div>
            )}
            {showFooter && footerText ? <p className="mb-0 font-medium text-[10px]">{footerText}</p> : <p className="mb-0 font-black uppercase text-lg tracking-tight">Thank you for your business.</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-black border-t border-black pt-2 inline-block">Authorized Signature</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 pb-4 text-center text-[9px] font-bold text-gray-500 uppercase w-full print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white print:pb-2">
        Generated by Inzeedo ERP System &bull; 2026
      </div>
    </div>
  );
});

InvoiceA4Template.displayName = "InvoiceA4Template";
