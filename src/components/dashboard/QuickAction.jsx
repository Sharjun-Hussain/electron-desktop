"use client";

import { useRef } from "react";
import {
  ShoppingCart,
  FileText,
  Package,
  Users,
  BarChart3,
  Barcode,
  CreditCard,
  Settings
} from "lucide-react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const quickActions = [
  {
    id: "pos",
    name: "Point of Sale",
    icon: ShoppingCart,
    description: "New Sale",
    href: "/pos", 
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Package,
    description: "Manage Stock",
    href: "/products",
  },
  {
    id: "reports",
    name: "Analytics",
    icon: BarChart3,
    description: "View Insights",
    href: "/reports", 
  },
  {
    id: "purchase",
    name: "Purchases",
    icon: CreditCard,
    description: "Create Order",
    href: "/purchase/purchase-orders", 
  },
  {
    id: "employee",
    name: "Staff",
    icon: Users,
    description: "Manage Team",
    href: "/employees", 
  },
  {
    id: "barcodes",
    name: "Barcodes",
    icon: Barcode,
    description: "Print Labels",
    href: "/barcode",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description: "App Config",
    href: "/settings",
  },
];

export default function QuickActions() {
  const containerRef = useRef(null);
  const { contextSafe } = useGSAP({ scope: containerRef });

  // FIX: Added 'overwrite: true' to ensure animations don't conflict
  const onHoverEnter = contextSafe((e) => {
    const target = e.currentTarget;
    const icon = target.querySelector(".action-icon");
    
    gsap.to(target, { 
      y: -5, 
      scale: 1.02, 
      duration: 0.3, 
      ease: "back.out(1.7)",
      overwrite: true 
    });
    
    gsap.to(icon, { 
      scale: 1.1, 
      rotate: 5, 
      duration: 0.4, 
      ease: "back.out(1.7)",
      overwrite: true 
    });
  });

  const onHoverLeave = contextSafe((e) => {
    const target = e.currentTarget;
    const icon = target.querySelector(".action-icon");

    gsap.to(target, { 
      y: 0, 
      scale: 1, 
      duration: 0.25, // Made slightly faster for snappier feel
      ease: "power2.out",
      overwrite: true 
    });
    
    gsap.to(icon, { 
      scale: 1, 
      rotate: 0, 
      duration: 0.25, 
      ease: "power2.out",
      overwrite: true 
    });
  });

  return (
    <div ref={containerRef} className="bg-background rounded-xl border border-border/60 shadow-sm p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            id={`quick-${action.id}`}
            href={action.href}
            onMouseEnter={onHoverEnter}
            onMouseLeave={onHoverLeave}
            className="group relative flex flex-col items-center justify-center p-5 rounded-xl border border-border/60 bg-muted/20 hover:bg-background hover:border-emerald-600/30 hover:shadow-md transition-all duration-300"
          >
            <div
              className="action-icon mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm transition-transform duration-300"
            >
              <action.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            
            <div className="text-center">
              <span className="block text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors duration-300">
                {action.name}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground mt-1 block opacity-70">
                {action.description}
              </span>
            </div>

            {action.soon && (
              <Badge className="absolute top-2 right-2 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0 rounded-md">
                Soon
              </Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}