"use client";
import { useState } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

// Helper to safely render strings or objects returned by AI
const safeString = (val: any) => {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' | ');
  }
  return String(val);
};

export default function RecognizePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [insights, setInsights] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setInsights(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    setInsights(null);
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post("/cv/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setInsights(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to analyze image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Image Recognition</h1>
          <p className="text-gray-600 mb-8">Upload a photo from your trip and let our Vision AI identify the landmark and provide deep historical insights.</p>
          
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: Upload & Preview */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Travel Photo</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              
              {preview && (
                <div className="mt-6 relative rounded-xl overflow-hidden border border-gray-200 h-72 bg-gray-100">
                  <img src={preview} alt="Selected preview" className="h-full w-full object-cover" />
                </div>
              )}

              {selectedFile && (
                <button 
                  onClick={handleUpload}
                  disabled={loading}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Image...
                    </>
                  ) : "Analyze with Vision AI"}
                </button>
              )}
              {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
            </div>

            {/* Right: Advanced Insights Results */}
            <div className="flex flex-col bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4">AI Insights</h3>
              
              {!insights && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <span className="text-5xl mb-4">📸</span>
                  <p className="text-gray-400 font-medium">Upload an image to see deep AI insights, history, and travel tips.</p>
                </div>
              )}

              {loading && (
                <div className="space-y-4 w-full">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              )}

              {insights && !loading && (
                <div className="space-y-5 overflow-y-auto max-h-[28rem] pr-2">
                  <div>
                    <h4 className="text-2xl font-extrabold text-blue-700">{insights.landmark_name || "Unknown Landmark"}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">{insights.category || "N/A"}</span>
                      <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">📍 {insights.location || "Unknown"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Visual Features</h5>
                    <p className="text-sm text-gray-700 leading-relaxed">{safeString(insights.visual_features)}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Historical Significance</h5>
                    <p className="text-sm text-gray-700 leading-relaxed">{safeString(insights.historical_significance)}</p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <h5 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-1 flex items-center gap-1">💡 Travel Tip</h5>
                    <p className="text-sm text-yellow-800 leading-relaxed">{safeString(insights.travel_tips)}</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
