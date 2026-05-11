import { useEffect, useState } from "react";
import { Star, Search, RefreshCw, Calendar, User, MessageSquare } from "lucide-react";
import api from "@/services/api";

interface Review {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  mentorId:  { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  studentRating: number;
  studentComment?: string;
  summary?: string;
}

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={13} className={i <= n ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
    ))}
  </div>
);

const AdminReviews = () => {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [filtered, setFiltered] = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [starFilter, setStarFilter] = useState<"all"|"5"|"4"|"3"|"low">("all");

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    let r = reviews;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.mentorId?.name?.toLowerCase().includes(q) ||
        x.studentId?.name?.toLowerCase().includes(q) ||
        x.studentComment?.toLowerCase().includes(q)
      );
    }
    if (starFilter === "5")   r = r.filter(x => x.studentRating === 5);
    if (starFilter === "4")   r = r.filter(x => x.studentRating === 4);
    if (starFilter === "3")   r = r.filter(x => x.studentRating === 3);
    if (starFilter === "low") r = r.filter(x => x.studentRating <= 2);
    setFiltered(r);
  }, [search, starFilter, reviews]);

  const fetch = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/session-reviews");
      setReviews(res.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load reviews");
    } finally { setLoading(false); }
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.studentRating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Session Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">
            Student ratings from completed mentor sessions · Avg: <span className="text-amber-400 font-bold">{avg}★</span>
          </p>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Reviews", value: reviews.length },
          { label: "5-Star",        value: reviews.filter(r => r.studentRating === 5).length },
          { label: "4-Star",        value: reviews.filter(r => r.studentRating === 4).length },
          { label: "Low (≤2)",      value: reviews.filter(r => r.studentRating <= 2).length },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search mentor, student, comment..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
        </div>
        <div className="flex gap-2">
          {(["all","5","4","3","low"] as const).map(f => (
            <button key={f} onClick={() => setStarFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${starFilter === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"}`}>
              {f === "all" ? "All" : f === "low" ? "≤2★" : `${f}★`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {/* Reviews */}
      {loading ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center text-slate-400">Loading reviews...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">
            {reviews.length === 0
              ? "No session reviews yet. Students rate sessions after they are completed."
              : "No reviews match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <div key={r._id || i} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {r.mentorId?.name?.[0]?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{r.mentorId?.name}</p>
                    <p className="text-xs text-slate-500">{r.mentorId?.learningProfile?.skillTrack || "Mentor"}</p>
                  </div>
                </div>
                <Stars n={r.studentRating} />
              </div>
              {r.studentComment && (
                <p className="text-sm text-slate-300 italic mb-3">"{r.studentComment}"</p>
              )}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-white/5">
                <span className="flex items-center gap-1"><User size={11} /> {r.studentId?.name}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(r.date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-600 text-right">Showing {filtered.length} of {reviews.length}</p>
    </div>
  );
};

export default AdminReviews;
