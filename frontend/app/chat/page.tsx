"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [autoStarted, setAutoStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat"],
    queryFn: async () => (await api.get("/chat/history")).data,
  });

  const mutation = useMutation({
    mutationFn: async (msg: string) => {
      return (await api.post("/chat/", { message: msg, trip_id: null })).data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["chat"] });
      if (data.content.includes("[TRIP_CREATED]") || data.content.includes("[ITINERARY_SAVED]")) {
        qc.invalidateQueries({ queryKey: ["trips"] });
        qc.invalidateQueries({ queryKey: ["itinerary"] });
      }
    },
    onError: (err: any) => alert("Chat Error: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  const handleSend = (e: React.FormEvent, msg?: string) => {
    e.preventDefault();
    const messageToSend = msg || input;
    if (!messageToSend.trim()) return;
    // Use a highly unique temporary ID to prevent React key warnings
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    qc.setQueryData(["chat"], (old: any) => [...(old || []), { id: tempId, role: "user", content: messageToSend, created_at: new Date().toISOString() }]);
    mutation.mutate(messageToSend);
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mutation.isPending]);

  // Auto-send prompt if navigated from AI Planner button
  useEffect(() => {
    const dest = searchParams.get('dest');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (dest && start && end && !autoStarted && !isLoading) {
      setAutoStarted(true);
      const prompt = `Plan a trip to ${dest} from ${start} to ${end}. Propose the itinerary first.`;
      handleSend(new Event('submit') as any, prompt);
    }
  }, [searchParams, autoStarted, isLoading]);

  const cleanMessage = (content: string) => {
    let cleaned = content.replace("[TRIP_CREATED]", "").replace("[ITINERARY_SAVED]", "").trim();
    cleaned = cleaned.replace(/\[ITINERARY\][\s\S]*?\[\/ITINERARY\]/g, "✅ Itinerary generated and saved to your trips!");
    cleaned = cleaned.replace(/<function[^>]*>/g, "").replace(/<\/function>/g, "").trim();
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, "").trim();
    return cleaned;
  };

  const quickActions = [
    { icon: "🗓️", label: "Plan a Trip", prompt: "Plan a 3-day trip to Chennai." },
    { icon: "🌤️", label: "Check Weather", prompt: "What is the live weather in Paris?" },
    { icon: "💱", label: "Convert Currency", prompt: "How much is 100 USD in INR?" },
    { icon: "🗺️", label: "Ask about Bali", prompt: "What is the best way to get from the airport in Bali?" }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Trip Planner</h1>
            <p className="text-sm text-gray-500">Chat with AI to generate and save your itineraries.</p>
          </div>
          <Link href="/trips" className="text-blue-600 hover:underline font-medium text-sm flex items-center gap-1">
            View My Trips →
          </Link>
        </div>

        <div className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-6 overflow-y-auto pb-32">
          {isLoading ? (
            <div className="text-center text-gray-400 mt-20">Loading conversation...</div>
          ) : messages?.length === 0 ? (
            <div className="text-center mt-20">
              <div className="text-6xl mb-6">✈️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Where to today?</h2>
              <p className="text-gray-500 mb-10 max-w-md mx-auto">Tell me where you want to go, your dates, and your budget. I'll generate a complete itinerary for you.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {quickActions.map((action) => (
                  <button 
                    key={action.label} 
                    onClick={(e) => handleSend(e, action.prompt)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <span className="text-2xl block mb-2">{action.icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages?.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 text-md shadow-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-800 border"}`}>
                  <p className="whitespace-pre-wrap">{cleanMessage(msg.content)}</p>
                  {(msg.content.includes("[TRIP_CREATED]") || msg.content.includes("[ITINERARY_SAVED]")) && (
                    <Link href="/trips" className="mt-3 block text-sm bg-green-100 text-green-800 p-2 rounded-lg text-center font-semibold hover:bg-green-200">
                      ✅ Trip Saved! Click to View in My Trips
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
          
          {mutation.isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white p-4 text-md border shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.6s]"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-0 left-0 md:ml-64 right-0 bg-white border-t p-4 z-30">
          <form onSubmit={(e) => handleSend(e)} className="max-w-3xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g., Plan a trip to Goa for next week)..."
              className="flex-1 rounded-xl border border-gray-300 p-4 text-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button type="submit" className="rounded-xl bg-blue-600 px-8 text-md font-semibold text-white hover:bg-blue-700 transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPlannerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
