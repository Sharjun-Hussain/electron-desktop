import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "../ReportLayout";

export const SalesSummaryPrintTemplate = React.forwardRef(({ data, dateRange, stats, formatDateTime, selectedColumns = {} }, ref) => {
  return (
    <div ref={ref}>
      <ReportLayout 
        title="Sales Report" 
        subtitle="Sales Summary"
        filters={{
          'Period': dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}` : format(dateRange.from, "PPP")) : "All Time",
          'Branch': stats.branchName || "All Branches"
        }}
      >

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
            {selectedColumns.executionDate !== false && <th className="py-2 px-2 font-bold">Date</th>}
            {selectedColumns.reference !== false && <th className="py-2 px-2 font-bold">Invoice</th>}
            {selectedColumns.customer !== false && <th className="py-2 px-2 font-bold">Customer</th>}
            <th className="py-2 px-2 font-bold">Batches</th>
            {selectedColumns.settlement !== false && <th className="py-2 px-2 font-bold">Type</th>}
            {selectedColumns.settlement !== false && <th className="py-2 px-2 font-bold">Status</th>}
            {selectedColumns.cost !== false && <th className="py-2 px-2 text-right font-bold">Cost</th>}
            {selectedColumns.mrp !== false && <th className="py-2 px-2 text-right font-bold">MRP</th>}
            {selectedColumns.wholesale !== false && <th className="py-2 px-2 text-right font-bold">Wholesale</th>}
            {selectedColumns.selling !== false && <th className="py-2 px-2 text-right font-bold">Selling</th>}
            {selectedColumns.netRevenue !== false && <th className="py-2 px-2 text-right font-bold">Total</th>}
            {selectedColumns.profit !== false && <th className="py-2 px-2 text-right font-bold">Profit</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const isCredit = item.payment_status === 'unpaid' || item.payment_status === 'partially_paid';
            return (
            <tr key={index} className={`border-b border-slate-200 ${isCredit ? 'bg-amber-50' : ''}`}>
              {selectedColumns.executionDate !== false && <td className="py-2 px-2">{formatDateTime ? formatDateTime(item.date) : (item.date ? format(new Date(item.date), "MMM dd, HH:mm") : "-")}</td>}
              {selectedColumns.reference !== false && <td className="py-2 px-2">{item.id || "-"}</td>}
              {selectedColumns.customer !== false && <td className="py-2 px-2">{item.customer || "Walk-in"}</td>}
              <td className="py-2 px-2 text-[9px]">
                 {item.batchDetails?.length > 0 
                    ? [...new Map(item.batchDetails.map(b => [b.batch_number, b])).values()]
                        .map(b => b.batch_number + (b.expiry_date ? ` (Exp: ${b.expiry_date.split('T')[0]})` : ''))
                        .join(', ') 
                    : '-'}
              </td>
              {selectedColumns.settlement !== false && <td className="py-2 px-2 uppercase text-[10px]">
                {item.payments && item.payments.length > 0 
                  ? item.payments.map(p => p.payment_method).join(", ")
                  : (item.type || "-")}
              </td>}
              {selectedColumns.settlement !== false && <td className="py-2 px-2 text-xs">
                {isCredit ? (
                  <span className="text-amber-700 font-semibold">
                    {item.payment_status === 'unpaid' ? 'UNPAID' : 'PARTIAL'}
                  </span>
                ) : (
                  <span className="text-emerald-700">PAID</span>
                )}
              </td>}
              {selectedColumns.cost !== false && <td className="py-2 px-2 text-right">LKR {(item.total_cost || 0).toFixed(2)}</td>}
              {selectedColumns.mrp !== false && <td className="py-2 px-2 text-right">LKR {(item.total_mrp || 0).toFixed(2)}</td>}
              {selectedColumns.wholesale !== false && <td className="py-2 px-2 text-right">LKR {(item.total_wholesale || 0).toFixed(2)}</td>}
              {selectedColumns.selling !== false && <td className="py-2 px-2 text-right">LKR {(item.total_selling_base || 0).toFixed(2)}</td>}
              {selectedColumns.netRevenue !== false && <td className="py-2 px-2 text-right font-semibold">
                LKR {(item.total || 0).toFixed(2)}
                {isCredit && (
                  <div className="text-[10px] text-amber-600 font-normal">
                    Due: LKR {(item.total - (item.paid_amount || 0)).toFixed(2)}
                  </div>
                )}
              </td>}
              {selectedColumns.profit !== false && <td className="py-2 px-2 text-right font-semibold text-emerald-700">LKR {(item.total - (item.total_cost || 0)).toFixed(2)}</td>}
            </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        End of Report | Generated by POS System
      </div>

        {/* Today Summary Page (Register Details) */}
        <div style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Register & Payment Summary</h2>
            <p className="text-sm text-slate-500">
              {dateRange?.from ? format(dateRange.from, "do MMM, yyyy hh:mm a") : ""} - {dateRange?.to ? format(dateRange.to, "do MMM, yyyy hh:mm a") : format(new Date(), "do MMM, yyyy hh:mm a")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            {/* Left Column: Payment Methods */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">Payment Breakdown</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Cash Payment</td>
                    <td className="py-3 text-right font-semibold text-slate-800">Rs {(stats.paymentAmounts?.Cash || stats.paymentAmounts?.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Card Payment</td>
                    <td className="py-3 text-right font-semibold text-slate-800">Rs {(stats.paymentAmounts?.Card || stats.paymentAmounts?.card || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Bank Transfer</td>
                    <td className="py-3 text-right font-semibold text-slate-800">Rs {(stats.paymentAmounts?.['Bank Transfer'] || stats.paymentAmounts?.bank_transfer || stats.paymentAmounts?.Bank || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Cheque Payment</td>
                    <td className="py-3 text-right font-semibold text-slate-800">Rs {(stats.paymentAmounts?.Cheque || stats.paymentAmounts?.cheque || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-600">Credit Sales</td>
                    <td className="py-3 text-right font-semibold text-amber-600">Rs {(stats.paymentAmounts?.Credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-slate-600">Other Payments</td>
                    <td className="py-3 text-right font-semibold text-slate-800">Rs {(stats.paymentAmounts?.Other || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Register Totals */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">Register Totals</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Total Gross Sales</span>
                  <span className="text-sm font-bold text-slate-800">Rs {(stats.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/60">
                  <span className="text-sm text-slate-600">Total Refunds Processed</span>
                  <span className="text-sm font-bold text-rose-600">- Rs {(stats.totalRefund || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center mb-5 gap-4">
                  <span className="text-sm font-bold text-slate-700 leading-tight">Net Collected</span>
                  <span className="text-lg font-black text-slate-900 whitespace-nowrap shrink-0 text-right">
                    Rs {((Object.values(stats.paymentAmounts || {}).reduce((a, b) => a + b, 0) - (stats.paymentAmounts?.Credit || 0)) - (stats.totalRefund || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="mt-5 pt-5 border-t border-slate-200 bg-white -mx-5 -mb-5 p-5 rounded-b-xl">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-bold text-slate-800 leading-tight">Expected Cash In Drawer</span>
                    <span className="text-xl font-black text-emerald-600 whitespace-nowrap shrink-0 text-right">
                      Rs {(stats.cashInHand !== undefined ? stats.cashInHand : (stats.paymentAmounts?.Cash || stats.paymentAmounts?.cash || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5 text-right uppercase tracking-wider">
                    Includes Opening Float & Cash Refunds
                  </p>
                </div>
              </div>
            </div>
          </div>



        {/* Footer info for Today Summary */}
        <div className="mt-12 text-sm text-slate-600 space-y-1">
          <p><span className="font-medium text-slate-800">User:</span> {stats.user || "Admin"}</p>
          <p><span className="font-medium text-slate-800">Email:</span> {stats.email || "admin@example.com"}</p>
          <p><span className="font-medium text-slate-800">Business Location:</span> {stats.branchName || "All Branches"}</p>
        </div>
        </div>
      </ReportLayout>
    </div>
  );
});

SalesSummaryPrintTemplate.displayName = "SalesSummaryPrintTemplate";