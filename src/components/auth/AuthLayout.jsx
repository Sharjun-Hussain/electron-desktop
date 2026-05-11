"use client";

import React, { memo } from "react";
import Image from "next/image";
import { Terminal } from "lucide-react";

// --- MEMOIZED LEFT PANEL ---
const LeftPanel = memo(({ title, description, icon: Icon, logo, stats }) => {
  return (
    <div className="left-panel hidden lg:flex lg:w-1/2 relative bg-zinc-950 items-center justify-center p-12 overflow-hidden border-r border-white/5">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full animate-in fade-in duration-1000">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-zinc-950 to-black opacity-80" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
        <div className="mb-6">
          {logo ? (
            typeof logo === "string" ? (
              <img src={logo} alt="Logo" className="w-[120px] h-auto object-contain rounded-md" />
            ) : (
              <Image 
                src={logo} 
                alt="Logo" 
                width={120} 
                height={120} 
                className="object-contain rounded-md" 
                priority
                unoptimized
              />
            )
          ) : Icon ? (
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 backdrop-blur-md text-emerald-400">
              <Icon className="h-10 w-10" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 backdrop-blur-md text-emerald-400">
              <Terminal className="h-10 w-10" />
            </div>
          )}
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight whitespace-pre-line">
          {title}
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">{description}</p>

        {stats && (
          <div className="mt-12 grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div
                  className={`text-2xl font-bold ${stat.highlight ? "text-emerald-400" : "text-white"}`}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
LeftPanel.displayName = "LeftPanel";

// --- MEMOIZED FOOTER ---
const AuthFooter = memo(() => (
  <div className="absolute bottom-6 text-center w-full text-xs text-slate-400 dark:text-zinc-600">
    &copy; {new Date().getFullYear()} Inzeedo Systems. Secured by 256-bit
    encryption.
  </div>
));
AuthFooter.displayName = "AuthFooter";

const AuthLayout = ({
  children,
  title,
  description,
  icon,
  logo,
  stats,
  isRedirecting,
}) => {
  return (
    <main className="flex min-h-screen w-full bg-slate-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-500">
      <LeftPanel
        title={title}
        description={description}
        icon={icon}
        logo={logo}
        stats={stats}
      />

      <div
        className={`w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative transition-all duration-700 ${isRedirecting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
      >
        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-700">
          {children}
        </div>
        <AuthFooter />
      </div>
    </main>
  );
};

export default memo(AuthLayout);
