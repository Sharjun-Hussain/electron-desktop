"use client";

import PosPage from "@/components/pos/main-page";
import ClassicPosPage from "@/components/pos/classic-page";
import { useSettingsStore } from "@/store/useSettingsStore";
import React from "react";

const Page = () => {
  const posLayout = useSettingsStore((state) => state.global?.posLayout || "modern");

  if (posLayout === "classic") {
    return <ClassicPosPage />;
  }

  return <PosPage />;
};

export default Page;
