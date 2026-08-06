"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, use, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

const ITEMS_PER_PAGE = 4;

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;

  const qc = useQueryClient();
  const [dayNo, setDayNo] = useState(1);
  const [activity, setActivity] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDayNo, setEditDayNo] = useState(1);
  const [editActivity, setEditActivity] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Changed from openDay (boolean accordion) to selectedDay (dropdown value)
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

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

  const updateMutation = useMutation({
    mutationFn: async (updatedItem: any) => {
      const res = await api.put(`/itineraries/${updatedItem.id}`, updatedItem.data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itinerary", tripId] });
      setEditingId(null);
    },
    onError: (err: any) => alert("Error updating activity: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  const groupedItems = useMemo(() => {
    return items?.reduce((acc: any, item: any) => {
      (acc[item.day_no] = acc[item.day_no] || []).push(item);
      return acc;
    }, {});
  }, [items]);

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/download-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'TripMate_Itinerary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download PDF.');
    }
  };

  if (tripLoading) return <div className="p-8">Loading trip...</div>;

  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const endDate = trip?.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate ? Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 : 1;

  const formatDate = (date: Date, addDays = 0) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + addDays);
    return newDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const allDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Get items for the currently selected day
  const selectedDayItems = selectedDay ? (groupedItems?.[selectedDay] || []) : [];
  const totalPages = Math.ceil(selectedDayItems.length / ITEMS_PER_PAGE);
  const paginatedItems = selectedDayItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDayChange = (day: number) => {
    setSelectedDay(day);
    setCurrentPage(1); // Reset to page 1 when changing days
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditDayNo(item.day_no);
    setEditActivity(item.activity);
    setEditTime(item.time || "");
    setEditNotes(item.notes || "");
  };

  const handleUpdateSubmit = (e: React.FormEvent, itemId: string) => {
    e.preventDefault();
    updateMutation.mutate({
      id: itemId,
      data: {
        day_no: Number(editDayNo),
        activity: editActivity,
        time: editTime || null,
        notes: editNotes || null
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm p-4 sticky top-0 z-20">
          <Link href="/trips" className="text-blue-600 hover:underline flex items-center gap-2 font-medium">
            ← Back to My Trips
          </Link>
        </div>

        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-400 p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
              {trip?.status}
            </span>
            <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">{trip?.title}</h1>
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

        <div className="max-w-6xl mx-auto w-full px-8 pt-8">
          <button 
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-red-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-600 transition-colors shadow-md"
          >
            <span>📄</span> Download Itinerary PDF
          </button>
        </div>

        <div className="max-w-6xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Timeline</h2>
            
            {itemsLoading && <p>Loading activities...</p>}
            
            {/* Master Box Container with Dropdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Day to View</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => handleDayChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white text-lg font-semibold text-gray-800"
                >
                  {allDays.map(d => (
                    <option key={d} value={d}>
                      Day {d} ({formatDate(startDate, d - 1)}) - {groupedItems?.[d]?.length || 0} Activities
                    </option>
                  ))}
                </select>
              </div>

              {/* Activities for Selected Day */}
              <div className="p-6 space-y-4">
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-3 block">🗓️</span>
                    <p className="text-gray-500 font-medium">No activities planned for Day {selectedDay} yet.</p>
                    <p className="text-gray-400 text-sm mt-1">Use the form on the right to add one!</p>
                  </div>
                ) : (
                  paginatedItems.map((item: any) => (
                    <div key={item.id} className="border border-gray-100 rounded-lg p-4 group hover:shadow-sm transition-shadow bg-gray-50/50">
                      {editingId !== item.id ? (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 text-blue-600 rounded-lg p-2 mt-1">
                              <span className="text-lg">📍</span>
                            </div>
                            <div>
                              <h3 className="text-md font-bold text-gray-900">{item.activity}</h3>
                              {item.time && <p className="text-xs text-gray-500 font-medium mt-1">🕒 {item.time}</p>}
                              {item.notes && <p className="text-xs text-gray-600 mt-2 italic bg-white p-2 rounded border border-gray-100">💡 {item.notes}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">✏️ Edit</button>
                            <button onClick={async () => { await api.delete(`/itineraries/${item.id}`); qc.invalidateQueries({ queryKey: ["itinerary", tripId] }); }} className="text-red-500 hover:text-red-700 text-xs font-medium">✕ Remove</button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleUpdateSubmit(e, item.id)} className="space-y-3 bg-white p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Day</label>
                              <select value={editDayNo} onChange={(e) => setEditDayNo(Number(e.target.value))} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                {allDays.map(d => <option key={d} value={d}>Day {d}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Activity</label>
                            <input type="text" value={editActivity} onChange={(e) => setEditActivity(e.target.value)} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Notes</label>
                            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"></textarea>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={updateMutation.isPending} className="bg-blue-600 text-white py-2 px-4 rounded font-semibold text-sm hover:bg-blue-700 disabled:opacity-50">
                              {updateMutation.isPending ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded font-semibold text-sm hover:bg-gray-300">Cancel</button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>➕</span> Add Activity
              </h3>
              <form onSubmit={(e) => { e.preventDefault(); addMutation.mutate({ trip_id: tripId, day_no: Number(dayNo), activity: activity, time: time || null, notes: notes || null }); }} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Select Day</label>
                  <select value={dayNo} onChange={(e) => setDayNo(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white">
                    {allDays.map(d => (
                      <option key={d} value={d}>Day {d} ({formatDate(startDate, d - 1)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Activity</label>
                  <input type="text" placeholder="e.g., Visit Eiffel Tower" value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Time (Optional)</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notes (Optional)</label>
                  <textarea placeholder="e.g., Book tickets in advance" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition resize-none"></textarea>
                </div>
                <button type="submit" disabled={addMutation.isPending} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md">
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
