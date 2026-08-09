"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";

const TRIPS_PER_PAGE = 4; // Show exactly 4 cards (2x2 grid)

export default function TripsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState(0);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [currentPage, setCurrentPage] = useState(1);

  const [tripSearchQuery, setTripSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { formatCurrency, currency, symbol } = useCurrency();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => (await api.get("/trips/")).data,
  });

  // Debounce search input for live Wikipedia suggestions
  useEffect(() => {
    if (title.length > 1) {
      const timer = setTimeout(() => setTripSearchQuery(title), 400);
      return () => clearTimeout(timer);
    } else {
      setTripSearchQuery("");
    }
  }, [title]);

  const { data: liveSuggestions } = useQuery({
    queryKey: ["liveTripSearch", tripSearchQuery],
    queryFn: async () => (await api.get(`/destinations/?q=${tripSearchQuery}`)).data,
    enabled: !!tripSearchQuery,
  });

  const addMutation = useMutation({
    mutationFn: async (newTrip: any) => (await api.post("/trips/", newTrip)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      setTitle(""); setStartDate(""); setEndDate(""); setBudget(0);
    },
    onError: (err: any) => alert("Error adding trip: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId: string) => { await api.delete(`/trips/${tripId}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] })
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedTrip: any) => (await api.put(`/trips/${updatedTrip.id}`, updatedTrip.data)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trips"] }); setIsEditModalOpen(false); }
  });

  // Date Validations
  const todayStr = new Date().toISOString().split('T')[0];
  let minEndDate = "";
  if (startDate) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 1);
    minEndDate = d.toISOString().split('T')[0];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortTripsDesc = (arr: any[]) => arr ? [...arr].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
  const upcomingTrips = sortTripsDesc(trips?.filter((trip: any) => new Date(trip.end_date) >= today) || []);
  const pastTrips = sortTripsDesc(trips?.filter((trip: any) => new Date(trip.end_date) < today) || []);
  
  const displayedTrips = activeTab === "upcoming" ? upcomingTrips : pastTrips;
  const totalPages = Math.ceil(displayedTrips.length / TRIPS_PER_PAGE);
  const paginatedTrips = displayedTrips.slice((currentPage - 1) * TRIPS_PER_PAGE, currentPage * TRIPS_PER_PAGE);

  const handleTabChange = (tab: "upcoming" | "past") => { setActiveTab(tab); setCurrentPage(1); };
  const handleDelete = (tripId: string) => { if (window.confirm("Delete this trip?")) deleteMutation.mutate(tripId); setOpenMenuId(null); };
  const handleEditClick = (trip: any) => { setEditingTrip({ ...trip, budget: trip.budget ?? 0 }); setIsEditModalOpen(true); setOpenMenuId(null); };
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    updateMutation.mutate({ id: editingTrip.id, data: { title: editingTrip.title, start_date: editingTrip.start_date, end_date: editingTrip.end_date, budget: Number(editingTrip.budget) || 0, status: editingTrip.status || "planning" } });
  };

  const handleAIPlanner = () => {
    if (!title || !startDate || !endDate) {
      alert("Please fill in Where to, Start Date, and End Date to use the AI Planner.");
      return;
    }
    router.push(`/chat?dest=${encodeURIComponent(title)}&start=${startDate}&end=${endDate}`);
  };

  return (
    // Fixed height screen, no scroll on the body
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-8">
        <div className="mx-auto max-w-6xl w-full flex-1 flex flex-col overflow-hidden">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 flex-shrink-0">My Trips</h1>

          {/* Two-Column Grid Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-1 overflow-y-auto pr-2">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Plan a New Trip</h2>
                <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate({ title, start_date: startDate, end_date: endDate, budget: Number(budget), status: "planning" }); }} className="space-y-5">
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Where to?</label>
                    <input 
                      type="text" 
                      placeholder="Search any place..." 
                      value={title} 
                      onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }} 
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" 
                      required 
                    />
                    {showSuggestions && liveSuggestions && liveSuggestions.length > 0 && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto z-20">
                        {liveSuggestions.map((dest: any) => (
                          <div
                            key={dest.id}
                            onMouseDown={() => { setTitle(dest.name); setShowSuggestions(false); }}
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
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Start Date</label>
                    <input type="date" value={startDate} min={todayStr} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">End Date</label>
                    <input type="date" value={endDate} min={minEndDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Budget (in {currency})</label>
                    <input type="number" min="0" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" required />
                  </div>
                  
                  <button type="submit" disabled={addMutation.isPending} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md">
                    {addMutation.isPending ? "Adding..." : "Add Trip"}
                  </button>
                  <button type="button" onClick={handleAIPlanner} className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md flex items-center justify-center gap-2">
                    <span>🤖</span> AI Planner
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Trips List & Pagination */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-4 mb-4 border-b border-gray-200 flex-shrink-0">
                <button onClick={() => handleTabChange("upcoming")} className={`pb-3 px-2 font-bold text-lg transition-colors relative ${activeTab === "upcoming" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                  Upcoming <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{upcomingTrips.length}</span>
                  {activeTab === "upcoming" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button onClick={() => handleTabChange("past")} className={`pb-3 px-2 font-bold text-lg transition-colors relative ${activeTab === "past" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                  Past <span className="ml-2 text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{pastTrips.length}</span>
                  {activeTab === "past" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>}
                </button>
              </div>

              {/* Cards Grid (Fills available space) */}
              <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
                {paginatedTrips.map((trip: any) => {
                  const isPastTrip = new Date(trip.end_date) < today;
                  const displayStatus = isPastTrip ? "Completed" : trip.status;
                  const statusBg = isPastTrip ? "bg-green-600/40 border border-green-300/30" : "bg-white/20";
                  
                  return (
                    <div key={trip.id} className="group block rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 relative flex flex-col h-full">
                      <div className="absolute top-3 right-3 z-20">
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === trip.id ? null : trip.id); }} className="p-1.5 bg-black/20 backdrop-blur-sm text-white rounded-full hover:bg-black/40 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                        {openMenuId === trip.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1">
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(trip); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2">✏️ Edit Trip</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(trip.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">🗑️ Delete</button>
                          </div>
                        )}
                      </div>
                      <Link href={`/trips/${trip.id}`} className="block flex-1 flex flex-col">
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative flex items-end p-4">
                          <span className={`absolute top-3 left-3 ${statusBg} backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide`}>{displayStatus}</span>
                          <h3 className="text-xl font-extrabold text-white drop-shadow-md">{trip.title}</h3>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="flex items-center text-gray-600 mb-2">
                            <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-xs font-medium">{trip.start_date} to {trip.end_date}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-auto">
                            <span className="text-gray-700 font-semibold text-sm">Budget: {formatCurrency(trip.budget)}</span>
                            <span className="text-blue-600 font-semibold text-xs group-hover:translate-x-1 transition-transform">View →</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
                
                {displayedTrips.length === 0 && (
                  <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 m-auto">
                    <p className="text-xl text-gray-400 font-medium">{activeTab === "upcoming" ? "No upcoming trips. Plan your next adventure!" : "No past trips yet."}</p>
                  </div>
                )}
              </div>

              {/* Pagination (Fixed at bottom) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4 flex-shrink-0">
                  <button type="button" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm">← Prev</button>
                  <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
                  <button type="button" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors shadow-sm">Next →</button>
                </div>
              )}
            </div>
          </div>
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
                <input type="text" value={editingTrip.title || ""} onChange={(e) => setEditingTrip({ ...editingTrip, title: e.target.value })} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Start Date</label>
                  <input type="date" value={editingTrip.start_date || ""} onChange={(e) => setEditingTrip({ ...editingTrip, start_date: e.target.value })} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">End Date</label>
                  <input type="date" value={editingTrip.end_date || ""} onChange={(e) => setEditingTrip({ ...editingTrip, end_date: e.target.value })} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Budget</label>
                <input type="number" value={editingTrip.budget || 0} onChange={(e) => setEditingTrip({ ...editingTrip, budget: e.target.value })} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50">{updateMutation.isPending ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
