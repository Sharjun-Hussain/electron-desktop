import React from "react";
import { format } from "date-fns";

export const SalesSummaryPrintTemplate = React.forwardRef(({ data, dateRange, stats, formatDateTime }, ref) => {
  return (
    // The ref must be attached to the actual DOM element inside the hidden container
    <div ref={ref} className="p-10 font-sans text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
      
      {/* Print Styles: Removes margins and forces white background */}
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0mm; } 
          body { margin: 0; padding: 0; background-color: white; }
        `}
      </style>

      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider">Sales Report</h1>
          <p className="text-sm text-slate-500 mt-1">Sales Summary</p>
        </div>
        <div className="text-right text-sm">
          <p><strong>Generated:</strong> {format(new Date(), "PPP p")}</p>
          <p><strong>Period:</strong> {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}` : format(dateRange.from, "PPP")) : "All Time"}</p>
          <p><strong>Branch:</strong> {stats.branchName || "All Branches"}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Sales</span>
          <div className="text-xl font-bold mt-1">LKR {(stats.totalSales || 0).toLocaleString()}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Transactions</span>
          <div className="text-xl font-bold mt-1">{stats.totalTransactions || 0}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Avg Value</span>
          <div className="text-xl font-bold mt-1">LKR {(Number(stats.avgValue) || 0).toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50">
          <span className="text-xs text-slate-500 uppercase font-bold">Total Discounts</span>
          <div className="text-xl font-bold mt-1">LKR {(stats.totalDiscounts || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-300">
            <th className="py-2 px-2 font-bold">Date</th>
            <th className="py-2 px-2 font-bold">Invoice</th>
            <th className="py-2 px-2 font-bold">Customer</th>
            <th className="py-2 px-2 font-bold">Type</th>
            <th className="py-2 px-2 font-bold">Status</th>
            <th className="py-2 px-2 text-right font-bold">Subtotal</th>
            <th className="py-2 px-2 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const isCredit = item.payment_status === 'unpaid' || item.payment_status === 'partially_paid';
            return (
            <tr key={index} className={`border-b border-slate-200 ${isCredit ? 'bg-amber-50' : ''}`}>
              <td className="py-2 px-2">{formatDateTime ? formatDateTime(item.date) : (item.date ? format(new Date(item.date), "MMM dd, HH:mm") : "-")}</td>
              <td className="py-2 px-2">{item.id || "-"}</td>
              <td className="py-2 px-2">{item.customer || "Walk-in"}</td>
              <td className="py-2 px-2 uppercase text-[10px]">
                {item.payments && item.payments.length > 0 
                  ? item.payments.map(p => p.payment_method).join(", ")
                  : (item.type || "-")}
              </td>
              <td className="py-2 px-2 text-xs">
                {isCredit ? (
                  <span className="text-amber-700 font-semibold">
                    {item.payment_status === 'unpaid' ? 'UNPAID' : 'PARTIAL'}
                  </span>
                ) : (
                  <span className="text-emerald-700">PAID</span>
                )}
              </td>
              <td className="py-2 px-2 text-right">LKR {(item.subtotal || 0).toFixed(2)}</td>
              <td className="py-2 px-2 text-right font-semibold">
                LKR {(item.total || 0).toFixed(2)}
                {isCredit && (
                  <div className="text-[10px] text-amber-600 font-normal">
                    Due: LKR {(item.total - (item.paid_amount || 0)).toFixed(2)}
                  </div>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        End of Report | Generated by POS System
      </div>
    </div>
  );
});

SalesSummaryPrintTemplate.displayName = "SalesSummaryPrintTemplate";