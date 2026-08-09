"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    // If already logged in, go straight to the chat planner
    if (token) router.push("/chat");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 md:px-12 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-gray-900 text-2xl font-bold">
          <span>✈️</span> TripMate AI
        </div>
        <div className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
          <Link href="/chat" className="hover:text-blue-600 transition-colors">Plan a Trip</Link>
          <Link href="/destinations" className="hover:text-blue-600 transition-colors">Explore</Link>
          <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
          <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-12">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-gray-900 max-w-4xl">
          Plan your trip differently with AI.
        </h1>
        <p className="text-lg md:text-2xl mb-10 font-light text-gray-600 max-w-2xl mx-auto">
          Discover places, build itineraries, get personalized recommendations, and change your entire trip through conversation.
        </p>
        
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            placeholder="Where to? (e.g., Chennai, Paris, Tokyo)" 
            className="flex-1 p-4 text-lg outline-none rounded-xl"
            onKeyDown={(e) => { if (e.key === 'Enter') router.push('/chat'); }}
          />
          <button 
            onClick={() => router.push('/chat')}
            className="bg-blue-600 text-white py-4 px-8 rounded-xl text-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Create a trip <span>→</span>
          </button>
        </div>
        
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <span className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">📅 Flexible Dates</span>
          <span className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">👨‍👩‍👧 Group Planning</span>
          <span className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">🤖 AI Recommendations</span>
        </div>
      </div>
    </div>
  );
}
