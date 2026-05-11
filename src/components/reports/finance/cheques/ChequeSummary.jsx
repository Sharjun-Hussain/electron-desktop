"use client";

import { useAppSettings } from "@/app/hooks/useAppSettings";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Printer,
  Download,
  FileText,
  History,
  AlertCircle,
  CheckCircle2,
  Landmark,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  Ban,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-border bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 30, 40, 50].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">per page</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (currentPage <= 2) {
              pageNum = i;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            if (pageNum >= 0 && pageNum < totalPages) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    currentPage === pageNum
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            }
            return null;
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-border hover:border-emerald-200 hover:bg-emerald-50 bg-transparent"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function ChequeSummaryPage() {
  const { data: session } = useSession();
  const { formatCurrency, formatDate } = useAppSettings();
  const [data, setData] = useState({
    details: [],
    summary: { total: 0, cleared: 0, pending: 0, bounced: 0 }
  });
  const [type, setType] = useState("receivable");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state (Client Side)
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    setCurrentPage(0); // reset page on load
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/finance/cheques?type=${type}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result.data || { details: [], summary: { total: 0, cleared: 0, pending: 0, bounced: 0 } });
      } else {
        toast.error(result.message || "Failed to fetch cheque data");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, type]);

  const exportData = useMemo(() => {
    return (data.details || []).map((item) => ({
      "Cheque #": item.cheque_number,
      "Bank Name": item.bank_name,
      "Payee/Payor": item.payee_payor_name || "N/A",
      "Cheque Date": formatDate(item.cheque_date),
      "Amount": Number(item.amount || 0),
      "Status": item.status?.toUpperCase(),
      "Origin Branch": item.branch?.name || "N/A",
      "Report Type": type === 'receivable' ? 'Customer Cheques' : 'Supplier Cheques',
      "Organization": session?.organization?.name || "Inzeedo POS",
      "Timestamp": new Date().toLocaleString()
    }));
  }, [data.details, formatDate, type, session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'cleared':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold gap-1 uppercase tracking-wider text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Cleared
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 py-0.5 rounded-md font-semibold gap-1 uppercase tracking-wider text-[10px]">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case 'bounced':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-2 py-0.5 rounded-md font-semibold gap-1 uppercase tracking-wider text-[10px]">
            <Ban className="w-3 h-3" /> Bounced
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase">{status}</Badge>;
    }
  };

  // Client Filtering and Pagination Logic
  const filteredDetails = useMemo(() => {
    return (data.details || []).filter(item => 
      item.cheque_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payee_payor_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data.details, searchQuery]);

  const totalPages = Math.ceil(filteredDetails.length / pageSize);
  const paginatedDetails = filteredDetails.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    // Reset to page 0 if filter changes and current page becomes invalid
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    } else if (totalPages === 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const statsCards = [
    {
      label: "Total Portfolio",
      val: isLoading ? null : formatCurrency(data.summary?.total || 0),
      desc: "Aggregate portfolio holding",
      icon: CreditCard,
      gradient: "from-blue-500 to-indigo-400",
      badge: "Primary"
    },
    {
      label: "Cleared Amount",
      val: isLoading ? null : formatCurrency(data.summary?.cleared || 0),
      desc: "Verified & settled capital",
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-400",
      badge: "Verified"
    },
    {
      label: "Pending Amount",
      val: isLoading ? null : formatCurrency(data.summary?.pending || 0),
      desc: "Capital inherently in transit",
      icon: Clock,
      gradient: "from-amber-500 to-yellow-400",
      badge: "In Transit"
    },
    {
      label: "Bounced Amount",
      val: isLoading ? null : formatCurrency(data.summary?.bounced || 0),
      desc: "Total value requiring audit",
      icon: Ban,
      gradient: "from-rose-500 to-red-400",
      badge: "Audit Req."
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Cheque Summary</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Clinical verification of cheque portfolio, clearances, and settlement recognition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DataActions 
              data={exportData} 
              fileName={`Cheque_${type}_Audit_Report`}
              onPrint={() => window.print()}
              showPrint={true}
            />
            <Button 
                variant="outline" 
                size="icon"
                onClick={fetchData} 
                className="h-9 w-9 p-0 border-border hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600 border bg-transparent rounded-lg" 
                disabled={isLoading}
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Portfolio Selection Tabs */}
        <div className="flex border-b border-border w-full">
          <Tabs value={type} onValueChange={setType} className="w-full">
            <TabsList className="flex bg-transparent rounded-none p-0 h-11 w-full justify-start items-end">
              <TabsTrigger 
                  value="receivable" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all font-semibold text-sm text-muted-foreground data-[state=active]:text-emerald-600 px-8 h-11 bg-transparent hover:text-emerald-600/70"
              >
                 Customer Cheques
              </TabsTrigger>
              <TabsTrigger 
                  value="payable" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-all font-semibold text-sm text-muted-foreground data-[state=active]:text-emerald-600 px-8 h-11 bg-transparent hover:text-emerald-600/70"
              >
                 Supplier Cheques
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ── Portfolio Diagnostics Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.gradient} text-white shrink-0 self-start`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0 w-full">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0 rounded-md shadow-sm whitespace-nowrap">
                    {card.badge}
                  </Badge>
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-28 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-foreground truncate mt-0.5">{card.val}</h3>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cheque Transaction Registry */}
        <Card className="border border-border shadow-sm rounded-lg overflow-hidden flex flex-col bg-card">
          <CardHeader className="p-4 border-b border-border bg-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100">
                      <Activity className="size-4" />
                  </div>
                  <div>
                      <h3 className="text-sm font-semibold text-foreground">Transaction Registry</h3>
                      <p className="text-xs text-muted-foreground">Chronological breakdown of registered cheques and banking metadata</p>
                  </div>
              </div>
              <div className="relative group max-w-xs w-full lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search cheques..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-border h-9 pl-9 pr-4 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Cheque Identification</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Payee / Payor Basis</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground px-4 text-center border-b-0">Due Recognition</TableHead>
                  <TableHead className="text-right h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Ledger Amount</TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Audit Status</TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground min-w-[120px] border-b-0">Origin Facility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array.from({ length: pageSize }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="pl-6 py-4"><Skeleton className="h-4 w-32 bg-muted rounded" /><Skeleton className="h-3 w-20 mt-1 bg-muted/50 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 bg-muted rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 bg-muted/50 mx-auto rounded" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-4 w-20 ml-auto bg-muted rounded" /></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-md bg-muted/50" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-4 w-16 ml-auto bg-muted/50 rounded" /></TableCell>
                      </TableRow>
                    ))
                ) : paginatedDetails.length > 0 ? (
                  paginatedDetails.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border group">
                      <TableCell className="pl-6 py-3.5">
                        <div className="font-semibold text-sm text-emerald-600 mb-0.5 tracking-tight">#{item.cheque_number}</div>
                        <div className="text-[11px] font-medium text-muted-foreground uppercase flex items-center gap-1.5 leading-none">
                           <Landmark className="w-3 h-3" /> {item.bank_name}
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="font-semibold text-foreground text-sm tracking-tight leading-none">
                          {item.payee_payor_name || "Unidentified"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4">
                        <div className="font-medium text-muted-foreground text-[11px] tabular-nums tracking-widest flex items-center justify-center gap-1.5 uppercase leading-none">
                          {formatDate(item.cheque_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-4">
                         <span className="text-sm font-semibold text-foreground tabular-nums tracking-tight">
                            {formatCurrency(item.amount || 0)}
                         </span>
                      </TableCell>
                      <TableCell className="text-center px-4">
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right pr-6 min-w-[120px]">
                        <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md border-border bg-muted/50 shadow-none leading-none">
                          {item.branch?.name}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-xl bg-gray-50 text-muted-foreground opacity-50">
                          <History className="w-10 h-10" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs leading-none">Zero Cheque Activity</h4>
                          <p className="text-[11px] text-muted-foreground font-medium mt-2 italic leading-none">No {type} portfolio discovered for the current audit scope.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setCurrentPage(0);
            }}
          />

        </Card>

        {/* Cheque Management Protocol Disclaimer */}
        <Card className="border shadow-none bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20 rounded-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="p-2.5 rounded-md bg-emerald-100 text-emerald-600 shrink-0 group-hover:rotate-12 transition-transform">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-800 text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 leading-none italic"><Activity className="size-3" /> Cheque Management Protocol</h4>
                <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                  This registry displays a real-time audit of banking cheques within the portfolio. Receivable cheques represent customer recognition in settlement transit, while Payable cheques indicate organizational obligations to supplier entities. Any bounced recognition requires immediate fiscal reconciliation in the principal ledger.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
