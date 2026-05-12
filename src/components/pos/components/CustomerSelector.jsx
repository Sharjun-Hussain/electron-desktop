"use client";

import { useState } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, Loader2, Plus, ChevronDown, UserMinus, Check, Gift, Network 
} from "lucide-react";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── AddCustomerForm ──────────────────────────────────────────────────────────
export const AddCustomerForm = ({ onCustomerCreated, initialName = "", onCancel }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();
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
    <div className="space-y-3 p-1 text-foreground">
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
};

// ─── AddDistributorForm ──────────────────────────────────────────────────────────
export const AddDistributorForm = ({ onDistributorCreated, initialName = "", onCancel }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = useSession();

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
    <div className="space-y-3 p-1 text-foreground">
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
};

// ─── CustomerSelector ─────────────────────────────────────────────────────────
export const CustomerSelector = ({ 
  customers = [], distributors = [], selectedCustomer, selectedDistributor, 
  isWholesale, onSelectCustomer, onSelectDistributor, 
  onCustomerCreated, onDistributorCreated, isManufacturing = false,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const { business } = useAppSettings();

  const useDistributors = isWholesale && isManufacturing;
  const list = useDistributors ? distributors : customers;
  const selected = useDistributors ? selectedDistributor : selectedCustomer;
  const onSelect = useDistributors ? onSelectDistributor : onSelectCustomer;
  const onCreate = useDistributors ? onDistributorCreated : onCustomerCreated;

  const filtered = list.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  );

  return (
    <div className={cn("w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "h-10 w-full justify-between items-center px-3 bg-card hover:bg-muted/50 border-border/50 rounded-xl group transition-all",
              useDistributors && "border-blue-500/30 bg-blue-50/5"
            )}
          >
            <div className="truncate text-left flex flex-col justify-center">
              <p className={cn("text-[11px] font-medium leading-none truncate mb-1", useDistributors ? "text-blue-600" : "text-foreground")}>
                {selected ? selected.name : (useDistributors ? "Select Distributor" : (isWholesale ? "Select Wholesale Customer" : t("pos.walk_in_customer")))}
              </p>
              <p className="text-[9px] text-muted-foreground leading-none truncate">
                {selected?.phone || (useDistributors ? "Bulk Distribution" : (isWholesale ? "Volume Pricing Applied" : t("pos.standard_pricing")))}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {selected && !useDistributors && business?.loyalty_enabled && (
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                  <Gift className="h-2 w-2" />
                  <span className="text-[9px] font-bold">{selected.loyalty_points || 0}</span>
                </div>
              )}
              {useDistributors && <Network className="h-3 w-3 text-blue-400 opacity-40 shrink-0" />}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-40 shrink-0" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-xl overflow-hidden border-border/50" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={useDistributors ? "Search Distributors..." : (isWholesale ? "Search Wholesale Customers..." : t("pos.search_customers"))}
              value={search}
              onValueChange={setSearch}
              className="h-9"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                {useDistributors ? "No distributor found" : (isWholesale ? "No wholesale customer found" : t("pos.no_customer_found"))}
              </CommandEmpty>
              <CommandGroup>
                {!useDistributors && (
                  <CommandItem
                    onSelect={() => {
                      onSelect(null);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer p-2"
                  >
                    <UserMinus className="h-4 w-4 opacity-70" />
                    <div className="flex flex-col">
                      <span className="text-sm font-normal">{t("pos.walk_in_customer")}</span>
                      <span className="text-[10px] opacity-60">{t("pos.no_profile_selection")}</span>
                    </div>
                    {!selected && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                  </CommandItem>
                )}

                {filtered.slice(0, 50).map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer p-2"
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-normal">{item.name}</span>
                        {useDistributors && (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold border-blue-200 text-blue-700 bg-blue-50 uppercase tracking-tighter">
                            Partner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-60">{item.phone || "No phone"}</span>
                        {!useDistributors && business?.loyalty_enabled && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1 rounded flex items-center gap-1">
                            <Gift className="h-2 w-2" /> {item.loyalty_points || 0}
                          </span>
                        )}
                      </div>
                    </div>
                    {selected?.id === item.id && (
                      <Check className={cn("ml-auto h-4 w-4", useDistributors ? "text-blue-600" : "text-emerald-600")} />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t border-border/40 bg-muted/20">
              <Popover open={isAddOpen} onOpenChange={setIsAddOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-8 text-[11px] font-medium rounded-lg justify-between px-3",
                      useDistributors ? "text-blue-600 hover:bg-blue-500/10" : "text-emerald-600 hover:bg-emerald-500/10"
                    )}
                  >
                    <span>{useDistributors ? "Onboard New Distributor" : (isWholesale ? "Add Wholesale Customer" : t("pos.add_new_customer"))}</span><Plus className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" align="end" className={cn("w-72 p-3 shadow-2xl rounded-xl", useDistributors ? "border-blue-500/20" : "border-emerald-500/20")} sideOffset={10}>
                  {useDistributors ? (
                    <AddDistributorForm
                      initialName={search}
                      onCancel={() => setIsAddOpen(false)}
                      onDistributorCreated={(d) => {
                        if (onCreate) onCreate(d);
                        onSelect(d);
                        setIsAddOpen(false);
                        setIsOpen(false);
                      }}
                    />
                  ) : (
                    <AddCustomerForm
                      initialName={search}
                      onCancel={() => setIsAddOpen(false)}
                      onCustomerCreated={(c) => {
                        if (onCreate) onCreate(c);
                        onSelect(c);
                        setIsAddOpen(false);
                        setIsOpen(false);
                      }}
                    />
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
