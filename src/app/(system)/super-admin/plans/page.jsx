"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Plus, 
  Layers, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Hash,
  Activity,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PlanForm from "./plan-form";

const PlanHeaderContent = () => (
  <div className="flex items-center gap-4">
    <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
      <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div>
      <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Subscription Plans</h1>
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Tiered Feature Matrices & Revenue Architecture</p>
    </div>
  </div>
);

const PlanStatsCards = React.memo(({ data }) => {
  const stats = React.useMemo(() => {
    if (!data?.length) return { total: 0, active: 0, enterprise: 0 };
    return {
      total: data.length,
      active: data.filter((p) => p.is_active).length,
      enterprise: data.filter((p) => p.name === 'Enterprise').length,
    };
  }, [data]);

  const statItems = [
    {
      label: "Total Tiers",
      value: stats.total,
      icon: Layers,
      gradient: "from-blue-500 to-indigo-400",
      trend: "Configured"
    },
    {
      label: "Active Plans",
      value: stats.active,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-400",
      trend: "Live"
    },
    {
      label: "Enterprise Tiers",
      value: stats.enterprise,
      icon: Activity,
      gradient: "from-violet-500 to-purple-400",
      trend: "High End"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {statItems.map((item, idx) => (
        <div key={idx} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md">
          <div className={`p-3 rounded-lg bg-linear-to-br ${item.gradient} text-white`}>
            <item.icon className="w-5 h-5 shadow-sm" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-60">{item.label}</p>
            </div>
            <h3 className="text-2xl font-bold text-foreground leading-none tabular-nums">{item.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
});

PlanStatsCards.displayName = "PlanStatsCards";

export default function BusinessPlansPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/plans`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        setPlans(data.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) fetchPlans();
  }, [session]);

  const handleSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const method = selectedPlan ? "PUT" : "POST";
      const url = selectedPlan 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/plans/${selectedPlan.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/plans`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast.success(selectedPlan ? "Plan updated" : "Plan created");
        setIsDialogOpen(false);
        fetchPlans();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to save plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success("Plan deleted successfully");
        fetchPlans();
      } else {
        toast.error(data.message || "Failed to delete plan");
      }
    } catch (error) {
      toast.error("Error deleting plan");
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="font-bold text-foreground">{row.original.name}</p>
            <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">
              {row.original.description || "No description"}
            </p>
          </div>
        </div>
      )
    },
    {
      accessorKey: "trial_days",
      header: "Trial",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="size-3 text-muted-foreground" />
          <span className="font-bold text-sm">
            {row.original.trial_days || 0} Days
          </span>
        </div>
      )
    },
    {
      accessorKey: "max_branches",
      header: "Limits",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-[10px] uppercase tracking-tighter">
            Branches: {row.original.max_branches === -1 ? "∞" : row.original.max_branches}
          </span>
          <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-tighter">
            Users: {row.original.max_users === -1 ? "∞" : row.original.max_users}
          </span>
        </div>
      )
    },
    {
      accessorKey: "price_monthly",
      header: "Price (M/Y)",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-xs">${parseFloat(row.original.price_monthly).toFixed(2)} / mo</span>
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">${parseFloat(row.original.price_yearly).toFixed(2)} / yr</span>
        </div>
      )
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "secondary"} className="rounded-full text-[10px] uppercase font-black tracking-widest px-3">
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2 pr-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-lg hover:bg-muted text-muted-foreground"
            onClick={() => {
              setSelectedPlan(row.original);
              setIsDialogOpen(true);
            }}
          >
            <Edit3 className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8 rounded-lg hover:bg-red-50 text-red-400"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <ResourceManagementLayout
        data={plans}
        columns={columns}
        isLoading={loading}
        headerTitle={<PlanHeaderContent />}
        statCardsComponent={<PlanStatsCards data={plans} />}
        addButtonLabel="Create Plan"
        onAddClick={() => {
          setSelectedPlan(null);
          setIsDialogOpen(true);
        }}
        searchColumn="name"
        searchPlaceholder="Search plans..."
      />

      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SheetContent className="sm:max-w-xl p-0 border-l border-border/40 shadow-2xl bg-background overflow-hidden flex flex-col h-full">
          {/* CLEAN HEADER */}
          <SheetHeader className="px-8 py-6 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
                <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground">
                {selectedPlan ? "Update Subscription Plan" : "Initialize New Tier"}
              </SheetTitle>
            </div>
            <SheetDescription className="text-sm text-muted-foreground">
              {selectedPlan ? "Modify existing service level and module matrix." : "Define a new service tier and its associated feature set."}
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-8 py-8 thin-scrollbar bg-background">
            <PlanForm 
              initialData={selectedPlan} 
              onSubmit={handleSubmit} 
              onCancel={() => setIsDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
