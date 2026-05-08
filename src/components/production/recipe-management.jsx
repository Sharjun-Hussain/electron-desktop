"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
  Origami,
  Eye,
} from "lucide-react";

import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { usePermission } from "@/hooks/use-permission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";

export default function RecipeManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const { formatCurrency } = useAppSettings();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });
  const [pageCount, setPageCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchRecipes = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        size: pagination.pageSize.toString(),
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      if (data.status === "success") {
        setRecipes(data.data?.data || []);
        setPageCount(data.data?.pagination?.pages || 0);
      }
    } catch (err) {
      toast.error("Failed to fetch recipes");
    } finally {
      setLoading(false);
    }
  }, [session, pagination]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recipes/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        toast.success("Recipe deleted successfully");
        fetchRecipes();
      }
    } catch (err) {
      toast.error("Failed to delete recipe");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Recipe Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.original.name}</span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {row.original.product?.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "batch_size",
      header: "Standard Yield",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-none font-medium">
          {row.original.batch_size} Units
        </Badge>
      ),
    },
    {
      accessorKey: "total_cost",
      header: "Estimated Costing",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-emerald-600 text-sm">
            {formatCurrency(row.original.total_cost)}
          </span>
          <span className="text-xs text-muted-foreground opacity-70">
            {formatCurrency(row.original.total_cost / (row.original.batch_size || 1))} / Unit
          </span>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={cn(
          "shadow-none font-medium",
          row.original.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-gray-100 text-gray-600 border-gray-200"
        )}>
          {row.original.is_active ? "Active Specification" : "Draft Mode"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-emerald-500/10">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-border/50 animate-in zoom-in-95 duration-200">
            <DropdownMenuItem
              onClick={() => router.push(`/production/recipes/edit?id=${row.original.id}`)}
              className="rounded-lg cursor-pointer"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Modify Recipe
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-lg text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
              onClick={() => {
                setDeleteId(row.original.id);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete BOM
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in duration-700">
      <ResourceManagementLayout
        data={recipes}
        isLoading={loading}
        columns={columns}
        headerTitle={
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-500/10 shadow-sm animate-pulse">
              <Origami className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground leading-tight">Recipes (BOM)</h1>
              <p className="text-sm text-muted-foreground font-medium opacity-80">
                Manage Bills of Materials and Production Standards
              </p>
            </div>
          </div>
        }
        addButtonLabel="Create Recipe"
        onAddClick={() => router.push("/production/recipes/new")}
        paginationState={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Remove Recipe Specification?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium">
              This will permanently delete the recipe Bill of Materials. This action cannot be reversed and may affect historical production references.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl font-semibold shadow-lg shadow-red-600/20"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
