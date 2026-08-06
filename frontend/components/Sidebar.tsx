"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/trips", icon: "🏠" },
    { name: "Discover", href: "/destinations", icon: "🗺️" },
    { name: "Recognize", href: "/recognize", icon: "📸" },
    { name: "Recommend", href: "/recommend", icon: "🤖" },
    { name: "Analytics", href: "/analytics", icon: "📊" },
  ];

  return (
    // Added sticky top-0, h-screen, and flex-shrink-0 to keep it locked in place
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
  );
}
