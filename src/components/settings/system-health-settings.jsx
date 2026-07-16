"use client";

import { useState } from "react";
import {
    Activity,
    Database,
    Zap,
    Trash2,
    RefreshCw,
    ShieldCheck,
    HardDrive,
    Search,
    Info,
    Wifi,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Server,
    MemoryStick,
    Cpu,
    Layers,
    Lock,
    ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { format } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

function HudCard({ icon: Icon, color, label, value, sub, rightElement }) {
    const gradients = {
        emerald: "from-emerald-500 to-teal-400",
        blue:    "from-blue-500 to-indigo-400",
        violet:  "from-violet-500 to-purple-400",
        amber:   "from-amber-500 to-orange-400",
        rose:    "from-rose-500 to-pink-400",
        cyan:    "from-cyan-500 to-sky-400",
        slate:   "from-slate-500 to-gray-400",
    };
    return (
        <div className="bg-card rounded-md p-6 border border-border shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-md bg-linear-to-br ${gradients[color]} text-white shrink-0`}>
                    <Icon className="w-5 h-5 shadow-sm" />
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="text-[12px] font-medium text-muted-foreground truncate">{label}</p>
                    <h3 className="text-2xl font-bold text-foreground capitalize truncate">
                        {value ?? '—'}
                    </h3>
                    {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
                </div>
            </div>
            {rightElement && (
                <div className="shrink-0">
                    {rightElement}
                </div>
            )}
        </div>
    );
}

export function SystemHealthSettings() {
    const [telemetryRange, setTelemetryRange] = useState(60); // minutes: 60 (1h), 720 (12h), 1440 (24h)
    
    const { business, isLoading: isSettingsLoading } = useAppSettings();
    const isEssential = business?.subscription_tier === 'Essential';

    const { useMaintenanceStats, optimizeDatabase, purgeCache, useTelemetryHistory } = useSettings();
    const { data: response, isLoading, error } = useMaintenanceStats();
    const { data: telemetryResponse } = useTelemetryHistory(telemetryRange);

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [optimizeLog, setOptimizeLog] = useState(null);

    const stats = response?.data || null;
    const telemetry = telemetryResponse?.data || [];
    const system = stats?.system || {};
    const db = system?.db || {};
    const cache = system?.cache || {};
    const dbData = stats?.database || {};

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setOptimizeLog(null);
        const res = await optimizeDatabase();
        if (res.success) {
            setOptimizeLog(res.data?.log || []);
            toast.success(`Optimized ${res.data?.optimizedCount} tables successfully!`);
        } else {
            toast.error(res.error || "Database optimization failed");
            setOptimizeLog([{ table: 'System', status: 'failed', note: res.error }]);
        }
        setIsOptimizing(false);
    };

    const handlePurgeCache = async () => {
        setIsPurging(true);
        const res = await purgeCache();
        if (res.success) {
            toast.success(`Cache flushed — freed ${res.data?.before?.memoryUsed || 'unknown'}`);
        } else {
            toast.error(res.error || "Cache purge failed");
        }
        setIsPurging(false);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredTables = (dbData?.tables || []).filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Error State ---
    if (error) return (
        <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">Failed to load health data</p>
            <p className="text-xs text-slate-400 max-w-sm">{error.message || 'Could not connect to the maintenance API. Check that the backend is running and you have permission.'}</p>
        </div>
    );

    // --- Loading State ---
    if (isLoading || isSettingsLoading) return (
        <div className="flex flex-col items-center justify-center p-12 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500/50" />
            <p className="text-xs text-muted-foreground">Scanning system health...</p>
        </div>
    );

    if (isEssential) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Feature Status Banner */}
                <Card className="border-amber-200 bg-amber-50/20 overflow-hidden mb-6">
                    <div className="h-1 bg-amber-500 w-full" />
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-amber-100 rounded-full">
                            <Lock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-slate-900 leading-tight font-display">Maintenance Suite Restricted</h2>
                            <p className="text-[12px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Your organization is on the <span className="font-bold text-amber-700 underline decoration-amber-300">Essential Plan</span>. 
                                Deep database optimization and real-time telemetry analytics are exclusive to our higher-tier intelligence engines.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl pt-2">
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3 text-left">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[12px] font-bold text-slate-900 leading-none">Professional</div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">Database table analysis and basic performance metrics enabled.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex items-start gap-3 text-left">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[12px] font-bold text-slate-900 leading-none">Enterprise</div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">Full telemetry dashboard, real-time query analysis, and cache purging.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                size="sm" 
                                className="h-10 px-6 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 text-[11px] font-bold rounded-lg transition-all active:scale-95" 
                                onClick={() => (window.location.href = '/settings?tab=subscription')}
                            >
                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade to Unlocked Modules
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Blurred/Disabled Background Preview */}
                <div className="opacity-40 grayscale pointer-events-none select-none space-y-5 filter blur-[1px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                             <div key={i} className="bg-card rounded-md p-6 border border-border shadow-xs h-24" />
                        ))}
                    </div>
                    <Card className="h-64 border-gray-100" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* === ROW 1: System HUD === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <HudCard icon={ShieldCheck} color="emerald" label="DB Status"
                    value={system.status === 'healthy' ? 'Healthy' : 'Unstable'} />
                <HudCard icon={Activity}   color="blue"    label="Uptime"
                    value={system.uptime} />
                <HudCard icon={Wifi}       color="cyan"    label="Connections"
                    value={`${db.threadsConnected ?? '—'} active`} />
                <HudCard icon={Zap}        color="rose"    label="Slow Queries"
                    value={db.slowQueries ?? '—'}
                    sub={`${db.totalQueries?.toLocaleString() ?? '—'} total`} />
                <HudCard icon={HardDrive}  color="violet"  label="DB Size"
                    value={formatSize((dbData?.summary?.totalData || 0) + (dbData?.summary?.totalIndex || 0))} />
                <HudCard icon={MemoryStick} color="amber"  label="App Memory"
                    value={system.memory?.heapUsed}
                    sub={`RSS ${system.memory?.rss}`} />
            </div>

            {/* === ROW 2: Cache HUD === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HudCard 
                    icon={Server} 
                    color={cache.status === 'online' ? 'emerald' : 'slate'} 
                    label="Redis Status"
                    value={cache.status || 'offline'}
                    rightElement={
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${cache.status === 'online' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-slate-50'}`}>
                            {cache.status === 'online' ? 'Connected' : 'Offline'}
                        </Badge>
                    }
                />
                <HudCard icon={Database} color="cyan"   label="Cache Memory"
                    value={cache.memoryUsed || '—'}
                    sub={`${cache.keyCount ?? 0} keys stored`} />
                <HudCard icon={Wifi}     color="violet" label="DB Engine"
                    value={db.version || '—'}
                    sub={`Uptime ${Math.floor((db.dbUptime || 0) / 3600)}h`} />
            </div>

            {/* === ROW 2.1: System Detailed HUD === */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <HudCard 
                    icon={Cpu} 
                    color="rose" 
                    label="System CPU"
                    value={`${(system?.system?.load?.[0] || 0).toFixed(2)}`}
                    sub="1m Load Avg"
                />
                <HudCard 
                    icon={MemoryStick} 
                    color="blue" 
                    label="System RAM"
                    value={formatSize(system?.system?.ram?.used || 0)}
                    sub={`${Math.round(((system?.system?.ram?.used || 0) / (system?.system?.ram?.total || 1)) * 100)}% Used`}
                />
                <HudCard 
                    icon={Layers} 
                    color="amber" 
                    label="Swap Memory"
                    value={formatSize(system?.system?.swap?.used || 0)}
                    sub={`${formatSize(system?.system?.swap?.total || 0)} Total`}
                />
                <HudCard 
                    icon={Activity} 
                    color="cyan" 
                    label="I/O Wait"
                    value={`${(system?.system?.io || 0).toFixed(1)}%`}
                    sub="Disk Utilization"
                />
            </div>

            {/* === ROW 2.5: Telemetry Charts === */}
            <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm rounded-md overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-gray-800 p-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Real-Time Performance Telemetry</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Historical load, connection traffic, and query saturation</CardDescription>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                        <button onClick={() => setTelemetryRange(60)} className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${telemetryRange === 60 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>1h</button>
                        <button onClick={() => setTelemetryRange(720)} className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${telemetryRange === 720 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>12h</button>
                        <button onClick={() => setTelemetryRange(1440)} className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${telemetryRange === 1440 ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>24h</button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {telemetry.length === 0 ? (
                        <div className="h-48 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md">
                            <p className="text-xs text-slate-400">Waiting for Redis telemetry points...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* --- Group A: System Resources --- */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Server className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Infrastructure Metrics</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">CPU & IO Utilization</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="cpuLoad" name="CPU Load (1m)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="ioUtil" name="IO Util %" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">Total System Memory (MB)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="sysRam" name="System RAM" stroke="#ec4899" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="sysSwap" name="System Swap" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-50 dark:border-slate-800" />

                            {/* --- Group B: Application Performance --- */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Node.js & Database Analytics</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">App Memory Saturation (MB)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="rss" name="Process RSS" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="heapUsed" name="Process Heap" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">Database Persistence (Count)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="stepAfter" dataKey="threads" name="Active Conn" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="slowQueries" name="Slow Queries" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-50 dark:border-slate-800" />

                            {/* --- Group C: Traffic & Throughput Analysis --- */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Wifi className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Traffic & Throughput Analysis</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">API Request Volume (Hits/30s)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="httpReqRate" name="Req Rate" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-56">
                                        <p className="text-xs font-bold text-slate-500 mb-4">Network Throughput (KB/30s)</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={telemetry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200,200,200,0.1)" />
                                                <XAxis dataKey="timestamp" tickFormatter={(v) => format(new Date(v), 'HH:mm')} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={30} />
                                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <RechartsTooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    labelFormatter={(v) => format(new Date(v), 'PPpp')}
                                                />
                                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="dbInRate" name="DB Ingress" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="dbOutRate" name="DB Egress" stroke="#6366f1" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="httpInRate" name="HTTP In" stroke="#ec4899" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* === ROW 3: Action Buttons === */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    variant="outline"
                    className="flex-1 h-16 bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group rounded-md"
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                >
                    <div className="flex items-center gap-3 w-full px-1">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-md group-hover:bg-emerald-100 transition-colors">
                            {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> : <Database className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Optimize Database</p>
                            <p className="text-[11px] text-slate-400">Defragment tables & rebuild indexes</p>
                        </div>
                    </div>
                </Button>

                <Button
                    variant="outline"
                    className="flex-1 h-16 bg-white dark:bg-slate-900 border-gray-100 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all group rounded-md"
                    onClick={handlePurgeCache}
                    disabled={isPurging || cache.status !== 'online'}
                >
                    <div className="flex items-center gap-3 w-full px-1">
                        <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-md group-hover:bg-amber-100 transition-colors">
                            {isPurging ? <RefreshCw className="w-4 h-4 animate-spin text-amber-600" /> : <Trash2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Purge Redis Cache</p>
                            <p className="text-[11px] text-slate-400">
                                {cache.status === 'online'
                                    ? `${cache.keyCount ?? 0} keys · ${cache.memoryUsed ?? '—'} in use`
                                    : 'Redis is offline — start it to enable purge'}
                            </p>
                        </div>
                    </div>
                </Button>
            </div>

            {/* === ROW 4: Maintenance Activity Log === */}
            {optimizeLog && (
                <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm rounded-md overflow-hidden">
                    <CardHeader className="border-b border-gray-50 dark:border-gray-800 p-4">
                        <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">
                            Maintenance Activity Log
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {optimizeLog.filter(r => r.status === 'success').length} succeeded ·{' '}
                            {optimizeLog.filter(r => r.status === 'failed').length} failed
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 max-h-48 overflow-y-auto">
                        {optimizeLog.map((entry, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                {entry.status === 'success'
                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    : <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                }
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">{entry.table}</span>
                                <span className={`text-[11px] ${entry.status === 'failed' ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {entry.note || entry.status}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* === ROW 5: Table Analysis === */}
            <Card className="border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-sm rounded-md overflow-hidden">
                <CardHeader className="border-b border-gray-50 dark:border-gray-800 p-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium text-slate-900 dark:text-white">Table Analysis</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            {dbData?.tables?.length || 0} tables · {dbData?.summary?.totalRows?.toLocaleString() || 0} total rows
                        </CardDescription>
                    </div>
                    <div className="relative w-52">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            placeholder="Search tables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-8 pl-9 bg-slate-50 dark:bg-slate-800/50 border-none rounded-md text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-[10px] text-slate-400 border-b border-gray-50 dark:border-gray-800">
                                <tr>
                                    <th className="px-5 py-3">Table Name</th>
                                    <th className="px-5 py-3">Rows</th>
                                    <th className="px-5 py-3">Data Size</th>
                                    <th className="px-5 py-3">Index Size</th>
                                    <th className="px-5 py-3">Engine</th>
                                    <th className="px-5 py-3">Last Updated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredTables.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                                            No tables found
                                        </td>
                                    </tr>
                                ) : filteredTables.map((table) => (
                                    <tr key={table.name} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3 text-xs font-medium text-slate-700 dark:text-slate-200">{table.name}</td>
                                        <td className="px-5 py-3 text-xs text-slate-500">
                                            {Number(table.rows || 0).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-emerald-600 dark:text-emerald-400">
                                            {formatSize(table.dataSize)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-400 rounded-full"
                                                        style={{ width: `${Math.min(100, (Number(table.indexSize) / (Number(table.dataSize) || 1)) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[11px] text-slate-400">{formatSize(table.indexSize)}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 dark:border-slate-700 text-slate-400">
                                                {table.engine}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 text-[11px] text-slate-400">
                                            {table.lastUpdated ? new Date(table.lastUpdated).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* === Footer Note === */}
            <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-500/5 rounded-md border border-blue-100/50 dark:border-blue-500/10">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                    Stats are fetched live from the database engine every 30 seconds. Tables like <strong>audit_logs</strong> and <strong>sales</strong> should be optimized periodically. Redis must be running for cache purge to work.
                </p>
            </div>
        </div>
    );
}
