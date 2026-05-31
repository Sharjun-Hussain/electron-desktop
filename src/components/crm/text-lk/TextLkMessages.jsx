"use client";

import React, { useState } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { 
  Send, 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TextLkMessages() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");

  const handleSend = async () => {
    if (!recipient || !message) {
      toast.error("Please provide both recipient and message");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/crm/text-lk/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ recipient, message, template_id: templateId })
      });

      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Message sent successfully!");
      setRecipient("");
      setMessage("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Composer */}
      <Card className="lg:col-span-1 border-border bg-card shadow-xs rounded-xl flex flex-col">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Compose SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-5 flex-1">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Recipient Number</Label>
            <Input 
              placeholder="e.g. 947XXXXXXXX" 
              className="h-10 font-bold text-sm bg-muted/40 border-border text-foreground"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <p className="text-[9px] text-muted-foreground font-medium">Include country code (e.g. 94 for Sri Lanka)</p>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Quick Template</Label>
            <Select onValueChange={(val) => {
              setTemplateId(val);
              if (val === "receipt") setMessage("Thank you for your purchase at our store! Your bill total is LKR {{amount}}. View receipt: {{link}}");
              if (val === "welcome") setMessage("Welcome to our loyalty program! Show this message to get 5% off on your next visit.");
            }}>
              <SelectTrigger className="h-10 bg-muted/40 border-border text-sm text-foreground">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Custom Message</SelectItem>
                <SelectItem value="receipt">Sales Receipt</SelectItem>
                <SelectItem value="welcome">Welcome Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Message Body</Label>
            <Textarea 
              placeholder="Type your message here..." 
              className="min-h-[160px] bg-muted/40 border-border text-sm leading-relaxed text-foreground focus-visible:ring-indigo-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex justify-between items-center px-1">
              <span className={`text-[10px] font-bold ${message.length > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {message.length} / 160 characters
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                {Math.ceil(message.length / 160)} SMS units
              </span>
            </div>
          </div>

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 h-11 font-bold shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/5 active:scale-95 transition-transform"
            onClick={handleSend}
            disabled={loading || !recipient || !message}
          >
            {loading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Message
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="lg:col-span-2 border-border bg-card shadow-xs rounded-xl flex flex-col">
        <CardHeader className="border-b border-border bg-card flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Message History
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Filter logs..." className="h-8 pl-8 text-xs w-[160px] border-border bg-muted/40 text-foreground" />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 border-border text-foreground hover:bg-muted/40">
              <Filter className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <div className="divide-y divide-border/60">
            {/* Mock History Item */}
            {[
              { to: "94771234567", time: "2 mins ago", status: "delivered", body: "Thank you for your purchase! Your total is LKR 4,500.00." },
              { to: "94715556677", time: "1 hour ago", status: "delivered", body: "Your order is ready for pickup. See you soon!" },
              { to: "94789998877", time: "Yesterday", status: "failed", body: "Welcome to our store! Claim your discount today." }
            ].map((log, i) => (
              <div key={i} className="p-4 hover:bg-muted/20 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border ${log.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    {log.status === 'delivered' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{log.to}</p>
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="h-3 w-3" />
                        {log.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 line-clamp-1 pr-12 leading-relaxed">{log.body}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                  </div>
                </div>
              </div>
            ))}

            <div className="p-8 text-center space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">End of message history</p>
              <Button variant="link" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline h-auto p-0">Load older messages</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
