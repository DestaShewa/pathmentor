import { useEffect, useState } from "react";
import {
  Star, Search, RefreshCw, MessageSquare,
  User, Calendar, Filter, Trash2, TrendingUp
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface SessionReview {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  mentorId: { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  status: string;
  studentRating: number;
  studentComment?: string;
  summary?: string;
  feedback?: string;
}

const StarDisplay = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}
      />
    ))}
  </div>
);

const AllFeedback = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [filtered, setFiltered] = useState<SessionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    let r = reviews;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (x) =>
          x.mentorId?.name?.toLowerCase().includes(q) ||
          x.studentId?.name?.toLowerCase().includes(q) ||
          x.studentComment?.toLowerCase().includes(q) ||
          x.summary?.toLowerCase().includes(q)
      );
    }
    if (ratingFilter === "5") r = r.filter((x) => x.studentRating === 5);
    else if (ratingFilter === "4") r = r.filter((x) => x.studentRating === 4);
    else if (ratingFilter === "3") r = r.filter((x) => x.studentRating === 3);
    else if (ratingFilter === "low") r = r.filter((x) => x.studentRating <= 2);
    setFiltered(r);
  }, [search, ratingFilter, reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/session-reviews");
      setReviews(res.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    setDeletingId(reviewId);
    try {
      await api.delete(`/admin/session-reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      toast({
        title: "Success",
        description: "Review deleted successfully",
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Failed to delete review",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Summary stats
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.studentRating, 0) / reviews.length).toFixed(1)
      : "—";
  const fiveStars = reviews.filter((r) => r.studentRating === 5).length;
  const lowRatings = reviews.filter((r) => r.studentRating <= 2).length;

  // Per-mentor aggregation for top mentors
  const mentorMap: Record<string, { name: string; track?: string; sum: number; count: number }> = {};
  reviews.forEach((r) => {
    const id = r.mentorId?._id;
    if (!id) return;
    if (!mentorMap[id]) {
      mentorMap[id] = {
        name: r.mentorId.name,
        track: r.mentorId.learningProfile?.skillTrack,
        sum: 0,
        count: 0,
      };
    }
    mentorMap[id].sum += r.studentRating;
    mentorMap[id].count++;
  });
  const topMentors = Object.values(mentorMap)
    .map((m) => ({ ...m, avg: m.sum / m.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Feedback & Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">
            Session ratings and comments from students about their mentors
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: reviews.length, color: "text-white", bg: "bg-white/5" },
          { label: "Avg Rating", value: `${avgRating}★`, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "5-Star Reviews", value: fiveStars, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Low Ratings", value: lowRatings, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border border-white/10 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top mentors sidebar + reviews */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top rated mentors */}
        {topMentors.length > 0 && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Top Rated Mentors
            </h3>
            <div className="space-y-3">
              {topMentors.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{m.name}</p>
                      {m.track && <p className="text-[10px] text-slate-500">{m.track}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-400">{m.avg.toFixed(1)}★</p>
                    <p className="text-[10px] text-slate-500">{m.count} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews list */}
        <div className={topMentors.length > 0 ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentor, student, or comment..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="low">1–2 Stars</option>
            </select>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
          )}

          {loading ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center text-slate-400">
              Loading feedback...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-bold text-white mb-2">No Feedback Yet</h3>
              <p className="text-slate-400 text-sm">
                {reviews.length === 0
                  ? "Feedback appears here after students rate completed mentor sessions."
                  : "No reviews match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-none">
              {filtered.map((review, i) => (
                <div
                  key={review._id || i}
                  className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
                >
                  {/* Mentor + rating row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {review.mentorId?.name?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{review.mentorId?.name}</p>
                        {review.mentorId?.learningProfile?.skillTrack && (
                          <p className="text-xs text-slate-500">{review.mentorId.learningProfile.skillTrack}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarDisplay rating={review.studentRating} />
                      <span className="text-xs font-bold text-amber-400">{review.studentRating}.0</span>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.studentComment && (
                    <p className="text-sm text-slate-300 italic mb-3 pl-12">
                      "{review.studentComment}"
                    </p>
                  )}

                  {/* Session summary from mentor */}
                  {review.summary && (
                    <div className="pl-12 mb-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Session Summary</p>
                      <p className="text-xs text-slate-400">{review.summary}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 pl-12">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={11} />
                        By <span className="text-slate-300 font-medium ml-1">{review.studentId?.name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${review.studentRating >= 4
                        ? "bg-emerald-500/10 text-emerald-400"
                        : review.studentRating === 3
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-red-500/10 text-red-400"
                        }`}>
                        {review.studentRating >= 4 ? "Positive" : review.studentRating === 3 ? "Neutral" : "Negative"}
                      </span>
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={deletingId === review._id}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete review"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllFeedback;
