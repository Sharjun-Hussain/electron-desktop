"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { format } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Paperclip,
  Upload,
  Eye,
  X,
  FileIcon,
  Loader2,
  Package,
  Printer,
  Download,
  CheckCircle2,
  User,
  CalendarIcon,
  Building2,
  Settings2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useReactToPrint } from "react-to-print";
import { GRNPrintTemplate } from "@/components/Template/GRNPrintTemplate";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- HELPER: Attachment Item ---
const AttachmentItem = ({ file, onDelete, isDeleting }) => {
  const fileUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${file.file_path.replace('./', '')}`;
  const isImage = file.file_type?.startsWith("image/");

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 overflow-hidden">
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
          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
            {file.file_name}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">{(file.file_size / 1024).toFixed(1)} KB</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {isImage ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 hover:text-emerald-500"
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
            onClick={() => window.open(fileUrl, "_blank")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground/50 hover:text-emerald-500"
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
          onClick={() => onDelete(file.id)}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const printRef = useRef();
  const fileInputRef = useRef();

  const [columns, setColumns] = useState({
    mrp: false,
    wholesale: false,
    selling: false,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("grnDetailColumns");
    if (saved) {
      try {
        setColumns(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("grnDetailColumns", JSON.stringify(columns));
    }
  }, [columns, isMounted]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: grn ? `GRN-${grn.grn_number}` : "GRN Receipt",
  });

  useEffect(() => {
    async function fetchGRNDetails() {
      if (!params.id || !session?.accessToken) {
        if (params.id === undefined || session?.accessToken === undefined) {
          // Still initializing
        } else {
          setLoading(false);
        }
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${params.id}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        const result = await response.json();
        if (result.status === "success") {
          setGrn(result.data);
        } else {
          toast.error(result.message || "Failed to load GRN details");
        }
      } catch (error) {
        console.error("Failed to fetch GRN", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchGRNDetails();
  }, [params.id, session]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        {/* GRN Record Header Skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border/60 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-card border-b border-border/60 px-6 py-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="text-right space-y-2 flex flex-col items-end">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full">
                  <div className="flex justify-between px-6 py-4 border-b border-border/60 bg-muted/10">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center px-6 py-4 border-b border-border/50">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-16 rounded-md" />
                          <Skeleton className="h-4 w-24 rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-8" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-muted/20">
                  <div className="flex justify-between items-center bg-background p-5 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card className="border border-border/60 shadow-sm bg-background rounded-xl">
              <CardContent className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                    {i < 2 && <Separator className="my-4 bg-border/60" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card className="border border-border/60 shadow-sm bg-background rounded-xl">
              <CardContent className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </div>
                    {i < 2 && <Separator className="my-4 bg-border/60" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Attachments Card */}
            <Card className="border border-border/60 shadow-sm bg-background rounded-xl">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6 text-center py-20 bg-background min-h-screen">
        <h1 className="text-2xl font-bold text-foreground/90">GRN Not Found</h1>
        <Button variant="link" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }



  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('attachmentFiles', file);
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${grn.id}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Attachments uploaded successfully");
        setGrn(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), ...result.data]
        }));
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/suppliers/grn/${grn.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });

      if (response.ok) {
        toast.success("Attachment deleted");
        setGrn(prev => ({
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

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen print:p-0 print:bg-card">
      {/* GRN Record Header */}
      <div className="flex items-center justify-between mb-2 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-md">
            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">GRN Details</h1>
            <p className="text-xs font-medium text-muted-foreground">Goods Received Note Ledger Entry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 font-semibold shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Hidden GRN Print Template */}
      <div className="hidden">
        <GRNPrintTemplate ref={printRef} data={grn} columns={columns} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-card border-b border-border/60 px-6 py-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl font-bold text-foreground">{grn.grn_number}</CardTitle>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs px-2.5 py-0.5 rounded-md shadow-none">
                        Finalized
                      </Badge>
                    </div>
                    <CardDescription className="font-semibold text-muted-foreground mt-1 text-sm">
                      Received on {format(new Date(grn.received_date), "EEEE, MMMM do, yyyy")}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-muted-foreground mb-1">Total Valuation</div>
                  <div className="text-2xl font-bold text-foreground tabular-nums leading-none">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isMounted && (
                <div className="flex justify-end p-2 border-b border-border/50 bg-muted/5 print:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 shadow-sm">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={columns.mrp}
                        onCheckedChange={(c) => setColumns(prev => ({ ...prev, mrp: c }))}
                      >
                        MRP Price
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columns.wholesale}
                        onCheckedChange={(c) => setColumns(prev => ({ ...prev, wholesale: c }))}
                      >
                        Wholesale Price
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={columns.selling}
                        onCheckedChange={(c) => setColumns(prev => ({ ...prev, selling: c }))}
                      >
                        Selling Price
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <Table>
                {/* Table Header Row */}
                <TableHeader className="bg-muted/30 border-b border-border">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="pl-6 py-4 font-bold text-muted-foreground text-xs">Item Descriptor</TableHead>
                    <TableHead className="text-center py-4 font-bold text-muted-foreground text-xs">Receipt Qty</TableHead>
                    <TableHead className="text-right py-4 font-bold text-muted-foreground text-xs">Standard Cost</TableHead>
                    {columns.mrp && <TableHead className="text-right py-4 font-bold text-muted-foreground text-xs">MRP Price</TableHead>}
                    {columns.wholesale && <TableHead className="text-right py-4 font-bold text-muted-foreground text-xs">Wholesale Price</TableHead>}
                    {columns.selling && <TableHead className="text-right py-4 font-bold text-muted-foreground text-xs">Selling Price</TableHead>}
                    <TableHead className="pr-6 py-4 text-right font-bold text-muted-foreground text-xs">Line Totals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grn.items?.map((item) => (
                    <TableRow key={item.id} className="border-border/50 hover:bg-muted/20 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">{item.product?.name}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {item.variant && item.variant.name && item.variant.name !== 'Default' && item.variant.name !== item.product?.name && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2 py-0.5 rounded-md">
                              {item.variant.name}
                            </Badge>
                          )}
                          {item.batch_number && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">BN: {item.batch_number}</span>
                          )}
                          {(item.variant?.barcode || item.variant?.sku) && (
                            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="text-[9px] uppercase tracking-wider font-sans">Barcode:</span>
                              <span className="font-semibold text-foreground">{item.variant.barcode || item.variant.sku}</span>
                            </span>
                          )}
                          {item.expiry_date && (
                            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">Exp: {format(new Date(item.expiry_date), "MMM yyyy")}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-foreground text-base tabular-nums">{parseFloat(item.quantity_received).toFixed(0)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-muted-foreground tabular-nums">LKR {parseFloat(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </TableCell>
                      {columns.mrp && (
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-muted-foreground tabular-nums">LKR {parseFloat(item.mrp_price || item.variant?.mrpPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </TableCell>
                      )}
                      {columns.wholesale && (
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-muted-foreground tabular-nums">LKR {parseFloat(item.wholesale_price || item.variant?.wholesalePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </TableCell>
                      )}
                      {columns.selling && (
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold text-muted-foreground tabular-nums">LKR {parseFloat(item.selling_price || item.retail_price || item.variant?.retailPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </TableCell>
                      )}
                      <TableCell className="pr-6 text-right">
                        <span className="font-bold text-emerald-600 text-base tabular-nums">LKR {parseFloat(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-6 bg-muted/20 border-t border-border/60">
                <div className="flex justify-between items-center bg-background p-5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">Verification Confirmed</div>
                      <div className="text-xs font-semibold text-muted-foreground mt-0.5">Inventory updated and ledger balanced.</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-muted-foreground mb-1">Receipt Net</div>
                    <div className="text-xl font-bold text-emerald-600 tabular-nums">LKR {parseFloat(grn.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {grn.notes && (
            <Card className="border border-border/60 shadow-sm bg-muted/10 rounded-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" /> Receiver Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">{grn.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <Card className="border border-border/60 shadow-sm bg-background rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4 group/sidebar">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 group-hover/sidebar:bg-emerald-100 transition-colors">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">Supplier Entity</span>
                  <span className="font-bold text-foreground text-sm truncate">{grn.supplier?.name}</span>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex items-center gap-4 group/sidebar">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 group-hover/sidebar:bg-emerald-100 transition-colors">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">Contact Person</span>
                  <span className="font-bold text-foreground text-sm">{grn.supplier?.contact_person || 'System Primary'}</span>
                </div>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex items-center gap-4 group/sidebar">
                <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 group-hover/sidebar:bg-emerald-100 transition-colors">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground mb-1">Received Date</span>
                  <span className="font-bold text-foreground text-sm">{format(new Date(grn.received_date), "MMM do, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 shadow-sm bg-background rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              {grn.purchase_order && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Purchase Order</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-xs py-1 px-2.5 rounded-md shadow-none">
                      {grn.purchase_order.po_number}
                    </Badge>
                  </div>
                  <Separator className="bg-border/60" />
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Target Branch</span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs py-1 px-2.5 rounded-md shadow-none">
                  {grn.branch?.name || 'Main Branch'}
                </Badge>
              </div>
              <Separator className="bg-border/60" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Received By</span>
                <span className="text-foreground font-bold text-sm tabular-nums">{grn.received_by_user?.name || 'Administrative'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-600/20 shadow-md bg-white dark:bg-background group hover:border-emerald-600/50 transition-all overflow-hidden relative rounded-xl p-6">
            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all pointer-events-none">
              <Printer className="w-32 h-32 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="font-bold text-base text-foreground mb-1">Physical Copy Needed?</div>
              <p className="text-muted-foreground text-xs font-semibold mb-4 leading-relaxed">Generate a high-fidelity print-ready receipt for archival.</p>
              <Button
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-sm shadow-sm transition-all shadow-emerald-500/20"
                onClick={handlePrint}
              >
                Print Receipt
              </Button>
            </div>
          </Card>

          {/* Attachments Card */}
          <Card className="border border-border/60 shadow-sm bg-background rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/60 px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-emerald-600" /> Documentary Evidence
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                {grn.attachments && grn.attachments.length > 0 ? (
                  grn.attachments.map(file => (
                    <AttachmentItem
                      key={file.id}
                      file={file}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic text-center py-2">No attachments available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}