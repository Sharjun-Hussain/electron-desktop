"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/DesktopAuthProvider";
import { Users, LayoutGrid, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function MobileTableSelection({ onSelectTable }) {
  const { data: session } = useSession();
  const [areas, setAreas] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLayoutData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const [areasRes, tablesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/areas`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dining/tables`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        })
      ]);

      const areasData = await areasRes.json();
      const tablesData = await tablesRes.json();

      if (areasData.status === "success") {
        setAreas(areasData.data || []);
        if (areasData.data?.length > 0) {
          setSelectedAreaId(areasData.data[0].id);
        }
      }
      if (tablesData.status === "success") {
        setTables(tablesData.data || []);
      }
    } catch (err) {
      console.error("Error loading floor layouts:", err);
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchLayoutData();
  }, [fetchLayoutData]);

  const handleTableClick = useCallback((table) => {
    if (table.status !== "free") {
      toast.error(`Table is currently ${table.status}`);
      return;
    }
    onSelectTable(table);
  }, [onSelectTable]);

  const activeAreaTables = tables.filter(t => t.dining_area_id === selectedAreaId);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] touch-manipulation select-none">
      {/* Greeting Area */}
      <div className="px-5 pt-6 pb-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Select a Table</h2>
        <p className="text-sm text-gray-500 mt-1">Tap a free table to start an order</p>
      </div>

      {/* Area Tabs */}
      <div className="flex-none overflow-x-auto scrollbar-hide shrink-0 px-3 pb-2 pt-2">
        <div className="flex gap-2 w-max px-2">
          {loading && areas.length === 0 ? (
            <div className="text-sm text-gray-400 font-medium px-4 py-2 animate-pulse">Loading areas...</div>
          ) : areas.length === 0 ? (
            <div className="text-sm text-gray-400 font-medium px-4 py-2">No areas found</div>
          ) : (
            areas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border-2",
                  selectedAreaId === area.id
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    : "bg-white text-gray-600 border-transparent hover:border-gray-200"
                )}
              >
                {area.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {loading && tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <LayoutGrid className="w-12 h-12 mb-2 animate-pulse text-gray-300" />
            <p>Loading tables...</p>
          </div>
        ) : activeAreaTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <AlertCircle className="w-12 h-12 mb-2 text-gray-300" />
            <p>No tables in this area</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {activeAreaTables.map((table) => {
              const isFree = table.status === 'free';
              
              const statusColors = {
                free: "border-emerald-100 bg-white text-gray-800 hover:border-emerald-300 shadow-sm shadow-emerald-100/50",
                occupied: "border-gray-200 bg-gray-50 text-gray-400 opacity-60",
                reserved: "border-blue-100 bg-blue-50 text-blue-700 opacity-80"
              };

              const formattedNumber = table.table_number.charAt(0).toUpperCase() + table.table_number.slice(1);

              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  disabled={!isFree}
                  className={cn(
                    "flex flex-col items-center justify-center p-5 rounded-[1.5rem] border-2 transition-all h-32 relative active:scale-[0.97]",
                    statusColors[table.status] || statusColors.free
                  )}
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {isFree ? 'Free' : table.status}
                    </span>
                    <div className={cn(
                      "w-2 h-2 rounded-full shadow-sm",
                      table.status === 'free' ? 'bg-emerald-500 shadow-emerald-500/40' : 
                      table.status === 'occupied' ? 'bg-amber-500' : 'bg-blue-500'
                    )} />
                  </div>
                  
                  <span className={cn(
                    "text-3xl font-black mb-1 mt-2", 
                    isFree ? "text-emerald-950" : "text-gray-500"
                  )}>
                    {formattedNumber}
                  </span>
                  <span className={cn(
                    "text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    isFree ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  )}>
                    <Users className="w-3.5 h-3.5" />
                    {table.capacity} Pax
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
