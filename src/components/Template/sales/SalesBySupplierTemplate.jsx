import React from "react";
import { format } from "date-fns";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const SalesBySupplierPrintTemplate = React.forwardRef(({ data = [], filters = {}, stats = {} }, ref) => {
  const { business } = useAppSettings();
  const safeStats = {
    totalSales: stats?.totalSales || 0,
    totalProfit: stats?.totalProfit || 0,
    activeSuppliers: stats?.activeSuppliers || 0,
    topSupplier: stats?.topSupplier || null
  };

  return (
    <div style={{ display: "none" }}>
      <div ref={ref} className="p-8 font-sans text-slate-900 bg-white" style={{ width: "210mm", minHeight: "297mm" }}>
        
        <style type="text/css" media="print">
          {`@page { size: A4; margin: 0mm; } body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }`}
        </style>

        {/* --- HEADER --- */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <div className="h-8 w-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">POS</div>
               <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{business?.name || "Inzeedo Corp"}</h1>
            </div>
            <h2 className="text-xl font-semibold text-slate-700">Sales Summary By Supplier</h2>
            <p className="text-sm text-slate-500 mt-1">Vendor Performance Report</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p><strong>Generated:</strong> {format(new Date(), "PPP p")}</p>
            <p><strong>Branch:</strong> {filters?.store || "All"}</p>
            <p><strong>Category:</strong> {filters?.category || "All"}</p>
          </div>
        </div>

        {/* --- SUMMARY METRICS --- */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Sales</span>
            <div className="text-lg font-bold mt-1 text-slate-900">LKR {(safeStats.totalSales || 0).toLocaleString()}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Top Supplier</span>
            <div className="text-sm font-bold mt-2 text-slate-900 truncate">{safeStats.topSupplier?.name || safeStats.topSupplier?.supplier_name || "-"}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Vendors</span>
            <div className="text-lg font-bold mt-1 text-slate-900">{safeStats.activeSuppliers || 0}</div>
          </div>
          <div className="p-4 border border-slate-200 rounded bg-slate-50">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Gross Profit</span>
            <div className="text-lg font-bold mt-1 text-emerald-700">LKR {(safeStats.totalProfit || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* --- DATA TABLE --- */}
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-xs uppercase">
              <th className="py-2 px-2 font-bold text-slate-600">Supplier Name</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-center">Items Sold</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Total Sales</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Discount</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Net Sales</th>
              <th className="py-2 px-2 font-bold text-slate-600 text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? data.map((item, index) => (
              <tr key={index} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-2 px-2 font-medium">{item.name || item.supplier_name}</td>
                <td className="py-2 px-2 text-center">{item.sold || 0}</td>
                <td className="py-2 px-2 text-right font-medium">{(item.totalSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-right text-red-600">({(item.discount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})})</td>
                <td className="py-2 px-2 text-right font-bold">{(item.netSales || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="py-2 px-2 text-right text-emerald-700 font-medium">{(item.profit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400 italic">No supplier records available</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* --- FOOTER --- */}
        <div className="fixed bottom-10 left-10 right-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 flex justify-between">
          <span>Printed by Admin</span>
          <span>Confidential | {business?.name || "Inzeedo POS"}</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
});

SalesBySupplierPrintTemplate.displayName = "SalesBySupplierPrintTemplate";