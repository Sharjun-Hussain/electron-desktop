"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { format } from "@/lib/date-utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SupplierLedgersPage() {
  const { data: session } = useSession();
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Fetch Suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      if (!session?.accessToken) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers?size=100`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setSuppliers(result.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
        toast.error("Could not load suppliers");
      }
    }
    fetchSuppliers();
  }, [session]);

  // Fetch Ledger
  const fetchLedger = useCallback(async () => {
    if (!selectedSupplierId || !session?.accessToken) return;

    try {
      setLoading(true);
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/${selectedSupplierId}/ledger`;
      const params = new URLSearchParams();
      if (dateRange.from) params.append("from_date", dateRange.from);
      if (dateRange.to) params.append("to_date", dateRange.to);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result = await response.json();
      
      if (result.status === "success") {
        setLedgerData(result.data.ledger);
        setCurrentBalance(result.data.current_balance);
      } else {
        toast.error(result.message || "Failed to fetch ledger");
      }
    } catch (error) {
      console.error("Ledger fetch error:", error);
      toast.error("An error occurred while fetching ledger");
    } finally {
      setLoading(false);
    }
  }, [selectedSupplierId, session, dateRange]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="p-6 space-y-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Supplier Ledgers</h1>
          <p className="text-sm text-muted-foreground">Track payables and transaction history.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="bg-card" onClick={() => window.print()}>
             <Download className="w-4 h-4 mr-2" /> Export / Print
           </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">Select Supplier</label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Choose a supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">From Date</label>
              <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="bg-card" />
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium text-foreground">To Date</label>
               <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="bg-card" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      {selectedSupplierId ? (
        <Card className="border-none shadow-md overflow-hidden">
           <CardHeader className="bg-card border-b pb-4">
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle className="text-xl text-foreground">{selectedSupplier?.name}</CardTitle>
                    <CardDescription>{selectedSupplier?.email} | {selectedSupplier?.phone}</CardDescription>
                 </div>
                 <div className="text-right">
                    <div className="text-sm text-muted-foreground font-medium">Current Balance</div>
                    <div className={cn(
                        "text-2xl font-bold",
                        currentBalance > 0 ? "text-red-600" : "text-green-600"
                    )}>
                        LKR {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs ml-1 font-normal text-muted-foreground/60">
                            {currentBalance > 0 ? "(Payable)" : "(Advance/Credit)"}
                        </span>
                    </div>
                 </div>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <Table>
                 <TableHeader className="bg-muted/30">
                    <TableRow>
                       <TableHead className="w-[120px]">Date</TableHead>
                       <TableHead className="w-[100px]">Type</TableHead>
                       <TableHead>Reference / Description</TableHead>
                       <TableHead className="text-right w-[150px]">Debit (Paid)</TableHead>
                       <TableHead className="text-right w-[150px]">Credit (Due)</TableHead>
                       <TableHead className="text-right w-[150px]">Balance</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {loading ? (
                       <TableRow>
                          <TableCell colSpan={6} className="text-center py-20 bg-card">
                             <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                <span className="text-muted-foreground text-sm">Loading ledger history...</span>
                             </div>
                          </TableCell>
                       </TableRow>
                    ) : ledgerData.length > 0 ? (
                       ledgerData.map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/20">
                             <TableCell className="text-muted-foreground">{format(new Date(row.transaction_date), "dd MMM yyyy")}</TableCell>
                             <TableCell>
                                <StatusBadge 
                                   value={row.reference_type === 'GRN' ? 'Success' : row.type === 'debit' ? 'Received' : 'Danger'}
                                   label={row.reference_type || (row.type === 'debit' ? 'PAID' : 'DUE')}
                                   showIcon={false}
                                   className={cn(
                                       "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                                       row.reference_type === 'GRN' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                                       row.type === 'debit' && "bg-green-50 text-green-700 border-green-200 shadow-none",
                                       row.type === 'credit' && row.reference_type !== 'GRN' && "bg-red-50 text-red-700 border-red-200 shadow-none",
                                   )}
                                />
                             </TableCell>
                             <TableCell>
                                <div className="font-medium text-foreground">{row.description}</div>
                                <div className="text-xs text-muted-foreground/60 font-mono uppercase">{row.id.split('-')[0]}</div>
                             </TableCell>
                             <TableCell className="text-right text-green-600 font-medium bg-green-50/10">
                                {row.type === 'debit' ? parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                             </TableCell>
                             <TableCell className="text-right text-red-600 font-medium bg-red-50/10">
                                {row.type === 'credit' ? parseFloat(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                             </TableCell>
                             <TableCell className="text-right font-bold text-foreground">
                                {parseFloat(row.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </TableCell>
                          </TableRow>
                       ))
                    ) : (
                       <TableRow>
                          <TableCell colSpan={6} className="text-center py-20 bg-card text-muted-foreground">
                             No transactions recorded for the selected period.
                          </TableCell>
                       </TableRow>
                    )}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-dashed border-border/50 text-center shadow-sm">
           <div className="h-16 w-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
           </div>
           <h3 className="text-lg font-semibold text-foreground">No Supplier Selected</h3>
           <p className="text-muted-foreground max-w-xs mt-2 text-sm leading-relaxed">
             Please select a supplier from the list above to generate a comprehensive ledger statement.
           </p>
        </div>
      )}
    </div>
  );
}

