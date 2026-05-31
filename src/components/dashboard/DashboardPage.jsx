"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import Header from "./Header";
import StatsGrid from "./StatsGrid";
import QuickActions from "./QuickAction";
import IntegrationCards from "./IntegrationCards";
import DashboardCharts from "./DashboardCharts";
import DashboardTableMonitor from "./DashboardTableMonitor";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Zap, Activity, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const containerRef = useRef(null);
  const { business } = useAppSettings();
  const isRestaurant = business?.business_type?.toLowerCase() === "restaurant";

  useGSAP(() => {
    // Stagger entrance of all child elements with the class 'dashboard-item'
    gsap.from(".dashboard-item", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  return (
    <div className="relative" ref={containerRef}>
      <Header
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="p-8">
        {activeSection === "dashboard" && (
          <div className="w-full space-y-8">
            
            {/* 1. Stats Section */}
            <div id="dashboard-stats" className="dashboard-item">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
                    <LayoutDashboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Store Overview</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium opacity-80">A quick summary of your sales and stock today.</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 border border-border/80 px-3 py-1.5 rounded-lg shadow-xs">
                  <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>Last updated: Just now</span>
                </div>
              </div>
              <StatsGrid />
            </div>

            {/* Restaurant Seating Monitor */}
            {isRestaurant && (
              <div id="dashboard-table-monitor" className="dashboard-item animate-in fade-in slide-in-from-bottom-5 duration-500">
                <DashboardTableMonitor />
              </div>
            )}

            {/* 2. Quick Actions Section */}
            <div id="dashboard-quick-access" className="dashboard-item">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Quick Access</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium opacity-80">High-speed shortcuts for your daily tasks.</p>
                  </div>
                </div>
              <QuickActions />
            </div>

            {/* 2.5 Integrations Section (Shopify/WhatsApp) */}
            <IntegrationCards />

            {/* 1.5. Charts Section */}
            <div id="dashboard-charts" className="dashboard-item">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                    <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Live KPI Visualizer</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium opacity-80">Interactive data trends and performance metrics.</p>
                  </div>
                </div>
              <DashboardCharts />
            </div>

            {/* 3. Placeholder for Activity (Example of Grid Layout) */}
            {/* <div className="dashboard-item grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
            </div> */}

          </div>
        )}
      </main>
    </div>
  );
}