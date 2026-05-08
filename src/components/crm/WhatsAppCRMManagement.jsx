"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  MessageCircle, 
  RefreshCcw, 
  Plus, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";

export function WhatsAppCRMManagement() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await fetchTemplates();
      } catch (error) {
        console.error(error);
        toast.error("Failed to load templates. Check your Chatwoot settings.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchTemplates = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/whatsapp/templates`, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch templates");
    }
    const data = await response.json();
    setTemplates(data.data || []);
    return data.data;
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading("Syncing templates from Chatwoot...");
    try {
      await fetchTemplates();
      toast.success("Templates synchronized successfully", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load templates. Check your Chatwoot settings.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Template Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground capitalize">
            {row.original.name.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {row.original.category}
          </span>
        </div>
      )
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[10px] font-bold uppercase border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
          {row.original.language}
        </Badge>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge 
          className="capitalize font-bold text-[10px] h-5"
          variant={row.original.status === 'approved' ? 'success' : row.original.status === 'rejected' ? 'destructive' : 'secondary'}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 hover:text-emerald-600 font-bold">
          View <ExternalLink className="h-3 w-3" />
        </Button>
      )
    }
  ], []);

  const HeaderContent = () => (
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
        <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">
          WhatsApp Templates
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1.5 opacity-70">
          Manage and use your approved WhatsApp Business templates.
        </p>
      </div>
    </div>
  );

  const StatCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {[
        { label: "Total Templates", value: templates.length, icon: FileText, color: "emerald" },
        { label: "Approved", value: templates.filter(t => t.status === 'approved').length, icon: CheckCircle2, color: "blue" },
        { label: "Pending", value: templates.filter(t => t.status === 'pending').length, icon: RefreshCcw, color: "amber" },
        { label: "Rejected", value: templates.filter(t => t.status === 'rejected').length, icon: AlertCircle, color: "red" }
      ].map((stat, i) => (
        <Card key={i} className={`bg-${stat.color}-500/5 border-${stat.color}-500/10 shadow-none`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-2 bg-${stat.color}-500/10 rounded-lg`}>
                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TemplateGridCard = ({ row }) => {
    const template = row.original;
    return (
      <Card className="group hover:shadow-md transition-all border-emerald-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2">
           <Badge 
            variant={template.status === 'approved' ? 'success' : template.status === 'rejected' ? 'destructive' : 'secondary'}
            className="capitalize text-[9px] h-4"
          >
            {template.status}
          </Badge>
        </div>
        <CardContent className="pt-6">
          <div className="space-y-1 mb-4">
            <h3 className="font-bold text-sm text-foreground capitalize truncate pr-16">
              {template.name.replace(/_/g, ' ')}
            </h3>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {template.category}
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono mb-4 text-muted-foreground line-clamp-3 h-20 overflow-hidden">
            {template.components?.find(c => c.type === 'BODY')?.text || "No content preview available"}
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[9px] font-bold uppercase border-emerald-500/20 text-emerald-600">
              {template.language}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 hover:text-emerald-600 font-bold">
              View <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ResourceManagementLayout
      data={templates}
      columns={columns}
      isLoading={loading}
      headerTitle={<HeaderContent />}
      addButtonLabel="New Template"
      onAddClick={() => {}}
      extraActions={
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 h-9 border-emerald-500/20 text-emerald-700 hover:bg-emerald-50 font-bold text-xs"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Sync from Chatwoot</span>
        </Button>
      }
      statCardsComponent={<StatCards />}
      searchColumn="name"
      searchPlaceholder="Find templates..."
      renderGridItem={(row) => <TemplateGridCard row={row} />}
      viewMode="grid"
    />
  );
}
