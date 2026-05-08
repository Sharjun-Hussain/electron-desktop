'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";

// Force the component to only load on the client
const ReportsHubPage = dynamic(() => import("@/components/reports/MainReportPage"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>
  ),
});

const ReportsPage = () => {
  useEffect(() => {
    document.title = "Reports | Inzeedo POS";
  }, []);

  return <ReportsHubPage />;
};

export default ReportsPage;
