import React from "react";
import { format } from "@/lib/date-utils";

export const BatchWiseSalesAuditTemplate = React.forwardRef(({ data, dateRange, stats, formatCurrency }, ref) => {
  return (
    <div ref={ref} className="p-10 text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm", fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 10mm; } 
          body { margin: 0; padding: 0; background-color: white; }
          * { font-family: Arial, Helvetica, sans-serif !important; }
          .print-table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
        `}
      </style>

      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-800">Sales Audit</h1>
          <p className="text-sm text-slate-500 mt-1 italic text-indigo-600 font-medium">Batch-wise Performance Report</p>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold text-slate-800 mb-1">AUDIT PARAMETERS</p>
          <p><strong>Generated:</strong> {format(new Date(), "PPP p")}</p>
          <p><strong>Period:</strong> {dateRange?.from ? format(dateRange.from, "PPP") : "Start"} - {dateRange?.to ? format(dateRange.to, "PPP") : "End"}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Sales</span>
          <div className="text-lg font-black mt-1 text-emerald-600">{formatCurrency(stats.totalSales || 0)}</div>
        </div>
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Cost</span>
          <div className="text-lg font-black mt-1 text-rose-600">{formatCurrency(stats.totalCost || 0)}</div>
        </div>
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gross Profit</span>
          <div className="text-lg font-black mt-1 text-indigo-600">{formatCurrency(stats.totalProfit || 0)}</div>
        </div>
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Units Sold</span>
          <div className="text-lg font-black mt-1 text-amber-600">{stats.itemCount?.toLocaleString() || 0}</div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-[11px] text-left border-collapse print-table">
        <thead>
          <tr className="bg-slate-100 border-y border-slate-300">
            <th className="py-2.5 px-2 font-bold uppercase text-slate-700">Transaction</th>
            <th className="py-2.5 px-2 font-bold uppercase text-slate-700">Product(s)</th>
            <th className="py-2.5 px-2 font-bold uppercase text-slate-700">Batch</th>
            <th className="py-2.5 px-2 text-right font-bold uppercase text-slate-700">Cost</th>
            <th className="py-2.5 px-2 text-right font-bold uppercase text-slate-700">Sale</th>
            <th className="py-2.5 px-2 text-right font-bold uppercase text-slate-700">Qty</th>
            <th className="py-2.5 px-2 text-right font-bold uppercase text-slate-700">Margin</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-2 align-top">
                <div className="font-bold text-slate-800">#{item.invoice}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.date ? format(new Date(item.date), "MMM dd, HH:mm") : "-"}</div>
                <div className="text-[9px] font-medium text-indigo-600/70">{item.branch}</div>
              </td>
              <td className="py-3 px-2 align-top max-w-[200px]">
                <div className="font-bold text-slate-800 leading-snug">{item.product}</div>
                <div className="text-[9px] text-slate-500 mt-0.5 italic">{item.category}</div>
              </td>
              <td className="py-3 px-2 align-top">
                <div className="font-black text-slate-800">#{item.batch}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{item.supplier || "Direct"}</div>
              </td>
              <td className="py-3 px-2 text-right align-top tabular-nums text-rose-600 font-medium">{formatCurrency(item.total_cost)}</td>
              <td className="py-3 px-2 text-right align-top tabular-nums text-emerald-600 font-bold">{formatCurrency(item.total_sale)}</td>
              <td className="py-3 px-2 text-right align-top tabular-nums font-black text-slate-800">{parseFloat(item.quantity).toFixed(0)}</td>
              <td className="py-3 px-2 text-right align-top tabular-nums">
                <div className="font-black text-indigo-600">{formatCurrency(item.profit)}</div>
                <div className="text-[9px] font-bold text-emerald-600">{((item.profit / (item.total_sale || 1)) * 100).toFixed(1)}%</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
        <div>
           Generated via Inzeedo Intelligent POS - Enterprise Edition
        </div>
        <div>
          End of Report | Page 1 of 1
        </div>
      </div>
    </div>
  );
});

BatchWiseSalesAuditTemplate.displayName = "BatchWiseSalesAuditTemplate";
