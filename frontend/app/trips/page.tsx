"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWidget from "@/components/ChatWidget";

export default function TripsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all destinations for the autocomplete dropdown
  const { data: allDestinations } = useQuery({
    queryKey: ["all-destinations-mini"],
    queryFn: async () => {
      const res = await api.get("/destinations/?limit=100"); // Fetch up to 100
      return res.data;
    },
  });

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await api.get("/trips/");
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newTrip: any) => {
      const res = await api.post("/trips/", newTrip);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      setTitle("");
      setStartDate("");
      setEndDate("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err.message;
      alert("Error adding trip: " + JSON.stringify(msg));
    }
  });

  if (isLoading) return <div className="p-8">Loading trips...</div>;

  // Filter destinations based on what the user is typing
  const filteredSuggestions = allDestinations?.filter((dest: any) => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    return (
      dest.name.toLowerCase().includes(lowerTitle) ||
      dest.country.toLowerCase().includes(lowerTitle)
    );
  }).slice(0, 5); // Limit to 5 suggestions

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">My Trips</h1>

          {/* Add New Trip Form */}
          <div className="mb-12 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              ✈️ Plan a New Trip
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate({
                  title,
                  start_date: startDate,
                  end_date: endDate,
                  budget: 1000,
                  status: "planning",
                });
              }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {/* Autocomplete Input Container */}
              <div className="flex flex-col relative">
                <label className="mb-2 text-sm font-semibold text-gray-600">Where to?</label>
                <input
                  type="text"
                  placeholder="e.g., Paris"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition z-10"
                  required
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && filteredSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto z-20">
                    {filteredSuggestions.map((dest: any) => (
                      <div
                        key={dest.id}
                        onMouseDown={() => {
                          setTitle(dest.name);
                          setShowSuggestions(false);
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <img src={dest.image_url} alt={dest.name} className="w-10 h-10 rounded-md object-cover" />
                        <div>
                          <p className="font-medium text-gray-800">{dest.name}</p>
                          <p className="text-xs text-gray-500">{dest.country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 transition-colors shadow-md"
                >
                  Add Trip
                </button>
              </div>
            </form>
          </div>

          {/* Trips Grid */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming & Past Trips</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {trips?.map((trip: any) => (
              <Link 
                key={trip.id} 
                href={`/trips/${trip.id}`} 
                className="group block rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-end p-6">
                  <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {trip.status}
                  </span>
                  <h3 className="text-2xl font-extrabold text-white drop-shadow-md">{trip.title}</h3>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">{trip.start_date} to {trip.end_date}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-gray-700 font-semibold">Budget: ${trip.budget}</span>
                    <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            
            {trips?.length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-xl text-gray-400">No trips yet. Plan your first adventure above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ChatWidget />
    </div>
  );
}
