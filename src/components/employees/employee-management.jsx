"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, UserCheck, UserX, Briefcase, Search, RefreshCcw,
  Download, Plus, MoreHorizontal, Pencil, Trash2,
  Loader2, CheckCircle2, XCircle, Activity, AlertTriangle
} from "lucide-react";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import EmployeesPageSkeleton from "@/app/skeletons/Employees-skeleton";
import { columns as employeeColumns } from "./columns";
import { Badge } from "@/components/ui/badge";
import EmployeeDetailSheet from "./EmployeeDetailSheet";

const EmployeeBulkActions = ({ table, onDelete, onToggleStatus }) => {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((row) => row.original.id);

  if (selectedIds.length === 0) return null;

  return (
    <>
      <DropdownMenuItem onClick={() => { onToggleStatus(selectedIds); table.resetRowSelection(); }}>
        <UserCheck className="h-4 w-4 mr-2" /> Activate Selected
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { onToggleStatus(selectedIds); table.resetRowSelection(); }}>
        <UserX className="h-4 w-4 mr-2" /> Deactivate Selected
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => { onDelete(selectedIds); table.resetRowSelection(); }} className="text-red-500 focus:text-red-600">
        <Trash2 className="h-4 w-4 mr-2" /> Remove Selected
      </DropdownMenuItem>
    </>
  );
};

export default function EmployeesPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();

  const isEssential = session?.user?.organization?.subscription_tier === "Essential" && !session?.user?.organization?.is_master;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?return_url=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [router, status]);

  if (isEssential) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6 bg-background">
        <div className="p-5 rounded-3xl bg-amber-500/10 mb-6 border border-amber-500/20 shadow-inner">
          <AlertTriangle className="h-12 w-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3 uppercase tracking-tight">Module Restricted</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium leading-relaxed">
          The <span className="text-emerald-600 font-bold">Employee & HR Management</span> suite is reserved for Professional and Enterprise organizations. 
          Your current <span className="text-amber-600 font-bold">Essential</span> plan does not support personnel catalogs.
        </p>
        <div className="flex gap-3">
           <Button onClick={() => router.push("/dashboard")} variant="outline" className="font-bold h-11 px-6 rounded-xl border-border/40">Back to Dashboard</Button>
           <Button onClick={() => router.push("/settings")} className="font-bold h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">Upgrade Plan</Button>
        </div>
      </div>
    );
  }

  const fetchEmployees = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      if (data.status === "success") {
        setEmployees(data?.data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch employees");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchEmployees();
  }, [status, session]);

  const handleAddClick = () => {
    setIsNavigating(true);
    router.push("/employees/new");
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  const handleEditClick = (employee) => {
    setIsNavigating(true);
    router.push(`/employees/edit?id=${employee.id}`);
  };

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    if (!confirm(`Are you sure you want to remove ${idsToDelete.length} staff member(s)?`)) return;

    toast.promise(
      (async () => {
        for (const id of idsToDelete) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Deletion blocked by system dependencies");
          }
        }
        await fetchEmployees();
        return true;
      })(),
      {
        loading: "Attempting personnel removal...",
        success: "Staff removed successfully!",
        error: (err) => err.message
      }
    );
  };

  const handleToggleStatus = async (employeeOrIds) => {
    let ids = [];
    if (Array.isArray(employeeOrIds)) {
      ids = employeeOrIds;
    } else {
      ids = [employeeOrIds.id];
    }

    if (ids.length === 0) return;

    toast.promise(
      Promise.all(ids.map((id) =>
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${id}/toggle-status`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      )),
      {
        loading: "Updating enrollment status...",
        success: () => { fetchEmployees(); return "Status updated successfully!"; },
        error: "Action failed."
      }
    );
  };

  const handleToggleAccess = async (employee) => {
    if (!employee.user_id) {
       toast.error("This staff member does not have a system account.");
       return;
    }

    toast.promise(
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employees/${employee.id}/toggle-access`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }).then(async (res) => {
         if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Failed to update access");
         }
         return res.json();
      }),
      {
        loading: "Updating system access...",
        success: () => { fetchEmployees(); return "Login access updated!"; },
        error: (err) => err.message
      }
    );
  };

  // We need to pass the handlers to useMemo if they change.
  // Standard list pattern: handlers are passed down to columns.
  // But columns are defined as a static array in many places here.
  // I will check columns.jsx soon to see how to inject handlers.


  const totalEmployees = employees.length;
  const activeStaff = employees.filter(e => e.is_active).length;
  const inactiveStaff = totalEmployees - activeStaff;
  const uniqueRoles = new Set(employees.flatMap(e => e.user?.roles?.map(r => r.name) || [])).size;

  if (loading && employees.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-background p-6 md:p-10 space-y-8 pb-32 max-w-[1600px] mx-auto w-full">
        <EmployeesPageSkeleton />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background font-sans">
      <ResourceManagementLayout
        data={employees}
        columns={employeeColumns}
        isLoading={loading}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Employee Management</h1>
              <p className="text-xs text-muted-foreground font-semibold mt-1 opacity-70">
                Staff catalog, role allocation, and organizational HR control
              </p>
            </div>
          </div>
        }
        addButtonLabel="Add Employee"
        onAddClick={handleAddClick}
        isAdding={isNavigating}
        onExportClick={() => console.log('Export')}
        extraActions={
          <Button onClick={fetchEmployees} variant="outline" className="h-10 w-10 p-0 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50">
            <RefreshCcw className={cn("h-4 w-4 text-muted-foreground hover:text-emerald-600", loading && "animate-spin")} />
          </Button>
        }
        statCardsComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Staff", value: totalEmployees, icon: Users, gradient: "from-emerald-500 to-emerald-400" },
              { label: "Active Staff", value: activeStaff, icon: UserCheck, gradient: "from-blue-500 to-blue-400" },
              { label: "On Leave / Inactive", value: inactiveStaff, icon: UserX, gradient: "from-orange-500 to-orange-400" },
              { label: "Staff Roles", value: uniqueRoles, icon: Briefcase, gradient: "from-purple-500 to-purple-400" },
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4 transition-all hover:shadow-md duration-300">
                <div className={cn("p-3 rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform duration-500 group-hover:scale-105", stat.gradient)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-foreground tabular-nums">
                    {stat.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        }
        searchPlaceholder="Search staff by identity or role..."
        onSearchChange={setGlobalFilter}
        bulkActionsComponent={<EmployeeBulkActions onDelete={handleDelete} onToggleStatus={handleToggleStatus} />}
        onClearFilters={() => setGlobalFilter("")}
        isManualPagination={false} // Use client-side pagination since we have all employees
        tableMeta={{
          onView: handleViewDetails,
          onEdit: handleEditClick,
          onToggleStatus: (staff) => handleToggleStatus(staff),
          onToggleAccess: (staff) => handleToggleAccess(staff),
          onDelete: (id) => handleDelete(id)
        }}
      />

      <EmployeeDetailSheet
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        employee={selectedEmployee}
        onEdit={handleEditClick}
      />
    </div>
  );
}
