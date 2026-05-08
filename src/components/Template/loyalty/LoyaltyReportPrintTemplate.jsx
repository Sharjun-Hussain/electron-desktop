import React from "react";
import { format } from "date-fns";

export const LoyaltyReportPrintTemplate = React.forwardRef(({ transactions, topCustomers, summary, dateRange, formatDateTime }, ref) => {
  return (
    <div ref={ref} className="p-10 font-sans text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0mm; } 
          body { margin: 0; padding: 0; background-color: white; }
        `}
      </style>

      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider">Loyalty Report</h1>
          <p className="text-sm text-slate-500 mt-1">Customer Points & Redemption Summary</p>
        </div>
        <div className="text-right text-sm">
          <p><strong>Generated:</strong> {format(new Date(), "PPP p")}</p>
          {dateRange?.from && (
            <p><strong>Period:</strong> {format(dateRange.from, "PPP")} - {dateRange.to ? format(dateRange.to, "PPP") : "End"}</p>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="p-4 border rounded bg-slate-50 text-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Earned</span>
          <div className="text-xl font-bold mt-1 text-emerald-600">+{summary?.totalEarned || 0} pts</div>
        </div>
        <div className="p-4 border rounded bg-slate-50 text-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Redeemed</span>
          <div className="text-xl font-bold mt-1 text-rose-600">-{summary?.totalRedeemed || 0} pts</div>
        </div>
        <div className="p-4 border rounded bg-slate-50 text-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Active Members</span>
          <div className="text-xl font-bold mt-1 text-blue-600">{summary?.activeCustomers || 0}</div>
        </div>
        <div className="p-4 border rounded bg-slate-50 text-center">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Outstanding</span>
          <div className="text-xl font-bold mt-1 text-slate-800">{summary?.totalOutstanding || 0} pts</div>
        </div>
      </div>

      {/* Top Customers Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 border-b border-slate-200 pb-2">Top Customers by Points</h2>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="py-2 px-2 font-bold">Customer Name</th>
              <th className="py-2 px-2 font-bold">Phone Number</th>
              <th className="py-2 px-2 text-right font-bold">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers?.slice(0, 10).map((customer, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2 px-2">{customer.name}</td>
                <td className="py-2 px-2">{customer.phone || "-"}</td>
                <td className="py-2 px-2 text-right font-semibold">{customer.loyalty_points} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction History Section */}
      <div>
        <h2 className="text-lg font-bold mb-4 border-b border-slate-200 pb-2">Loyalty Transaction Logs</h2>
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-300">
              <th className="py-2 px-2 font-bold">Date</th>
              <th className="py-2 px-2 font-bold">Invoice</th>
              <th className="py-2 px-2 font-bold">Customer</th>
              <th className="py-2 px-2 text-right font-bold text-emerald-600">Earned</th>
              <th className="py-2 px-2 text-right font-bold text-rose-600">Redeemed</th>
              <th className="py-2 px-2 text-right font-bold">Net Change</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-2 px-2">{formatDateTime ? formatDateTime(tx.created_at) : format(new Date(tx.created_at), "MMM dd, HH:mm")}</td>
                <td className="py-2 px-2">{tx.invoice_number}</td>
                <td className="py-2 px-2">{tx.customer?.name}</td>
                <td className="py-2 px-2 text-right text-emerald-600">+{tx.earned_points || 0}</td>
                <td className="py-2 px-2 text-right text-rose-600">-{tx.redeemed_points || 0}</td>
                <td className="py-2 px-2 text-right font-semibold">
                  {(tx.earned_points || 0) - (tx.redeemed_points || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        End of Loyalty Report | Generated by Inzeedo POS
      </div>
    </div>
  );
});

LoyaltyReportPrintTemplate.displayName = "LoyaltyReportPrintTemplate";
