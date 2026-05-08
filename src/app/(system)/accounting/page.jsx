'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/components/auth/DesktopAuthProvider';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataActions } from "@/components/general/DataActions";
import { Plus, Search, Filter, RotateCcw, Landmark, Wallet, TrendingDown, TrendingUp, History, Pencil, ArrowLeftRight, X, Check, ChevronsUpDown, Loader2, Calendar as CalendarIcon, FolderDown, HelpCircle, FileDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export default function ChartOfAccountsPage() {
    const { data: session } = useSession();
    
    const ACCOUNT_TYPE_GUIDE = {
        asset: {
            title: "Asset",
            description: "What your business owns",
            examples: "Bank accounts, Cash, Inventory, Equipment, Properties",
            accent: "emerald",
            range: "1000 - 1999"
        },
        liability: {
            title: "Liability",
            description: "What your business owes to others",
            examples: "Bank loans, Unpaid bills (Payables), Credit cards",
            accent: "red",
            range: "2000 - 2999"
        },
        equity: {
            title: "Equity",
            description: "Net worth / Owner's investment",
            examples: "Owner capital, Retained earnings, Stock",
            accent: "indigo",
            range: "3000 - 3999"
        },
        revenue: {
            title: "Revenue",
            description: "Income generated from activities",
            examples: "Sales, Service fees, Interest income",
            accent: "blue",
            range: "4000 - 4999"
        },
        expense: {
            title: "Expense",
            description: "Costs of running the business",
            examples: "Rent, Salaries, Utilities, Purchases",
            accent: "amber",
            range: "5000 - 5999"
        }
    };

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLedgerDialogOpen, setIsLedgerDialogOpen] = useState(false);
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [ledgerData, setLedgerData] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [transferData, setTransferData] = useState({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
    });
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'asset',
        balance: 0
    });
    const [isTransferring, setIsTransferring] = useState(false);

    useEffect(() => {
        if (session) {
            fetchAccounts();
        }
    }, [session]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch chart of accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, formData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Account created successfully');
            setIsAddDialogOpen(false);
            fetchAccounts();
            setFormData({ name: '', code: '', type: 'asset', balance: 0 });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create account');
        }
    };

    const handleUpdateAccount = async () => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/${selectedAccount.id}`, formData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Account updated successfully');
            setIsEditDialogOpen(false);
            fetchAccounts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update account');
        }
    };

    const fetchAccountLedger = async (account) => {
        try {
            setSelectedAccount(account);
            setIsLedgerDialogOpen(true);
            setLedgerLoading(true);
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/${account.id}/ledger`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setLedgerData(response.data.data.data);
        } catch (error) {
            console.error('Error fetching account ledger:', error);
            toast.error('Failed to fetch account ledger');
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (transferData.from_account_id === transferData.to_account_id) {
            toast.error('Source and destination accounts must be different');
            return;
        }

        try {
            setIsTransferring(true);
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/transfer`, transferData, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            toast.success('Funds transferred successfully');
            setIsTransferDialogOpen(false);
            fetchAccounts();
            setTransferData({ from_account_id: '', to_account_id: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to transfer funds');
        } finally {
            setIsTransferring(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'asset': return <Wallet className="h-4 w-4 text-emerald-500" />;
            case 'liability': return <TrendingDown className="h-4 w-4 text-red-500" />;
            case 'equity': return <Landmark className="h-4 w-4 text-indigo-500" />;
            case 'revenue': return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case 'expense': return <History className="h-4 w-4 text-amber-500" />;
            default: return <Plus className="h-4 w-4 text-slate-500" />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                        <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Chart of Accounts</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage your financial accounts and balances
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DataActions 
                        data={accounts.map(a => ({
                            'Account Code': a.code,
                            'Account Name': a.name,
                            'Type': a.type.toUpperCase(),
                            'Balance (LKR)': parseFloat(a.balance).toFixed(2),
                            'Status': a.is_active ? 'Active' : 'Inactive'
                        }))}
                        fileName="Chart_of_Accounts"
                    />

                    <Button
                        variant="outline"
                        className="h-9 px-4 font-medium text-[13px] gap-2"
                        onClick={fetchAccounts}
                        disabled={loading}
                    >
                        <RotateCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        className="h-9 px-4 font-medium text-[13px] gap-2"
                        onClick={() => setIsTransferDialogOpen(true)}
                    >
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                        Transfer
                    </Button>
                    <Button
                        variant="default"
                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[13px] gap-2"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <Plus className="h-4 w-4" />
                        Add Account
                    </Button>
                </div>
            </div>

            <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card/10 backdrop-blur-sm p-0 gap-0">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/60">
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6 w-[100px]">Code</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6">Account Name</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6">Type</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6 text-right">Balance</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6">Status</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase text-muted-foreground/70 py-3 px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <RotateCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                                        <p className="text-[13px] font-semibold text-muted-foreground/50">Loading chart of accounts...</p>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <Landmark className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4 opacity-30" />
                                        <p className="text-[13px] font-semibold text-muted-foreground/50">No accounts found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id} className="group hover:bg-muted/40 transition-colors border-border/40">
                                        <TableCell className="py-4 px-6">
                                            <code className="text-[11px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">
                                                {account.code}
                                            </code>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <p className="text-sm font-medium text-foreground">{account.name}</p>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(account.type)}
                                                <span className="text-xs font-medium capitalize text-muted-foreground">
                                                    {account.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right font-mono font-bold text-foreground">
                                            LKR {parseFloat(account.balance).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <StatusBadge value={account.is_active} />
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-muted/50 border border-transparent shadow-none"
                                                    onClick={() => {
                                                        setSelectedAccount(account);
                                                        setFormData({
                                                            name: account.name,
                                                            code: account.code,
                                                            type: account.type,
                                                            balance: account.balance
                                                        });
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 rounded-lg hover:bg-muted/50 border border-transparent shadow-none"
                                                    onClick={() => fetchAccountLedger(account)}
                                                >
                                                    <History className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background">
                    <SheetHeader className="px-6 py-5 border-b border-border bg-card/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-xl font-bold">Add New Account</SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground mt-0.5">Create a new entry in your chart of accounts</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 text-left">
                                <div className="flex items-center gap-1.5">
                                    <Label className="text-sm font-medium text-muted-foreground">Account Code</Label>
                                    <TooltipProvider delayDuration={100}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help inline-flex items-center group">
                                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                                    <span className="sr-only">Code numbering help</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="w-64 p-3 bg-popover border-border shadow-xl">
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-bold uppercase text-foreground">Standard Numbering</h4>
                                                    <div className="text-[11px] space-y-1 text-muted-foreground">
                                                        <p className="flex justify-between"><span>Assets</span> <span className="font-mono font-bold text-emerald-600">1000 - 1999</span></p>
                                                        <p className="flex justify-between"><span>Liabilities</span> <span className="font-mono font-bold text-red-600">2000 - 2999</span></p>
                                                        <p className="flex justify-between"><span>Equity</span> <span className="font-mono font-bold text-indigo-600">3000 - 3999</span></p>
                                                        <p className="flex justify-between"><span>Revenue</span> <span className="font-mono font-bold text-blue-600">4000 - 4999</span></p>
                                                        <p className="flex justify-between"><span>Expenses</span> <span className="font-mono font-bold text-amber-600">5000 - 5999</span></p>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Input
                                    placeholder="e.g. 1020"
                                    className="h-9 text-sm bg-background border-border focus-visible:ring-emerald-500/20"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5 text-left">
                                <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger className="h-9 text-sm w-full bg-background border-border focus:ring-emerald-500/20">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asset" className="text-sm">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-sm">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-sm">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-sm">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-sm">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                            <Input
                                placeholder="e.g. Current Assets"
                                className="h-9 text-sm bg-background border-border focus-visible:ring-emerald-500/20"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Opening Balance (Optional)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-9 text-sm font-mono bg-background border-border focus-visible:ring-emerald-500/20"
                                value={formData.balance}
                                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                            />
                        </div>

                        {/* GUIDANCE SECTION */}
                        {formData.type && ACCOUNT_TYPE_GUIDE[formData.type] && (
                            <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 leading-none">Accounting Guidance</h4>
                                <div className={cn(
                                    "p-4 rounded-md border bg-background shadow-xs",
                                    `border-${ACCOUNT_TYPE_GUIDE[formData.type].accent}-500/20 ring-1 ring-${ACCOUNT_TYPE_GUIDE[formData.type].accent}-500/5`
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={cn("w-2 h-2 rounded-full", `bg-${ACCOUNT_TYPE_GUIDE[formData.type].accent}-500`)} />
                                        <div className="flex items-center justify-between w-full">
                                            <span className={cn("text-sm font-bold", `text-${ACCOUNT_TYPE_GUIDE[formData.type].accent}-600`)}>
                                                {ACCOUNT_TYPE_GUIDE[formData.type].title}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                Range: {ACCOUNT_TYPE_GUIDE[formData.type].range}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">
                                        {ACCOUNT_TYPE_GUIDE[formData.type].description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">
                                        Examples: {ACCOUNT_TYPE_GUIDE[formData.type].examples}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-border bg-card/10 flex justify-end mt-auto shrink-0">
                        <Button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm w-full" onClick={handleCreateAccount}>
                            <FolderDown className="h-4 w-4 mr-2" />
                            Save Account
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden bg-background">
                    <SheetHeader className="px-6 py-5 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                                <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-xl font-bold">Edit Account</SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground mt-0.5">Update chart of account details</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-muted-foreground">Account Code</Label>
                                <Input disabled className="h-9 text-sm bg-gray-50 border-gray-200" value={formData.code} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger className="h-9 text-sm w-full bg-background border-border focus:ring-emerald-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="asset" className="text-sm">Asset</SelectItem>
                                        <SelectItem value="liability" className="text-sm">Liability</SelectItem>
                                        <SelectItem value="equity" className="text-sm">Equity</SelectItem>
                                        <SelectItem value="revenue" className="text-sm">Revenue</SelectItem>
                                        <SelectItem value="expense" className="text-sm">Expense</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                            <Input
                                className="h-9 text-sm bg-background border-border focus-visible:ring-emerald-500/20"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border bg-card/10 flex justify-end mt-auto shrink-0">
                        <Button className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm w-full" onClick={handleUpdateAccount}>
                            <FolderDown className="h-4 w-4 mr-2" />
                            Update Account
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isLedgerDialogOpen} onOpenChange={setIsLedgerDialogOpen}>
                <SheetContent className="flex flex-col w-full sm:max-w-4xl p-0 overflow-hidden bg-background shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-border bg-card/10">
                        <div className="flex justify-between items-center pr-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                                    <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="text-left">
                                    <SheetTitle className="text-lg font-bold">Transaction History</SheetTitle>
                                    <SheetDescription className="text-sm text-muted-foreground mt-0.5">
                                        Statement for <span className="text-foreground font-medium">{selectedAccount?.name}</span> ({selectedAccount?.code})
                                    </SheetDescription>
                                </div>
                            </div>
                            <div className="text-right sr-only md:not-sr-only">
                                <p className="text-[11px] font-medium text-muted-foreground">Current Balance</p>
                                <p className="text-2xl font-semibold text-emerald-600 tabular-nums">
                                    LKR {parseFloat(selectedAccount?.balance || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-0 custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="text-[11px] font-medium text-muted-foreground/70 py-3 px-6 h-10">Date</TableHead>
                                    <TableHead className="text-[11px] font-medium text-muted-foreground/70 py-3 px-6 h-10">Reference</TableHead>
                                    <TableHead className="text-[11px] font-medium text-muted-foreground/70 py-3 px-6 h-10">Description</TableHead>
                                    <TableHead className="text-right text-[11px] font-medium text-muted-foreground/70 py-3 px-6 h-10">Debit</TableHead>
                                    <TableHead className="text-right text-[11px] font-medium text-muted-foreground/70 py-3 px-6 h-10">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <RotateCcw className="h-8 w-8 animate-spin mx-auto text-muted-foreground/30 mb-4" />
                                            <p className="text-xs font-medium text-muted-foreground/50">Fetching Ledger Entries...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : ledgerData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20">
                                            <History className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4 opacity-30" />
                                            <p className="text-xs font-medium text-muted-foreground/50">No transactions recorded yet</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgerData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-border/40">
                                            <TableCell className="py-3 px-6 font-medium text-[13px] text-muted-foreground whitespace-nowrap">
                                                {format(new Date(row.transaction_date), 'dd MMM yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="py-3 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-medium text-foreground">{row.reference_type}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">{row.reference_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-6">
                                                <div className="flex flex-col max-w-[250px] gap-1">
                                                    <p className="text-[13px] font-medium text-muted-foreground leading-snug">
                                                        {row.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {row.customer && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded">CUST: {row.customer.name}</span>}
                                                        {row.supplier && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded">SUPP: {row.supplier.name}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-6 text-right font-mono text-[13px] font-medium text-foreground whitespace-nowrap">
                                                {row.type === 'debit' ? parseFloat(row.amount).toFixed(2) : '-'}
                                            </TableCell>
                                            <TableCell className="py-3 px-6 text-right font-mono text-[13px] font-medium text-emerald-600 whitespace-nowrap">
                                                {row.type === 'credit' ? parseFloat(row.amount).toFixed(2) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-6 border-t border-border bg-card/10 flex justify-between items-center mt-auto shrink-0">
                        <div className="text-[13px] font-medium text-muted-foreground italic">
                            Transaction Summary: <span className="text-foreground font-semibold uppercase">{ledgerData.length} records retrieved</span>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                <SheetContent className="flex flex-col sm:max-w-md w-full p-0 border-l border-border bg-background overflow-hidden">
                    <SheetHeader className="px-6 py-5 border-b border-border bg-card/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                                <ArrowLeftRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                                <SheetTitle className="text-xl font-bold">Transfer Funds</SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground mt-0.5">Move money between your accounts</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">From Account</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal bg-white border-gray-200">
                                        {transferData.from_account_id ? accounts.find(a => a.id === transferData.from_account_id)?.name : "Select Source Account"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search accounts..." />
                                        <CommandList>
                                            <CommandEmpty>No account found.</CommandEmpty>
                                            <CommandGroup>
                                                {accounts.map(a => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={`${a.code} ${a.name}`}
                                                        onSelect={() => setTransferData({ ...transferData, from_account_id: a.id })}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-emerald-500", transferData.from_account_id === a.id ? "opacity-100" : "opacity-0")} />
                                                        {a.code} - {a.name} <span className="ml-auto text-muted-foreground font-mono text-xs">LKR {parseFloat(a.balance).toFixed(2)}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">To Account</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal bg-white border-gray-200">
                                        {transferData.to_account_id ? accounts.find(a => a.id === transferData.to_account_id)?.name : "Select Destination Account"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search accounts..." />
                                        <CommandList>
                                            <CommandEmpty>No account found.</CommandEmpty>
                                            <CommandGroup>
                                                {accounts.map(a => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={`${a.code} ${a.name}`}
                                                        onSelect={() => setTransferData({ ...transferData, to_account_id: a.id })}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4 text-emerald-500", transferData.to_account_id === a.id ? "opacity-100" : "opacity-0")} />
                                                        {a.code} - {a.name} <span className="ml-auto text-muted-foreground font-mono text-xs">LKR {parseFloat(a.balance).toFixed(2)}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-muted-foreground">Amount (LKR)</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-9 text-sm font-mono border-border bg-background focus-visible:ring-emerald-500/20"
                                    value={transferData.amount}
                                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left h-9 text-sm font-normal bg-background border-border focus-visible:ring-emerald-500/20",
                                                !transferData.date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                            {transferData.date ? format(parseISO(transferData.date), "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={transferData.date ? parseISO(transferData.date) : undefined}
                                            onSelect={(date) => setTransferData({ ...transferData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Notes / Description</Label>
                            <Input
                                placeholder="Purpose of transfer..."
                                className="h-9 text-sm bg-background border-border"
                                value={transferData.description}
                                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-border bg-card/10 flex justify-end mt-auto shrink-0">
                        <Button
                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-sm w-full"
                            onClick={handleTransfer}
                            disabled={!transferData.from_account_id || !transferData.to_account_id || !transferData.amount || isTransferring}
                        >
                            {isTransferring ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Perform Transfer"
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

