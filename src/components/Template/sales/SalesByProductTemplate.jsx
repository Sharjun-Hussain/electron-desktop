import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "../ReportLayout";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const SalesByProductPrintTemplate = React.forwardRef(({ data, filters, stats, dateRange, selectedColumns = {} }, ref) => {
  const { formatCurrency, report } = useAppSettings();

  return (
    <div style={{ display: "none" }}>
      <div ref={ref}>
        <ReportLayout 
          title="Sales by Product Report" 
          subtitle="Detailed performance tracking across inventory classifications"
          filters={filters}
          stats={stats}
        >
          {/* --- SUMMARY METRICS --- */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 border border-slate-200 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Quantity</span>
              <div className="text-lg font-bold mt-1 text-slate-900">{(stats.totalSold || 0).toLocaleString()} Units</div>
            </div>
            <div className="p-4 border border-slate-200 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Revenue</span>
              <div className="text-lg font-bold mt-1 text-slate-900">{formatCurrency(stats.totalRevenue || 0)}</div>
            </div>
            <div className="p-4 border border-slate-200 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Profit</span>
              <div className="text-lg font-bold mt-1 text-emerald-700">{formatCurrency(stats.totalProfit || 0)}</div>
            </div>
            <div className="p-4 border border-slate-200 rounded bg-slate-50/50">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Mover</span>
              <div className="text-sm font-bold mt-2 truncate text-slate-900">{stats.topSellingItem?.name || "-"}</div>
            </div>
          </div>

          {/* --- DATA TABLE --- */}
          <table className="w-full text-left border-collapse report-table">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider">
                {selectedColumns?.skuEntity !== false && <th className="py-3 px-2 font-bold">Product Name</th>}
                {selectedColumns?.skuEntity !== false && <th className="py-3 px-2 font-bold">SKU</th>}
                {selectedColumns?.batch !== false && <th className="py-3 px-2 font-bold">Batch / Exp</th>}
                {selectedColumns?.quantity !== false && <th className="py-3 px-2 font-bold text-right">Qty Sold</th>}
                {selectedColumns?.cost !== false && <th className="py-3 px-2 font-bold text-right">Cost</th>}
                {selectedColumns?.mrp !== false && <th className="py-3 px-2 font-bold text-right">MRP</th>}
                {selectedColumns?.wholesale !== false && <th className="py-3 px-2 font-bold text-right">Wholesale</th>}
                {selectedColumns?.sellingPrice !== false && <th className="py-3 px-2 font-bold text-right">Selling</th>}
                {selectedColumns?.revenue !== false && <th className="py-3 px-2 font-bold text-right">Revenue</th>}
                {selectedColumns?.profit !== false && <th className="py-3 px-2 font-bold text-right">Profit</th>}
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {data.map((item, index) => (
                <tr key={index} className="break-inside-avoid">
                  {selectedColumns?.skuEntity !== false && <td className="font-medium">{item.name}</td>}
                  {selectedColumns?.skuEntity !== false && <td className="text-slate-500">{item.sku}</td>}
                  {selectedColumns?.batch !== false && <td className="text-slate-500">
                    <div>{item.batch !== 'N/A' ? item.batch : '-'}</div>
                    {item.expiry !== 'N/A' && <div className="text-[9px]">{item.expiry}</div>}
                  </td>}
                  {selectedColumns?.quantity !== false && <td className="text-right">{(item.sold || 0)}</td>}
                  {selectedColumns?.cost !== false && <td className="text-right text-slate-600">{formatCurrency(item.cost_price || 0)}</td>}
                  {selectedColumns?.mrp !== false && <td className="text-right text-slate-600">{formatCurrency(item.mrp_price || 0)}</td>}
                  {selectedColumns?.wholesale !== false && <td className="text-right text-slate-600">{formatCurrency(item.wholesale_price || 0)}</td>}
                  {selectedColumns?.sellingPrice !== false && <td className="text-right text-slate-600">{formatCurrency(item.selling_price || 0)}</td>}
                  {selectedColumns?.revenue !== false && <td className="text-right font-medium">{formatCurrency(item.sales || 0)}</td>}
                  {selectedColumns?.profit !== false && <td className="text-right font-bold text-emerald-700">{formatCurrency(item.profit || 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>

        
        {stats.paymentAmounts && (
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
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-slate-600">Total Refunds Processed</span>
                  <span className="text-sm font-bold text-rose-600">- Rs {(stats.totalRefund || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/60">
                  <span className="text-sm text-slate-600">Total Expenses</span>
                  <span className="text-sm font-bold text-amber-600">- Rs {(stats.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center mb-5">
                  <span className="text-sm font-bold text-slate-700">Net Collected</span>
                  <span className="text-lg font-black text-slate-900">
                    Rs {((Object.values(stats.paymentAmounts || {}).reduce((a, b) => a + b, 0) - (stats.paymentAmounts?.Credit || 0)) - (stats.totalRefund || 0) - (stats.totalExpense || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="mt-5 pt-5 border-t border-slate-200 bg-white -mx-5 -mb-5 p-5 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800">Expected Cash In Drawer</span>
                    <span className="text-xl font-black text-emerald-600">
                      Rs {(stats.cashInHand !== undefined ? stats.cashInHand : (stats.paymentAmounts?.Cash || stats.paymentAmounts?.cash || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5 text-right uppercase tracking-wider">
                    Includes Opening Float, Cash Refunds & Cash Expenses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        </ReportLayout>
      </div>
    </div>
  );
});

function cn(...inputs) {
    return inputs.filter(Boolean).join(" ");
}

SalesByProductPrintTemplate.displayName = "SalesByProductPrintTemplate";

SalesByProductPrintTemplate.displayName = "SalesByProductPrintTemplate";