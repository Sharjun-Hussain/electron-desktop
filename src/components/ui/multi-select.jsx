"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select items...",
  disabled = false,
}) {
  const inputRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (item) => {
    onChange(selected.filter((i) => i.value !== item.value));
  };

  return (
    <Command
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !inputValue) {
          e.preventDefault();
          if (selected.length > 0) {
            const newSelected = [...selected];
            newSelected.pop();
            onChange(newSelected);
          }
        }
        if (e.key === "Escape") {
          inputRef.current?.blur();
        }
      }}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div className="group border border-input px-3 py-1.5 text-sm rounded-md focus-within:ring-1 focus-within:ring-ring transition-all">
        <div className="flex gap-1.5 flex-wrap items-center">
          {selected.map((item) => (
            <Badge key={item.value} variant="default" className="rounded-md font-bold text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100 transition-all hover:bg-emerald-100">
              {item.label}
              <button
                className="ml-1.5 rounded-full outline-none focus:ring-1 focus:ring-ring hover:bg-emerald-200/50 p-0.5 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(item)}
              >
                <X className="size-3 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground h-6 text-[13px] min-w-[120px]"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && options.length > 0 ? (
          <div className="absolute w-full z-20 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup className="h-full overflow-auto max-h-60 p-1">
              {options.map((option) => {
                const isSelected = selected.some((s) => s.value === option.value);
                if (isSelected) return null;

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      onChange([...selected, option]);
                    }}
                    className="cursor-pointer rounded-md"
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
