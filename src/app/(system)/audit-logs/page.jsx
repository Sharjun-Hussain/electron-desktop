'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/components/auth/DesktopAuthProvider';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Calendar as CalendarIcon, Download, Eye, Filter, Activity, RotateCcw, FileDown } from 'lucide-react';
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { format } from "@/lib/date-utils";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (session) {
      fetchAuditLogs();
    }
  }, [session, page, actionFilter, statusFilter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 20,
        ...(search && { search }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateRange.from && { start_date: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange.to && { end_date: format(dateRange.to, 'yyyy-MM-dd') })
      };

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/audit-logs`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          params
        }
      );

      const result = response.data;
      if (result.status === 'success') {
        setLogs(Array.isArray(result.data) ? result.data : (result.data?.data || []));
        // Prefer last_page directly from response or nested in data
        const lastPage = result.last_page || result.data?.last_page || 1;
        setTotalPages(lastPage);
      } else {
        toast.error(result.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const exportData = useMemo(() => {
    if (logs.length === 0) return [];
    return logs.map(log => ({
      Timestamp: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      User: log.user?.name || 'System',
      Email: log.user?.email || 'N/A',
      Action: log.action,
      Entity: log.entity_type || 'N/A',
      Description: log.description,
      Status: log.status,
      "IP Address": log.ip_address || 'N/A'
    }));
  }, [logs]);

  const getActionBadge = (action) => {
    const colors = {
      CREATE: 'bg-emerald-500 hover:bg-emerald-600',
      UPDATE: 'bg-blue-500 hover:bg-blue-600',
      DELETE: 'bg-red-500 hover:bg-red-600',
      LOGIN: 'bg-indigo-500 hover:bg-indigo-600',
      LOGOUT: 'bg-muted-foreground/30 hover:bg-muted-foreground/50',
      READ: 'bg-cyan-500 hover:bg-cyan-600'
    };
    
    return (
      <Badge className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-1 shadow-sm border-none text-white", colors[action] || 'bg-muted-foreground/20')}>
        {action}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'success' ? (
      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-600">Success</Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-red-500/20 bg-red-500/10 text-red-600">Failure</Badge>
    );
  };

  const handlePaginationChange = (updater) => {
    const nextState = typeof updater === 'function' 
        ? updater({ pageIndex: page - 1, pageSize: 20 }) 
        : updater;
    setPage(nextState.pageIndex + 1);
  };

  const columns = [
    {
      header: "Temporal Point",
      accessorKey: "created_at",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">{format(date, 'dd MMM yyyy')}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{format(date, 'HH:mm:ss')}</span>
          </div>
        );
      }
    },
    {
      header: "Operator Identity",
      accessorKey: "user.name",
      cell: ({ row }) => (
        <div className="flex flex-col font-sans">
          <span className="text-sm font-bold text-foreground truncate max-w-[150px]">{row.original.user?.name || 'Automated System'}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-tight truncate max-w-[150px]">{row.original.user?.email || 'SYSTEM_DAEMON'}</span>
        </div>
      )
    },
    {
      header: "Action Protocol",
      accessorKey: "action",
      cell: ({ row }) => getActionBadge(row.original.action)
    },
    {
      header: "Logic Entity",
      accessorKey: "entity_type",
      cell: ({ row }) => (
        <div className="flex flex-col font-sans">
          <span className="text-xs font-bold text-foreground uppercase tracking-tight">{row.original.entity_type || 'N/A'}</span>
          <span className="text-[10px] font-mono text-muted-foreground opacity-60">{row.original.entity_id?.substring(0, 12) || 'N/A'}</span>
        </div>
      )
    },
    {
      header: "Execution",
      accessorKey: "status",
      cell: ({ row }) => getStatusBadge(row.original.status)
    },
    {
      header: "Network UID",
      accessorKey: "ip_address",
      cell: ({ row }) => (
        <code className="text-[10px] font-bold text-muted-foreground/80 bg-muted px-2 py-1 rounded-md border border-border">
          {row.original.ip_address || '0.0.0.0'}
        </code>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Trace Detail</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/40 hover:text-emerald-600 hover:bg-emerald-50 transition-all outline-none"
            onClick={() => viewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-background font-sans">
      <ResourceManagementLayout
        data={logs}
        columns={columns}
        isLoading={loading}
        headerTitle={
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Audit Trace</h1>
                <p className="text-xs text-muted-foreground font-semibold mt-1 opacity-70">
                  System-wide activity monitoring and forensic trace analysis
                </p>
              </div>
            </div>
        }
        extraActions={
          <Button 
            onClick={fetchAuditLogs} 
            variant="outline" 
            className="h-9 px-4 font-semibold shadow-sm text-xs gap-2"
            disabled={loading}
          >
            <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh Registers
          </Button>
        }
        exportData={exportData}
        exportFileName="Audit_Trace_Logs"
        searchColumn="description_logic" // This is a dummy for search bar usage
        searchPlaceholder="Type to trace descriptions..."
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterComponents={() => (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {/* Action Filter */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Action Protocol</label>
                <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1); }}>
                    <SelectTrigger className="h-10 rounded-lg border-border bg-background font-medium text-sm focus:ring-emerald-500 transition-all">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Protocols</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                        <SelectItem value="LOGIN">Login</SelectItem>
                        <SelectItem value="LOGOUT">Logout</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Execution Status</label>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                    <SelectTrigger className="h-10 rounded-lg border-border bg-background font-medium text-sm focus:ring-emerald-500 transition-all">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failure">Failure</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Chronological Window</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="h-10 w-full justify-start text-left font-normal border-border bg-background rounded-lg hover:bg-muted/30 transition-all shadow-sm"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {dateRange.from ? (
                                dateRange.to ? (
                                    <>
                                        {format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM')}
                                    </>
                                ) : (
                                    format(dateRange.from, 'dd MMM yyyy')
                                )
                            ) : (
                                <span className="text-muted-foreground">Select Range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-border shadow-lg" align="start">
                        <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(val) => { setDateRange(val); setPage(1); }}
                            numberOfMonths={2}
                            className="p-4"
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </div>
        )}
        onClearFilters={() => {
            setSearch('');
            setActionFilter('all');
            setStatusFilter('all');
            setDateRange({ from: null, to: null });
            setPage(1);
        }}
        pageCount={totalPages}
        paginationState={{ pageIndex: page - 1, pageSize: 20 }}
        onPaginationChange={handlePaginationChange}
        enablePagination={true}
        enableBulkActions={false}
      />

      {/* --- DETAILS DIALOG --- */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border-border shadow-2xl p-0 font-sans">
          <DialogHeader className="p-8 border-b border-border bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground uppercase">Transaction Detail Trace</DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wider">
                  Deep audit analysis for frame ID: <span className="text-emerald-600 font-mono">{selectedLog?.id}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedLog && (
            <div className="p-8 space-y-10">
              {/* Primary Trace Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Temporal Point</label>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{format(new Date(selectedLog.created_at), 'PPpp')}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Execution Timestamp</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Operator Entity</label>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {(selectedLog.user?.name || 'S')[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{selectedLog.user?.name || 'System Daemon'}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">{selectedLog.user?.email || 'automated@system.internal'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Network Context</label>
                  <div className="flex flex-col">
                    <code className="text-sm font-bold text-emerald-600 font-mono tracking-tight">{selectedLog.ip_address || '0.0.0.0'}</code>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={selectedLog.user_agent}>
                        {selectedLog.user_agent || 'Unknown Client'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Operational Protocol</label>
                    <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Execution Status</label>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Entity Mapping</label>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground uppercase tracking-tight">{selectedLog.entity_type || 'GLOBAL_SYSTEM'}</span>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground truncate max-w-[200px]">{selectedLog.entity_id || 'NULL_REFERENCE'}</span>
                    </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Operation Summary</label>
                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                  "{selectedLog.description}"
                </p>
              </div>

              {/* Data Changes */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Data State Reconciliation</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-widest flex items-center gap-2">
                          <RotateCcw className="w-3 h-3" /> Pre-Transactional State
                      </label>
                      <pre className="p-5 bg-muted/30 rounded-xl text-xs font-medium text-muted-foreground overflow-x-auto border border-border scrollbar-thin">
                        {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : "// No preceding state recorded"}
                      </pre>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-emerald-600 ml-1 tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3" /> Post-Transactional State
                      </label>
                      <pre className="p-5 bg-emerald-50/30 rounded-xl text-xs font-medium text-emerald-600 overflow-x-auto border border-emerald-500/20 scrollbar-thin">
                        {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : "// No state transformation recorded"}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Stack */}
              {selectedLog.error_message && (
                <div className="space-y-4 pt-6 border-t border-red-100/30">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">Error Diagnostic Stack</h4>
                  </div>
                  <pre className="p-5 bg-red-50/30 text-red-700/80 rounded-2xl text-[11px] font-mono border border-red-100/50 overflow-x-auto scrollbar-thin">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {/* Infrastructure Metadata */}
              {selectedLog.metadata && (
                <div className="space-y-4 pt-6 border-t border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full" />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">System Metadata</h4>
                    </div>
                    <pre className="p-5 bg-muted/5 rounded-2xl text-[11px] font-medium text-muted-foreground/40 overflow-x-auto border border-border/20 scrollbar-thin">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
