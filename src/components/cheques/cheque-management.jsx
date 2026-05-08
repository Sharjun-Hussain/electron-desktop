"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResourceManagementLayout } from "@/components/general/resource-management-layout";
import { getChequeColumns } from "./cheque-column";
import ChequePageSkeleton from "@/app/skeletons/cheques/cheque-page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, History, Loader2, Zap, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChequeDetailsSheet } from "./ChequeDetailsSheet";

export default function ChequeManagement() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [viewingCheque, setViewingCheque] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.FINANCE_MANAGE);

  const fetchCheques = async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch cheques");
      const data = await response.json();
      if (data.status === "success") {
        setCheques(data?.data?.data || data?.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch cheques");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/accounts`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      const data = await response.json();
      if (data.status === "success") {
        setAccounts(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch accounts", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCheques();
      fetchAccounts();
    }
  }, [status, session]);

  const handleUpdateStatus = async (cheque, newStatus) => {
    if (newStatus === "cleared") {
      setSelectedCheque(cheque);
      setIsClearDialogOpen(true);
      return;
    }

    if (newStatus === "bounced") {
      setSelectedCheque(cheque);
      setIsBounceDialogOpen(true);
      return;
    }
  };

  const handleBounceCheque = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${selectedCheque.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "bounced" }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      toast.success("Cheque marked as bounced");
      setIsBounceDialogOpen(false);
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCheque = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account for clearing");
      return;
    }

    try {
      setIsUpdating(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${selectedCheque.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            status: "cleared",
            account_id: selectedAccount,
            cleared_date: new Date()
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");

      toast.success("Cheque cleared successfully");
      setIsClearDialogOpen(false);
      setSelectedAccount("");
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewClick = (cheque) => {
    setViewingCheque(cheque);
    setIsViewSheetOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/cheques/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );
      if (!response.ok) throw new Error("Failed to delete cheque");
      toast.success("Cheque deleted successfully");
      fetchCheques();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = getChequeColumns({
    onUpdateStatus: canManage ? handleUpdateStatus : null,
    onDelete: canManage ? handleDelete : null,
    onView: handleViewClick,
  });

  const receivable = cheques.filter(c => c.type === "receivable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const payable = cheques.filter(c => c.type === "payable").reduce((acc, c) => acc + parseFloat(c.amount), 0);
  const pendingCount = cheques.filter(c => c.status === "pending").length;

  const statCards = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 text-white">
          <ArrowDownLeft className="w-5 h-5 shadow-sm" />
        </div>
        <div className="flex flex-col">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Receivable Amount</p>
          <h3 className="text-2xl font-bold text-foreground">
            LKR {receivable.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
          <ArrowUpRight className="w-5 h-5 shadow-sm" />
        </div>
        <div className="flex flex-col">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Payable Amount</p>
          <h3 className="text-2xl font-bold text-foreground">
            LKR {payable.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border shadow-xs flex items-center gap-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 text-white">
          <Clock className="w-5 h-5 shadow-sm" />
        </div>
        <div className="flex flex-col">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Pending Clearance</p>
          <h3 className="text-2xl font-bold text-foreground">
            {pendingCount}
          </h3>
        </div>
      </div>
    </div>
  );

  const headerTitle = (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
        <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Cheque Management
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track and manage receivable and payable cheques
        </p>
      </div>
    </div>
  );

  return (
    <>
      <ResourceManagementLayout
        data={cheques}
        columns={columns}
        isLoading={loading || status === "loading"}
        isError={!!error && cheques.length === 0}
        errorMessage={error}
        onRetry={fetchCheques}
        headerTitle={headerTitle}
        addButtonLabel="Add Cheque"
        onAddClick={canManage ? () => router.push("/cheques/new") : null}
        searchColumn="cheque_number"
        searchPlaceholder="Search by cheque #..."
        loadingSkeleton={<ChequePageSkeleton />}
        statCardsComponent={statCards}
      />

      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedCheque?.type === "receivable" ? "Clear Cheque" : "Realize Payment"}</DialogTitle>
            <DialogDescription>
              {selectedCheque?.type === "receivable" 
                ? "Mark instrument as successfully settled in your account" 
                : "Confirm that funds have been withdrawn from your bank account"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Cheque Number</Label>
                <p className="text-sm font-medium text-foreground">{selectedCheque?.cheque_number}</p>
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Amount</Label>
                <p className="text-sm font-semibold text-emerald-600">LKR {parseFloat(selectedCheque?.amount || 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {selectedCheque?.type === "receivable" ? "Deposit Account" : "Source Account (Withdrawal)"}
              </Label>
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-9 justify-between bg-white border-gray-200"
                  >
                    {selectedAccount
                      ? accounts.find((acc) => acc.id === selectedAccount)?.name
                      : "Search for an account..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0 shadow-md" align="start">
                  <Command>
                    <CommandInput placeholder="Type account name..." className="h-9" />
                    <CommandList className="max-h-[250px]">
                      <CommandEmpty className="py-2 text-center text-sm">No account found.</CommandEmpty>
                      <CommandGroup>
                        {accounts.map((acc) => (
                          <CommandItem
                            key={acc.id}
                            value={acc.name}
                            onSelect={() => {
                              setSelectedAccount(acc.id);
                              setIsComboboxOpen(false);
                            }}
                            className="py-2 px-3 flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Check className={cn("h-4 w-4 text-emerald-500", selectedAccount === acc.id ? "opacity-100" : "opacity-0")} />
                              <span className="text-sm">{acc.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleClearCheque}
              disabled={isUpdating}
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Check className="mr-2 h-4 w-4" /> 
                  {selectedCheque?.type === "receivable" ? "Confirm Settlement" : "Confirm Withdrawal"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBounceDialogOpen} onOpenChange={setIsBounceDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedCheque?.type === "receivable" ? "Cheque Bounced" : "Payment Dishonored"}</DialogTitle>
            <DialogDescription>
              {selectedCheque?.type === "receivable" 
                ? "Mark incoming instrument as unpaid" 
                : "Mark outgoing payment as rejected/failed"}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center space-y-2">
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Are you sure you want to mark cheque <span className="font-bold underline">#{selectedCheque?.cheque_number}</span> as bounced?
            </p>
            <p className="text-xs text-muted-foreground">This action will update the ledger and cannot be undone.</p>
          </div>

          <DialogFooter>
            <Button
              onClick={handleBounceCheque}
              disabled={isUpdating}
              className="w-full h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ChequeDetailsSheet 
        open={isViewSheetOpen} 
        onOpenChange={setIsViewSheetOpen} 
        cheque={viewingCheque} 
      />
    </>
  );
}
