import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { format } from "@/lib/date-utils";
import { useTranslation } from "@/hooks/useTranslation";
import Barcode from "react-barcode";
import { useSettingsStore } from "@/store/useSettingsStore";

// ─────────────────────────────────────────────────────────────────
// Shared style helpers (used by both receipts)
// ─────────────────────────────────────────────────────────────────
function usePaperConfig(settings) {
  const { paperWidth = "80mm", fontSize = "medium" } = settings || {};
  const paperWidthClass =
    paperWidth === "58mm"
      ? "w-[58mm] print:w-full"
      : paperWidth === "80mm"
      ? "w-[80mm] print:w-full"
      : "w-[210mm] print:w-full";

  // Thermal printers need readable sizes — match the bold clarity of the kitchen slip
  const size =
    fontSize === "xsmall"
      ? "text-[10px]"
      : fontSize === "small"
      ? "text-[11px]"
      : fontSize === "large"
      ? "text-[13px]"
      : fontSize === "xlarge"
      ? "text-[14px]"
      : "text-[12px]"; // medium (default) — was wrongly 10px before

  const fontConfig = {
    family: "font-mono",
    fontFamilyStyle: "monospace",
    size,
  };

  return { paperWidthClass, fontConfig };
}

function getLogoUrl(logoPath) {
  if (!logoPath) return null;
  if (logoPath.startsWith("http")) return logoPath;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}/${logoPath}`;
}

// ─────────────────────────────────────────────────────────────────
// CUSTOMER RECEIPT  (the billing / payment copy)
// ─────────────────────────────────────────────────────────────────
export const CustomerReceiptTemplate = forwardRef(
  ({ sale, settings, business, branch, terminalName }, ref) => {
    if (!sale) return null;
    const { t } = useTranslation();
    const { general } = useSettingsStore();
    const currency =
      general?.localization?.currency || business?.currency || "LKR";

    const formatMoney = (amount) =>
      `${currency} ${Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const {
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

    const { paperWidthClass, fontConfig } = usePaperConfig(settings);

    const diningTypeFormatted = sale.dining_type
      ? sale.dining_type.replace("_", " ").toUpperCase()
      : "DINE IN";

    // Consolidate appended items
    const groupedItems = Object.values(
      (sale.items || []).reduce((acc, item) => {
        const key = `${item.product_id}_${
          item.product_variant_id || "none"
        }_${item.unit_price}`;
        if (!acc[key]) {
          acc[key] = { ...item };
        } else {
          acc[key].quantity =
            parseFloat(acc[key].quantity) + parseFloat(item.quantity);
          acc[key].discount_amount =
            parseFloat(acc[key].discount_amount || 0) +
            parseFloat(item.discount_amount || 0);
          acc[key].tax_amount =
            parseFloat(acc[key].tax_amount || 0) +
            parseFloat(item.tax_amount || 0);
          if (
            acc[key].manual_discount !== undefined &&
            item.manual_discount !== undefined
          ) {
            acc[key].manual_discount =
              parseFloat(acc[key].manual_discount) +
              parseFloat(item.manual_discount);
          }
        }
        return acc;
      }, {})
    );

    return (
      <div ref={ref} className="bg-white">
        <style type="text/css" media="print">
          {`
            @page { margin: 0; }
            * {
              font-family: ${fontConfig.fontFamilyStyle} !important;
              font-weight: 600 !important;
              color: #000 !important;
              border-color: #000 !important;
              -webkit-font-smoothing: none !important;
              text-rendering: optimizeSpeed !important;
            }
            h1, th, .font-black, .font-bold {
              font-weight: 900 !important;
            }
          `}
        </style>

        <div
          className={cn(
            "bg-white text-black p-4 print:py-0 print:px-3 mx-auto transition-all uppercase",
            paperWidthClass,
            fontConfig.family,
            fontConfig.size
          )}
          style={{ fontFamily: fontConfig.fontFamilyStyle }}
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
            <h1 className="text-lg font-black">
              {business?.name || "Inzeedo POS"}
            </h1>
            <div className="leading-tight text-black font-bold">
              <p>{business?.address || branch?.address}</p>
              <p>
                {t("pos.tel_label")}: {business?.phone || branch?.phone}
              </p>
              {business?.tax_id && (
                <p>
                  {t("pos.vat_label")}: {business.tax_id}
                </p>
              )}
            </div>
            {showHeader &&
              headerText &&
              headerText !== "Sale Invoice" && (
                <p className="mt-2 font-bold border-t border-black pt-1">
                  {headerText}
                </p>
              )}
          </div>

          {/* Restaurant Specific Header Block */}
          <div className="border-y-2 border-black py-2 mb-2 space-y-1 text-center">
            <div className="text-xl font-black">{diningTypeFormatted}</div>
            {sale.table_number && (
              <div className="text-lg font-bold border border-black inline-block px-3 py-0.5 mt-1">
                TABLE {sale.table_number}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-black pb-2 mb-2 space-y-0.5">
            <div className="flex justify-between">
              <span>{t("pos.invoice_label")}:</span>
              <span className="font-bold">
                {sale.invoice_number || "Draft"}
              </span>
            </div>
            {(settings?.showDateTime ?? true) && (
              <div className="flex justify-between">
                <span>{t("pos.date_label")}:</span>
                <span>
                  {sale.created_at
                    ? format(new Date(sale.created_at), "yyyy-MM-dd HH:mm")
                    : format(new Date(), "yyyy-MM-dd HH:mm")}
                </span>
              </div>
            )}
            {showCustomer && sale.customer && (
              <div className="flex justify-between">
                <span>{t("pos.customer_label")}:</span>
                <span>{sale.customer.name}</span>
              </div>
            )}
            {showUser &&
              sale.sellers &&
              sale.sellers.length > 0 && (
                <div className="flex justify-between">
                  <span>SERVER:</span>
                  <span>{sale.sellers.map((s) => s.name).join(", ")}</span>
                </div>
              )}
            {terminalName && (
              <div className="flex justify-between text-[10px]">
                <span>{t("pos.terminal_label")}:</span>
                <span>{terminalName.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Items List */}
          <table className="w-full my-4 border-collapse font-bold">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="text-left py-1 pr-1 whitespace-nowrap">
                  # DESCRIPTION
                </th>
                <th className="text-center py-1 px-1 whitespace-nowrap">
                  QTY
                </th>
                <th className="text-right py-1 px-1 whitespace-nowrap">
                  PRICE
                </th>
                <th className="text-right py-1 pl-1 whitespace-nowrap">
                  AMOUNT
                </th>
              </tr>
            </thead>
            {groupedItems.map((item, idx) => {
              const qty = parseFloat(item.quantity || 0);
              const unitPrice = parseFloat(item.unit_price || item.price || 0);
              const lineTotalBeforeDiscount = unitPrice * qty;
              const itemDiscount =
                item.manual_discount !== undefined
                  ? parseFloat(item.manual_discount)
                  : parseFloat(item.discount_amount || 0);
              const itemTax = parseFloat(item.tax_amount || 0);
              const hasDiscount =
                itemDiscount > 0 ||
                parseFloat(item.discount || 0) > 0 ||
                parseFloat(item.discount_percentage || 0) > 0;

              return (
                <tbody
                  key={idx}
                  className="border-b border-dashed border-black last:border-b-0"
                >
                  <tr>
                    <td colSpan={4} className="pt-2 pb-0.5 pr-2 leading-tight font-bold text-[13px]">
                      <span className="mr-1">{idx + 1}</span>
                      <span>
                        {item.product_name ||
                          item.product_variant?.product?.name ||
                          item.product?.name ||
                          item.name ||
                          t("pos.item")}
                      </span>
                      {(() => {
                        const vName =
                          item.product_variant?.name || item.variant_name;
                        if (
                          vName &&
                          vName.toLowerCase() !== "default" &&
                          vName.toLowerCase() !== "#default"
                        ) {
                          return <span className="ml-1">[{vName}]</span>;
                        }
                        return null;
                      })()}
                    </td>
                  </tr>

                  {item.cooking_notes && (
                    <tr>
                      <td
                        colSpan={4}
                        className="pb-1 pl-4 text-[10px] italic font-semibold border-l-2 border-black ml-1"
                      >
                        * {item.cooking_notes}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td></td>
                    <td className="text-center whitespace-nowrap pb-2">
                      {qty.toLocaleString()} x
                    </td>
                    <td className="text-right px-1 whitespace-nowrap pb-2">
                      {formatMoney(unitPrice)}
                    </td>
                    <td className="text-right pl-1 whitespace-nowrap pb-2">
                      {formatMoney(lineTotalBeforeDiscount)}
                    </td>
                  </tr>

                  {showDiscount && hasDiscount && itemDiscount > 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-left pb-2 whitespace-nowrap normal-case"
                      >
                        *Line Discount
                      </td>
                      <td className="text-right pl-1 whitespace-nowrap pb-2">
                        -{formatMoney(itemDiscount)}
                      </td>
                    </tr>
                  )}

                  {showTax && itemTax > 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-left pb-2 whitespace-nowrap"
                      >
                        *TAX
                      </td>
                      <td className="text-right pl-1 whitespace-nowrap pb-2">
                        {formatMoney(itemTax)}
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>

          {/* Totals */}
          <div className="border-t border-black pt-2 space-y-1">
            <div className="flex justify-between">
              <span>SUB TOTAL:</span>
              <span>{formatMoney(sale.total_amount || 0)}</span>
            </div>
            {showDiscount && parseFloat(sale.discount_amount) > 0 && (
              <div className="flex justify-between border-b border-dashed border-black pb-1 mb-1">
                <span>{t("pos.your_total_discount_is")}</span>
                <span>{formatMoney(sale.discount_amount || 0)}</span>
              </div>
            )}
            {showTax && parseFloat(sale.tax_amount || 0) > 0 && (
              <div className="flex justify-between">
                <span>TAX:</span>
                <span>{formatMoney(sale.tax_amount || 0)}</span>
              </div>
            )}
            {parseFloat(sale.adjustment || 0) !== 0 && (
              <div className="flex justify-between">
                <span>ADJUSTMENT:</span>
                <span>{formatMoney(sale.adjustment || 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-[14px] font-black border-t-2 border-black pt-1 mt-1">
              <span>{t("pos.grand_total")}:</span>
              <span>
                {formatMoney(sale.payable_amount || sale.net_total || 0)}
              </span>
            </div>
          </div>

          {/* Payments */}
          <div className="mt-4 border-t border-dashed border-black pt-2 space-y-1">
            {sale.payments && sale.payments.length > 0 ? (
              sale.payments.map((pmt, i) => (
                <div key={i} className="flex justify-between text-[11px]">
                  <span className="uppercase">
                    {t(`pos.${pmt.payment_method.toLowerCase()}`)}:
                  </span>
                  <span className="font-bold">
                    {formatMoney(pmt.amount || 0)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-[11px]">
                <span className="uppercase">
                  {sale.payment_method || "CASH"}{" "}
                  {t("pos.paid").toUpperCase()}:
                </span>
                <span className="font-bold">
                  {formatMoney(
                    sale.paid_amount || sale.payable_amount || 0
                  )}
                </span>
              </div>
            )}

            {parseFloat(sale.paid_amount) >
              parseFloat(sale.payable_amount) && (
              <div className="flex justify-between font-bold border-t border-black mt-1 pt-1">
                <span>{t("pos.change_label")}:</span>
                <span>
                  {formatMoney(
                    parseFloat(sale.paid_amount) -
                      parseFloat(sale.payable_amount)
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Barcode */}
          {(settings?.showBarcode ?? true) && (
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
                <span className="font-bold block mb-1">
                  {t("pos.refund_return_policy_label")}
                </span>
                {refundPolicy}
              </div>
            )}
            {showFooter && footerText && (
              <div className="whitespace-pre-wrap leading-tight text-[10px] mb-4">
                {footerText}
              </div>
            )}
            <div className="leading-tight">
              <p className="text-[10px] whitespace-nowrap">
                ERP SYSTEM FROM INZEEDO
              </p>
              <p className="text-[10px]">© 2026 INZEEDO.LK | +94785706441</p>
            </div>
          </div>

          {/* Spacer for physical cutter blade distance from print head */}
          <div className="hidden print:block print:h-8 w-full"></div>
        </div>
      </div>
    );
  }
);
CustomerReceiptTemplate.displayName = "CustomerReceiptTemplate";

// ─────────────────────────────────────────────────────────────────
// KITCHEN SLIP  (KOT – items-only copy for the kitchen)
// ─────────────────────────────────────────────────────────────────
export const KitchenSlipTemplate = forwardRef(
  ({ sale, settings, business }, ref) => {
    if (!sale) return null;
    const { t } = useTranslation();
    const { paperWidthClass, fontConfig } = usePaperConfig(settings);

    const diningTypeFormatted = sale.dining_type
      ? sale.dining_type.replace("_", " ").toUpperCase()
      : "DINE IN";

    return (
      <div ref={ref} className="bg-white">
        <style type="text/css" media="print">
          {`
            @page { margin: 0; }
            * {
              font-family: ${fontConfig.fontFamilyStyle} !important;
              color: #000 !important;
              border-color: #000 !important;
              -webkit-font-smoothing: none !important;
              text-rendering: optimizeSpeed !important;
            }
          `}
        </style>

        <div
          className={cn(
            "bg-white text-black p-4 print:py-0 print:px-3 mx-auto transition-all uppercase",
            paperWidthClass,
            fontConfig.family,
            fontConfig.size
          )}
          style={{ fontFamily: fontConfig.fontFamilyStyle }}
        >
          <div className="text-center font-black text-xl border-b-2 border-black pb-2 mb-2">
            KITCHEN SLIP
          </div>

          <div className="border-b border-dashed border-black pb-2 mb-2 space-y-0.5 font-bold">
            <div className="flex justify-between text-lg">
              <span>ORDER #:</span>
              <span>{(sale.invoice_number || "").slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span>TIME:</span>
              <span>
                {sale.created_at
                  ? format(new Date(sale.created_at), "HH:mm dd/MM")
                  : format(new Date(), "HH:mm dd/MM")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SERVER:</span>
              <span>
                {sale.sellers && sale.sellers.length > 0
                  ? sale.sellers[0].name
                  : "STAFF"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TYPE:</span>
              <span>{diningTypeFormatted}</span>
            </div>
            {sale.table_number && (
              <div className="flex justify-between text-lg border border-black px-1 mt-1">
                <span>TABLE:</span>
                <span>{sale.table_number}</span>
              </div>
            )}
          </div>

          <table className="w-full my-4 border-collapse font-bold text-lg leading-tight">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-1 pr-1">QTY</th>
                <th className="text-left py-1 pl-1">ITEM</th>
              </tr>
            </thead>
            {sale.items?.map((item, idx) => {
              const qty = parseFloat(item.quantity || 0);
              return (
                <tbody
                  key={idx}
                  className="border-b border-dashed border-black last:border-b-0"
                >
                  <tr>
                    <td className="text-left py-2 pr-2 align-top whitespace-nowrap">
                      {qty.toLocaleString()} x
                    </td>
                    <td className="text-left py-2 pl-1">
                      <span>
                        {item.product_name ||
                          item.product_variant?.product?.name ||
                          item.product?.name ||
                          item.name ||
                          t("pos.item")}
                      </span>
                      {(() => {
                        const vName =
                          item.product_variant?.name || item.variant_name;
                        if (
                          vName &&
                          vName.toLowerCase() !== "default" &&
                          vName.toLowerCase() !== "#default"
                        ) {
                          return <span className="ml-1">[{vName}]</span>;
                        }
                        return null;
                      })()}

                      {item.cooking_notes && (
                        <div className="text-sm italic border-l-2 border-black pl-1 mt-1">
                          * {item.cooking_notes}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>

          <div className="text-center font-bold mt-4 pt-2 border-t-2 border-black">
            --- END OF ORDER ---
          </div>

          {/* Spacer for physical cutter blade distance from print head */}
          <div className="hidden print:block print:h-8 w-full"></div>
        </div>
      </div>
    );
  }
);
KitchenSlipTemplate.displayName = "KitchenSlipTemplate";

// ─────────────────────────────────────────────────────────────────
// Legacy combined export – kept for backward compatibility
// (restaurant-page.jsx will be updated to use the two separate refs)
// ─────────────────────────────────────────────────────────────────
export const RestaurantReceiptTemplate = CustomerReceiptTemplate;
export default CustomerReceiptTemplate;
