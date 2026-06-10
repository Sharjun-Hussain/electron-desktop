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
            <th className="py-2 px-2 font-bold">Batches</th>
            <th className="py-2 px-2 font-bold">Type</th>
            <th className="py-2 px-2 font-bold">Status</th>
            <th className="py-2 px-2 text-right font-bold">Cost</th>
            <th className="py-2 px-2 text-right font-bold">MRP</th>
            <th className="py-2 px-2 text-right font-bold">Wholesale</th>
            <th className="py-2 px-2 text-right font-bold">Selling</th>
            <th className="py-2 px-2 text-right font-bold">Total</th>
            <th className="py-2 px-2 text-right font-bold">Profit</th>
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
              <td className="py-2 px-2 text-[9px]">
                 {item.batchDetails?.length > 0 
                    ? [...new Map(item.batchDetails.map(b => [b.batch_number, b])).values()]
                        .map(b => b.batch_number + (b.expiry_date ? ` (Exp: ${b.expiry_date.split('T')[0]})` : ''))
                        .join(', ') 
                    : '-'}
              </td>
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
              <td className="py-2 px-2 text-right">LKR {(item.total_cost || 0).toFixed(2)}</td>
              <td className="py-2 px-2 text-right">LKR {(item.total_mrp || 0).toFixed(2)}</td>
              <td className="py-2 px-2 text-right">LKR {(item.total_wholesale || 0).toFixed(2)}</td>
              <td className="py-2 px-2 text-right">LKR {(item.total_selling_base || 0).toFixed(2)}</td>
              <td className="py-2 px-2 text-right font-semibold">
                LKR {(item.total || 0).toFixed(2)}
                {isCredit && (
                  <div className="text-[10px] text-amber-600 font-normal">
                    Due: LKR {(item.total - (item.paid_amount || 0)).toFixed(2)}
                  </div>
                )}
              </td>
              <td className="py-2 px-2 text-right font-semibold text-emerald-700">LKR {(item.total - (item.total_cost || 0)).toFixed(2)}</td>
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
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Register Details ( {dateRange?.from ? format(dateRange.from, "do MMM, yyyy hh:mm a") : ""} - {dateRange?.to ? format(dateRange.to, "do MMM, yyyy hh:mm a") : format(new Date(), "do MMM, yyyy hh:mm a")} )
          </h2>
        </div>

        <div className="w-[400px] mb-8 space-y-2 text-sm">
          <div className="flex justify-between items-center text-slate-600 mb-4 pb-2 border-b border-slate-200">
             <span>Cash in hand:</span>
             <span>Rs {(stats.paymentAmounts?.Cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
             <span>Cash Payment:</span>
             <span>Rs {(stats.paymentAmounts?.Cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Cheque Payment:</span>
             <span>Rs {(stats.paymentAmounts?.Cheque || stats.paymentAmounts?.cheque || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Card Payment:</span>
             <span>Rs {(stats.paymentAmounts?.Card || stats.paymentAmounts?.card || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Bank Transfer:</span>
             <span>Rs {(stats.paymentAmounts?.['Bank Transfer'] || stats.paymentAmounts?.bank_transfer || stats.paymentAmounts?.Bank || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Advance payment:</span>
             <span>Rs 0.00</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Custom Payment 1:</span>
             <span>Rs 0.00</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
             <span>Custom Payment 2:</span>
             <span>Rs 0.00</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 mb-4">
             <span>Custom Payment 3:</span>
             <span>Rs 0.00</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 mb-4">
             <span>Other Payments:</span>
             <span>Rs {(stats.paymentAmounts?.Other || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-slate-800 font-semibold mb-4">
             <span>Total Refund</span>
             <span>Rs {(stats.totalRefund || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-slate-800 font-semibold mb-4">
             <span>Total Payment</span>
             <span>Rs {(Object.values(stats.paymentAmounts || {}).reduce((a, b) => a + b, 0) - (stats.paymentAmounts?.Credit || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 mb-4">
             <span>Credit Sales:</span>
             <span>Rs {(stats.paymentAmounts?.Credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-slate-800 font-semibold mb-8 pb-4 border-b border-slate-300">
             <span>Total Sales:</span>
             <span>Rs {(stats.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Details of products sold */}
        <div className="mb-8">
          <h3 className="text-lg text-slate-700 mb-4 border-b border-slate-200 pb-2">Details of products sold</h3>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2 px-2 w-12 font-medium">#</th>
                <th className="py-2 px-2 font-medium">Brands</th>
                <th className="py-2 px-2 font-medium text-right">Quantity</th>
                <th className="py-2 px-2 font-medium text-right">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.productBreakdown && Object.values(stats.productBreakdown).map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100/50">
                  <td className="py-2 px-2">{idx + 1}.</td>
                  <td className="py-2 px-2">{item.brand}</td>
                  <td className="py-2 px-2 text-right">{item.quantity.toFixed(4)}</td>
                  <td className="py-2 px-2 text-right">Rs {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-800 mt-2">
                <td className="py-3 px-2">#</td>
                <td className="py-3 px-2 text-right">{stats.productBreakdown ? Object.values(stats.productBreakdown).length : 0}</td>
                <td className="py-3 px-2 text-right"></td>
                <td className="py-3 px-2 text-right">Grand Total: Rs {(stats.productBreakdown ? Object.values(stats.productBreakdown).reduce((sum, item) => sum + item.amount, 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info for Today Summary */}
        <div className="mt-12 text-sm text-slate-600 space-y-1">
          <p><span className="font-medium text-slate-800">User:</span> {stats.user || "Admin"}</p>
          <p><span className="font-medium text-slate-800">Email:</span> {stats.email || "admin@example.com"}</p>
          <p><span className="font-medium text-slate-800">Business Location:</span> {stats.branchName || "All Branches"}</p>
        </div>

      </div>
    </div>
  );
});

SalesSummaryPrintTemplate.displayName = "SalesSummaryPrintTemplate";