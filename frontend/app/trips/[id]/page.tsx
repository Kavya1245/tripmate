"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;

  const qc = useQueryClient();
  const [dayNo, setDayNo] = useState(1);
  const [activity, setActivity] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const res = await api.get(`/trips/${tripId}`);
      return res.data;
    },
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: async () => {
      const res = await api.get(`/itineraries/${tripId}`);
      return res.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const res = await api.post("/itineraries/", newItem);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itinerary", tripId] });
      setActivity("");
      setTime("");
      setNotes("");
    },
    onError: (err: any) => alert("Error adding activity: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  if (tripLoading) return <div className="p-8">Loading trip...</div>;

  // Group itinerary items by day_no for the timeline view
  const groupedItems = items?.reduce((acc: any, item: any) => {
    (acc[item.day_no] = acc[item.day_no] || []).push(item);
    return acc;
  }, {});
  
  const sortedDays = groupedItems ? Object.keys(groupedItems).sort((a, b) => Number(a) - Number(b)) : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <div className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <Link href="/trips" className="text-blue-600 hover:underline flex items-center gap-2 font-medium">
            ← Back to My Trips
          </Link>
        </div>

        {/* Trip Hero Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-400 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
              {trip?.status}
            </span>
            <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">{trip?.title}</h1>
            
            {/* Quick Stat Cards */}
            <div className="flex flex-wrap gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-xs text-blue-100 uppercase tracking-wide">Dates</p>
                  <p className="font-bold">{trip?.start_date} to {trip?.end_date}</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-xs text-blue-100 uppercase tracking-wide">Budget</p>
                  <p className="font-bold">${trip?.budget}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Timeline Itinerary */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Day-by-Day Itinerary</h2>
            
            {itemsLoading && <p>Loading activities...</p>}
            
            {!itemsLoading && sortedDays.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-dashed border-gray-200">
                <span className="text-5xl mb-4 block">🗺️</span>
                <p className="text-xl text-gray-500 font-medium">No activities planned yet.</p>
                <p className="text-gray-400 mt-1">Start building your adventure using the form on the right!</p>
              </div>
            )}

            <div className="space-y-10">
              {sortedDays.map((day) => (
                <div key={day} className="relative">
                  {/* Day Header */}
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 text-white font-bold py-1 px-4 rounded-full text-sm shadow-md">
                      DAY {day}
                    </div>
                    <div className="flex-1 h-px bg-gray-200 ml-4"></div>
                  </div>
                  
                  {/* Activities for this day */}
                  <div className="pl-6 border-l-2 border-gray-100 space-y-4">
                    {groupedItems[day].map((item: any) => (
                      <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 text-blue-600 rounded-lg p-2 mt-1">
                            <span className="text-xl">📍</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{item.activity}</h3>
                            {item.time && <p className="text-sm text-gray-500 font-medium mt-1">🕒 {item.time}</p>}
                            {item.notes && <p className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-2 rounded">💡 {item.notes}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            await api.delete(`/itineraries/${item.id}`);
                            qc.invalidateQueries({ queryKey: ["itinerary", tripId] });
                          }}
                          className="text-gray-300 hover:text-red-500 text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Add Activity Form (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>➕</span> Add Activity
              </h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  addMutation.mutate({
                    trip_id: tripId,
                    day_no: Number(dayNo),
                    activity: activity,
                    time: time || null,
                    notes: notes || null
                  });
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Day Number</label>
                  <input 
                    type="number" 
                    min="1"
                    value={dayNo}
                    onChange={(e) => setDayNo(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Activity</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Visit Eiffel Tower"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Time (Optional)</label>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notes (Optional)</label>
                  <textarea 
                    placeholder="e.g., Book tickets in advance"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
                >
                  {addMutation.isPending ? "Adding..." : "Add to Itinerary"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
