import React from "react";
import { format } from "date-fns";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export const ReportLayout = ({ children, title, subtitle, filters, stats, reportType = "Standard" }) => {
  const { business, report } = useAppSettings();
  
  const themeColor = report.primaryColor || "#10b981";
  
  return (
    <div className="p-8 font-sans text-slate-900 bg-white" style={{ width: report.orientation === 'landscape' ? "297mm" : "210mm", minHeight: report.orientation === 'landscape' ? "210mm" : "297mm", fontSize: `${report.fontSize}pt` }}>
      
      {/* Global Print CSS */}
      <style type="text/css" media="print">
        {`
          @page { size: ${report.pageSize} ${report.orientation}; margin: 0mm; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .report-table thead th { background-color: ${report.accentTableHead ? themeColor : '#f1f5f9'} !important; color: ${report.accentTableHead ? 'white' : '#475569'} !important; }
          .report-table th, .report-table td {
             border-bottom: ${report.showBorders ? '1px solid #e2e8f0' : 'none'} !important;
             padding: ${report.rowDensity === 'compact' ? '4px 8px' : report.rowDensity === 'spacious' ? '16px 8px' : '8px 8px'} !important;
          }
        `}
      </style>

      {/* --- HEADER --- */}
      <div className="border-b-2 pb-6 mb-8 flex justify-between items-start" style={{ borderColor: themeColor }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
             {report.showLogo && (
               <div className="bg-slate-900 rounded flex items-center justify-center text-white font-bold" style={{ height: `${report.logoHeight}px`, width: `${report.logoHeight}px`, fontSize: `${report.logoHeight/3}px` }}>
                 {business?.name?.[0] || "P"}
               </div>
             )}
             <div>
               <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">{business?.name || "Inzeedo POS"}</h1>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{report.headerTitle || "Business Report"}</p>
             </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mt-4">{title || "Report"}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          
          <div className="mt-4 text-[10px] text-slate-500 space-y-2">
            {(report.showAddress || report.showContact) && (
              <div className="space-y-0.5">
                {report.showAddress && <p>{business?.address || "No 123, Business Road, Colombo"}</p>}
                {report.showContact && <p>{business?.phone || "+94 11 234 5678"} | {business?.email || "contact@business.com"}</p>}
              </div>
            )}
            
            {/* Branch Details */}
            {report.showBranchDetails && (filters?.branch || filters?.store) && (
              <div className="space-y-0.5 pt-1 border-t border-slate-100 max-w-sm">
                <p><strong>Branch:</strong> {filters?.branch?.name || filters?.store || "Main Branch"}</p>
                {filters?.branch?.address && <p>{filters.branch.address}</p>}
                {filters?.branch?.manager?.name && <p><strong>Manager:</strong> {filters.branch.manager.name}</p>}
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right text-[10px] text-slate-600 space-y-1">
          {report.showGeneratedDate && <p><strong>Date Generated:</strong> {format(new Date(), "dd MMM yyyy, HH:mm a")}</p>}
          {Object.entries(filters || {}).map(([key, val]) => {
            if (key === 'store' || key === 'branch') return null;
            return <p key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {val}</p>
          })}
          {report.showConfidentialTag && (
            <div className="inline-block mt-2 px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-600 font-bold uppercase tracking-tighter text-[8px]">
              Confidential
            </div>
          )}
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1">
        {children}
      </div>

      {/* --- FOOTER --- */}
      <div className="fixed bottom-10 left-10 right-10 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex justify-between items-center">
        {report.showPrintedBy && <span>Printed by Authorized User</span>}
        <span className="flex-1 px-8 italic">{report.footerText}</span>
        {report.showPageNumbers && <span>Page 1 of 1</span>}
      </div>
    </div>
  );
};
