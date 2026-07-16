"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Phone, Shield, Calendar, 
  MapPin, Hash, X, Edit3, Briefcase, 
  Building2, Clock, ShieldCheck, TrendingUp,
  Activity, Package, Wallet, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "@/lib/date-utils";
import { Card } from "@/components/ui/card";

const EmployeeDetailSheet = ({ isOpen, onOpenChange, employee, onEdit }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!employee) return null;

  const initials = employee.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
  const createdAt = employee.created_at ? format(new Date(employee.created_at), 'MMM dd, yyyy') : 'N/A';
  const roles = employee.user?.roles || [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl">
        
        {/* HEADER - Styled like Customer Profile */}
        <SheetHeader className="px-8 py-6 pr-14 border-b border-border bg-background shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                  {employee.name}
                  <Badge variant={employee.is_active ? "default" : "secondary"} className="text-[10px] font-semibold tracking-wide bg-emerald-500 text-white border-none">
                    {employee.is_active ? "Active" : "Inactive"}
                  </Badge>
                </SheetTitle>
              </div>
              <SheetDescription className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600/50" />
                Staff Identity: #{employee.id}
              </SheetDescription>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Date Joined</p>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xl font-bold tabular-nums text-foreground">
                  {createdAt}
                </span>
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* TABS NAVIGATION */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-8 border-b border-border bg-muted/10 shrink-0">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0 border-none">
              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "employment", label: "Employment", icon: Briefcase },
                { id: "roles", label: "Privileges", icon: Shield },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-1 font-semibold text-sm text-muted-foreground data-[state=active]:text-foreground transition-none gap-2 data-[state=active]:shadow-none"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-8 overflow-y-auto">
            
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="mt-0 space-y-8">
              {/* Contact Information Cards */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">Personnel Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 shadow-sm border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-3.5 w-3.5 text-emerald-600/70" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{employee.email || "—"}</p>
                  </Card>
                  <Card className="p-4 shadow-sm border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-3.5 w-3.5 text-emerald-600/70" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">{employee.phone || "—"}</p>
                  </Card>
                </div>
              </div>

              {/* Physical Residence */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">Primary Location</h3>
                </div>
                <Card className="p-5 shadow-sm bg-muted/20 border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    {employee.address || "No physical residence record found."}
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* EMPLOYMENT TAB */}
            <TabsContent value="employment" className="mt-0 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">Deployment Assignments</h3>
                </div>
                
                {/* Primary Branch Card */}
                <Card className="p-4 shadow-sm border-emerald-100 dark:border-emerald-500/10 bg-emerald-50/30 dark:bg-emerald-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-50" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-emerald-600/70" />
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Primary Master Branch</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{employee.primaryBranch?.name || "Corporate Hub"}</p>
                </Card>

                {/* Additional Branches Grid */}
                {employee.branches?.filter(b => b.id !== employee.branch_id).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employee.branches.filter(b => b.id !== employee.branch_id).map((branch) => (
                      <Card key={branch.id} className="p-4 shadow-sm border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Assignment</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{branch.name}</p>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <Card className="p-4 shadow-sm border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-emerald-600/70" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">National ID (NIC)</p>
                    </div>
                    <p className="text-lg font-bold text-foreground">{employee.nic || "—"}</p>
                  </Card>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 rounded-md border border-emerald-100 dark:border-emerald-500/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">System Permissions</p>
                  <p className="text-xs text-emerald-700/60 dark:text-emerald-500/60 mt-0.5">Manage and audit staff authorization levels.</p>
                </div>
                <Button 
                  onClick={() => onEdit(employee)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-sm"
                >
                  <Edit3 className="size-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </TabsContent>

            {/* ROLES TAB */}
            <TabsContent value="roles" className="mt-0">
               <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-foreground">Authorized Roles</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <ShieldCheck className="size-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{role.name}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px] uppercase">Active</Badge>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-border rounded-xl">
                      <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                      <h4 className="font-semibold text-sm text-muted-foreground">No roles assigned</h4>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 text-emerald-600/50" />
            <span className="text-[11px] font-semibold italic">Identity verified via system protocol</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-6 rounded-xl hover:bg-slate-50 transition-all text-xs"
          >
            Acknowledge & Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EmployeeDetailSheet;
