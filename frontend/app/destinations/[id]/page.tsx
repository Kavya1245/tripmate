"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { useCurrency } from "@/context/CurrencyContext";

export default function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const { formatCurrency } = useCurrency();
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const { data: dest, isLoading: destLoading } = useQuery({
    queryKey: ["destination", id],
    queryFn: async () => {
      const res = await api.get(`/destinations/${id}`);
      return res.data;
    },
  });

  const { data: reviews, isLoading: revLoading } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const res = await api.get(`/reviews/${id}`);
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (newReview: any) => {
      const res = await api.post("/reviews/", newReview);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      setComment("");
      setRating(5);
    },
    onError: (err: any) => alert("Error posting review: " + JSON.stringify(err.response?.data?.detail || err.message))
  });

  const externalQuotes = [
    "An absolutely breathtaking experience. The architecture and history are unmatched. A must-visit!",
    "Great place to spend the day. Be sure to arrive early to beat the crowds. Highly recommended.",
    "Beautiful scenery and rich culture. The local food nearby is also fantastic. Will come back again!",
    "A bit crowded but totally worth it. The photos don't do justice to how massive and beautiful it is."
  ];

  if (destLoading) return <div className="p-8">Loading destination...</div>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-20">
          <Link href="/destinations" className="text-blue-600 hover:underline flex items-center gap-2">
            ← Back to Discover
          </Link>
        </div>

        {/* Hero Image */}
        <div className="relative h-[60vh] w-full bg-gray-900">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${dest?.image_url})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-2xl mb-2">{dest?.name}</h1>
              <div className="flex items-center gap-6 text-lg font-medium drop-shadow-md">
                <span className="flex items-center gap-2">📍 {dest?.country}</span>
                <span className="flex items-center gap-2">💰 Avg. Budget: {formatCurrency(dest?.avg_budget)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this destination</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">{dest?.description}</p>
              <div className="flex gap-2 flex-wrap">
                {dest?.tags.split(',').map((tag: string) => (
                  <span key={tag} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-100">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Traveler Reviews ({reviews?.length || 0})</h3>
              {revLoading && <p className="text-gray-500">Loading reviews...</p>}
              <div className="space-y-6">
                {reviews?.map((rev: any) => (
                  <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">U</div>
                        <span className="font-semibold text-gray-900">{rev.user_name || "Anonymous User"}</span>
                      </div>
                      <span className="text-yellow-500 text-lg">{"⭐".repeat(rev.rating)}</span>
                    </div>
                    <p className="text-gray-600 leading-relaxed pl-13">{rev.comment || "No comment provided."}</p>
                  </div>
                ))}
                {reviews?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Review Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Leave a Review</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  reviewMutation.mutate({
                    destination_id: id,
                    rating: Number(rating),
                    comment: comment || null
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className={`text-4xl transition-transform hover:scale-110 ${(hover || rating) >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Share your experience..."
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={reviewMutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
