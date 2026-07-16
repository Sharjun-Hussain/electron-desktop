import React from "react";
import { format } from "@/lib/date-utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const CardReconcilePrintTemplate = React.forwardRef(({ data, filters, stats }, ref) => {
  const { business } = useAppSettings();
  return (
    <div style={{ display: "none" }}>
      <div ref={ref} className="p-8 text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm", fontFamily: 'Arial, Helvetica, sans-serif' }}>
        
        {/* Print CSS */}
        <style type="text/css" media="print">
          {`
            @page { size: A4; margin: 0mm; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            * { font-family: Arial, Helvetica, sans-serif !important; }
          `}
        </style>

        {/* --- HEADER --- */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">POS</div>
               <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{business?.name || "Inzeedo Corp"}</h1>
            </div>
            <h2 className="text-xl font-semibold text-slate-700">Card Reconciliation Statement</h2>
            <p className="text-sm text-slate-500 mt-1">Financial Settlement Report</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p><strong>Generated:</strong> {format(new Date(), "PPP p")}</p>
            <p><strong>Branch:</strong> {filters.store}</p>
            <p><strong>Card Type:</strong> {filters.cardType}</p>
          </div>
        </div>

        {/* --- SUMMARY --- */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Card Sales</span>
            <div className="text-lg font-bold mt-1">LKR {stats.totalSales.toLocaleString()}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Transactions</span>
            <div className="text-lg font-bold mt-1">{stats.totalCount}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Refunds / Voids</span>
            <div className="text-lg font-bold mt-1 text-red-600">LKR {stats.totalRefunds.toLocaleString()}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Net Settlement</span>
            <div className="text-lg font-bold mt-1 text-emerald-700">LKR {stats.netAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* --- TABLE --- */}
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
              <th className="py-2 px-2 font-bold text-slate-600">Date/Time</th>
              <th className="py-2 px-2 font-bold text-slate-600">Invoice</th>
              <th className="py-2 px-2 font-bold text-slate-600">Card</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Amount (LKR)</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-2 px-2 text-slate-700">{item.date}</td>
                <td className="py-2 px-2 font-medium">{item.invoice}</td>
                <td className="py-2 px-2">{item.cardType}</td>
                <td className="py-2 px-2 text-right font-medium">{item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-center text-xs uppercase font-bold">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* --- FOOTER --- */}
        <div className="fixed bottom-10 left-10 right-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 flex justify-between">
          <span>Checked by: ________________</span>
          <span>Confidential | Finance Dept</span>
          <span>Verified by: ________________</span>
        </div>
      </div>
    </div>
  );
});

CardReconcilePrintTemplate.displayName = "CardReconcilePrintTemplate";