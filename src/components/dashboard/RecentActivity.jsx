"use client";

import {
  ShoppingCart,
  FileText,
  Package,
  UserPlus,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export default function RecentActivity() {
  const { formatCurrency } = useCurrency();

  const activities = [
    {
      id: 1,
      type: "sale",
      description: "New sale completed",
      amount: 149.99, // Changed to number
      isCurrency: true,
      user: "John Doe",
      time: "2 min ago",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: 2,
      type: "invoice",
      description: "Invoice #INV-0023 created",
      amount: 299.50, // Changed to number
      isCurrency: true,
      user: "Sarah Wilson",
      time: "5 min ago",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: 3,
      type: "inventory",
      description: "Low stock alert: iPhone 14",
      amount: "3 items left",
      isCurrency: false,
      user: "System",
      time: "12 min ago",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: 4,
      type: "customer",
      description: "New customer registered",
      amount: "Premium plan",
      isCurrency: false,
      user: "Mike Johnson",
      time: "1 hour ago",
      icon: UserPlus,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: 5,
      type: "payment",
      description: "Payment received",
      amount: 450.00, // Changed to number
      isCurrency: true,
      user: "Emma Davis",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal text-gray-900">Recent Activity</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-normal">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className={`p-2 rounded-lg ${activity.bgColor}`}>
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-normal text-gray-900 truncate">
                {activity.description}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{activity.user}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-normal text-gray-900">
                {activity.isCurrency ? formatCurrency(activity.amount) : activity.amount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
