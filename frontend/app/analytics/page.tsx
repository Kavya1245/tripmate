"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart, CartesianGrid } from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.get("/analytics/stats");
      return res.data;
    },
  });

  if (isLoading) return <div className="p-8 text-gray-500 text-lg">Loading Analytics Engine...</div>;

  const kpis = data?.kpis || {};

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-slate-800">Analytics Dashboard</h1>
            <p className="text-slate-500 mt-2 font-medium">Platform insights, financial metrics, and user engagement data.</p>
          </div>
          
          {/* Premium KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-4xl font-extrabold text-slate-800">{kpis.total_users}</p>
              <p className="text-xs text-slate-400 mt-2">Active accounts</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Trips</p>
                <span className="text-2xl">✈️</span>
              </div>
              <p className="text-4xl font-extrabold text-slate-800">{kpis.total_trips}</p>
              <p className="text-xs text-slate-400 mt-2">Itineraries planned</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</p>
                <span className="text-2xl">🗺️</span>
              </div>
              <p className="text-4xl font-extrabold text-slate-800">{kpis.total_destinations}</p>
              <p className="text-xs text-slate-400 mt-2">Global destinations</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Platform Volume</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-4xl font-extrabold text-emerald-600">${kpis.total_platform_budget?.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">Total planned budget</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Popular Destinations (Area Chart) */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Top Trending Destinations</h3>
              <p className="text-xs text-slate-500 mb-6">Most frequently planned places by users</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.popular_destinations}>
                  <defs>
                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} 
                    cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  />
                  <Area type="monotone" dataKey="trips" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trip Status (Donut Chart) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Trip Lifecycle</h3>
              <p className="text-xs text-slate-500 mb-6">Status distribution</p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={data?.trips_by_status} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    paddingAngle={5}
                  >
                    {data?.trips_by_status?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#64748b" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg. Trip Budget</p>
                <p className="text-2xl font-extrabold text-slate-800">${kpis.avg_trip_budget?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Budget Tier Distribution (Gradient Bars) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">User Budget Tiers</h3>
            <p className="text-xs text-slate-500 mb-6">Spending segmentation across the platform</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.budget_tiers} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={150} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }} 
                  cursor={{ fill: "#f8fafc" }}
                />
                <defs>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <Bar dataKey="value" fill="url(#colorBudget)" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}
