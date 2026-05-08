"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/components/auth/DesktopAuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Wallet, Calculator, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const ShiftManagerDialog = ({
  isOpen,
  forceOpen, // If true, implies we are blocking due to missing shift
  activeShift,
  onClose,
  openShift,
  closeShift,
  branchId
}) => {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const isOpening = !activeShift;

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setError(null);
    }
  }, [isOpen, isOpening]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const val = parseFloat(amount) || 0;

    try {
      if (isOpening) {
        const res = await openShift(val, branchId);
        if (res.success) {
          if (onClose) onClose();
        } else {
          setError(res.error || "Failed to open shift");
        }
      } else {
        const res = await closeShift(activeShift.id, val);
        if (res.success) {
          if (onClose) onClose();
        } else {
          setError(res.error || "Failed to close shift");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen || forceOpen}
      onOpenChange={(open) => {
        // If forceOpen is true, they cannot close it.
        if (!forceOpen && !open && onClose) onClose();
      }}
    >
      <DialogContent
        className="max-w-md bg-card border-border/50 shadow-2xl p-0 overflow-hidden rounded-3xl"
        onPointerDownOutside={(e) => {
          if (forceOpen) e.preventDefault(); // Prevent clicking outside to close
        }}
        onEscapeKeyDown={(e) => {
          if (forceOpen) e.preventDefault(); // Prevent ESC to close
        }}
      >
        <div className="p-6 pb-8 flex flex-col items-center">

          <div className="w-full flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${isOpening ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                {isOpening ? <Wallet size={24} /> : <Calculator size={24} />}
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground       leading-none mb-1">
                  {isOpening ? "Open Cash Register" : "End Shift (Z-Read)"}
                </DialogTitle>
                <DialogDescription className="text-[11px] font-bold text-muted-foreground/70">
                  {isOpening ? "Declare your starting cash float." : "Count your physical cash drawer."}
                </DialogDescription>
              </div>
            </div>

            {forceOpen && isOpening && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[10px] font-black h-9 text-rose-600 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            )}
          </div>

          {error && (
            <div className="w-full bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2.5 text-rose-600 mb-6">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="w-full bg-muted/30 border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center mb-6">
            <p className="text-sm font-semibold text-muted-foreground/80  mb-4">
              {isOpening ? "Opening Float" : "Actual Cash Expected"}
            </p>
            <div className="relative w-full max-w-[220px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground/40">LKR</span>
              <Input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit(e);
                }}
                className="h-16 w-full bg-background border-2 border-border/50 rounded-2xl pl-16 pr-4 text-3xl font-black text-foreground shadow-sm focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all text-center"
              />
            </div>
          </div>

          <Button
            id="pos-start-shift-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || (!amount && !isOpening)}
            className={`w-full h-14 text-sm font-semibold         rounded-2xl text-white shadow-lg transition-all active:scale-[0.98] ${isOpening ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {isOpening ? "Confirm & Open Register" : "Complete Z-Read"}
              </>
            )}
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
};
