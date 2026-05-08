'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useSession } from '@/components/auth/DesktopAuthProvider';
import axios from 'axios';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
    Plus, Save, RotateCcw, BookOpen, AlertCircle,
    CheckCircle2, Trash2, Check, ChevronsUpDown, Calendar as CalendarIcon
} from 'lucide-react';

import { cn } from "@/lib/utils";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import {
    Command, CommandEmpty, CommandGroup,
    CommandInput, CommandItem, CommandList
} from '@/components/ui/command';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// =================================================================================
// 1. Custom Hook for Logic: /hooks/useManualJournal.js
// =================================================================================
// Encapsulates all state, derived values, and functions for the journal page.
// =================================================================================

const createNewEntry = () => ({
    account_id: '',
    debit: '',
    credit: '',
    key: `entry_${Date.now()}_${Math.random()}`
});

const INITIAL_ENTRIES = [createNewEntry(), createNewEntry()];

export function useManualJournal() {
    const { data: session } = useSession();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState({ fetch: false, post: false });

    const [journalDate, setJournalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState(INITIAL_ENTRIES);

    const fetchAccounts = useCallback(async () => {
        if (!session?.accessToken) return;
        setLoading(prev => ({ ...prev, fetch: true }));
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setAccounts(response.data.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to fetch accounts.');
        } finally {
            setLoading(prev => ({ ...prev, fetch: false }));
        }
    }, [session]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const totals = useMemo(() => {
        return entries.reduce((acc, e) => {
            acc.debit += (parseFloat(e.debit) || 0);
            acc.credit += (parseFloat(e.credit) || 0);
            return acc;
        }, { debit: 0, credit: 0 });
    }, [entries]);

    const isBalanced = useMemo(() => {
        return totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.01;
    }, [totals]);

    const hasValidEntries = useMemo(() => {
        return entries.some(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0) && e.account_id);
    }, [entries]);

    const canPost = useMemo(() => {
        const activeEntries = entries.filter(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0));
        return isBalanced && description && hasValidEntries && activeEntries.every(e => e.account_id);
    }, [isBalanced, description, hasValidEntries, entries]);

    const addEntry = useCallback(() => {
        setEntries(prev => [...prev, createNewEntry()]);
    }, []);

    const removeEntry = useCallback((key) => {
        setEntries(prev => {
            if (prev.length <= 2) {
                toast.error('At least two entries are required');
                return prev;
            }
            return prev.filter(e => e.key !== key);
        });
    }, []);

    const updateEntry = useCallback((key, field, value) => {
        setEntries(prev => prev.map(e => {
            if (e.key === key) {
                const updated = { ...e, [field]: value };
                if (field === 'debit' && value) updated.credit = '';
                if (field === 'credit' && value) updated.debit = '';
                return updated;
            }
            return e;
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!canPost) {
            if (!description) toast.error('Description is required');
            else if (!isBalanced) toast.error('Journal entry must balance');
            else toast.error('All line items require a selected account.');
            return;
        }

        setLoading(prev => ({ ...prev, post: true }));
        try {
            const backendEntries = entries
                .filter(e => (parseFloat(e.debit) > 0 || parseFloat(e.credit) > 0) && e.account_id)
                .map(e => ({
                    account_id: e.account_id,
                    amount: e.debit ? parseFloat(e.debit) : parseFloat(e.credit),
                    type: e.debit ? 'debit' : 'credit'
                }));

            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts/journal`, {
                date: journalDate,
                description,
                entries: backendEntries
            }, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            toast.success('Journal entry recorded successfully');
            setDescription('');
            setEntries(INITIAL_ENTRIES);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to record journal entry');
        } finally {
            setLoading(prev => ({ ...prev, post: false }));
        }
    }, [canPost, entries, journalDate, description, session, isBalanced]);

    return {
        accounts, loading, journalDate, description, entries,
        setJournalDate, setDescription, totals, isBalanced, canPost,
        addEntry, removeEntry, updateEntry, handleSubmit,
    };
}


// =================================================================================
// 2. Memoized Child Component: /components/JournalEntryRow.jsx
// =================================================================================
// This component is wrapped in React.memo to prevent re-renders unless its
// specific props change, boosting performance significantly for lists.
// =================================================================================


const JournalEntryRow = memo(function JournalEntryRow({ entry, accounts, onUpdate, onRemove, isRemoveDisabled }) {
    const [open, setOpen] = useState(false);
    const handleUpdate = (field, value) => {
        onUpdate(entry.key, field, value);
        if (field === 'account_id') setOpen(false);
    };
    const handleRemove = () => onRemove(entry.key);

    const isDebit = parseFloat(entry.debit) > 0;
    const isCredit = parseFloat(entry.credit) > 0;

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-muted/20 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-border/40 shadow-sm transition-all hover:shadow-md hover:border-border/80 relative group">
            <div className="flex-1 w-full">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block md:hidden">Account Selection</label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between h-10 text-sm font-normal", !entry.account_id && "text-muted-foreground")}>
                            {entry.account_id ? accounts.find(a => a.id === entry.account_id)?.name : "Select account..."}
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
                                            onSelect={() => handleUpdate('account_id', a.id)}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4 text-emerald-500", entry.account_id === a.id ? "opacity-100" : "opacity-0")} />
                                            {a.code} - {a.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="w-full md:w-[200px]">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block md:hidden">Debit (LKR)</label>
                <div className="relative">
                    <Input
                        type="number" placeholder="0.00"
                        className={cn("h-10 rounded-lg font-mono text-sm font-bold text-right pl-8 transition-all border", isDebit ? "bg-background border-emerald-500 ring-4 ring-emerald-500/10" : "bg-muted/40 border-border/40 focus:bg-background focus:border-emerald-500/50")}
                        value={entry.debit} onChange={(e) => handleUpdate('debit', e.target.value)}
                    />
                    {isDebit && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
            </div>
            <div className="w-full md:w-[200px]">
                <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block md:hidden">Credit (LKR)</label>
                <div className="relative">
                    <Input
                        type="number" placeholder="0.00"
                        className={cn("h-10 rounded-lg font-mono text-sm font-bold text-right pl-8 transition-all border", isCredit ? "bg-background border-emerald-500 ring-4 ring-emerald-500/10" : "bg-muted/40 border-border/40 focus:bg-background focus:border-emerald-500/50")}
                        value={entry.credit} onChange={(e) => handleUpdate('credit', e.target.value)}
                    />
                    {isCredit && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </div>
            </div>
            <div className="w-full md:w-auto text-right">
                <Button size="icon" variant="ghost" className="h-10 w-10 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg md:w-9 md:h-9" onClick={handleRemove} disabled={isRemoveDisabled}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});


// =================================================================================
// 3. Main Page Component: /app/manual-journal/page.jsx
// =================================================================================
// This is now a clean, lean, presentational component. Its only job is to
// render the UI based on the state provided by the useManualJournal hook.
// =================================================================================

export default function ManualJournalPage() {
    const {
        accounts, loading, journalDate, description, entries,
        setJournalDate, setDescription, totals, isBalanced, canPost,
        addEntry, removeEntry, updateEntry, handleSubmit,
    } = useManualJournal();

    return (
        <div className="p-6 md:p-8 space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                        <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Manual Journal Entry</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Record multi-line financial adjustments and manual transactions
                        </p>
                    </div>
                </div>
            </div>

            <Card className="border-border shadow-sm rounded-xl overflow-hidden bg-card/40 backdrop-blur-sm mb-8">
                <CardHeader className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-muted-foreground">Journal Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left h-10 bg-background border-border/60 focus-visible:ring-emerald-500 rounded-md text-sm font-normal",
                                            !journalDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                        {journalDate ? format(parseISO(journalDate), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={journalDate ? parseISO(journalDate) : undefined}
                                        onSelect={(date) => setJournalDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Reference / Description</label>
                            <Input
                                placeholder="E.g. Monthly Rent Payment / Owner Investment..."
                                className="h-10 bg-background border-border/60 focus-visible:ring-emerald-500 rounded-md text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                <div className="hidden md:flex items-center gap-4 px-5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-4">
                    <div className="flex-1">Account Selection</div>
                    <div className="w-[200px] text-right">Debit (LKR)</div>
                    <div className="w-[200px] text-right">Credit (LKR)</div>
                    <div className="w-9"></div>
                </div>

                {entries.map((entry) => (
                    <JournalEntryRow
                        key={entry.key}
                        entry={entry}
                        accounts={accounts}
                        onUpdate={updateEntry}
                        onRemove={removeEntry}
                        isRemoveDisabled={entries.length <= 2}
                    />
                ))}

                <div className="pt-4 flex justify-center">
                    <Button
                        variant="outline"
                        className="h-10 bg-card hover:bg-emerald-500/5 rounded-lg px-12 border-dashed border-border transition-all text-muted-foreground hover:border-emerald-500 hover:text-emerald-600 font-medium"
                        onClick={addEntry}
                    >
                        <Plus className="h-4 w-4" />
                        Add New Line Item
                    </Button>
                </div>
            </div>

            <div className="sticky bottom-6 z-40 mt-12 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-black/5 dark:ring-white/10 font-sans">
                <div className="flex flex-col justify-center gap-1">
                    <div className="flex items-center gap-2">
                        {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
                        <span className={cn("text-base font-bold", isBalanced ? "text-emerald-600" : "text-amber-600")}>
                            {isBalanced ? "Journal Entry Balanced" : "Journal Out of Balance"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">All debits must equal credits before saving.</p>
                </div>

                <div className="flex items-center justify-end gap-8 md:gap-12">
                    <div className="text-right">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Debit</p>
                        <p className="font-mono text-2xl font-bold text-emerald-600">LKR {totals.debit.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Credit</p>
                        <p className="font-mono text-2xl font-bold text-emerald-600">LKR {totals.credit.toFixed(2)}</p>
                    </div>
                    <Button
                        className={cn("h-11 px-8 rounded-lg font-bold text-sm shadow-sm ml-4 transition-all duration-300", canPost ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]" : "bg-muted text-muted-foreground cursor-not-allowed border border-border")}
                        disabled={!canPost || loading.post}
                        onClick={handleSubmit}
                    >
                        {loading.post ? <RotateCcw className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Post Journal Entry</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
