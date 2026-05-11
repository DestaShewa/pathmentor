import { useEffect, useState } from "react";
import { Star, Search, RefreshCw, Calendar, MessageSquare } from "lucide-react";
import api from "@/services/api";

interface SessionReview {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  mentorId: { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  studentRating: number;
  studentComment?: string;
  summary?: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        size={14}
        className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-600"}
      />
    ))}
    <span className="text-xs font-bold text-amber-400 ml-1">{rating}.0</span>
  </div>
);

const MentorReviews = () => {
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [filtered, setFiltered] = useState<SessionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | "5" | "4" | "3" | "low">("all");

  useEffect(() => { fetchReviews(); }, []);

  useEffect(() => {
    let result = reviews;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.mentorId?.name?.toLowerCase().includes(q) ||
        r.studentId?.name?.toLowerCase().includes(q) ||
        r.studentComment?.toLowerCase().includes(q)
      );
    }
    if (ratingFilter === "5")   result = result.filter(r => r.studentRating === 5);
    if (ratingFilter === "4")   result = result.filter(r => r.studentRating === 4);
    if (ratingFilter === "3")   result = result.filter(r => r.studentRating === 3);
    if (ratingFilter === "low") result = result.filter(r => r.studentRating <= 2);
    setFiltered(result);
  }, [search, ratingFilter, reviews]);

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/session-reviews");
      setReviews(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Summary stats
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.studentRating, 0) / reviews.length).toFixed(1)
    : "—";
  const fiveStars = reviews.filter(r => r.studentRating === 5).length;
  const lowRatings = reviews.filter(r => r.studentRating <= 2).length;

  // Per-mentor aggregation
  const mentorStats = reviews.reduce((acc: Record<string, { name: string; track?: string; total: number; sum: number }>, r) => {
    const id = r.mentorId?._id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { name: r.mentorId.name, track: r.mentorId.learningProfile?.skillTrack, total: 0, sum: 0 };
    acc[id].total++;
    acc[id].sum += r.studentRating;
    return acc;
  }, {});

  const topMentors = Object.values(mentorStats)
    .map(m => ({ ...m, avg: m.sum / m.total }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentor Session Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">Student ratings from completed mentor sessions</p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews",  value: reviews.length,  color: "text-blue-400",    bg: "bg-blue-500/10" },
          { label: "Avg Rating",     value: `${avgRating}★`, color: "text-amber-400",   bg: "bg-amber-500/10" },
          { label: "5-Star Reviews", value: fiveStars,       color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Low Ratings",    value: lowRatings,      color: "text-red-400",     bg: "bg-red-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <Star size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Mentors */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Top Rated Mentors
          </h3>
          {topMentors.length === 0 ? (
            <p className="text-slate-500 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topMentors.map((m, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{m.name}</p>
                      {m.track && <p className="text-[10px] text-slate-500">{m.track}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-400">{m.avg.toFixed(1)}★</p>
                    <p className="text-[10px] text-slate-500">{m.total} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search mentor, student, or comment..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value as any)}
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
              Loading reviews...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400">
                {reviews.length === 0
                  ? "No session reviews yet. Reviews appear after students rate completed sessions."
                  : "No reviews match your search."}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-none">
              {filtered.map((r, i) => (
                <div key={r._id || i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {r.mentorId?.name?.[0]?.toUpperCase() || "M"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{r.mentorId?.name}</p>
                        {r.mentorId?.learningProfile?.skillTrack && (
                          <p className="text-xs text-slate-500">{r.mentorId.learningProfile.skillTrack}</p>
                        )}
                      </div>
                    </div>
                    <StarRating rating={r.studentRating} />
                  </div>

                  {r.studentComment && (
                    <p className="text-sm text-slate-300 italic mb-3">"{r.studentComment}"</p>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
                    <span>By <span className="text-slate-300 font-medium">{r.studentId?.name}</span></span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(r.date).toLocaleDateString()}
                    </span>
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

export default MentorReviews;
