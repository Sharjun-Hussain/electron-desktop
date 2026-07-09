"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { toast } from "sonner";
import { Save, Upload, Loader2, Store, Globe, Phone, Mail, MapPin, Building2, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions";

export function BusinessSettings() {
  const { hasPermission, hasRole } = usePermission();
  const { useBusinessSettings, updateBusinessSettings, uploadLogo } = useSettings();
  const { data: response, isLoading } = useBusinessSettings();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '', taxId: '', businessType: 'retail',
    website: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '',
    shopify_enabled: false, whatsapp_enabled: false, textlk_enabled: false
  });

  useEffect(() => {
    if (response?.data) {
      const org = response.data;
      setFormData({
        businessName: org.name || '', taxId: org.tax_id || '',
        businessType: org.business_type || 'retail', website: org.website || '',
        email: org.email || '', phone: org.phone || '', address: org.address || '',
        city: org.city || '', state: org.state || '', zipCode: org.zip_code || '',
        shopify_enabled: !!org.shopify_enabled, whatsapp_enabled: !!org.whatsapp_enabled,
        textlk_enabled: !!org.textlk_enabled
      });
      if (org.logo) setLogoPreview(`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${org.logo}`);
    }
  }, [response]);

  const validateForm = () => {
    const errors = [];

    // Business Name — required, min 2 chars
    const name = formData.businessName.trim();
    if (!name) {
      errors.push("Business name is required");
    } else if (name.length < 2) {
      errors.push("Business name must be at least 2 characters");
    }

    // Email — optional, but must be valid if provided
    const email = formData.email.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) errors.push("Please enter a valid business email address");
    }

    // Phone — optional, but must match allowed characters if provided
    const phone = formData.phone.trim();
    if (phone) {
      const phoneRegex = /^[\d+() -]+$/;
      if (!phoneRegex.test(phone)) errors.push("Phone number contains invalid characters (use digits, +, -, spaces, or parentheses)");
    }

    // Website — optional, but must be a valid URL if provided
    const website = formData.website.trim();
    if (website) {
      try {
        new URL(website);
      } catch {
        errors.push("Please enter a valid website URL (e.g. https://example.com)");
      }
    }

    return errors;
  };

  const handleSave = async () => {
    if (!hasPermission(PERMISSIONS.SETTINGS_BUSINESS)) {
      toast.error("You do not have permission to modify business settings");
      return;
    }

    // Run client-side validation first
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setIsSaving(true);
    const payload = {
      name: formData.businessName.trim(), tax_id: formData.taxId,
      business_type: formData.businessType, website: formData.website.trim(),
      email: formData.email.trim(), phone: formData.phone.trim(), address: formData.address,
      city: formData.city, state: formData.state, zip_code: formData.zipCode,
      shopify_enabled: formData.shopify_enabled, whatsapp_enabled: formData.whatsapp_enabled,
      textlk_enabled: formData.textlk_enabled
    };
    const result = await updateBusinessSettings(payload);
    if (logoFile) {
      const logoResult = await uploadLogo(logoFile);
      if (!logoResult.success) toast.error("Failed to synchronize brand logo: " + logoResult.error);
    }
    if (result.success) toast.success("Business identity synchronized successfully");
    else toast.error(result.error || "Failed to synchronize identity");
    setIsSaving(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error("Asset size exceeds 2MB structural limit");
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      toast.info("Brand asset updated. Save to persist.");
    }
  };

  const inputCls = "h-10 rounded-md border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 font-medium";
  const selectTriggerCls = "h-10 rounded-md border-slate-200 dark:border-slate-800 focus:ring-emerald-500 font-medium";

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="flex flex-col mb-5">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-emerald-500/10">
          <Icon className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{title}</h3>
      </div>
      {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 ml-9 leading-none">{description}</p>}
    </div>
  );

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>;

  return (
    <div className="space-y-6">

      {/* Brand & Core Identity */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <SectionHeader icon={Building2} title="Structural Branding" description="Manage formal organizational identity and assets" />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Logo Uploader */}
            <div className="flex flex-col items-center gap-3 w-full lg:w-[200px] shrink-0">
              <div className="relative w-full aspect-square border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/40 overflow-hidden group">
                {logoPreview ? (
                  <img src={logoPreview} alt="Brand Asset" className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-[1.02] transition-transform" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-3" />
                  </div>
                )}
              </div>
              <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoChange} />
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold w-full">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </label>
              </Button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Business Name <span className="text-red-500">*</span></Label>
                  <Input value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} placeholder="Enter formal entity title" className={inputCls} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Tax / Fiscal Identifier</Label>
                  <Input value={formData.taxId} onChange={(e) => updateField('taxId', e.target.value)} placeholder="Registration ID / Basis" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Commercial Environment</Label>
                  <Select value={formData.businessType} onValueChange={(v) => updateField('businessType', v)}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                      {["Retail Solution", "Restaurant Nexus", "Clinical Cafe", "Healthcare Store", "Grocery Logic", "Electronics Lab", "Garment Protocol", "General Environment"].map(t => (
                        <SelectItem key={t} value={t.toLowerCase().replace(/\s+/g, '_').split('/')[0].trim()} className="text-xs font-medium">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Institutional Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 dark:text-slate-600 font-medium" />
                    <Input value={formData.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://organization.basis" className={cn(inputCls, "pl-10")} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 dark:text-slate-600 font-medium" />
                    <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="contact@organization.com" className={cn(inputCls, "pl-10")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 dark:text-slate-600 font-medium" />
                    <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+1 (Business Phone)" className={cn(inputCls, "pl-10")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Address Registry */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-none rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <SectionHeader icon={MapPin} title="Organization Details" description="Structural location data for document generation" />
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Headquarters Address</Label>
              <Input placeholder="Enter registered site address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: 'city', placeholder: 'e.g. Colombo', label: 'City' },
                { key: 'state', placeholder: 'Administrative State', label: 'State' },
                { key: 'zipCode', placeholder: 'Postal Basis (ZIP)', label: 'Zip Code' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{f.label || f.placeholder}</Label>
                  <Input placeholder={f.placeholder} value={formData[f.key]} onChange={(e) => updateField(f.key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm gap-2 active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Identity
        </Button>
      </div>
    </div>
  );
}
