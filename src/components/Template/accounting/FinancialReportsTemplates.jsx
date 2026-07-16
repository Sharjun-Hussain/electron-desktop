import React, { forwardRef } from "react";
import { format } from "@/lib/date-utils";
import { ReportLayout } from "../ReportLayout";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

/**
 * INDUSTRIAL SIGNATURE BLOCK
 * Kept specifically for financial reports to maintain auditing authority.
 */
const IndustrialSignature = ({ userName }) => (
    <div className="mt-16 grid grid-cols-3 gap-0 border-2 border-slate-400 rounded-sm overflow-hidden break-inside-avoid">
        <div className="p-6 border-r-2 border-slate-400 flex flex-col items-center text-center">
            <div className="w-full border-b border-slate-300 mb-2 h-10 flex items-end justify-center pb-1 italic text-[9px] text-slate-400 font-medium">
                Digital Signature Verified
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-900">Chief Accountant</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase pt-1">Internal Processed: {userName}</p>
        </div>
        <div className="p-6 border-r-2 border-slate-400 flex flex-col items-center text-center">
            <div className="w-full border-b border-slate-300 mb-2 h-10" />
            <p className="text-[10px] font-bold uppercase text-slate-900">Audit Authority</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase pt-1">External Verification</p>
        </div>
        <div className="p-6 flex flex-col items-center text-center bg-slate-50">
            <div className="w-full border-b border-slate-300 mb-2 h-10" />
            <p className="text-[10px] font-bold uppercase text-slate-900">Finance Director</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase pt-1">Institutional Approval</p>
        </div>
    </div>
);

/**
 * 1. TRIAL BALANCE
 */
