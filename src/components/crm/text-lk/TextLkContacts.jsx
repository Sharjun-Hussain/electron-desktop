"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Users, 
  RefreshCcw, 
  Search, 
  FolderPlus, 
  MoreVertical,
  CheckCircle2,
  Folder,
  Filter,
  ArrowUpDown,
  Layers,
  Copy,
  Edit2,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TextLkContacts() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editGroupUid, setEditGroupUid] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteGroupUid, setDeleteGroupUid] = useState("");
  const [deleteGroupName, setDeleteGroupName] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/contacts`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      if (!response.ok) throw new Error("Failed to load contact groups");
      const data = await response.json();
      
      let rawGroups = [];
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          rawGroups = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          rawGroups = data.data.data;
        } else if (data.data.data && data.data.data.data && Array.isArray(data.data.data.data)) {
          rawGroups = data.data.data.data;
        } else if (data.data.contacts && Array.isArray(data.data.contacts)) {
          rawGroups = data.data.contacts;
        }
      }
      setGroups(rawGroups);
    } catch (error) {
      console.error(error);
      toast.error("Handshake failed. Ensure API settings are correct.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    const toastId = toast.loading("Exporting POS customers to Text.lk...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Sync failed");
      
      toast.success(data.message, { id: toastId });
      fetchGroups(); // Refresh list
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    const toastId = toast.loading("Creating contact group...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name: newGroupName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create group");
      
      toast.success("Contact group created successfully!", { id: toastId });
      setIsAddOpen(false);
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleUpdateGroup = async () => {
    if (!editGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    const toastId = toast.loading("Updating contact group...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/contacts/${editGroupUid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ name: editGroupName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update group");
      
      toast.success("Contact group updated successfully!", { id: toastId });
      setIsEditOpen(false);
      setEditGroupUid("");
      setEditGroupName("");
      fetchGroups();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleDeleteGroup = async () => {
    const toastId = toast.loading("Deleting contact group...");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/contacts/${deleteGroupUid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete group");
      
      toast.success("Contact group deleted successfully!", { id: toastId });
      setIsDeleteOpen(false);
      setDeleteGroupUid("");
      setDeleteGroupName("");
      fetchGroups();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Group UID copied to clipboard!");
  };

  const groupsArray = Array.isArray(groups) ? groups : [];
  const filteredGroups = groupsArray.filter(group => {
    const groupName = group.name || "";
    const groupUid = group.uid || "";
    return groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupUid.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search contact groups by name or UID..." 
            className="pl-11 h-10 border-border bg-card text-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-indigo-500 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 border-border text-foreground bg-card hover:bg-muted/40 rounded-lg transition-all active:scale-95"
            onClick={fetchGroups}
            disabled={loading}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Groups
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 h-10 font-bold rounded-lg transition-all active:scale-95"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Create Contact Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Group Name</Label>
                  <Input 
                    placeholder="e.g. Premium VIP Customers" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
                  />
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold active:scale-95 transition-transform" onClick={handleCreateGroup}>
                  Save Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sync Banner */}
      <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-none border-dashed border-2 rounded-xl">
        <CardContent className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Sync with POS Customers</p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/80 font-medium tracking-tight">Automatically compile your POS contact ledger and export them to your Text.lk Groups.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-extrabold px-6 rounded-lg active:scale-95 transition-transform"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Sync
          </Button>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="border-border bg-card shadow-xs overflow-hidden rounded-xl">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground py-3.5 pl-6 w-[350px]">Group Name</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Group Unique ID (UID)</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Group Type</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-8 pl-6 pr-6">
                    <div className="h-4 w-full bg-muted animate-pulse rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group, i) => {
                const displayName = group.name || 'Unnamed Contact Group';
                const avatarLetter = displayName.charAt(0).toUpperCase();

                return (
                  <TableRow key={group.uid || i} className="hover:bg-muted/20 transition-colors border-b border-border/80">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-xs uppercase border border-indigo-500/20 shadow-xs">
                          {avatarLetter}
                        </div>
                        <span className="font-bold text-sm text-foreground tracking-tight">
                          {displayName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs px-2.5 py-1 bg-muted rounded-md font-mono text-muted-foreground font-bold border border-border shadow-xs select-all">
                          {group.uid}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-foreground active:scale-90"
                          onClick={() => copyToClipboard(group.uid)}
                          title="Copy UID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-extrabold border-indigo-500/20 bg-indigo-500/5 text-indigo-500 h-5 px-2.5 rounded-md">
                        Multi-Contact Group
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20 animate-pulse" />
                        <span className="text-[11px] font-bold text-muted-foreground">Active / Synced</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 animate-fade-in">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg active:scale-95 transition-all">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditGroupUid(group.uid);
                              setEditGroupName(displayName);
                              setIsEditOpen(true);
                            }}
                            className="text-foreground hover:bg-muted/40 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-indigo-500" />
                            Edit Group Name
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeleteGroupUid(group.uid);
                              setDeleteGroupName(displayName);
                              setIsDeleteOpen(true);
                            }}
                            className="text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/20 font-semibold text-xs flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center pl-6 pr-6">
                  <div className="space-y-2">
                    <Folder className="h-8 w-8 text-muted-foreground/60 mx-auto" />
                    <p className="text-sm font-bold text-muted-foreground">No contact groups found</p>
                    <p className="text-xs text-muted-foreground/80 font-medium">Verify your credentials or synchronize with your POS database to import groups.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Group Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Update Contact Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Group Name</Label>
              <Input 
                placeholder="e.g. VIP Customers Updated" 
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="bg-muted/40 border-border text-foreground focus-visible:ring-indigo-500"
              />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold active:scale-95 transition-transform" onClick={handleUpdateGroup}>
              Update Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Delete Contact Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-extrabold text-foreground">"{deleteGroupName}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-border hover:bg-muted/40 font-bold text-foreground" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold active:scale-95 transition-transform" onClick={handleDeleteGroup}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
