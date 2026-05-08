"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const AccessDenied = ({ errorMessage, onRetry, isAccessDenied: externalIsAccessDenied }) => {
  const isAccessDenied = externalIsAccessDenied || errorMessage?.includes("Access Denied") || errorMessage?.includes("authorize");
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 text-center bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-300">
      <div className={cn(
        "mb-6 p-4 rounded-full",
        isAccessDenied ? "bg-red-50 dark:bg-red-500/10" : "bg-slate-50 dark:bg-slate-800"
      )}>
        {isAccessDenied ? (
          <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-full">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>
          </div>
        ) : (
          <X className="h-8 w-8 text-slate-400" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">
        {isAccessDenied ? "Access Denied" : "Something went wrong"}
      </h3>
      
      <p className="text-muted-foreground max-w-[400px] mb-8 leading-relaxed">
        {isAccessDenied 
          ? "You do not have the required authority to perform this action. Please contact your system administrator if you believe this is an error." 
          : (errorMessage || "An unexpected error occurred while loading the data.")
        }
      </p>

      <div className="flex items-center gap-3">
        {onRetry && !isAccessDenied && (
          <Button variant="outline" onClick={onRetry} className="h-10 px-6 font-semibold">
            Try Again
          </Button>
        )}
        <Button 
          variant={isAccessDenied ? "default" : "outline"} 
          className={cn("h-10 px-6 font-semibold", isAccessDenied && "bg-red-600 hover:bg-red-700 text-white border-none")}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};
