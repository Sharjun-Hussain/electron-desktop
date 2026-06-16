import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "../ReportLayout";

export const StockAdjustmentsPrintTemplate = React.forwardRef(({ data, dateRange, stats, selectedColumns = {} }, ref) => {
  return (
    <div ref={ref}>
      <ReportLayout 
        title="Stock Adjustments Report" 
        subtitle="Comprehensive audit of all inventory movements and adjustments"
        filters={{
          'Period': dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}` : format(dateRange.from, "PPP")) : "All Time",
        }}
      >

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Adjustments</span>
          <div className="text-xl font-bold mt-1">{stats.totalTransactions || 0}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Additions</span>
          <div className="text-xl font-bold mt-1 text-emerald-600">+{stats.additions || 0}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Subtractions</span>
          <div className="text-xl font-bold mt-1 text-rose-600">-{stats.subtractions || 0}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Net Value Impact</span>
          <div className="text-xl font-bold mt-1">LKR {(stats.netCostImpact || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm text-left border-collapse">
        <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              {selectedColumns.date !== false && <th className="py-2 px-2 font-bold">Date</th>}
              {selectedColumns.item_name !== false && <th className="py-2 px-2 font-bold">Item Details</th>}
              {selectedColumns.category !== false && <th className="py-2 px-2 font-bold">Category</th>}
              {selectedColumns.brand !== false && <th className="py-2 px-2 font-bold">Brand</th>}
              {selectedColumns.previous_stock !== false && <th className="py-2 px-2 font-bold text-center">Prev Stock</th>}
              {selectedColumns.adjust_qty !== false && <th className="py-2 px-2 font-bold text-center">Adjust Qty</th>}
              {selectedColumns.after_stock !== false && <th className="py-2 px-2 font-bold text-center">After Stock</th>}
              {selectedColumns.type !== false && <th className="py-2 px-2 font-bold text-center">Type</th>}
              {selectedColumns.cost_price !== false && <th className="py-2 px-2 text-right font-bold">Cost Price</th>}
              {selectedColumns.sale_price !== false && <th className="py-2 px-2 text-right font-bold">Sale Price</th>}
              {selectedColumns.user !== false && <th className="py-2 px-2 font-bold text-right">User</th>}
            </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            return (
            <tr key={item.id || index} className="border-b border-slate-200">
                  {selectedColumns.date !== false && (
                    <td className="py-2 px-2 whitespace-nowrap leading-tight">
                      <div>{item.date ? format(new Date(item.date), "yyyy-MM-dd") : "-"}</div>
                      <div className="text-[10px] text-slate-500">{item.date ? format(new Date(item.date), "HH:mm") : ""}</div>
                    </td>
                  )}
                  {selectedColumns.item_name !== false && (
                    <td className="py-2 px-2">
                      <div className="font-semibold text-slate-800">{item.item_name || "-"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.barcode || ""}</div>
                    </td>
                  )}
                  {selectedColumns.category !== false && <td className="py-2 px-2 text-xs text-slate-500">{item.category || "-"}</td>}
                  {selectedColumns.brand !== false && <td className="py-2 px-2 text-xs text-slate-500">{item.brand || "-"}</td>}
                  {selectedColumns.previous_stock !== false && <td className="py-2 px-2 text-center text-orange-600 font-medium">{item.previous_stock !== null ? item.previous_stock : "-"}</td>}
                  {selectedColumns.adjust_qty !== false && (
                    <td className="py-2 px-2 text-center font-bold">
                      {item.type === 'addition' ? <span className="text-emerald-600">+{item.quantity}</span> :
                        item.type === 'subtraction' ? <span className="text-rose-600">-{item.quantity}</span> :
                          <span className="text-blue-600">{item.quantity}</span>}
                    </td>
                  )}
                  {selectedColumns.after_stock !== false && <td className="py-2 px-2 text-center font-medium">{item.after_stock !== null ? item.after_stock : "-"}</td>}
                  {selectedColumns.type !== false && <td className="py-2 px-2 text-center uppercase text-[10px] text-slate-500 font-medium">{item.type}</td>}
              {selectedColumns.cost_price !== false && <td className="py-2 px-2 text-right">{(Number(item.cost_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
              {selectedColumns.sale_price !== false && <td className="py-2 px-2 text-right">{(Number(item.sale_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
              {selectedColumns.user !== false && <td className="py-2 px-2 text-right">{item.user || "-"}</td>}
            </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        End of Report | Generated by POS System
      </div>
      </ReportLayout>
    </div>
  );
});

StockAdjustmentsPrintTemplate.displayName = "StockAdjustmentsPrintTemplate";
