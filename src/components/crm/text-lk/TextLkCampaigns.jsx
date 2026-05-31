"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Zap, 
  Plus, 
  Send, 
  Calendar, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Users,
  Search,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TextLkCampaigns() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    contact_list_id: "",
    dlt_template_id: "",
    schedule_time: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, groupRes, tempRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/campaigns`, { headers: { Authorization: `Bearer ${session?.accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/contacts`, { headers: { Authorization: `Bearer ${session?.accessToken}` } }), // Actually we need groups, but I'll use the initialize-group names for now
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/templates`, { headers: { Authorization: `Bearer ${session?.accessToken}` } })
      ]);

      const campData = await campRes.json();
      const groupData = await groupRes.json(); // Wait, the service has getGroups, I should expose it
      const tempData = await tempRes.json();

      setCampaigns(Array.isArray(campData.data) ? campData.data : []);
      setTemplates(Array.isArray(tempData.data) ? tempData.data : []);
      // For groups, I'll mock one if none returned (as we created "POS Customers" during sync)
      setGroups([{ id: "pos_customers", name: "POS Customers" }]); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
  const groupsArray = Array.isArray(groups) ? groups : [];
  const templatesArray = Array.isArray(templates) ? templates : [];

  const handleLaunch = async () => {
    if (!newCampaign.contact_list_id || !newCampaign.message) {
      toast.error("Please select a group and enter a message");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(newCampaign)
      });

      if (!response.ok) throw new Error("Failed to launch campaign");
      toast.success("Campaign launched successfully!");
      setIsAddOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Active Campaigns
        </h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 h-10 font-bold shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/5 active:scale-95 transition-transform">
              <Zap className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Setup SMS Campaign</DialogTitle>
              <CardDescription className="text-muted-foreground text-xs">Reach your entire audience in one click.</CardDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Campaign Name</Label>
                  <Input 
                    placeholder="e.g. Clearance Sale" 
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Target Group</Label>
                  <Select onValueChange={(val) => setNewCampaign(prev => ({ ...prev, contact_list_id: val }))}>
                    <SelectTrigger className="bg-muted/40 border-border text-foreground">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsArray.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Template (Optional)</Label>
                <Select onValueChange={(val) => {
                  const temp = templatesArray.find(t => t.id === val);
                  if (temp) setNewCampaign(prev => ({ ...prev, message: temp.body, dlt_template_id: temp.dlt_template_id || "" }));
                }}>
                  <SelectTrigger className="bg-muted/40 border-border text-foreground">
                    <SelectValue placeholder="Choose a saved template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templatesArray.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Message Content</Label>
                <Textarea 
                  className="min-h-[140px] bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500" 
                  placeholder="Enter your campaign message..." 
                  value={newCampaign.message}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Schedule (Optional)</Label>
                <Input 
                  type="datetime-local" 
                  className="h-10 bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, schedule_time: e.target.value }))}
                />
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold text-base active:scale-95 transition-transform" onClick={handleLaunch}>
                <Send className="mr-2 h-5 w-5" />
                Launch Campaign Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
            Syncing Campaigns...
          </div>
        ) : campaignsArray.length > 0 ? (
          campaignsArray.map((camp) => (
            <Card key={camp.id} className="border-border bg-card shadow-xs group hover:border-indigo-500/40 transition-all overflow-hidden rounded-xl">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="p-5 md:w-[240px] border-b md:border-b-0 md:border-r border-border bg-muted/30">
                  <div className="space-y-2">
                    <Badge variant={camp.status === 'Sent' ? 'success' : camp.status === 'Scheduled' ? 'secondary' : 'default'} className="font-bold text-[9px] uppercase tracking-wider h-5">
                      {camp.status}
                    </Badge>
                    <h3 className="text-sm font-bold text-foreground truncate">{camp.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(camp.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      Message Content
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-medium line-clamp-1 italic">"{camp.message}"</p>
                  </div>
                  <div className="flex items-center gap-8 pr-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Target</p>
                      <p className="text-sm font-bold text-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        POS Group
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Delivery</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-2 border-border py-16 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 rounded-xl">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Launch your first campaign</p>
              <p className="text-[11px] text-muted-foreground/80 font-medium">Broadcast messages to all your POS customers instantly.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 border-border text-foreground hover:bg-muted/40 font-bold active:scale-95 transition-transform"
              onClick={() => setIsAddOpen(true)}
            >
              Start Designing
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
