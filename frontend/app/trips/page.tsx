"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ChatWidget from "@/components/ChatWidget";

export default function TripsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isLoading) return <div className="p-8">Loading trips...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
          <button onClick={handleLogout} className="text-red-500 hover:underline">
            Logout
          </button>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Add New Trip</h2>
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
            className="flex flex-col gap-4 md:flex-row"
          >
            <input
              type="text"
              placeholder="Trip Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded border p-2"
              required
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border p-2"
              required
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded border p-2"
              required
            />
            <button
              type="submit"
              className="rounded bg-green-600 p-2 px-6 font-semibold text-white hover:bg-green-700"
            >
              Add
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {trips?.map((trip: any) => (
            <div key={trip.id} className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-bold text-gray-800">{trip.title}</h3>
              <p className="text-sm text-gray-500">
                {trip.start_date} to {trip.end_date}
              </p>
              <p className="mt-2 text-gray-700">Budget: ${trip.budget}</p>
              <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {trip.status}
              </span>
            </div>
          ))}
          {trips?.length === 0 && <p>No trips yet. Add one above!</p>}
        </div>
      </div>
      
      <ChatWidget />
    </div>
  );
}
