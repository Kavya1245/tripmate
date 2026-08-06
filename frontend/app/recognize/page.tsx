"use client";
import { useState } from "react";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default function RecognizePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setPredictions([]); // Clear previous results
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await api.post("/cv/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setPredictions(res.data.predictions);
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
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">AI Image Recognition</h1>
          <p className="text-gray-600 mb-8">Upload a photo from your trip and let AI identify the landmark or objects in it!</p>
          
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
                <div className="mt-6 relative rounded-xl overflow-hidden border border-gray-200 h-64 bg-gray-100">
                  <img src={preview} alt="Selected preview" className="h-full w-full object-cover" />
                </div>
              )}

              {selectedFile && (
                <button 
                  onClick={handleUpload}
                  disabled={loading}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Analyzing Image..." : "Analyze with AI"}
                </button>
              )}
              
              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            </div>

            {/* Right: Results */}
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-4">AI Predictions</h3>
              
              {!predictions.length && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <span className="text-5xl mb-4">📸</span>
                  <p className="text-gray-400 font-medium">Upload an image to see the magic!</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500 font-medium">AI is looking at your photo...</p>
                </div>
              )}

              {predictions.length > 0 && (
                <div className="space-y-4">
                  {predictions.map((pred, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800 capitalize">{pred.label}</span>
                        <span className="text-sm font-bold text-blue-600">{(pred.score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${pred.score * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
