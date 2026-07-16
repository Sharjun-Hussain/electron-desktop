"use client";

import * as React from "react";
import { format } from "@/lib/date-utils";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function JoinedDatePicker({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "h-9 justify-start text-left font-normal text-sm bg-white border-gray-200 rounded-md hover:bg-muted/30 transition-all w-full shadow-none",
            !value && "text-muted-foreground"
          )}
        >
          {value ? format(value, "PPP") : <span className="opacity-50">Enlistment Date...</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-emerald-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-md border-border/40 shadow-2xl overflow-hidden" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className="rounded-md border-none"
        />
      </PopoverContent>
    </Popover>
  );
}
