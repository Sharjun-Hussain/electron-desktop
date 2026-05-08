"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col w-full", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Creates the bottom border line for the list
        "inline-flex h-10 items-center justify-start border-b border-gray-200 dark:border-gray-700 p-0 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles
        "inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium",
        // Animation
        "transition-all duration-200 ease-in-out",
        // Bottom border setup (transparent by default)
        "border-b-2 border-transparent",
        // Negative margin to overlap the list's border, making the active underline cover it
        "-mb-[1px]",
        // Text color
        "text-muted-foreground",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled styles
        "disabled:pointer-events-none disabled:opacity-50",
        // Hover styles
        "hover:text-foreground",
        // Active state (the blue-600 underline)
        "data-[state=active]:text-blue-600 data-[state=active]:border-blue-600 dark:data-[state=active]:text-blue-500 dark:data-[state=active]:border-blue-500",
        "data-[state=active]:font-semibold",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none mt-4", // Added margin-top for content spacing
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
