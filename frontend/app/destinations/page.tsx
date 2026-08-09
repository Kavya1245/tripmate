"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";

export default function DestinationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { formatCurrency } = useCurrency();
  const [activeQuery, setActiveQuery] = useState("");
  
  useEffect(() => {
    if (search.length > 1) {
      const timer = setTimeout(() => setActiveQuery(search), 400);
      return () => clearTimeout(timer);
    } else {
      setActiveQuery("");
    }
  }, [search]);

  const { data: dbDestinations, isLoading: dbLoading } = useQuery({
    queryKey: ["destinations"],
    queryFn: async () => (await api.get("/destinations/?limit=100")).data,
    enabled: !activeQuery, 
  });

  const { data: liveResults, isLoading: liveLoading } = useQuery({
    queryKey: ["liveSearch", activeQuery],
    queryFn: async () => (await api.get(`/destinations/?q=${activeQuery}`)).data,
    enabled: !!activeQuery, 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(search);
  };

  // When clicking a live search result, save it to DB then navigate to details page
  const handleLiveClick = async (e: React.MouseEvent, dest: any) => {
    e.preventDefault();
    try {
      // Save to database to get a real ID and allow reviews
      const res = await api.post("/destinations/save", {
        name: dest.name,
        country: dest.country,
        description: dest.description,
        image_url: dest.image_url,
        tags: dest.tags,
        avg_budget: dest.avg_budget
      });
      // Navigate to the internal details page
      router.push(`/destinations/${res.data.id}`);
    } catch (err) {
      alert("Could not open destination details.");
    }
  };

  const displayedDestinations = activeQuery ? liveResults : dbDestinations;
  const isLoading = activeQuery ? liveLoading : dbLoading;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Discover Destinations</h1>
          
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search any place on Earth (e.g., Chennai, Eiffel Tower)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-gray-300 p-4 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                autoFocus
              />
              <button type="submit" className="rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 transition-colors shadow-md">
                Search
              </button>
            </div>
          </form>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 w-full bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {displayedDestinations?.map((dest: any) => {
                // If it's a live search result, intercept click to save to DB
                if (activeQuery) {
                  return (
                    <div 
                      key={dest.id} 
                      onClick={(e) => handleLiveClick(e, dest)}
                      className="rounded-xl bg-white shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="h-48 w-full bg-cover bg-center bg-gray-200" style={{ backgroundImage: `url(${dest.image_url})` }}></div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl font-bold text-gray-800">{dest.name}</h2>
                          <span className="text-xs font-medium text-gray-500">Global</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{dest.description}</p>
                        <div className="flex items-center text-blue-600 font-semibold text-sm">
                          View Details & Reviews 
                          <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // If it's a DB destination, render the normal Link
                return (
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
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{dest.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {dest.tags?.split(',').map((tag: string) => (
                            <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-md font-bold text-blue-600 whitespace-nowrap">{formatCurrency(dest.avg_budget)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {displayedDestinations?.length === 0 && (
                <div className="col-span-3 text-center py-16">
                  <p className="text-xl text-gray-500">No destinations found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
