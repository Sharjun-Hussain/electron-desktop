"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderDown } from "lucide-react";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getExpenseCategoryColumns } from "./expense-category-column";
import { ExpenseCategorySheet } from "./expense-category-sheet";
import { usePermission } from "@/hooks/use-permission";
import { MODULES } from "@/lib/permissions";

const TableSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-14 bg-muted/40 rounded-xl" />
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-muted/20 rounded-xl" />
      ))}
    </div>
  </div>
);

export default function ExpenseCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermission();
  const { EXPENSE } = MODULES;

  const fetchCategories = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      if (data.status === "success") {
        setCategories(data?.data?.data || data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (err) {
      setError(err.message);
      // Fallback to mock data if API fails
      setCategories([
        { id: 1, name: "Utilities", description: "Electricity, Water, Internet", is_active: true },
        { id: 2, name: "Rent", description: "Office and warehouse rent", is_active: true },
        { id: 3, name: "Salaries", description: "Employee monthly salaries", is_active: true },
        { id: 4, name: "Marketing", description: "Ads and promotions", is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [status, session]);

  const handleAddClick = () => {
    setSelectedCategory(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setIsSheetOpen(true);
  };

  const handleDelete = async (ids) => {
    const idsToDelete = Array.isArray(ids) ? ids : [ids];
    toast.promise(
      Promise.all(
        idsToDelete.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/expense-categories/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.accessToken}` },
          })
        )
      ),
      {
        loading: "Deleting...",
        success: () => {
          fetchCategories();
          return "Category deleted successfully!";
        },
        error: "Failed to delete.",
      }
    );
  };

  const columns = getExpenseCategoryColumns({
    onEdit: canUpdate(EXPENSE) ? handleEditClick : null,
    onDelete: canDelete(EXPENSE) ? handleDelete : null,
  });

  return (
    <>
    <ResourceManagementLayout
      data={categories}
      columns={columns}
      isLoading={loading || status === "loading"}
      isError={!!error && categories.length === 0}
      errorMessage={error}
      onRetry={fetchCategories}
      headerTitle={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <FolderDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Expense Categories</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and organize business expenditure types</p>
          </div>
        </div>
      }
      addButtonLabel="Add Expense Category"
      addButtonIcon={<FolderDown className="mr-2 h-4 w-4" />}
      addButtonClassName="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
      onAddClick={canCreate(EXPENSE) ? handleAddClick : null}
      searchColumn="name"
      searchPlaceholder="Filter expense categories..."
      loadingSkeleton={<TableSkeleton />}
    />
    
    <ExpenseCategorySheet 
      isOpen={isSheetOpen}
      onClose={() => {
        setIsSheetOpen(false);
        setTimeout(() => setSelectedCategory(null), 300); // Clear after animation
      }}
      onSuccess={() => {
        fetchCategories();
      }}
      initialData={selectedCategory}
    />
    </>
  );
}
