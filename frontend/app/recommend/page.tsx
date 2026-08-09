"use client";
import { useState } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";

export default function RecommendPage() {
  const [budget, setBudget] = useState(0);
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState(0);
  const [travelStyle, setTravelStyle] = useState("Relaxed");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get currency and formatCurrency from the global context
  const { formatCurrency, currency } = useCurrency();

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const res = await api.post("/ml/recommend", { 
        budget: Number(budget), 
        tags, 
        duration: Number(duration),
        travel_style: travelStyle
      });
      setRecommendations(res.data.recommendations);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to get recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Travel Recommendations</h1>
          <p className="text-gray-600 mb-8">Let our Machine Learning engine find the perfect destination based on your budget, interests, and travel style.</p>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
            <form onSubmit={handleRecommend} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Budget (in {currency})</label>
                <input type="number" min="0" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (Days)</label>
                <input type="number" min="0" max="30" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Travel Style</label>
                <select value={travelStyle} onChange={(e) => setTravelStyle(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Relaxed</option>
                  <option>Adventure</option>
                  <option>Luxury</option>
                  <option>Budget</option>
                  <option>Cultural</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Interests</label>
                <input type="text" placeholder="e.g., beach,romance,food" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-gray-300 p-3 text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
              </div>
              
              <div className="md:col-span-2 lg:col-span-4">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
                  {loading ? "🤖 AI is analyzing 15 destinations..." : "Get AI Recommendations"}
                </button>
              </div>
            </form>
          </div>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

          {/* Recommendations Grid (Up to 15 cards) */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Top {recommendations.length} Matches For You</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((dest, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    <div className="h-40 w-full bg-cover bg-center bg-gray-200 relative" style={{ backgroundImage: `url(${dest.image_url})` }}>
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        {dest.match_score}% Match
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800">{dest.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">📍 {dest.country}</p>
                      <div className="flex gap-1 flex-wrap mb-4">
                        {dest.tags.split(',').map((tag: string) => (
                          <span key={tag} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                        {/* Dynamically converted budget */}
                        <span className="font-bold text-blue-600 text-sm">{formatCurrency(dest.budget)}</span>
                        <span className="text-xs text-gray-400">Est. Budget</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && recommendations.length === 0 && !error && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <span className="text-5xl mb-4 block">🤖</span>
              <p className="text-xl text-gray-400 font-medium">Fill out the form above to get your personalized AI matches!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
