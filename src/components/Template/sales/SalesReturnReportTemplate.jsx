
import React, { forwardRef } from "react";
import { format } from "date-fns";
import { useAppSettings } from "@/app/hooks/useAppSettings";

export const SalesReturnReportTemplate = forwardRef(({ data, stats, dateRange, formatDateTime }, ref) => {
  const { business } = useAppSettings();
  const formatDate = (date) => {
    if (!date) return "";
    return format(new Date(date), "dd/MM/yyyy");
  };

  return (
    <div ref={ref} className="p-12 bg-white text-slate-900 print:p-8" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <style type="text/css" media="print">{`@page { size: A4; margin: 10mm; } body { margin: 0; } * { font-family: Arial, Helvetica, sans-serif !important; }`}</style>
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">Sales Return Report</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            Performance & Audit Summary
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Date Range</p>
          <p className="text-lg font-bold">
            {dateRange?.from ? formatDate(dateRange.from) : "Start"} - {dateRange?.to ? formatDate(dateRange.to) : "End"}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-50 p-6 border-l-4 border-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Returns</p>
          <p className="text-2xl font-black">{stats.totalReturns || 0}</p>
        </div>
        <div className="bg-slate-50 p-6 border-l-4 border-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Return Value</p>
          <p className="text-2xl font-black">Rs. {(stats.totalReturnAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-6 border-l-4 border-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Refunded</p>
          <p className="text-2xl font-black text-emerald-600">Rs. {(stats.totalRefundAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-6 border-l-4 border-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Customers Affected</p>
          <p className="text-2xl font-black">{stats.uniqueCustomers || 0}</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-left border-collapse mb-12">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-4 font-black uppercase tracking-widest text-xs">Return #</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs">Date</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs">Invoice Ref</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs">Customer</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs text-right">Method</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs text-right">Value</th>
            <th className="py-4 font-black uppercase tracking-widest text-xs text-right">Refund</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-4 font-bold text-sm tracking-tighter uppercase">{item.return_number}</td>
              <td className="py-4 text-sm text-slate-600 font-medium">{formatDate(item.return_date)}</td>
              <td className="py-4 font-bold text-sm text-slate-400">{item.sale?.invoice_number || "N/A"}</td>
              <td className="py-4 font-bold text-sm">{item.customer?.name || "Walk-in"}</td>
              <td className="py-4 text-right">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded">
                  {item.refund_method || "CASH"}
                </span>
              </td>
              <td className="py-4 text-right font-bold text-sm">Rs. {(item.total_amount || 0).toLocaleString()}</td>
              <td className="py-4 text-right font-black text-sm text-emerald-600">Rs. {(item.refund_amount || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-slate-200 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{business?.name || "Inzeedo POS System"}</p>
          <p className="text-[10px] font-medium text-slate-400">Generated on {format(new Date(), "PPpp")}</p>
        </div>
        <div className="text-right">
          <div className="h-1 w-32 bg-slate-200 mb-2 ml-auto" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Signature</p>
        </div>
      </div>
    </div>
  );
});

SalesReturnReportTemplate.displayName = "SalesReturnReportTemplate";
