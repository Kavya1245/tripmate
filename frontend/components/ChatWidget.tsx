"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    qc.setQueryData(["chat"], (old: any) => [
      ...(old || []),
      { id: Date.now().toString(), role: "user", content: input, created_at: new Date().toISOString() }
    ]);

    mutation.mutate(input);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700"
        >
          💬 Chat
        </button>
      )}

      {isOpen && (
        <div className="flex h-96 w-80 flex-col rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between rounded-t-lg bg-blue-600 p-3 text-white">
            <h3 className="font-bold">TripMate AI</h3>
            <button onClick={() => setIsOpen(false)} className="text-xl">×</button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading && <p className="text-center text-gray-400">Loading...</p>}
            {messages?.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 p-2 text-sm text-gray-400">AI is typing...</div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex border-t p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your trip..."
              className="flex-1 rounded-l border p-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-r bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
