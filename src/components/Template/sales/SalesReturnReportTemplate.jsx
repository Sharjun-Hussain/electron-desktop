import { BRAND } from "@/lib/branding";
import React, { forwardRef } from "react";
import { format } from "@/lib/date-utils";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { ReportLayout } from "../ReportLayout";

export const SalesReturnReportTemplate = forwardRef(({ data, stats, dateRange, formatDateTime }, ref) => {
  const { formatCurrency } = useAppSettings();

  const formatDateLabel = (date) => {
    if (!date) return "";
    return formatDateTime ? formatDateTime(date) : format(new Date(date), "dd/MM/yyyy HH:mm");
  };

  return (
    <div ref={ref}>
      <ReportLayout
        title="Sales Return Report"
        subtitle="Performance & Audit Summary"
        filters={{
          'Period': dateRange?.from 
            ? (dateRange.to ? `${format(new Date(dateRange.from), "PPP")} - ${format(new Date(dateRange.to), "PPP")}` : format(new Date(dateRange.from), "PPP")) 
            : "All Time",
        }}
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 border rounded bg-slate-50">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total Returns</span>
            <div className="text-xl font-bold mt-1">{stats.totalReturns || 0}</div>
          </div>
          <div className="p-4 border rounded bg-slate-50">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Return Value</span>
            <div className="text-xl font-bold mt-1 max-w-full truncate" title={formatCurrency(stats.totalReturnAmount || 0)}>{formatCurrency(stats.totalReturnAmount || 0)}</div>
          </div>
          <div className="p-4 border rounded bg-slate-50">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Refunded</span>
            <div className="text-xl font-bold mt-1 text-emerald-600 max-w-full truncate" title={formatCurrency(stats.totalRefundAmount || 0)}>{formatCurrency(stats.totalRefundAmount || 0)}</div>
          </div>
          <div className="p-4 border rounded bg-slate-50">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Customers Affected</span>
            <div className="text-xl font-bold mt-1">{stats.uniqueCustomers || 0}</div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm text-left border-collapse report-table mb-12">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px]">Return #</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px]">Date</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px]">Invoice Ref</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px]">Customer</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px] text-right">Method</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px] text-right">Value</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest text-[10px] text-right">Refund</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-2 px-2 font-bold text-xs">{item.return_number}</td>
                <td className="py-2 px-2 text-xs text-slate-600 font-medium">{formatDateLabel(item.return_date || item.createdAt)}</td>
                <td className="py-2 px-2 font-bold text-xs text-slate-400">{item.sale?.invoice_number || item.invoice_number || "N/A"}</td>
                <td className="py-2 px-2 font-bold text-xs">{item.customer?.name || item.distributor?.name || "Walk-in"}</td>
                <td className="py-2 px-2 text-right">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {item.refund_method || item.sale?.payments?.[0]?.payment_method || "CASH"}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-bold text-xs">{formatCurrency(item.total_amount || 0)}</td>
                <td className="py-2 px-2 text-right font-bold text-xs text-emerald-600">{formatCurrency(item.refund_amount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Footer label in content area matching summary print */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          End of Report | {BRAND.REPORT_GENERATED_BY}
        </div>
      </ReportLayout>
    </div>
  );
});

SalesReturnReportTemplate.displayName = "SalesReturnReportTemplate";
