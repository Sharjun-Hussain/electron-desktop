import React from "react";
import { ReportLayout } from "../ReportLayout";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const SalesByProductPrintTemplate = React.forwardRef(({ data, filters, stats }, ref) => {
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