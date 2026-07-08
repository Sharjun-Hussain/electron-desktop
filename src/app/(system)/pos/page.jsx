"use client";

import PosPage from "@/components/pos/main-page";
import ClassicPosPage from "@/components/pos/classic-page";
import RestaurantPosPage from "@/components/pos/restaurant-page";
import { useSettingsStore } from "@/store/useSettingsStore";
import React from "react";

const Page = () => {
  const posLayout = useSettingsStore((state) => state.global?.posLayout || "modern");
  const business = useSettingsStore((state) => state.business);
  const isRestaurant = business?.business_type?.toLowerCase() === "restaurant";

  if (isRestaurant) {
    return <RestaurantPosPage />;
  }

  if (posLayout === "classic") {
    return <ClassicPosPage />;
  }

  return <PosPage />;
};

export default Page;

