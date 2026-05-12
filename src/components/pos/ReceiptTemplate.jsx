import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { QRCodeSVG } from "qrcode.react";

export const ReceiptTemplate = forwardRef(({ sale, settings, business, branch, terminalName }, ref) => {
  if (!sale) return null;
  const { t } = useTranslation();

  const {
    paperWidth = "80mm",
    fontSize = "medium",
    fontFamily = "mono",
    showLogo = true,
    showHeader = false,
    showFooter = true,
    headerText = "",
    footerText = "",
    refundPolicy = "",
    showTax = true,
    showDiscount = true,
    showUser = true,
    showCustomer = true,
  } = settings || {};

  const paperWidthClass = paperWidth === "58mm" ? "w-[58mm]" : paperWidth === "80mm" ? "w-[80mm]" : "w-[210mm]";

  const fontConfig = {
    family: fontFamily === "sans" ? "font-sans" : fontFamily === "serif" ? "font-serif" : "font-mono",
    size: fontSize === "xsmall" ? "text-[9px]" :
      fontSize === "small" ? "text-[10px]" :
        fontSize === "large" ? "text-sm" :
          fontSize === "xlarge" ? "text-base" :
            "text-xs" // medium
  };

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
    return `${baseUrl}/${logoPath}`;
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-white text-black p-4 print:p-0 mx-auto transition-all",
        paperWidthClass,
        fontConfig.family,
        fontConfig.size
      )}
    >
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        {showLogo && business?.logo && (
          <img
            src={getLogoUrl(business.logo)}
            alt="Business Logo"
            className="w-16 h-16 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-lg font-black">{business?.name || "Inzeedo POS"}</h1>
        <div className="leading-tight opacity-80">
          <p>{business?.address || branch?.address}</p>
          <p>{t("pos.tel_label")}: {business?.phone || branch?.phone}</p>
          {business?.tax_id && <p>{t("pos.vat_label")}: {business.tax_id}</p>}
        </div>
        {showHeader && headerText && headerText !== "Sale Invoice" && (
          <p className="mt-2 font-bold border-t border-black pt-1">{headerText}</p>
        )}
      </div>

      <div className="border-y border-dashed border-black py-2 my-2 space-y-0.5">
        <div className="flex justify-between">
          <span>{t("pos.invoice_label")}:</span>
          <span className="font-bold">{sale.invoice_number || "Draft"}</span>
        </div>
        {(settings.showDateTime ?? true) && (
          <div className="flex justify-between">
            <span>{t("pos.date_label")}:</span>
            <span>{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd HH:mm") : format(new Date(), "yyyy-MM-dd HH:mm")}</span>
          </div>
        )}
        {(settings.showSalesType ?? true) && (
          <div className="text-center font-bold text-[10px] my-1 border-b border-dashed border-black/30 pb-0.5">
            {sale.is_wholesale ? t("pos.wholesale_label") : t("pos.retail_label")} {t("pos.sale").toUpperCase()}
          </div>
        )}
        {showCustomer && sale.customer && (
          <div className="flex justify-between">
            <span>{t("pos.customer_label")}:</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
        {showUser && sale.sellers && sale.sellers.length > 0 && (
          <div className="flex justify-between">
            <span>{t("pos.user_label")}:</span>
            <span>{sale.sellers.map(s => s.name).join(", ")}</span>
          </div>
        )}
        {/* Terminal ID Trail */}
        {terminalName && (
          <div className="flex justify-between border-t border-dashed border-black/10 mt-1 pt-0.5 text-[9px] opacity-60">
            <span>{t("pos.terminal_label")}:</span>
            <span>{terminalName.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Items Table --- remains unchanged --- */}
      <table className="w-full my-4 border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">{t("pos.item_qty_label")}</th>
            <th className="text-right py-1">{t("pos.price_col")}</th>
            {showTax && <th className="text-right py-1">{t("pos.tax_col")}</th>}
            {showDiscount && <th className="text-right py-1">{t("pos.disc_col")}</th>}
            <th className="text-right py-1">{t("pos.total_col")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dashed divide-black/20">
          {sale.items?.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-2 pr-2">
                <div className="leading-tight">
                  <span className="font-bold">
                    {item.product_name || 
                     item.product_variant?.product?.name || 
                     item.product?.name || 
                     item.name || 
                     t("pos.item")}
                  </span>
                  <span className="font-normal opacity-70 ml-1 whitespace-nowrap">
                    (x{parseFloat(item.quantity || 0)})
                  </span>
                </div>
                {(item.product_variant?.name || item.variant_name) && (
                  <div className="text-[10px] opacity-70">{item.product_variant?.name || item.variant_name}</div>
                )}
                {item.mrp_price > item.unit_price && (
                  <div className="text-[9px] text-gray-500 italic">
                    MRP: {parseFloat(item.mrp_price).toLocaleString()} (Save: {parseFloat(item.mrp_price - item.unit_price).toLocaleString()})
                  </div>
                )}
              </td>
              <td className="text-right py-2 whitespace-nowrap">{parseFloat(item.unit_price || item.price || 0).toLocaleString()}</td>
              {showTax && (
                <td className="text-right py-2 text-[10px] whitespace-nowrap">
                  {parseFloat(item.tax_amount || 0).toLocaleString()}
                </td>
              )}
              {showDiscount && (
                <td className="text-right py-2 text-[10px] whitespace-nowrap">
                  {(item.discount_amount || item.discount || item.discount_percentage) ? (
                    <span>
                      {parseFloat(item.discount_amount || 0).toLocaleString()}
                    </span>
                  ) : "-"}
                </td>
              )}
              <td className="text-right py-2 font-bold whitespace-nowrap">{parseFloat(item.total_amount || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals remains unchanged --- */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>SUB TOTAL:</span>
          <span>{parseFloat(sale.total_amount).toLocaleString()}</span>
        </div>
        {showDiscount && parseFloat(sale.discount_amount) > 0 && (
          <div className="flex justify-between text-[10px] text-green-700 border-b border-dashed border-black/20 pb-1 mb-1">
            <span>{t("pos.your_total_discount_is")}</span>
            <span>{parseFloat(sale.discount_amount).toLocaleString()}</span>
          </div>
        )}
        {(() => {
          const totalMrpSavings = sale.items?.reduce((sum, item) => {
            if (item.mrp_price > item.unit_price) {
              return sum + (item.mrp_price - item.unit_price) * item.quantity;
            }
            return sum;
          }, 0);
          if (totalMrpSavings > 0) {
            return (
              <div className="flex justify-between text-[10px] font-bold text-gray-600 border-b border-dashed border-black/20 pb-1 mb-1">
                <span>YOU SAVED (MRP):</span>
                <span>{totalMrpSavings.toLocaleString()}</span>
              </div>
            );
          }
          return null;
        })()}
        {showTax && parseFloat(sale.tax_amount || 0) > 0 && (
          <div className="flex justify-between">
            <span>TAX:</span>
            <span>{parseFloat(sale.tax_amount).toLocaleString()}</span>
          </div>
        )}
        {parseFloat(sale.adjustment || 0) !== 0 && (
          <div className="flex justify-between">
            <span>ADJUSTMENT:</span>
            <span>{parseFloat(sale.adjustment).toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-[14px] font-black border-t-2 border-black pt-1 mt-1">
          <span>{t("pos.grand_total")}:</span>
          <span>{parseFloat(sale.payable_amount || sale.net_total).toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-black pt-2 space-y-1">
        {sale.payments && sale.payments.length > 0 ? (
          sale.payments.map((pmt, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="uppercase">{t(`pos.${pmt.payment_method.toLowerCase()}`)}:</span>
              <span className="font-bold">{parseFloat(pmt.amount).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between text-[11px]">
            <span className="uppercase">{sale.payment_method || "CASH"} {t("pos.paid").toUpperCase()}:</span>
            <span className="font-bold">{parseFloat(sale.paid_amount || sale.payable_amount).toLocaleString()}</span>
          </div>
        )}
        
        {parseFloat(sale.paid_amount) > parseFloat(sale.payable_amount) && (
          <div className="flex justify-between font-bold border-t border-black/10 mt-1 pt-1">
            <span>{t("pos.change_label")}:</span>
            <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* QR Code Section */}
      <div className="mt-4 flex flex-col items-center justify-center space-y-1">
        <QRCodeSVG
          value={JSON.stringify({
            invoice: sale.invoice_number || "Draft",
            date: sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            total: (sale.payable_amount || sale.net_total || 0).toString()
          })}
          size={80}
          level={"L"}
          includeMargin={false}
          imageSettings={{
            src: business?.logo ? getLogoUrl(business.logo) : "",
            x: undefined,
            y: undefined,
            height: 15,
            width: 15,
            excavate: true,
          }}
        />
        <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest">{t("pos.scan_for_verification")}</p>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center space-y-2 border-t border-dashed border-black/20 pt-2">
        {refundPolicy && (
          <div className="border-b border-dashed border-black/10 pb-2 mb-2 text-[9px] leading-tight">
            <span className="font-bold block mb-1">{t("pos.refund_return_policy_label")}</span>
            {refundPolicy}
          </div>
        )}
        {showFooter && footerText && (
          <div className="whitespace-pre-wrap leading-tight text-[10px] mb-2">{footerText}</div>
        )}
        <div className="opacity-40 leading-tight">
          <p className="font-bold text-[8px] whitespace-nowrap">A next-generation enterprise solution by Inzeedo</p>
          <p className="text-[7px]">© 2026 Inzeedo. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";

export default ReceiptTemplate;
