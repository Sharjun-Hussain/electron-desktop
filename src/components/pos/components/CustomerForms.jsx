"use client";

import { useState, memo } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

// ─── AddCustomerForm ──────────────────────────────────────────────────────────
export const AddCustomerForm = memo(({ onCustomerCreated, initialName = "", onCancel, session }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();

  const handleCreate = async () => {
    if (!name.trim()) return toast.error(t("pos.name_required"));
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success(t("pos.created"));
        onCustomerCreated(result.data);
      } else toast.error(result.message);
    } catch {
      toast.error("Error creating customer");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-emerald-600">{t("pos.new_customer")}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-2">
        <Input placeholder={t("pos.full_name")} value={name} onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-emerald-500/30" autoFocus />
        <Input placeholder={t("pos.phone_optional")} value={phone} onChange={(e) => setPhone(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-emerald-500/30" />
        <Button className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
          onClick={handleCreate} disabled={isCreating}>
          {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("pos.save_customer")}
        </Button>
      </div>
    </div>
  );
});
AddCustomerForm.displayName = "AddCustomerForm";

// ─── AddDistributorForm ──────────────────────────────────────────────────────────
export const AddDistributorForm = memo(({ onDistributorCreated, initialName = "", onCancel, session }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Name is required");
    setIsCreating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/distributors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Partner onboarded successfully");
        onDistributorCreated(result.data);
      } else toast.error(result.message);
    } catch {
      toast.error("Error onboarding partner");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-blue-600">Onboard Partner</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onCancel}><X className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-2">
        <Input placeholder="Business Name" value={name} onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-blue-500/30" autoFocus />
        <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="h-8 text-xs bg-muted/30 border-none rounded-lg focus-visible:ring-blue-500/30" />
        <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
          onClick={handleCreate} disabled={isCreating}>
          {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Authorize Partner"}
        </Button>
      </div>
    </div>
  );
});
AddDistributorForm.displayName = "AddDistributorForm";
