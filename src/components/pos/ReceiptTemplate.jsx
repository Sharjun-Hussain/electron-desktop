import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";

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
    family: "font-mono",
    fontFamilyStyle: "monospace",
    size: fontSize === "xsmall" ? "text-[10px]" :
      fontSize === "small" ? "text-[10px]" :
        fontSize === "large" ? "text-sm" :
          fontSize === "xlarge" ? "text-base" :
            "text-[10px]" // medium/default
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
        "bg-white text-black p-4 print:py-0 print:px-3 mx-auto transition-all uppercase",
        paperWidthClass,
        fontConfig.family,
        fontConfig.size
      )}
      style={{ fontFamily: fontConfig.fontFamilyStyle }}
    >
      <style type="text/css" media="print">{`@page { margin: 0; } * { font-family: ${fontConfig.fontFamilyStyle} !important; }`}</style>
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        {sale.source === 'ecommerce' && (
          <div className="border-2 border-black py-1 px-2 font-black text-xs uppercase tracking-widest text-center my-1 bg-black text-white">
            *** {t("pos.ecommerce_order") || "E-COMMERCE ORDER"} ***
          </div>
        )}
        {showLogo && business?.logo && (
          <img
            src={getLogoUrl(business.logo)}
            alt="Business Logo"
            className="w-16 h-16 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-lg font-black">{business?.name || "Inzeedo POS"}</h1>
        <div className="leading-tight text-black font-bold">
          <p>{business?.address || branch?.address}</p>
          <p>{t("pos.tel_label")}: {business?.phone || branch?.phone}</p>
          {business?.tax_id && <p>{t("pos.vat_label")}: {business.tax_id}</p>}
        </div>
        {showHeader && headerText && headerText !== "Sale Invoice" && (
          <p className="mt-2 font-bold border-t border-black pt-1">{headerText}</p>
        )}
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2 space-y-0.5">
        {sale.source === 'ecommerce' && (
          <div className="text-center font-black border border-black py-0.5 text-[10px] my-1 uppercase">
            {t("pos.online_checkout") || "ONLINE CHECKOUT"}
          </div>
        )}
        <div className="flex justify-between">
          <span>{t("pos.invoice_label")}:</span>
          <span className="">{sale.invoice_number || "Draft"}</span>
        </div>
        {(settings.showDateTime ?? true) && (
          <div className="flex justify-between">
            <span>{t("pos.date_label")}:</span>
            <span>{sale.created_at ? format(new Date(sale.created_at), "yyyy-MM-dd HH:mm") : format(new Date(), "yyyy-MM-dd HH:mm")}</span>
          </div>
        )}
        {(settings.showSalesType ?? true) && (
          <div className="text-center font-bold text-[10px] my-1 border-b border-dashed border-black pb-0.5">
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
          <div className="flex justify-between border-t border-dashed border-black mt-1 pt-0.5 text-[10px]">
            <span>{t("pos.terminal_label")}:</span>
            <span>{terminalName.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Items List */}
      <table className="w-full my-4 border-collapse">
        <thead>
          <tr className="border-b border-black font-bold">
            <th className="text-left py-1 pr-1 whitespace-nowrap"># DESCRIPTION</th>
            <th className="text-center py-1 px-1 whitespace-nowrap">QTY</th>
            <th className="text-right py-1 px-1 whitespace-nowrap">PRICE</th>
            <th className="text-right py-1 pl-1 whitespace-nowrap">AMOUNT</th>
          </tr>
        </thead>
        {sale.items?.map((item, idx) => {
          const qty = parseFloat(item.quantity || 0);
          const unitPrice = parseFloat(item.unit_price || item.price || 0);
          const lineTotalBeforeDiscount = unitPrice * qty;
          // Use manual_discount if available (to ignore apportioned global discounts), fallback to discount_amount for legacy receipts
          const itemDiscount = item.manual_discount !== undefined ? parseFloat(item.manual_discount) : parseFloat(item.discount_amount || 0);
          const itemTax = parseFloat(item.tax_amount || 0);
          const hasDiscount = itemDiscount > 0 || parseFloat(item.discount || 0) > 0 || parseFloat(item.discount_percentage || 0) > 0;

          return (
            <tbody key={idx} className="border-b border-dashed border-black last:border-b-0">
              {/* Line 1: Index, Name, Variant */}
              <tr>
                <td colSpan={4} className="pt-2 pb-0.5 pr-2 leading-tight">
                  <span className="mr-1">{idx + 1}</span>
                  <span>
                    {item.product_name ||
                      item.product_variant?.product?.name ||
                      item.product?.name ||
                      item.name ||
                      t("pos.item")}
                  </span>
                  {(item.product_variant?.name || item.variant_name) ? (
                    <span className="ml-1">#{item.product_variant?.name || item.variant_name}</span>
                  ) : null}
                  {/* Line 2: SKU / Barcode */}
                  {(item.product?.code || item.product_variant?.sku) && (
                    <div className="pl-4">
                      {item.product?.code || item.product_variant?.sku}
                    </div>
                  )}
                </td>
              </tr>

              {/* Line 3: Qty x Price   Amount */}
              <tr>
                <td></td>
                <td className="text-center whitespace-nowrap pb-2">{qty.toLocaleString()} x</td>
                <td className="text-right px-1 whitespace-nowrap pb-2">{unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="text-right pl-1 whitespace-nowrap pb-2">{lineTotalBeforeDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>

              {/* Optional: Discount */}
              {showDiscount && hasDiscount && itemDiscount > 0 && (
                <tr>
                  <td colSpan={3} className="text-left pb-2 whitespace-nowrap normal-case">*Line Discount</td>
                  <td className="text-right pl-1 whitespace-nowrap pb-2">-{itemDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )}

              {/* Optional: Tax */}
              {showTax && itemTax > 0 && (
                <tr>
                  <td colSpan={3} className="text-left pb-2 whitespace-nowrap">*TAX</td>
                  <td className="text-right pl-1 whitespace-nowrap pb-2">{itemTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )}

              {/* Optional: MRP Savings */}
              {item.mrp_price > item.unit_price && (
                <tr>
                  <td colSpan={4} className="pl-4 italic font-bold pb-2">
                    MRP: {parseFloat(item.mrp_price).toLocaleString()} (Save: {parseFloat(item.mrp_price - item.unit_price).toLocaleString()})
                  </td>
                </tr>
              )}
            </tbody>
          );
        })}
      </table>

      {/* Totals remains unchanged --- */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between">
          <span>SUB TOTAL:</span>
          <span>{parseFloat(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        {showDiscount && parseFloat(sale.discount_amount) > 0 && (
          <div className="flex justify-between border-b border-dashed border-black pb-1 mb-1">
            <span>{t("pos.your_total_discount_is")}</span>
            <span>{parseFloat(sale.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              <div className="flex justify-between text-[10px] font-bold border-b border-dashed border-black pb-1 mb-1">
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
          <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
            <span>{t("pos.change_label")}:</span>
            <span>{(parseFloat(sale.paid_amount) - parseFloat(sale.payable_amount)).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Barcode Section for Returns */}
      {(settings.showBarcode ?? true) && (
        <div className="mt-4 flex flex-col items-center justify-center space-y-1 overflow-hidden">
          <Barcode
            value={sale.invoice_number || "000000"}
            width={1.2}
            height={40}
            fontSize={10}
            margin={0}
            background="transparent"
          />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center space-y-2 border-t border-dashed border-black pt-2">
        {refundPolicy && (
          <div className="border-b border-dashed border-black pb-2 mb-2 text-[10px] leading-tight">
            <span className="font-bold block mb-1">{t("pos.refund_return_policy_label")}</span>
            {refundPolicy}
          </div>
        )}
        {showFooter && footerText && (
          <div className="whitespace-pre-wrap leading-tight text-[10px] mb-4">{footerText}</div>
        )}
        <div className="leading-tight">
          <p className="text-[10px] whitespace-nowrap">ERP SYSTEM FROM INZEEDO</p>
          <p className="text-[10px]">© 2026 INZEEDO.LK | +94785706441</p>
        </div>
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";

export default ReceiptTemplate;
