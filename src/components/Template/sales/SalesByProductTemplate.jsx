import React from "react";
import { format } from "date-fns";
import { ReportLayout } from "../ReportLayout";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const SalesByProductPrintTemplate = React.forwardRef(({ data, filters, stats, dateRange }, ref) => {
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
                <th className="py-3 px-2 font-bold">Product Name</th>
                <th className="py-3 px-2 font-bold">SKU</th>
                <th className="py-3 px-2 font-bold">Batch / Exp</th>
                <th className="py-3 px-2 font-bold text-right">Qty Sold</th>
                <th className="py-3 px-2 font-bold text-right">Cost</th>
                <th className="py-3 px-2 font-bold text-right">MRP</th>
                <th className="py-3 px-2 font-bold text-right">Wholesale</th>
                <th className="py-3 px-2 font-bold text-right">Selling</th>
                <th className="py-3 px-2 font-bold text-right">Revenue</th>
                <th className="py-3 px-2 font-bold text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {data.map((item, index) => (
                <tr key={index} className="break-inside-avoid">
                  <td className="font-medium">{item.name}</td>
                  <td className="text-slate-500">{item.sku}</td>
                  <td className="text-slate-500">
                    <div>{item.batch !== 'N/A' ? item.batch : '-'}</div>
                    {item.expiry !== 'N/A' && <div className="text-[9px]">{item.expiry}</div>}
                  </td>
                  <td className="text-right">{(item.sold || 0)}</td>
                  <td className="text-right text-slate-600">{formatCurrency(item.cost_price || 0)}</td>
                  <td className="text-right text-slate-600">{formatCurrency(item.mrp_price || 0)}</td>
                  <td className="text-right text-slate-600">{formatCurrency(item.wholesale_price || 0)}</td>
                  <td className="text-right text-slate-600">{formatCurrency(item.selling_price || 0)}</td>
                  <td className="text-right font-medium">{formatCurrency(item.sales || 0)}</td>
                  <td className="text-right font-bold text-emerald-700">{formatCurrency(item.profit || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

        
        {/* Today Summary Page (Register Details) */}
        {stats.paymentAmounts && (
        <div style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800">
              Register Details ( {dateRange?.from ? format(dateRange.from, "do MMM, yyyy hh:mm a") : ""} - {dateRange?.to ? format(dateRange.to, "do MMM, yyyy hh:mm a") : format(new Date(), "do MMM, yyyy hh:mm a")} )
            </h2>
          </div>

          <div className="w-[400px] mb-8 space-y-2 text-sm">
            <div className="flex justify-between items-center text-slate-600 mb-4 pb-2 border-b border-slate-200">
               <span>Cash in hand:</span>
               <span>Rs {(stats.cashInHand !== undefined ? stats.cashInHand : (stats.paymentAmounts?.Cash || stats.paymentAmounts?.cash || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
               <span>Cash Payment:</span>
               <span>Rs {(stats.paymentAmounts?.Cash || stats.paymentAmounts?.cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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