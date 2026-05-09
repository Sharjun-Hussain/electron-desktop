"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Scale,
  Lock,
  Zap,
  Users,
  Copyright,
  Globe,
  Monitor,
  HeartHandshake,
  ShieldAlert,
  HardDrive,
  CreditCard,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export function TermsModal({ onAccept }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    // Check if scrolled to bottom with 30px margin
    if (Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 30) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSubmit = async () => {
    if (!isChecked) {
      toast.error("Please agree to the terms to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/accept-terms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        }
      });

      if (!res.ok) throw new Error("Failed to update terms status");

      const data = await res.json();
      if (data.success) {
        toast.success("Terms accepted. Welcome to Inzeedo POS!");
        onAccept();
      }
    } catch (error) {
      console.error("Terms Acceptance Error:", error);
      toast.error("Could not save your acceptance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="w-full max-w-3xl border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Master Service Agreement</CardTitle>
              <CardDescription className="text-[12px] mt-0.5">Please review the comprehensive terms for Inzeedo POS Ecosystem</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[55vh] p-8 bg-slate-50/30 dark:bg-slate-950/30" onScrollCapture={handleScroll}>
            <div className="space-y-8 text-slate-600 dark:text-slate-400 pb-6">
              
              {/* SECTION 1 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Copyright className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">1. Proprietary Rights & Ownership</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Inzeedo POS (the "Software") is a proprietary technology developed and owned by <strong>Inzeedo (PVT) Ltd</strong>. All rights, title, and interest in the Software, including source code, database structures, UI/UX designs, and algorithms, remain exclusively with Inzeedo. This agreement grants you a license to use the Software; it does not constitute a sale of the underlying code or intellectual property.
                </p>
              </section>

              {/* SECTION 2 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Monitor className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">2. License Scope & Product Delivery</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[12px] font-bold text-emerald-600 mb-2 flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5" /> Desktop Edition
                    </h4>
                    <p className="text-[11px] leading-relaxed">
                      Our Desktop product is delivered for a <strong>one-time payment</strong>. This license is tied to your specific organization and hardware configuration. It is designed for offline-first, standalone operational stability. One-time payment covers the current version and stability patches.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h4 className="text-[12px] font-bold text-blue-600 mb-2 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> Cloud & Web Edition
                    </h4>
                    <p className="text-[11px] leading-relaxed">
                      Our Cloud solution requires an <strong>initial setup fee</strong> followed by recurring service payments (monthly, semi-annually, or annually). This fee covers high-availability cloud hosting, real-time data synchronization, and automated off-site backups.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">3. Prohibited Use & Ethics</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  You agree not to: (a) Resell, redistribute, or lease the Software to third parties; (b) Reverse engineer or attempt to extract source code; (c) Share user session tokens, login credentials, or internal access keys with competitors or external entities; (d) Use the system for fraudulent transactions or to circumvent local tax regulations.
                </p>
              </section>

              {/* SECTION 4 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">4. Customization & Professional Services</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  The Inzeedo POS Core is a standardized product. Any adjustments, UI modifications, or addition of custom modules are considered <strong>Professional Services</strong>. These must be performed exclusively by Inzeedo's engineering team to maintain system integrity. Custom work is subject to separate quotations and service-level agreements.
                </p>
              </section>

              {/* SECTION 5 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">5. User Responsibility & Environment</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  The performance of the system depends on your local environment. It is your responsibility to maintain: (a) Stable internet connectivity for cloud sync; (b) Hardware that meets our minimum specifications; (c) Security of your local devices. Inzeedo is not liable for data loss caused by hardware failure or power interruptions.
                </p>
              </section>

              {/* SECTION 6 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">6. Payment Terms & Renewals</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Initial payments and setup fees are non-refundable. Subscription services for the Cloud edition must be renewed before the expiry date to avoid service interruption. We reserve the right to adjust service fees with 30 days prior notice. Access to specific modules is restricted based on your active plan (Essential, Professional, or Enterprise).
                </p>
              </section>

              {/* SECTION 7 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <History className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">7. Termination & Data Portability</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Either party may terminate this agreement. Upon termination of Cloud services, you will have a 30-day grace period to export your data. After this period, data stored on our production clusters will be purged according to our security protocols. Desktop installations will remain functional but will no longer receive cloud sync or security updates.
                </p>
              </section>

              {/* SECTION 8 */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-[14px] font-bold">8. Confidentiality</h3>
                </div>
                <p className="text-[12px] leading-relaxed">
                  Both parties agree to protect the confidential information of the other. Your transactional data is your confidential information. The Inzeedo POS architecture and pricing models are our confidential information. Neither party shall disclose such information to third parties without prior written consent.
                </p>
              </section>

            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox 
              id="terms" 
              checked={isChecked} 
              onCheckedChange={setIsChecked}
              className="w-5 h-5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md"
            />
            <label htmlFor="terms" className="text-[14px] text-slate-700 dark:text-slate-300 font-bold cursor-pointer select-none">
              I agree to the Master Service Agreement
            </label>
          </div>

          <div className="flex items-center gap-4">
            {!hasScrolledToBottom && (
              <span className="text-[11px] text-amber-500 font-bold animate-pulse hidden lg:inline">
                Scroll to review all sections
              </span>
            )}
            <Button 
              disabled={!isChecked || !hasScrolledToBottom || isSubmitting}
              onClick={handleSubmit}
              className="h-11 px-8 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white rounded-xl shadow-lg text-[13px] font-bold transition-all active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? "Finalizing..." : "Accept & Launch System"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
