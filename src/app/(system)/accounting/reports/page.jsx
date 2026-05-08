"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/auth/DesktopAuthProvider';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, TrendingUp, BarChart3, PieChart, Wallet, ArrowUpRight, Printer, RotateCcw, Activity, ShieldCheck, Zap, Loader2, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from '@/app/hooks/useAppSettings';
import { useReactToPrint } from "react-to-print";
import { useRef } from 'react';
import { TrialBalanceTemplate, ProfitLossTemplate, BalanceSheetTemplate } from '@/components/Template/accounting/FinancialReportsTemplates';

export default function FinancialReportsPage() {
    const { data: session } = useSession();
    const { business, formatCurrency } = useAppSettings();
    const [activeTab, setActiveTab] = useState('trial-balance');
    const [loading, setLoading] = useState(true);
    
    // Print Refs
    const tbRef = useRef(null);
    const plRef = useRef(null);
    const bsRef = useRef(null);

    // Data states
    const [trialBalance, setTrialBalance] = useState({ accounts: [], summary: { totalDebit: 0, totalCredit: 0 } });
    const [pandL, setPandL] = useState({ revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, margin: 0 });
    const [capital, setCapital] = useState({ summary: { totalAssets: 0, totalLiabilities: 0, netWorth: 0 } });

    const fetchAllData = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            setLoading(true);
            const [tbRes, plRes, capRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/trial-balance`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/profit-loss`, { headers: { Authorization: `Bearer ${session.accessToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/capital-balance`, { headers: { Authorization: `Bearer ${session.accessToken}` } })
            ]);

            setTrialBalance(tbRes.data.data);
            setPandL(plRes.data.data);
            setCapital(capRes.data.data);
        } catch (error) {
            console.error('Error fetching financial reports:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // react-to-print hooks
    const handlePrintTB = useReactToPrint({
        contentRef: tbRef,
        documentTitle: `Trial_Balance_${format(new Date(), 'yyyyMMdd')}`,
    });

    const handlePrintPL = useReactToPrint({
        contentRef: plRef,
        documentTitle: `Profit_And_Loss_${format(new Date(), 'yyyyMMdd')}`,
    });

    const handlePrintBS = useReactToPrint({
        contentRef: bsRef,
        documentTitle: `Balance_Sheet_${format(new Date(), 'yyyyMMdd')}`,
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-black text-foreground uppercase tracking-widest leading-none mb-1">Fiscal Consolidation</p>
                    <p className="text-[10px] font-bold text-muted-foreground opacity-60">Compiling multi-ledger financial statements...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="flex-1 w-full p-6 lg:p-8 space-y-6 bg-background">

            {/* PAGE HEADER: Fluid width, clean CRM layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                        <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Financial Reports</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Consolidated performance and analytics hub
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-9 px-4 font-semibold shadow-sm"
                        onClick={fetchAllData}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 text-white">
                        <TrendingUp className="w-5 h-5 shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Net Revenue</p>
                        <h3 className="text-2xl font-bold text-foreground tabular-nums">
                            LKR {parseFloat(pandL.revenue).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
                        <ArrowUpRight className="w-5 h-5 shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
                        <h3 className="text-2xl font-bold text-red-600 tabular-nums">
                            LKR {parseFloat(pandL.expenses).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-lg text-white",
                        pandL.netProfit >= 0 ? "bg-gradient-to-br from-emerald-500 to-teal-400" : "bg-gradient-to-br from-red-500 to-orange-400"
                    )}>
                        <Activity className="w-5 h-5 shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
                        <h3 className={cn("text-2xl font-bold tabular-nums", pandL.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                            LKR {parseFloat(pandL.netProfit).toLocaleString()}
                        </h3>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-400 text-white">
                        <Landmark className="w-5 h-5 shadow-sm" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Business Worth</p>
                        <h3 className="text-2xl font-bold text-foreground tabular-nums">
                            LKR {parseFloat(capital.summary.netWorth).toLocaleString()}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION & CONTENT */}
            <Tabs defaultValue="trial-balance" onValueChange={setActiveTab} className="w-full print:hidden flex flex-col">
                <div className="border-b border-border mb-6">
                    <TabsList className="bg-transparent h-10 w-full justify-start p-0 border-b-0 space-x-1">
                        <TabsTrigger
                            value="trial-balance"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-[13px] h-full px-4 transition-all"
                        >
                            Trial Balance
                        </TabsTrigger>
                        <TabsTrigger
                            value="profit-loss"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-[13px] h-full px-4 transition-all"
                        >
                            Profit & Loss
                        </TabsTrigger>
                        <TabsTrigger
                            value="balance-sheet"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 rounded-none font-medium text-[13px] h-full px-4 transition-all"
                        >
                            Balance Sheet
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* 1. TRIAL BALANCE TAB */}
                <TabsContent value="trial-balance" className="mt-0 focus-visible:ring-0">
                    <Card className="shadow-xs border-border overflow-hidden">
                        <div className="px-6 py-5 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">Statement of Trial Balance</CardTitle>
                                <CardDescription className="text-sm">Comprehensive ledger balances as of {format(new Date(), 'dd MMM yyyy')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 font-medium shadow-xs w-full sm:w-auto" onClick={handlePrintTB}>
                                <Printer className="mr-2 h-3.5 w-3.5" />
                                Print Statement
                            </Button>
                        </div>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground h-10 px-6">Account Details</TableHead>
                                        <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground h-10 px-6">Classification</TableHead>
                                        <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground h-10 px-6">Debit</TableHead>
                                        <TableHead className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground h-10 px-6">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trialBalance.accounts.map((acc) => (
                                        <TableRow key={acc.id} className="transition-colors hover:bg-muted/30">
                                            <TableCell className="py-3 px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{acc.name}</span>
                                                    <span className="text-xs text-muted-foreground">{acc.code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-6 border-border">
                                                <Badge variant="outline" className="capitalize text-xs font-medium text-muted-foreground border-border bg-transparent">
                                                    {acc.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-6 text-right font-medium tabular-nums text-foreground">
                                                {acc.debit > 0 ? acc.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                            <TableCell className="py-3 px-6 text-right font-medium tabular-nums text-emerald-600">
                                                {acc.credit > 0 ? acc.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/30 font-semibold border-t border-border hover:bg-muted/30">
                                        <TableCell colSpan={2} className="py-4 px-6 text-foreground">
                                            Consolidated Statement Totals
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right tabular-nums text-foreground">
                                            {trialBalance.summary.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right tabular-nums text-emerald-600">
                                            {trialBalance.summary.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. PROFIT & LOSS TAB */}
                <TabsContent value="profit-loss" className="mt-0 focus-visible:ring-0">
                    <Card className="shadow-xs border-border overflow-hidden focus-visible:ring-0">
                        <div className="px-6 py-5 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">Income Statement (Profit & Loss)</CardTitle>
                                <CardDescription className="text-sm">Earnings and efficiency metrics for the current period.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 font-medium shadow-xs w-full sm:w-auto" onClick={handlePrintPL}>
                                <Printer className="mr-2 h-3.5 w-3.5" />
                                Print Income Statement
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-100">
                                <div className="flex justify-between items-center px-6 py-4">
                                    <span className="text-sm font-medium text-muted-foreground">Gross Sales Revenue</span>
                                    <span className="text-lg font-bold tabular-nums text-foreground">{pandL.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 text-red-600">
                                    <span className="text-sm font-medium">(Less) Cost of Goods Sold</span>
                                    <span className="text-base font-semibold tabular-nums">({pandL.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center px-6 py-5 bg-muted/20 border-y border-border">
                                    <span className="text-sm font-bold text-foreground">Gross Trading Profit</span>
                                    <span className="text-lg font-bold tabular-nums text-foreground">{pandL.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 text-red-600">
                                    <span className="text-sm font-medium">(Less) Operating Expenses</span>
                                    <span className="text-base font-semibold tabular-nums">({pandL.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})</span>
                                </div>
                                <div className="flex justify-between items-center px-6 py-6 bg-emerald-50/30 dark:bg-emerald-500/5 border-t border-border">
                                    <span className="text-base font-bold text-emerald-800 dark:text-emerald-400">Net Profit / Loss</span>
                                    <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                                        <span className="text-sm font-medium opacity-70 mr-1">LKR</span>
                                        {pandL.netProfit >= 0 ? '' : '-'}{Math.abs(pandL.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* Inner Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
                                <div className="bg-background p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Gross Margin</p>
                                    <p className="text-lg font-bold text-foreground">{( (pandL.grossProfit / pandL.revenue) * 100 || 0).toFixed(1)}%</p>
                                </div>
                                <div className="bg-background p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Net Margin</p>
                                    <p className="text-lg font-bold text-foreground">{pandL.margin.toFixed(1)}%</p>
                                </div>
                                <div className="bg-background p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Efficiency Ratio</p>
                                    <p className="text-lg font-bold text-foreground">{( (pandL.expenses / pandL.revenue) * 100 || 0).toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. BALANCE SHEET TAB */}
                <TabsContent value="balance-sheet" className="mt-0 focus-visible:ring-0">
                    <Card className="shadow-xs border-border overflow-hidden">
                        <div className="px-6 py-5 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight">Statement of Financial Position</CardTitle>
                                <CardDescription className="text-sm">Current asset, liability, and equity profile.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="h-8 font-medium shadow-xs w-full sm:w-auto" onClick={handlePrintBS}>
                                <Printer className="mr-2 h-3.5 w-3.5" />
                                Print Position
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

                                {/* Assets Column */}
                                 <div className="p-6 space-y-4 text-left">
                                    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Assets</h3>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-foreground">Total Current & Fixed Assets</span>
                                        <span className="font-bold tabular-nums text-foreground">{capital.summary.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">Includes Bank, Cash, Inventory, and Fixed Assets.</p>
                                </div>

                                {/* Liabilities & Equity Column */}
                                 <div className="p-6 space-y-4 flex flex-col text-left">
                                    <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Liabilities & Equity</h3>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-foreground">Consolidated Liabilities</span>
                                        <span className="font-bold tabular-nums text-foreground">{capital.summary.totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border border-border">
                                            <span className="text-sm font-bold uppercase tracking-wide text-foreground">Net Worth / Equity</span>
                                            <span className="text-lg font-bold tabular-nums text-foreground">LKR {capital.summary.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                             {/* Health Benchmarks Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
                                 <div className="bg-background p-6 flex flex-col items-center justify-center text-center">
                                     <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Debt to Asset Ratio</p>
                                     <p className="text-lg font-bold text-foreground">{(capital.summary.totalLiabilities / capital.summary.totalAssets * 100 || 0).toFixed(1)}%</p>
                                 </div>
                                 <div className="bg-background p-6 flex flex-col items-center justify-center text-center">
                                     <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Liquidity Score</p>
                                     <p className="text-lg font-bold text-emerald-600">PRIME</p>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* HIDDEN PRINT TEMPLATES - Targeted by react-to-print */}
            <div className="hidden">
               <TrialBalanceTemplate 
                   ref={tbRef} 
                   data={trialBalance} 
                   business={business} 
                   userName={session?.user?.name} 
               />
               <ProfitLossTemplate 
                   ref={plRef} 
                   data={pandL} 
                   business={business} 
                   userName={session?.user?.name} 
               />
               <BalanceSheetTemplate 
                   ref={bsRef} 
                   data={capital} 
                   business={business} 
                   userName={session?.user?.name} 
               />
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            `}</style>
        </div>
    );
}