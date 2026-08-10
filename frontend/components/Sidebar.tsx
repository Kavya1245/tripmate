"use client";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "AI Chat Planner", href: "/chat", icon: "💬" },
    { name: "My Trips", href: "/trips", icon: "🏠" },
    { name: "Discover", href: "/destinations", icon: "🗺️" },
    { name: "Recognize", href: "/recognize", icon: "📸" },
    { name: "Recommend", href: "/recommend", icon: "🤖" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
    
  ];

  return (
    <>
      <div className="sticky top-0 h-screen w-64 flex-shrink-0 flex flex-col bg-gray-900 text-white">
        <div className="flex items-center justify-center h-20 border-b border-gray-800 flex-shrink-0">
          <h1 className="text-2xl font-bold text-blue-400">✈️ TripMate</h1>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}

        </nav>

        <div className="px-4 mb-4 flex-shrink-0">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Select Currency</label>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="INR">₹ INR (Indian Rupee)</option>
            <option value="USD">$ USD (US Dollar)</option>
            <option value="EUR">€ EUR (Euro)</option>
            <option value="GBP">£ GBP (Pound)</option>
          </select>
        </div>

        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="mr-3 text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

    </>
  );
}
