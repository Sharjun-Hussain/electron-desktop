"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  ArrowRight,
  User as UserIcon,
  FileText,
  TrendingUp,
  RefreshCw,
  Activity,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { DataActions } from "@/components/general/DataActions";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Pagination — identical to ResourceManagementLayout ──────────────────────
const PaginationControls = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200">
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(0)}
          disabled={!canPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
                      : "border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
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
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default function CustomerHistoryPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { formatCurrency } = useAppSettings();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    setCurrentPage(0);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/customers/history`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch customer history");

      const result = await response.json();
      if (result.status === "success") {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer history");
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const filteredData = useMemo(() => {
    return (data || []).filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone && item.phone.includes(searchQuery))
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    } else if (totalPages === 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const exportData = useMemo(() => {
    return filteredData.map((item) => ({
      "Customer Name": item.name,
      Phone: item.phone || "-",
      Email: item.email || "-",
      "Total Visits": item.totalSales,
      "Total Spent": item.totalSpent,
      "Last Visit": item.lastVisit
        ? format(new Date(item.lastVisit), "yyyy-MM-dd")
        : "Never",
    }));
  }, [filteredData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    totalClients: data?.length || 0,
    netCrmValue: (data || []).reduce((acc, curr) => acc + (curr.totalSpent || 0), 0),
    highFrequencyCount: (data || []).filter(item => item.totalSales > 5).length,
  };

  const displayStats = [
    { 
      label: "Total Client Base", 
      value: stats.totalClients, 
      icon: Users, 
      gradient: "from-blue-500 to-indigo-400" 
    },
    { 
      label: "Net CRM Value", 
      value: formatCurrency(stats.netCrmValue), 
      icon: DollarSign, 
      gradient: "from-emerald-500 to-teal-400" 
    },
    { 
      label: "High-Frequency Buyers", 
      value: stats.highFrequencyCount, 
      icon: TrendingUp, 
      gradient: "from-purple-500 to-fuchsia-400" 
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Customer History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Clinical verification of engagement metrics and structural client equity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataActions 
              data={exportData} 
              fileName="Customer_Purchase_History" 
              onPrint={() => window.print()}
            />
            <Button 
                variant="outline" 
                onClick={fetchData} 
                className="h-9 w-9 p-0 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-emerald-600" 
                disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Engagement Diagnostics Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayStats.map((stat, i) => (
            <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} text-white shrink-0 self-start`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {isLoading ? <Skeleton className="h-7 w-24 opacity-20" /> : stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Engagement Ledger */}
        <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden flex flex-col">
          <CardHeader className="p-4 border-b border-gray-100 bg-white">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md text-emerald-600 bg-emerald-50 border border-emerald-100">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Engagement Attribution Ledger</h3>
                    <p className="text-xs text-muted-foreground">Audited history of client interactions and cumulative fiscal equity</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or phone..." 
                            className="h-9 pl-9 pr-4 rounded-md border-gray-200 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all" 
                            value={searchQuery}
                            onChange={(e)=>setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableHead className="pl-6 h-11 text-xs font-semibold text-muted-foreground border-b-0">Client Identity</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Communication Basis</TableHead>
                  <TableHead className="text-center h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Frequency</TableHead>
                  <TableHead className="text-right h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Fiscal Equity</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-muted-foreground px-4 border-b-0">Recent Activity</TableHead>
                  <TableHead className="text-right pr-6 h-11 text-xs font-semibold text-muted-foreground min-w-[100px] border-b-0">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="pl-6 py-4"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full bg-gray-100" /><Skeleton className="h-4 w-32 bg-gray-50" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 bg-gray-100" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-12 mx-auto rounded-md bg-gray-50" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto bg-gray-100" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28 bg-gray-100" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20 ml-auto bg-gray-50" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 rounded-xl bg-gray-50 text-muted-foreground opacity-50">
                            <Users className="w-10 h-10" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs leading-none">Zero Client Activity</h4>
                            <p className="text-[11px] text-muted-foreground font-medium mt-2 italic leading-none">No success profiles discovered for the current audit scope.</p>
                          </div>
                        </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3.5">
                          <Avatar className="h-9 w-9 border border-gray-200 group-hover:border-emerald-200 transition-all duration-300 shadow-sm">
                            <AvatarFallback className="bg-gray-50 text-muted-foreground font-semibold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                              {item.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-semibold text-sm text-foreground tracking-tight leading-none">{item.name}</span>
                              <span className="text-[10px] text-muted-foreground font-medium font-mono tracking-tighter mt-1 uppercase">UUID: {item.id?.substring(0,8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                          <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-muted-foreground tabular-nums leading-none tracking-tight">{item.phone || 'No Records'}</span>
                              <span className="text-[11px] text-muted-foreground/70 font-medium lowercase leading-none tracking-tight">{item.email || '-'}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-center px-4">
                          <Badge variant="outline" className="bg-white text-muted-foreground border-gray-200 font-semibold text-xs px-2.5 py-0.5 rounded-md shadow-sm tabular-nums">
                              {item.totalSales} <span className="ml-1 font-medium capitalize text-[10px]">Visits</span>
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right px-4">
                          <span className="text-sm font-semibold text-emerald-600 tabular-nums tracking-tighter leading-none">{formatCurrency(item.totalSpent || 0)}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium tracking-tight px-4 whitespace-nowrap">
                          {item.lastVisit ? format(new Date(item.lastVisit), 'MMM dd, yyyy') : 'No Registration'}
                      </TableCell>
                      <TableCell className="text-right pr-6 min-w-[100px]">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 gap-1.5 h-8 rounded-md font-semibold text-[11px] transition-all"
                           onClick={() => router.push(`/customers?id=${item.id}`)}
                         >
                             Profile <ArrowRight className="h-3 w-3" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
      </div>
    </div>
  );
}
