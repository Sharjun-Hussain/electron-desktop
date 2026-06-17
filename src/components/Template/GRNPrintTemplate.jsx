import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "./ReportLayout";

export const GRNPrintTemplate = React.forwardRef(({ data, columns = {} }, ref) => {
  if (!data) return null;

  const grandTotal = parseFloat(data.total_amount || 0);

  return (
    <div style={{ display: "none" }}>
      <div ref={ref}>
        <ReportLayout 
          title="Goods Receipt Note" 
          subtitle="Inventory Inward Record"
          filters={{
            'GRN #': data.grn_number,
            'Date': data.received_date ? format(new Date(data.received_date), "MMM dd, yyyy") : "N/A",
            ...(data.invoice_number ? { 'Invoice #': data.invoice_number } : {}),
            'Branch': data.branch?.name || "—",
            'Status': data.status || "Completed"
          }}
        >
          {/* ════ SUPPLIER & ORDER LINK ════ */}
          <div className="grid grid-cols-2 gap-10 mb-7 mt-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-200 pb-1 mb-2">
                Supplier
              </h3>
              <p className="font-bold text-sm text-slate-900">
                {data.supplier?.name || "—"}
              </p>
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed mt-0.5">
                {data.supplier?.contact_person && `Attn: ${data.supplier.contact_person}`}
              </p>
              <p className="text-[11px] font-medium text-slate-600">{data.supplier?.email}</p>
              <p className="text-[11px] font-medium text-slate-600">{data.supplier?.phone}</p>
              <p className="text-[11px] font-medium text-slate-600">{data.supplier?.address}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-200 pb-1 mb-2">
                Linked Purchase Order
              </h3>
              <p className="font-bold text-sm text-slate-900">
                {data.purchase_order?.po_number || "—"}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Received by:{" "}
                <span className="font-bold text-slate-800">
                  {data.received_by_user?.name || "Authorized Staff"}
                </span>
              </p>
              {data.remarks && (
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  Remarks: {data.remarks}
                </p>
              )}
            </div>
          </div>

          {/* ════ ITEMS TABLE ════ */}
          <table className="w-full text-left mb-6 border-collapse report-table">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider">
                <th className="font-bold">#</th>
                <th className="font-bold">Item Description</th>
                <th className="text-center font-bold">Ordered</th>
                <th className="text-center font-bold">Received</th>
                <th className="text-center font-bold">Free</th>
                <th className="text-right font-bold">Unit Cost</th>
                {columns?.mrp && <th className="text-right font-bold">MRP Price</th>}
                {columns?.wholesale && <th className="text-right font-bold">Wholesale Price</th>}
                {columns?.selling && <th className="text-right font-bold">Selling Price</th>}
                <th className="text-right font-bold">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {(data.items || []).map((item, idx) => {
                const lineTotal =
                  parseFloat(item.total_amount || 0) ||
                  parseFloat(item.unit_cost || 0) * parseFloat(item.quantity_received || 0);
                return (
                  <tr key={item.id || idx} className="break-inside-avoid">
                    <td className="text-slate-400 font-medium">{idx + 1}</td>
                    <td>
                      <span className="font-bold text-slate-900 block">
                        {item.product?.name || "Unknown Item"}
                      </span>
                      {item.variant && (
                        <span className="text-[10px] text-slate-500">
                          Variant: {item.variant.name || item.variant.sku}
                        </span>
                      )}
                      {item.batch_number && (
                        <span className="text-[10px] text-slate-400 block">
                          Batch: {item.batch_number}
                        </span>
                      )}
                      {item.expiry_date && (
                        <span className="text-[10px] text-slate-400 block">
                          Exp: {format(new Date(item.expiry_date), "MM/yyyy")}
                        </span>
                      )}
                    </td>
                    <td className="text-center font-medium text-slate-700">
                      {item.ordered_qty || item.quantity_ordered || "—"}
                    </td>
                    <td className="text-center font-bold text-emerald-700">
                      {parseFloat(item.quantity_received || 0).toFixed(0)}
                    </td>
                    <td className="text-center font-medium text-slate-500">
                      {item.free_qty || 0}
                    </td>
                    <td className="text-right font-medium text-slate-700 tabular-nums">
                      LKR {parseFloat(item.unit_cost || 0).toFixed(2)}
                    </td>
                    {columns?.mrp && (
                      <td className="text-right font-medium text-slate-700 tabular-nums">
                        LKR {parseFloat(item.mrp_price || item.variant?.mrpPrice || 0).toFixed(2)}
                      </td>
                    )}
                    {columns?.wholesale && (
                      <td className="text-right font-medium text-slate-700 tabular-nums">
                        LKR {parseFloat(item.wholesale_price || item.variant?.wholesalePrice || 0).toFixed(2)}
                      </td>
                    )}
                    {columns?.selling && (
                      <td className="text-right font-medium text-slate-700 tabular-nums">
                        LKR {parseFloat(item.selling_price || item.retail_price || item.variant?.retailPrice || 0).toFixed(2)}
                      </td>
                    )}
                    <td className="text-right font-bold text-slate-900 tabular-nums">
                      LKR {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ════ TOTALS ════ */}
          <div className="flex justify-end mb-8 break-inside-avoid">
            <div style={{ width: "260px" }}>
              <div className="flex justify-between py-1.5 text-[11px] font-medium border-b border-slate-100">
                <span className="text-slate-500">Number of Items:</span>
                <span className="tabular-nums">{(data.items || []).length}</span>
              </div>
              <div className="flex justify-between py-1.5 text-[11px] font-medium border-b border-slate-100">
                <span className="text-slate-500">Tax / VAT:</span>
                <span className="tabular-nums">LKR 0.00</span>
              </div>
              <div className="flex justify-between py-2 mt-1 border-t-2 border-slate-900">
                <span className="text-sm font-bold text-slate-900">
                  Grand Total:
                </span>
                <span className="text-sm font-bold text-emerald-700 tabular-nums">
                  LKR {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ════ FOOTER — Signature & Notes ════ */}
          <div className="grid grid-cols-2 gap-10 pt-5 mt-6 border-t border-slate-200 break-inside-avoid">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1">
                Notes / Remarks
              </p>
              <p className="text-[11px] text-slate-600 italic leading-relaxed">
                {data.remarks ||
                  "Goods received as per purchase order. Stock updated in inventory system."}
              </p>
            </div>
            <div className="flex flex-col justify-end items-center">
              <div className="w-48 border-t border-slate-400 pt-1.5 text-center text-[10px] font-bold uppercase text-slate-500">
                Authorized Signature
              </div>
              <div className="text-center text-[10px] font-medium text-slate-400 mt-0.5">
                {data.received_by_user?.name || "Store Manager"}
              </div>
            </div>
          </div>

        </ReportLayout>
      </div>
    </div>
  );
});

GRNPrintTemplate.displayName = "GRNPrintTemplate";
