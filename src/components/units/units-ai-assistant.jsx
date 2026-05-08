"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Zap, 
  Bot, 
  Send, 
  Plus, 
  CheckCircle2, 
  X,
  RefreshCcw,
  PlusCircle,
  Loader2
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UnitsAiAssistant({ open, onOpenChange, onSuccess, session }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSuggestions([]);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ai/generate-units`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ prompt })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Neural link failed");
      
      setSuggestions(result.data);
      toast.success("Units Generated", {
        description: `AI suggested ${result.data.length} units based on your prompt.`
      });
    } catch (err) {
      toast.error("Generation Failed", { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (suggestions.length === 0) return;
    setApplying(true);
    
    try {
      const results = await Promise.all(
        suggestions.map(unit => 
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/units`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken}`
            },
            body: JSON.stringify({
              ...unit,
              is_active: true
            })
          })
        )
      );

      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        toast.success("Units Integrated", {
          description: `Successfully added ${successCount} new units to your registry.`
        });
        onSuccess();
        onOpenChange(false);
        setSuggestions([]);
        setPrompt("");
      } else {
        throw new Error("Failed to integrate units. They might already exist.");
      }
    } catch (err) {
      toast.error("Integration Error", { description: err.message });
    } finally {
      setApplying(false);
    }
  };

  const removeSuggestion = (index) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md border-l border-emerald-500/20 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl p-0 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold flex items-center gap-2">
                Neural Unit Architect
                <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/20">BETA</Badge>
              </SheetTitle>
              <SheetDescription className="text-[11px] font-medium opacity-70">
                Generate professional measurement protocols using AI.
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Chat / Input Area */}
        <div className="p-4 space-y-4">
          <div className="relative group">
            <Input 
              placeholder="e.g. 'Create units for a pharmacy' or 'Liquid volume units'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="h-14 pl-12 pr-12 bg-white dark:bg-slate-900 border-emerald-500/20 rounded-2xl shadow-sm focus-visible:ring-emerald-500/20 transition-all text-sm font-medium"
            />
            <Bot className="absolute left-4 top-4.5 w-5 h-5 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" />
            <Button 
              size="icon"
              disabled={generating || !prompt.trim()}
              onClick={handleGenerate}
              className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all active:scale-90"
            >
              {generating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <ScrollArea className="flex-1 px-4">
          {generating && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                 <div className="h-16 w-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin" />
                 <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Consulting Neural Core...</p>
            </div>
          )}

          {!generating && suggestions.length > 0 && (
            <div className="space-y-3 pb-8">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-2">Neural Propositions</p>
              {suggestions.map((unit, idx) => (
                <div key={idx} className="group p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border/50 hover:border-emerald-500/30 transition-all shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground">{unit.name}</p>
                        <Badge variant="secondary" className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">{unit.short_name}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        Standardized measurement code: {unit.short_name}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeSuggestion(idx)}
                      className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!generating && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8 opacity-40">
              <Network className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-sm font-medium text-slate-400">Describe the units you need and the AI will draft them for you.</p>
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        {suggestions.length > 0 && (
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-border mt-auto shadow-2xl">
            <Button 
              onClick={handleApply}
              disabled={applying}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 gap-2 transition-all active:scale-95"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              Integrate {suggestions.length} Units
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-4 font-medium italic">
              Carefully review suggestions before integrating into master data.
            </p>
          </div>
        )}

      </SheetContent>
    </Sheet>
  );
}

function Network(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  )
}
