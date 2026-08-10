"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ScatterChart, Scatter } from "recharts";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics/stats")).data,
  });

  if (isLoading) return <div className="p-8 text-gray-900">Loading Analytics...</div>;
  const kpis = data?.kpis || {};

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Analytics Dashboard</h1>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Users</p><p className="text-2xl font-bold text-gray-800 mt-1">{kpis.total_users}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Trips</p><p className="text-2xl font-bold text-gray-800 mt-1">{kpis.total_trips}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Destinations</p><p className="text-2xl font-bold text-gray-800 mt-1">{kpis.total_destinations}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Reviews</p><p className="text-2xl font-bold text-gray-800 mt-1">{kpis.total_reviews}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Volume</p><p className="text-2xl font-bold text-emerald-600 mt-1">${kpis.total_platform_budget?.toLocaleString()}</p></div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"><p className="text-xs text-gray-500 uppercase">Avg Budget</p><p className="text-2xl font-bold text-blue-600 mt-1">${kpis.avg_trip_budget?.toFixed(0)}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Area Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Top Trending Destinations</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data?.popular_destinations}>
                  <defs><linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} cursor={{ stroke: "#94a3b8", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="trips" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter Plot (Relationship Chart) */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Budget vs. Duration</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="Duration (Days)" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="y" name="Budget ($)" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  <Scatter name="Trips" data={data?.budget_vs_duration || []} fill="#f59e0b" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
