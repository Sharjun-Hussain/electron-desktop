"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Zap, 
  Loader2, 
  MessageSquare, 
  Send, 
  Phone,
  User,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function SendPOWhatsAppDialog({ open, onOpenChange, po }) {
  const { data: session } = useSession();
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    if (open) {
      fetchTemplates();
      setCustomMessage(`Hello ${po?.supplier?.name}, here is your Purchase Order ${po?.po_number}: ${process.env.NEXT_PUBLIC_APP_URL}/purchase/purchase-orders/${po?.id}`);
    }
  }, [open, po]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/whatsapp/templates`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/whatsapp/send-po`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          purchaseOrderId: po.id,
          templateName: selectedTemplate === "custom" ? null : selectedTemplate,
          customMessage: selectedTemplate === "custom" ? customMessage : null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send");
      }

      toast.success("Purchase Order sent via WhatsApp!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to send via WhatsApp");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            Send via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Send Purchase Order <strong>{po?.po_number}</strong> to <strong>{po?.supplier?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" /> Supplier
              </Label>
              <div className="text-sm font-semibold truncate">{po?.supplier?.name}</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Phone Number
              </Label>
              <div className="text-sm font-semibold">{po?.supplier?.phone || "No phone number"}</div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="template" className="text-sm font-bold">Select Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Message (No Template)</SelectItem>
                {templates.filter(t => t.status === 'approved').map(t => (
                  <SelectItem key={t.name} value={t.name}>{t.name.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate === "custom" && (
            <div className="space-y-3">
              <Label htmlFor="message" className="text-sm font-bold">Message Content</Label>
              <Textarea 
                id="message" 
                rows={4} 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="resize-none focus-visible:ring-emerald-500"
              />
              <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 bg-muted/50 p-2 rounded-md">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                Custom messages may incur higher costs depending on your WhatsApp Business API provider. Templates are recommended for bulk or automated sending.
              </p>
            </div>
          )}

          {selectedTemplate !== "custom" && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-500/10 rounded-xl space-y-2">
              <div className="text-[10px] font-bold text-emerald-700 uppercase">Template Preview</div>
              <div className="text-sm text-emerald-900 line-clamp-3 italic">
                {templates.find(t => t.name === selectedTemplate)?.components?.find(c => c.type === 'BODY')?.text || "No preview available"}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !po?.supplier?.phone}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
