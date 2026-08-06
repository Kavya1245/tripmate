"use client";
import { useState } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function RecommendPage() {
  const [budget, setBudget] = useState(1500);
  const [tags, setTags] = useState("beach,romance");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecommendations([]);

    try {
      const res = await api.post("/ml/recommend", { budget: Number(budget), tags });
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
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Travel Recommendations</h1>
          <p className="text-gray-600 mb-8">Let our Machine Learning model find the perfect destination based on your budget and interests.</p>
          
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-8">
            <form onSubmit={handleRecommend} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">Your Budget ($)</label>
                <input 
                  type="number" 
                  min="100"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-2 text-sm font-semibold text-gray-600">Interests (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g., mountain,history"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? "AI is thinking..." : "Get Recommendations"}
              </button>
            </form>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Recommendations Grid */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Top Picks For You</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {recommendations.map((dest, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{dest.name}</h3>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">MATCH</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">📍 {dest.country}</p>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <span className="text-gray-700 font-semibold">💰 ${dest.budget}</span>
                      <div className="flex gap-1 flex-wrap">
                        {dest.tags.split(',').map((tag: string) => (
                           <span key={tag} className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                             {tag.trim()}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !recommendations.length && !error && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <span className="text-5xl mb-4 block">🤖</span>
              <p className="text-xl text-gray-400 font-medium">Enter your preferences above to get AI recommendations!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
