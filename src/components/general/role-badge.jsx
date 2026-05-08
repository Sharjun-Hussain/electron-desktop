import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Crown,
  Building2,
  Package,
  Calculator,
  ShoppingCart,
} from "lucide-react";

export function RoleBadge({ role, showIcon = true }) {
  const roleConfig = {
    super_admin: {
      label: "Super Admin",
      variant: "destructive",
      icon: <Crown className="mr-1 h-3 w-3" />,
    },
    client_admin: {
      label: "Client Admin",
      variant: "default",
      icon: <Shield className="mr-1 h-3 w-3" />,
    },
    branch_manager: {
      label: "Branch Manager",
      variant: "default",
      icon: <Building2 className="mr-1 h-3 w-3" />,
    },
    inventory_manager: {
      label: "Inventory Manager",
      variant: "secondary",
      icon: <Package className="mr-1 h-3 w-3" />,
    },
    accountant: {
      label: "Accountant",
      variant: "secondary",
      icon: <Calculator className="mr-1 h-3 w-3" />,
    },
    cashier: {
      label: "Cashier",
      variant: "outline",
      icon: <ShoppingCart className="mr-1 h-3 w-3" />,
    },
  };

  const config = roleConfig[role];

  return (
    <Badge variant={config.variant} className="capitalize">
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
