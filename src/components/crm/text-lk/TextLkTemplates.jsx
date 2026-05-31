"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  Copy,
  Layout,
  Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TextLkTemplates() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", body: "", dlt_template_id: "" });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/templates`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if (!response.ok) throw new Error("Failed to load templates");
      const data = await response.json();
      
      let rawTemplates = [];
      if (data) {
        if (Array.isArray(data.data)) {
          rawTemplates = data.data;
        } else if (Array.isArray(data.templates)) {
          rawTemplates = data.templates;
        } else if (Array.isArray(data)) {
          rawTemplates = data;
        }
      }
      setTemplates(rawTemplates);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(newTemplate)
      });
      if (!response.ok) throw new Error("Failed to create template");
      toast.success("Template created successfully");
      setIsAddOpen(false);
      setNewTemplate({ name: "", body: "", dlt_template_id: "" });
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if (!response.ok) throw new Error("Failed to delete template");
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const templatesArray = Array.isArray(templates) ? templates : [];
  const filteredTemplates = templatesArray.filter(t => 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates..." 
            className="pl-10 h-10 border-border bg-card text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 h-10 font-bold active:scale-95 transition-transform">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Create SMS Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Template Name</Label>
                <Input 
                  placeholder="e.g. Festival Offer" 
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">DLT Template ID (Optional)</Label>
                <Input 
                  placeholder="Enter ID from Text.lk dashboard" 
                  value={newTemplate.dlt_template_id}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, dlt_template_id: e.target.value }))}
                  className="bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Message Body</Label>
                <Textarea 
                  placeholder="Type your message here..." 
                  className="min-h-[120px] bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground font-medium">Use {"{{name}}"} for customer personalization.</p>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold active:scale-95 transition-transform" onClick={handleCreate}>
                Save Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="h-[200px] animate-pulse bg-muted/40 border-border" />
          ))
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="group border-border bg-card shadow-xs hover:border-indigo-500/40 transition-all flex flex-col rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-sm font-bold text-foreground truncate max-w-[150px]">{template.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase border-indigo-500/20 bg-indigo-500/5 text-indigo-500">
                    Local
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <div className="bg-muted/40 p-3 rounded-lg text-xs text-muted-foreground font-medium leading-relaxed mb-4 flex-1 line-clamp-4 italic">
                  "{template.body}"
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      ID: {template.dlt_template_id || 'NONE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md active:scale-90 transition-transform"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-md active:scale-90 transition-transform">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-3">
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
               <Layout className="h-8 w-8" />
             </div>
             <div>
               <p className="text-sm font-bold text-muted-foreground">No local templates yet</p>
               <p className="text-xs text-muted-foreground/80 font-medium">Create your first template to use in messages and campaigns.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
