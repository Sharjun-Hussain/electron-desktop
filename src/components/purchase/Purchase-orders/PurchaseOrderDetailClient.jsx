"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Printer,
  Download,
  MoreHorizontal,
  Edit,
  FileText,
  Upload,
  ClipboardCheck,
  Eye,
  FileIcon,
  Image as ImageIcon,
  X,
  Search,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  FileSpreadsheet,
  Settings2,
  ChevronDown,
  Copy,
  Mail,
  XCircle,
  MoreVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { PurchaseOrderTemplate } from "@/components/Template/PurchaseOrderTemplate";
import { toast } from "sonner";
import { format } from "@/lib/date-utils";

// --- 1. API HELPERS ---

async function fetchPO(id, token) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to fetch Purchase Order");
  const data = await response.json();
  return data.data;
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(parseFloat(amount));
};

// --- 2. HELPER: Attachment Item ---
const AttachmentItem = ({ file, onDelete, isDeleting }) => {
  const fileUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${file.file_path.replace('./', '')}`;
  const isImage = file.file_type?.startsWith("image/");

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Thumbnail Logic */}
        <div className="h-10 w-10 rounded bg-muted/40 shrink-0 overflow-hidden border flex items-center justify-center">
          {isImage ? (
            <img
              src={fileUrl}
              alt={file.file_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileIcon className="h-5 w-5 text-emerald-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
            {file.file_name}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">{(file.file_size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* View Action */}
        {isImage ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 hover:text-emerald-500"
                title="View Full Screen"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black border-none">
              <div className="relative w-full h-[80vh] flex items-center justify-center">
                <img
                  src={fileUrl}
                  alt={file.file_name}
                  className="max-w-full max-h-full object-contain"
                />
                <DialogClose className="absolute top-4 right-4 bg-card/10 hover:bg-card/20 p-2 rounded-full text-white">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/50 hover:text-emerald-500"
            title="View File"
            onClick={() => window.open(fileUrl, "_blank")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/50 hover:text-emerald-500"
          title="Download"
          onClick={() => {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = file.file_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          <Download className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/50 hover:text-red-500"
          title="Delete"
          onClick={() => onDelete(file.id)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default function PurchaseOrderView() {
  const searchParams = useSearchParams();
  const poid = searchParams.get('id');
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [poData, setPoData] = useState(null);
  const fileInputRef = useRef(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  const printComponentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef, // <--- User requested syntax
    documentTitle: poData ? `PO_${poData.po_number}` : "PurchaseOrder",
  });

  // 1. Fetch Data
  useEffect(() => {
    const load = async () => {
      if (!session?.accessToken || !poid) return;
      setIsLoading(true);
      try {
        const data = await fetchPO(poid, session.accessToken);
        setPoData(data);
      } catch (error) {
        console.error("Error fetching PO:", error);
        toast.error("Failed to load Purchase Order details");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [poid, session?.accessToken]);

  const handleApprove = async () => {
    if (!session?.accessToken) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (response.ok) {
        toast.success("Purchase Order approved successfully");
        // Refresh data
        const updated = await fetchPO(poData.id, session.accessToken);
        setPoData(updated);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to approve Purchase Order");
      }
    } catch (error) {
      toast.error("An error occurred during approval");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!session?.accessToken) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/pdf`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PO-${poData.po_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      toast.error("Error downloading PDF");
    }
  };

  const handleCancel = async () => {
    if (!session?.accessToken || !poData?.id) return;

    // Safety check: Cannot cancel if already cancelled or received
    if (poData.status === 'cancelled' || poData.status === 'received') {
      toast.error(`Cannot cancel an order that is already ${poData.status}`);
      return;
    }

    const confirmCancel = window.confirm("Are you sure you want to cancel this Purchase Order? This action cannot be undone.");
    if (!confirmCancel) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      if (response.ok) {
        toast.success("Purchase Order cancelled successfully");
        const updated = await fetchPO(poData.id, session.accessToken);
        setPoData(updated);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to cancel Purchase Order");
      }
    } catch (error) {
      toast.error("An error occurred during cancellation");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!session?.accessToken || !poData?.id) return;

    const emailPromise = fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/email`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` }
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to send email");
      }
      return response;
    });

    toast.promise(emailPromise, {
      loading: 'Engaging mail server and preparing protocol...',
      success: () => `Purchase Order successfully dispatched to ${poData.supplier?.email || "Supplier"}`,
      error: (err) => err.message || "Error sending protocol email",
    });
  };

  const handleDuplicate = () => {
    router.push(`/purchase/purchase-orders/create?duplicateId=${poData.id}`);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachmentFiles', file);
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        toast.success("Attachments uploaded successfully");
        // Refresh data
        const updated = await fetchPO(poid, session.accessToken);
        setPoData(updated);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to upload attachments");
      }
    } catch (error) {
      toast.error("Error uploading files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;

    setDeletingAttachmentId(attachmentId);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase-orders/${poData.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });

      if (response.ok) {
        toast.success("Attachment deleted");
        setPoData(prev => ({
          ...prev,
          attachments: prev.attachments.filter(a => a.id !== attachmentId)
        }));
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to delete attachment");
      }
    } catch (error) {
      toast.error("Error deleting attachment");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-muted-foreground/60 font-medium">Loading Order...</span>
      </div>
    );
  }

  if (!poData) return <div>Not Found</div>;

  // 2. Filter Items Logic (Name, Code/SKU, Barcode)
  const filteredItems = (poData.items || []).filter((item) => {
    const query = searchQuery.toLowerCase();
    const productName = item.product?.name || item.name || "";
    const productCode = item.product?.code || "";
    const variantSku = item.variant?.sku || "";
    const variantBarcode = item.variant?.barcode || "";

    return (
      productName.toLowerCase().includes(query) ||
      productCode.toLowerCase().includes(query) ||
      variantSku.toLowerCase().includes(query) ||
      variantBarcode.toLowerCase().includes(query)
    );
  });

  // Helper to determine badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "received": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "partially_received": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "pending": return "bg-emerald-500/10 text-emerald-600 border-blue-200";
      case "ordered": return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-muted/40 text-foreground/80";
    }
  };


  return (
    <div className="flex-1 space-y-6 p-6 bg-background min-h-screen">

      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border border-border/50 bg-card h-10 w-10 shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#10b981]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  Purchase Order #{poData.po_number}
                </h1>
                <Badge
                  variant="secondary"
                  className={`px-2.5 py-0.5 text-xs capitalize font-semibold border ${getStatusColor(poData.status)}`}
                >
                  {poData.status?.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] opacity-80 mt-0.5">
                Created {poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflow Action: Approve */}
          {poData.status === "pending" && (
            <Button
              onClick={handleApprove}
              disabled={isActionLoading}
              size="sm"
              className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
            >
              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve Order
            </Button>
          )}

          {/* Workflow Action: Receive Goods */}
          {(poData.status === "ordered" || poData.status === "partially_received") && (
            <Link href={`/purchase/grn/create?poid=${poData.id}`}>
              <Button size="sm" className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20">
                <ClipboardCheck className="h-4 w-4" />
                Receive Goods
              </Button>
            </Link>
          )}

          <div className="hidden">
            {poData && <PurchaseOrderTemplate ref={printComponentRef} data={poData} />}
          </div>

          {/* Unified Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/60 bg-card hover:bg-muted/30 transition-all shadow-sm h-9">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Actions</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Order Management</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <Link href={`/purchase/purchase-orders/edit?poid=${poData.id}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Edit Order</span>
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem onClick={handlePrint} className="cursor-pointer">
                <Printer className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Print Protocol</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                <Download className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Download PDF</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                <Copy className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Duplicate PO</span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleEmail} className="cursor-pointer">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Email Supplier</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleCancel}
                className="cursor-pointer text-red-600 focus:text-red-700"
                disabled={poData.status === 'cancelled' || poData.status === 'received'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                <span>Cancel Order</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* --- Info Cards --- */}
      <Card className="border border-border/50 shadow-sm bg-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supplier Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                Supplier Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="col-span-2 font-medium text-foreground">{poData.supplier?.name || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Code</span>
                  <span className="col-span-2 font-mono text-xs bg-muted/40 px-2 py-0.5 rounded w-fit text-foreground/80">{poData.supplier?.id?.substring(0, 8) || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="col-span-2 text-foreground">{poData.supplier?.contact || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="col-span-2 text-foreground">{poData.supplier?.phone || "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <a href={`mailto:${poData.supplier?.email}`} className="col-span-2 text-emerald-500 hover:underline truncate">{poData.supplier?.email || "N/A"}</a>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Address</span>
                  <span className="col-span-2 text-foreground">{poData.supplier?.address || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* PO Details */}
            <div className="border-t md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0 border-border/50">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Order Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">PO Number</span>
                  <span className="col-span-2 font-bold text-foreground">{poData.po_number}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Date</span>
                  <span className="col-span-2 text-foreground">{poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Expected</span>
                  <span className="col-span-2 text-foreground">{poData.expected_delivery_date ? format(new Date(poData.expected_delivery_date), "MMM dd, yyyy") : "N/A"}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="col-span-2 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                      {poData.created_by_user?.name?.charAt(0) || "U"}
                    </div>
                    {poData.created_by_user?.name || "System"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="col-span-2 text-foreground">{poData.payment_terms || "N/A"}</span>
                </div>
                {poData.notes && (
                  <div className="grid grid-cols-3 gap-4">
                    <span className="text-muted-foreground">Notes</span>
                    <span className="col-span-2 text-amber-700 bg-amber-500/10 p-2 rounded-md text-xs">
                      {poData.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Order Items Table --- */}
      <Card className="border border-border/50 shadow-sm bg-card">
        <CardHeader className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30">
          <CardTitle className="text-lg font-semibold">Order Items</CardTitle>

          {/* SEARCH BAR */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, SKU, or Barcode..."
                className="pl-9 h-9 bg-muted/30 border-border/60 focus:bg-card transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="pl-6 text-xs uppercase font-semibold text-muted-foreground/60">Product</TableHead>
                <TableHead className="text-xs uppercase font-semibold text-muted-foreground/60">Code / SKU</TableHead>
                <TableHead className="text-right text-xs uppercase font-semibold text-muted-foreground/60">Ordered</TableHead>

                {/* Hide "Received" column if Pending */}
                {poData.status !== "pending" && (
                  <TableHead className="text-right text-xs uppercase font-semibold text-muted-foreground/60">Received</TableHead>
                )}

                <TableHead className="text-right text-xs uppercase font-semibold text-muted-foreground/60">Unit Cost</TableHead>
                <TableHead className="text-right pr-6 text-xs uppercase font-semibold text-muted-foreground/60">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-border/30 hover:bg-muted/20">
                    <TableCell className="pl-6">
                      <div className="font-medium text-foreground">
                        {item.product?.name || item.name || <span className="text-muted-foreground/50 italic">Product Unavailable</span>}
                      </div>
                      <div className="text-xs text-muted-foreground md:hidden">
                        {item.product?.code || item.code || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="font-mono text-xs text-muted-foreground bg-muted/40 w-fit px-1.5 py-0.5 rounded">
                        {item.variant?.sku || item.product?.code || "N/A"}
                      </div>
                      {item.variant?.barcode && (
                        <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {item.variant.barcode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground/80">{item.quantity}</TableCell>

                    {/* Hide Received Cell if Pending */}
                    {poData.status !== "pending" && (
                      <TableCell className="text-right">
                        <span className={item.quantity_received < item.quantity ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                          {item.quantity_received || 0}
                        </span>
                        {(item.quantity_received || 0) < item.quantity && (
                          <span className="text-[10px] text-amber-500 block">
                            {item.quantity - (item.quantity_received || 0)} Pending
                          </span>
                        )}
                      </TableCell>
                    )}

                    <TableCell className="text-right text-muted-foreground">{formatCurrency(item.unit_cost)}</TableCell>
                    <TableCell className="text-right pr-6 font-semibold text-foreground">{formatCurrency(item.total_amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={poData.status === "pending" ? 5 : 6} className="h-24 text-center text-muted-foreground/60">
                    No items found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Financial Footer */}
          <div className="flex justify-end p-6 bg-muted/20">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(poData.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-emerald-500">-{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center text-lg font-bold text-foreground">
                <span className="whitespace-nowrap -ml-12">Grand Total</span>
                <span>{formatCurrency(poData.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- GRN History --- */}
      {poData.status !== "pending" && (
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base font-semibold">GRN History</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="pl-6 text-xs uppercase">GRN #</TableHead>
                  <TableHead className="text-xs uppercase">Date</TableHead>
                  <TableHead className="text-xs uppercase">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poData.grns && poData.grns.length > 0 ? (
                  poData.grns.map((grn) => (
                    <TableRow key={grn.id}>
                      <TableCell className="pl-6 font-medium text-emerald-500">{grn.grn_number}</TableCell>
                      <TableCell>{format(new Date(grn.received_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize">{grn.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 rounded-full">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-border/60">
                            <Link href={`/purchase/grn/view?id=${grn.id}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="cursor-pointer">
                              <Printer className="mr-2 h-4 w-4 text-muted-foreground" />
                              Print GRN
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No Goods Received Notes generated yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* --- Return History --- */}
      {poData.returns && poData.returns.length > 0 && (
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-base font-semibold text-red-600">Return History</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader className="bg-red-500/5/50">
                <TableRow>
                  <TableHead className="pl-6 text-xs uppercase text-red-700">Return #</TableHead>
                  <TableHead className="text-xs uppercase text-red-700">Date</TableHead>
                  <TableHead className="text-xs uppercase text-red-700">Amount</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase text-red-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poData.returns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="pl-6 font-medium text-red-600">{ret.return_number}</TableCell>
                    <TableCell>{format(new Date(ret.return_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(ret.total_amount)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 rounded-full">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-border/60">
                            <Link href={`/purchase/returns/view?id=${ret.id}`}>
                            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="cursor-pointer">
                            <Printer className="mr-2 h-4 w-4 text-muted-foreground" />
                            Print Return
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* --- Bottom Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Timeline */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-border/50 ml-3 space-y-8 pb-2">
              {(poData.timeline || [
                {
                  title: "Purchase Order Created",
                  by: poData.created_by_user?.name || "System",
                  date: poData.order_date ? format(new Date(poData.order_date), "MMM dd, yyyy") : "N/A"
                }
              ]).map((event, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-card ${idx === 0 ? "bg-emerald-500" : "bg-muted"}`}></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground/60">by {event.by} on {event.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="border border-border/50 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* List existing attachments */}
            {poData.attachments && poData.attachments.length > 0 ? (
              poData.attachments.map((file) => (
                <AttachmentItem
                  key={file.id}
                  file={file}
                  onDelete={handleDeleteAttachment}
                  isDeleting={deletingAttachmentId === file.id}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground/50 text-center py-4 italic">
                No attachments found.
              </div>
            )}

            {/* Upload Area */}
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-emerald-500/5 hover:border-emerald-500/30 cursor-pointer transition-all group"
            >
              <div className="bg-muted/30 p-3 rounded-full mb-2 group-hover:bg-emerald-500/10 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground/50 group-hover:text-emerald-500" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-emerald-600">
                {isUploading ? "Uploading Protocols..." : "Click to Upload Protocols"}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1 uppercase">PDF, JPG, PNG (Max 5MB)</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}