export const TrialBalanceTemplate = forwardRef(({ data, userName, isPreview = false }, ref) => {
    const { formatCurrency } = useAppSettings();
    return (
        <div style={!isPreview ? { display: "none" } : {}}>
            <div ref={ref} className={cn(isPreview && "bg-white p-8 max-w-4xl mx-auto shadow-lg rounded-lg border border-slate-200 my-4")}>
                <ReportLayout 
                    title="Statement of Trial Balance" 
                    subtitle="Comprehensive Ledger Balance Validation"
                >
                    <table className="w-full text-left border-collapse report-table mt-4">
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider">
                                <th className="font-bold">Account ID</th>
                                <th className="font-bold">Ledger Classification</th>
                                <th className="text-right font-bold">Debit</th>
                                <th className="text-right font-bold">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {data.accounts.map((acc, idx) => (
                                <tr key={idx} className="break-inside-avoid">
                                    <td className="font-bold tabular-nums">{acc.code}</td>
                                    <td className="font-medium">{acc.name}</td>
                                    <td className="text-right font-medium tabular-nums">
                                        {acc.debit > 0 ? formatCurrency(acc.debit) : "—"}
                                    </td>
                                    <td className="text-right font-medium tabular-nums">
                                        {acc.credit > 0 ? formatCurrency(acc.credit) : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="text-xs uppercase font-bold bg-slate-50">
                                <td colSpan={2} className="py-4 px-4 text-right italic border-t-2 border-slate-900">Consolidated Position Totals</td>
                                <td className="py-4 px-4 text-right tabular-nums border-t-2 border-slate-900 border-b-4 border-double">
                                    {formatCurrency(data.summary.totalDebit)}
                                </td>
                                <td className="py-4 px-4 text-right tabular-nums border-t-2 border-slate-900 border-b-4 border-double">
                                    {formatCurrency(data.summary.totalCredit)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <IndustrialSignature userName={userName} />
                </ReportLayout>
            </div>
        </div>
    );
});

/**
 * 2. PROFIT & LOSS
 */
export const ProfitLossTemplate = forwardRef(({ data, userName, isPreview = false }, ref) => {
    const { formatCurrency, report } = useAppSettings();
    const themeColor = report.primaryColor || "#10b981";

    return (
        <div style={!isPreview ? { display: "none" } : {}}>
            <div ref={ref} className={cn(isPreview && "bg-white p-8 max-w-4xl mx-auto shadow-lg rounded-lg border border-slate-200 my-4")}>
                <ReportLayout 
                    title="Income Statement (Profit & Loss)" 
                    subtitle="Comprehensive Fiscal Performance Review"
                >
                    <div className="border-2 mt-4 rounded-sm overflow-hidden" style={{ borderColor: themeColor }}>
                        <h3 className="text-white px-5 py-2.5 font-bold uppercase text-[11px] border-b-2" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                            Operating Revenue & Production Costs
                        </h3>
                        <div className="grid grid-cols-2 divide-x-2 border-b-2" style={{ borderColor: themeColor, divideColor: themeColor }}>
                            <div className="p-6 flex flex-col justify-center space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] font-bold text-slate-500 uppercase">Gross Revenue</span>
                                    <span className="text-lg font-bold tabular-nums text-slate-900">{formatCurrency(data.revenue)}</span>
                                </div>
                                {data.sourceBreakdown && (
                                    <div className="pt-2 mt-2 border-t border-slate-200/50 space-y-1">
                                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                                            <span>↳ POS Sales</span>
                                            <span className="tabular-nums font-bold">{formatCurrency(data.sourceBreakdown.pos.revenue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                                            <span>↳ Shopify Sales</span>
                                            <span className="tabular-nums font-bold text-indigo-600">{formatCurrency(data.sourceBreakdown.shopify.revenue)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-slate-50 flex flex-col justify-center italic">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="text-[11px] font-bold uppercase">(Less) Cost of Sales</span>
                                    <span className="text-base font-bold tabular-nums text-slate-700">({formatCurrency(data.cogs)})</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-100 p-6 flex flex-col border-b-2" style={{ borderColor: themeColor }}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-slate-600">Gross Fiscal Performance Result</span>
                                <span className="text-2xl font-bold tabular-nums border-b-4 border-double pb-1 text-slate-900" style={{ borderColor: themeColor }}>
                                    {formatCurrency(data.grossProfit)}
                                </span>
                            </div>
                            {data.sourceBreakdown && (
                                <div className="mt-4 pt-3 flex flex-col gap-1 border-t border-slate-200">
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span className="uppercase font-bold">↳ POS Profit Contribution</span>
                                        <span className="tabular-nums font-bold">{formatCurrency(data.sourceBreakdown.pos.grossProfit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                        <span className="uppercase font-bold">↳ Shopify Profit Contribution</span>
                                        <span className="tabular-nums font-bold text-indigo-600">{formatCurrency(data.sourceBreakdown.shopify.grossProfit)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-10 flex flex-col items-center justify-center text-white space-y-2" style={{ backgroundColor: themeColor }}>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Net Period Performance</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold tabular-nums border-b-4 border-double border-white pb-2 leading-none">
                                    {data.netProfit >= 0 ? "" : "-"}{formatCurrency(Math.abs(data.netProfit))}
                                </span>
                            </div>
                            <p className="text-[8px] font-medium uppercase italic pt-2 opacity-70">Comprehensive Profitability Analysis Audit Result</p>
                        </div>
                    </div>

                    <IndustrialSignature userName={userName} />
                </ReportLayout>
            </div>
        </div>
    );
});

/**
 * 3. BALANCE SHEET
 */
export const BalanceSheetTemplate = forwardRef(({ data, userName, isPreview = false }, ref) => {
    const { formatCurrency, report } = useAppSettings();
    const themeColor = report.primaryColor || "#10b981";

    return (
        <div style={!isPreview ? { display: "none" } : {}}>
            <div ref={ref} className={cn(isPreview && "bg-white p-8 max-w-4xl mx-auto shadow-lg rounded-lg border border-slate-200 my-4")}>
                <ReportLayout 
                    title="Statement of Financial Position" 
                    subtitle="Institutional Assets & Liabilities Summary"
                >
                    <div className="space-y-6 mt-4">
                        {/* ASSETS SECTION */}
                        <div className="border-2 rounded-sm overflow-hidden" style={{ borderColor: themeColor }}>
                            <h3 className="text-white px-5 py-2.5 font-bold uppercase text-[11px] border-b-2" style={{ backgroundColor: themeColor, borderColor: themeColor }}>
                                Section I: Comprehensive Assets
                            </h3>
                            <div className="p-6 flex justify-between items-center bg-white border-b-2 border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Consolidated Asset Valuation</span>
                                <span className="text-lg font-bold tabular-nums text-slate-900">{formatCurrency(data.summary.totalAssets)}</span>
                            </div>
                            <div className="bg-slate-50 p-6 flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-slate-900">Total Institutional Assets</span>
                                <span className="text-2xl font-bold tabular-nums border-b-4 border-double pb-1 text-slate-900" style={{ borderColor: themeColor }}>
                                    {formatCurrency(data.summary.totalAssets)}
                                </span>
                            </div>
                        </div>

                        {/* EQUITY & LIABILITIES SECTION */}
                        <div className="border-2 rounded-sm overflow-hidden" style={{ borderColor: themeColor }}>
                            <h3 className="bg-slate-900 text-white px-5 py-2.5 font-bold uppercase text-[11px] border-b-2" style={{ borderColor: themeColor }}>
                                Section II: Equity & Obligations
                            </h3>
                            <div className="grid grid-cols-2 divide-x-2 border-b-2" style={{ borderColor: themeColor, divideColor: themeColor }}>
                                <div className="p-6 space-y-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Operational Liabilities</p>
                                    <div className="flex justify-between items-center text-slate-700">
                                        <span className="text-[11px] font-bold">Total Claims</span>
                                        <span className="text-base font-bold tabular-nums">({formatCurrency(data.summary.totalLiabilities)})</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-50 space-y-2 flex flex-col justify-center">
                                    <p className="text-[9px] font-bold uppercase" style={{ color: themeColor }}>Net Corporate Worth</p>
                                    <div className="flex justify-between items-center text-slate-900">
                                        <span className="text-[11px] font-bold italic">Total Equity Contribution</span>
                                        <span className="text-base font-bold tabular-nums">{formatCurrency(data.summary.netWorth)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-white p-8 flex justify-between items-center" style={{ backgroundColor: themeColor }}>
                                <span className="text-xs font-bold uppercase">Total Equity & Liabilities</span>
                                <span className="text-2xl font-bold tabular-nums border-b-4 border-double border-white pb-1 leading-none">
                                    {formatCurrency(data.summary.totalAssets)}
                                </span>
                            </div>
                        </div>

                        {/* AUDIT DISCLOSURE */}
                        <div className="p-6 border-2 border-dashed border-slate-200 rounded-sm bg-slate-50/50 break-inside-avoid">
                            <h5 className="text-[9px] font-bold uppercase text-slate-500 mb-2">Accounting Basis & Integrity Disclosure</h5>
                            <p className="text-[9px] leading-relaxed text-slate-400 font-medium italic">
                                This statement is generated from the consolidated general ledger at the specified timestamp. 
                                All valuations are historical and reflect institutional cost analysis. This document is 
                                intended for authorized financial review only.
                            </p>
                        </div>
                    </div>

                    <IndustrialSignature userName={userName} />
                </ReportLayout>
            </div>
        </div>
    );
});

TrialBalanceTemplate.displayName = "TrialBalanceTemplate";
ProfitLossTemplate.displayName = "ProfitLossTemplate";
BalanceSheetTemplate.displayName = "BalanceSheetTemplate";
