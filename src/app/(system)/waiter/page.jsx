"use client";

import React from "react";
import MobileWaiterApp from "@/components/waiter/MobileWaiterApp";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function WaiterPage() {
  const business = useSettingsStore((state) => state.business);
  const isRestaurant = business?.business_type?.toLowerCase() === "restaurant";

  if (!isRestaurant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p>The Mobile Waiter view is only available for Restaurant businesses.</p>
        </div>
      </div>
    );
  }

  return <MobileWaiterApp />;
}
