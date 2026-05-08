import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "./ReportLayout";

export const PurchaseOrderTemplate = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <div style={{ display: "none" }}>
      <div ref={ref}>
        <ReportLayout 
          title="Purchase Order" 
          subtitle="Official Procurement Document"
          filters={{
            'PO #': data.po_number || data.id,
            'Date': data.order_date ? format(new Date(data.order_date), "MMM dd, yyyy") : "N/A",
            'Expected': data.expected_delivery_date ? format(new Date(data.expected_delivery_date), "MMM dd, yyyy") : "N/A"
          }}
        >
          {/* --- SUPPLIER & SHIPPING INFO --- */}
          <div className="grid grid-cols-2 gap-12 mb-10 mt-4">
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider border-b border-slate-200 pb-1">Vendor</h3>
              <div className="text-[11px] text-slate-800 leading-relaxed font-medium">
                <p className="font-bold text-sm text-slate-900">{data.supplier.name}</p>
                <p>Attn: {data.supplier.contact}</p>
                <p>{data.supplier.address}</p>
                <p>{data.supplier.email}</p>
                <p>{data.supplier.phone}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider border-b border-slate-200 pb-1">Ship To</h3>
              <div className="text-[11px] text-slate-800 leading-relaxed font-medium">
                <p className="font-bold text-sm text-slate-900">{data.branch?.name || "Inventory Warehouse"}</p>
                <p>{data.branch?.address || "Main Distribution Center"}</p>
                <p>Attn: Receiving Department</p>
              </div>
            </div>
          </div>

          {/* --- TABLE --- */}
          <table className="w-full text-left mb-8 border-collapse report-table">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider">
                <th className="font-bold">#</th>
                <th className="font-bold">Item Description</th>
                <th className="font-bold text-right">Qty</th>
                <th className="font-bold text-right">Unit Price</th>
                <th className="font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {(data.items || []).map((item, index) => (
                <tr key={index} className="break-inside-avoid">
                  <td className="font-medium text-slate-500">{index + 1}</td>
                  <td>
                    <span className="font-bold block text-slate-900">{item.product?.name || "Unknown Item"}</span>
                    <span className="text-[10px] text-slate-500">
                       SKU: {item.variant?.sku || item.product?.code || "N/A"} {item.variant?.barcode && `| Barcode: ${item.variant.barcode}`}
                    </span>
                  </td>
                  <td className="text-right font-medium">{item.quantity}</td>
                  <td className="text-right font-medium text-slate-600">LKR {Number(item.unit_cost).toFixed(2)}</td>
                  <td className="text-right font-bold text-slate-900">LKR {Number(item.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* --- TOTALS --- */}
          <div className="flex justify-end mb-12">
            <div className="w-1/2 md:w-1/3 space-y-2 text-[11px] font-medium">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="tabular-nums">LKR {Number(data.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600">Tax / VAT:</span>
                    <span className="tabular-nums">LKR 0.00</span>
                </div>
                 <div className="flex justify-between border-t-2 border-slate-900 pt-2 mt-2">
                    <span className="text-sm font-bold text-slate-900">Total:</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">LKR {Number(data.total_amount).toFixed(2)}</span>
                </div>
            </div>
          </div>

          {/* --- NOTES & FOOTER --- */}
          <div className="grid grid-cols-2 gap-10 mt-8 break-inside-avoid">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-2">Terms & Notes</h4>
                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-3 rounded-md border border-slate-200">
                    {data.notes || "Standard payment terms apply. Please include PO number on all invoices."}
                </p>
              </div>
              <div className="flex flex-col justify-end items-center">
                 <div className="w-48 border-t border-slate-400 pt-2 text-center text-[10px] font-bold uppercase text-slate-500">
                   Authorized Signature
                 </div>
              </div>
          </div>

        </ReportLayout>
      </div>
    </div>
  );
});

PurchaseOrderTemplate.displayName = "PurchaseOrderTemplate";