"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

const TRIPS_PER_PAGE = 3;

export default function TripsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState(1000);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any | null>(null);

  const { data: allDestinations } = useQuery({
    queryKey: ["all-destinations-mini"],
    queryFn: async () => {
      const res = await api.get("/destinations/?limit=100");
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

  const addMutation = useMutation({
    mutationFn: async (newTrip: any) => {
      const res = await api.post("/trips/", newTrip);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      setTitle("");
      setStartDate("");
      setEndDate("");
      setBudget(1000);
    },
    onError: (err: any) => alert("Error adding trip: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId: string) => {
      await api.delete(`/trips/${tripId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedTrip: any) => {
      const res = await api.put(`/trips/${updatedTrip.id}`, updatedTrip.data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.detail || err.message;
      alert("Error updating trip: " + JSON.stringify(errorMsg));
    }
  });

  if (isLoading) return <div className="p-8">Loading trips...</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips?.filter((trip: any) => new Date(trip.end_date) >= today) || [];
  const pastTrips = trips?.filter((trip: any) => new Date(trip.end_date) < today) || [];
  
  const displayedTrips = activeTab === "upcoming" ? upcomingTrips : pastTrips;

  const totalPages = Math.ceil(displayedTrips.length / TRIPS_PER_PAGE);
  const paginatedTrips = displayedTrips.slice(
    (currentPage - 1) * TRIPS_PER_PAGE,
    currentPage * TRIPS_PER_PAGE
  );

  const handleTabChange = (tab: "upcoming" | "past") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const filteredSuggestions = allDestinations?.filter((dest: any) => {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    return (
      dest.name.toLowerCase().includes(lowerTitle) ||
      dest.country.toLowerCase().includes(lowerTitle)
    );
  }).slice(0, 5);

  const handleDelete = (tripId: string) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      deleteMutation.mutate(tripId);
    }
    setOpenMenuId(null);
  };

  const handleEditClick = (trip: any) => {
    setEditingTrip({ ...trip, budget: trip.budget ?? 0 });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    updateMutation.mutate({
      id: editingTrip.id,
      data: {
        title: editingTrip.title,
        start_date: editingTrip.start_date,
        end_date: editingTrip.end_date,
        budget: Number(editingTrip.budget) || 0,
        status: editingTrip.status || "planning"
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">My Trips</h1>

          <div className="mb-12 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              ✈️ Plan a New Trip
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addMutation.mutate({
                  title,
                  start_date: startDate,
                  end_date: endDate,
                  budget: Number(budget),
                  status: "planning",
                });
              }}
              className="flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex flex-col relative flex-1 min-w-[150px]">
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
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition z-10"
                  required
                />
                
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
              
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">Budget ($)</label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  required
                />
              </div>

              <div className="flex items-end shrink-0">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 p-3 px-8 font-bold text-white hover:bg-blue-700 transition-colors shadow-md h-[48px] whitespace-nowrap"
                >
                  Add Trip
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-4 mb-8 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleTabChange("upcoming")}
              className={`pb-4 px-2 font-bold text-lg transition-colors relative ${
                activeTab === "upcoming" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Upcoming Trips
              <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{upcomingTrips.length}</span>
              {activeTab === "upcoming" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("past")}
              className={`pb-4 px-2 font-bold text-lg transition-colors relative ${
                activeTab === "past" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Past Trips
              <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pastTrips.length}</span>
              {activeTab === "past" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
            </button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedTrips.map((trip: any) => {
              // Dynamic Status Logic
              const isPastTrip = new Date(trip.end_date) < today;
              const displayStatus = isPastTrip ? "Completed" : trip.status;
              const statusBg = isPastTrip ? "bg-green-600/40 border border-green-300/30" : "bg-white/20";
              
              return (
                <div key={trip.id} className="group block rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative">
                  
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === trip.id ? null : trip.id);
                      }}
                      className="p-2 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    
                    {openMenuId === trip.id && (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1">
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(trip); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                        >
                          ✏️ Edit Trip
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(trip.id); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <Link href={`/trips/${trip.id}`} className="block">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-end p-6">
                      <span className={`absolute top-4 left-4 ${statusBg} backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                        {displayStatus}
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
                </div>
              );
            })}
            
            {displayedTrips.length === 0 && (
              <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-xl text-gray-400 font-medium">
                  {activeTab === "upcoming" ? "No upcoming trips. Plan your next adventure above!" : "No past trips yet."}
                </p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
      
      {openMenuId && <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>}

      {isEditModalOpen && editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Trip</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Trip Title</label>
                <input 
                  type="text" 
                  value={editingTrip.title || ""} 
                  onChange={(e) => setEditingTrip({ ...editingTrip, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={editingTrip.start_date || ""} 
                    onChange={(e) => setEditingTrip({ ...editingTrip, start_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={editingTrip.end_date || ""} 
                    onChange={(e) => setEditingTrip({ ...editingTrip, end_date: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Budget ($)</label>
                <input 
                  type="number" 
                  value={editingTrip.budget || 0} 
                  onChange={(e) => setEditingTrip({ ...editingTrip, budget: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
