"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function DestinationsPage() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  
  const { data: destinations, isLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => {
      const res = await api.get("/destinations/");
      return res.data;
    },
  });

  // Mutation to call the backend external API endpoint
  const fetchExternal = useMutation({
    mutationFn: async () => {
      const res = await api.post("/destinations/seed-external");
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
    },
    onError: (err: any) => alert("Error fetching external data: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  // Instant Filtering Logic
  const filteredDestinations = destinations?.filter((dest: any) => {
    const lowerSearch = search.toLowerCase();
    return (
      dest.name.toLowerCase().includes(lowerSearch) ||
      dest.country.toLowerCase().includes(lowerSearch) ||
      dest.tags.toLowerCase().includes(lowerSearch)
    );
  });

  if (isLoading) return <div className="p-8">Loading destinations...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Discover Destinations</h1>
            <button 
              onClick={() => fetchExternal.mutate()}
              disabled={fetchExternal.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {fetchExternal.isPending ? "Fetching..." : "Fetch World Destinations"}
            </button>
          </div>
          
          {/* Search Bar inside a Form for Enter Key support */}
          <form onSubmit={(e) => { e.preventDefault(); }} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name, country, or tags (e.g., beach, Paris)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 p-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
              />
              <button 
                type="submit"
                className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredDestinations?.map((dest: any) => (
              <Link 
                key={dest.id} 
                href={`/destinations/${dest.id}`} 
                className="rounded-xl bg-white shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="h-48 w-full bg-cover bg-center bg-gray-200" style={{ backgroundImage: `url(${dest.image_url})` }}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-800">{dest.name}</h2>
                    <span className="text-xs font-medium text-gray-500">{dest.country}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{dest.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                      {dest.tags.split(',').map((tag: string) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-md font-bold text-blue-600 whitespace-nowrap">${dest.avg_budget}</span>
                  </div>
                </div>
              </Link>
            ))}
            
            {filteredDestinations?.length === 0 && (
              <div className="col-span-3 text-center py-16">
                <p className="text-xl text-gray-500">No destinations found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
