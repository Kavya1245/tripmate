"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const qc = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["chat"],
    queryFn: async () => {
      const res = await api.get("/chat/history");
      return res.data;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await api.post("/chat/", { message: msg });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat"] });
    },
    onError: (err: any) => {
      alert("Chat Error: " + JSON.stringify(err.response?.data?.detail || err.message));
    }
  });

  const handleSend = (e: React.FormEvent, msg?: string) => {
    e.preventDefault();
    const messageToSend = msg || input;
    if (!messageToSend.trim()) return;
    
    qc.setQueryData(["chat"], (old: any) => [
      ...(old || []),
      { id: Date.now().toString(), role: "user", content: messageToSend, created_at: new Date().toISOString() }
    ]);

    mutation.mutate(messageToSend);
    setInput("");
  };

  // Quick action pills - always visible above the input
  const quickActions = [
    { icon: "🌤️", label: "Weather", prompt: "What is the live weather in Paris right now?" },
    { icon: "💱", label: "Currency", prompt: "How much is 100 USD in IDR?" },
    { icon: "🗺️", label: "Discover", prompt: "What is the best way to get from the airport in Bali?" },
    { icon: "✈️", label: "Plan Trip", prompt: "Plan a 3-day trip to Tokyo" }
  ];

  return (
    <div className="fixed top-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-white shadow-lg hover:bg-blue-700 transition-colors"
        >
          💬 Ask AI
        </button>
      )}

      {isOpen && (
        <div 
          className={`flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
            isFullscreen ? "fixed inset-4 w-auto h-auto" : "w-96 h-[600px] [resize:both] overflow-auto"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-900 p-4 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold">TripMate AI Concierge</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)} 
                className="text-gray-300 hover:text-white text-sm"
                title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullscreen ? "🗗" : "⛶"}
              </button>
              <button 
                onClick={() => { setIsOpen(false); setIsFullscreen(false); }} 
                className="text-gray-300 hover:text-white text-xl ml-2"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-gray-50">
            {isLoading && <p className="text-center text-gray-400">Loading history...</p>}
            
            {!isLoading && messages?.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-gray-700 mb-1 font-semibold">Welcome to TripMate AI!</p>
                <p className="text-gray-400 text-sm mb-6">How can I help you plan your trip today?</p>
              </div>
            )}

            {messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white text-gray-400 p-3 text-sm border border-gray-100 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.6s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Bar (Always visible above input) */}
          <div className="flex-shrink-0 px-3 pt-2 pb-1 border-t border-gray-100 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-1.5 flex-shrink-0 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => handleSend(e)} className="flex border-t border-gray-200 bg-white p-3 flex-shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your trip..."
              className="flex-1 rounded-l-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="rounded-r-lg bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
