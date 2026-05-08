"use client";

import { useState } from "react";
import {
  CreditCard,
  Truck,
  BarChart3,
  Mail,
  MessageSquare,
  Check,
  Download,
  Star,
} from "lucide-react";

const plugins = [
  {
    id: "payment",
    name: "Payment Gateway",
    description: "Accept multiple payment methods",
    icon: CreditCard,
    category: "Payment",
    installed: true,
    rating: 4.8,
    price: "Free",
    featured: true,
  },
  {
    id: "shipping",
    name: "Shipping Integration",
    description: "Connect with shipping carriers",
    icon: Truck,
    category: "Shipping",
    installed: false,
    rating: 4.5,
    price: "Paid",
  },
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Deep business insights",
    icon: BarChart3,
    category: "Analytics",
    installed: false,
    rating: 4.9,
    price: "Paid",
    featured: true,
  },
  {
    id: "email",
    name: "Email Marketing",
    description: "Send promotional emails",
    icon: Mail,
    category: "Marketing",
    installed: false,
    rating: 4.3,
    price: "Free",
  },
  {
    id: "sms",
    name: "SMS Notifications",
    description: "Customer SMS alerts",
    icon: MessageSquare,
    category: "Communication",
    installed: true,
    rating: 4.6,
    price: "Free",
  },
];

export default function PluginMarketplace() {
  const [installedPlugins, setInstalledPlugins] = useState(
    plugins.filter((p) => p.installed).map((p) => p.id)
  );

  const handleInstall = (pluginId) => {
    setInstalledPlugins((prev) => [...prev, pluginId]);
  };

  const categories = [
    "All",
    ...Array.from(new Set(plugins.map((p) => p.category))),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal text-gray-900">
          Plugin Marketplace
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-normal">
          View All
        </button>
      </div>

      {/* Categories */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full whitespace-nowrap hover:bg-gray-200 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Plugins List */}
      <div className="space-y-3">
        {plugins.map((plugin) => {
          const isInstalled = installedPlugins.includes(plugin.id);
          return (
            <div
              key={plugin.id}
              className={`p-4 border rounded-lg transition-all duration-200 ${
                plugin.featured
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      plugin.featured ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    <plugin.icon
                      className={`w-5 h-5 ${
                        plugin.featured ? "text-blue-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-normal text-gray-900">
                        {plugin.name}
                      </h3>
                      {plugin.featured && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {plugin.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {plugin.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">
                          {plugin.rating}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          plugin.price === "Free"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {plugin.price}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => !isInstalled && handleInstall(plugin.id)}
                  disabled={isInstalled}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-normal transition-colors ${
                    isInstalled
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isInstalled ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Installed</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Install</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
