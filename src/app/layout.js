"use client"
import "./globals.css";
import { Toaster } from "sonner";
import React, { useEffect, useState } from "react";
import Providers from "./providers";
import ClientOnly from "@/components/auth/ClientOnly";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Inter } from 'next/font/google'
import NextTopLoader from "nextjs-toploader";
import { GlobalOnboarding } from "@/components/general/onboarding-tour";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  const { global } = useSettingsStore();
  const zoomLevel = global?.zoomLevel || 1;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans`} style={{ zoom: zoomLevel, '--zoom-level': zoomLevel }}>
        <NextTopLoader showSpinner={false} color="#10b981" />
        <ErrorBoundary>
          <ClientOnly>
            <Providers>
              <GlobalOnboarding />
              {children}
              <Toaster position="top-right" richColors />
            </Providers>
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  );
}