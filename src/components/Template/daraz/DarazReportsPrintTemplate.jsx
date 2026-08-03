import React from "react";
import { format } from "@/lib/date-utils";
import { ReportLayout } from "../ReportLayout";

export const DarazReportsPrintTemplate = React.forwardRef(
  ({ stats, dateRange, formatCurrency, orgName }, ref) => {
    return (
      <div ref={ref}>
        <ReportLayout
          title="Daraz Analytics Report"
          subtitle="E-Commerce Performance Summary"
          filters={{
            Period: dateRange?.from
              ? dateRange.to
                ? `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                : format(dateRange.from, "PPP")
              : "All Time",
            Organization: orgName || "—",
          }}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded bg-slate-50">
              <span className="text-xs text-slate-500 uppercase font-bold">Total Orders</span>
              <div className="text-xl font-bold mt-1">{stats.total_orders ?? 0}</div>
            </div>
            <div className="p-4 border rounded bg-slate-50">
              <span className="text-xs text-slate-500 uppercase font-bold">Today's Orders</span>
              <div className="text-xl font-bold mt-1">{stats.today_orders ?? 0}</div>
            </div>
            <div className="p-4 border rounded bg-amber-50 border-amber-200">
              <span className="text-xs text-amber-600 uppercase font-bold">Pending</span>
              <div className="text-xl font-bold mt-1 text-amber-700">{stats.pending_orders ?? 0}</div>
            </div>
            <div className="p-4 border rounded bg-red-50 border-red-200">
              <span className="text-xs text-red-500 uppercase font-bold">Cancelled</span>
              <div className="text-xl font-bold mt-1 text-red-600">{stats.cancelled_orders ?? 0}</div>
            </div>
          </div>

          {/* Financials */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
              Financial Summary
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-600">Gross Revenue</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-700">
                    {formatCurrency(stats.total_revenue ?? 0)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-600">Total Profit Margin</td>
                  <td className="py-2.5 text-right font-semibold text-emerald-700">
                    {formatCurrency(stats.total_profit ?? 0)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-600">Daraz Deductions &amp; Lost</td>
                  <td className="py-2.5 text-right font-semibold text-red-600">
                    - {formatCurrency(stats.lost ?? 0)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 text-slate-600">Operating Expenses</td>
                  <td className="py-2.5 text-right font-semibold text-red-600">
                    - {formatCurrency(stats.expenses ?? 0)}
                  </td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-3 font-bold text-slate-800">Final Net Profit</td>
                  <td
                    className={`py-3 text-right text-lg font-black ${
                      (stats.final_profit ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(stats.final_profit ?? 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Products Table */}
          {(stats.top_products?.length ?? 0) > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
                Products Sold Overview
              </h3>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="py-2 px-2 font-bold">Item Name</th>
                    <th className="py-2 px-2 font-bold">Variant</th>
                    <th className="py-2 px-2 font-bold">SKU</th>
                    <th className="py-2 px-2 text-right font-bold">Qty</th>
                    <th className="py-2 px-2 text-right font-bold">Revenue</th>
                    <th className="py-2 px-2 text-right font-bold">Est. Cost</th>
                    <th className="py-2 px-2 text-right font-bold">Gross Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_products.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-2 px-2">{p.name}</td>
                      <td className="py-2 px-2 text-slate-500">{p.variant || "Base"}</td>
                      <td className="py-2 px-2 text-slate-500 text-xs">{p.sku}</td>
                      <td className="py-2 px-2 text-right font-semibold">{p.quantity_sold}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(p.revenue)}</td>
                      <td className="py-2 px-2 text-right text-slate-500">{formatCurrency(p.cost)}</td>
                      <td className="py-2 px-2 text-right font-semibold text-emerald-700">
                        {formatCurrency(p.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            End of Report | Generated by Inzeedo ERP System
          </div>
        </ReportLayout>
      </div>
    );
  }
);

DarazReportsPrintTemplate.displayName = "DarazReportsPrintTemplate";
