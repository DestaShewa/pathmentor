import { useEffect, useState } from "react";
import { MessageSquare, Search, RefreshCw, Activity, Bell, Quote, Trash2, Filter } from "lucide-react";
import api from "@/services/api";

interface ActivityItem {
  _id: string;
  user?: { name: string; email: string; role?: string };
  type: string;
  message: string;
  createdAt: string;
}

const typeColor: Record<string, string> = {
  USER_REGISTERED:  "bg-blue-500/20 text-blue-400",
  MENTOR_APPROVED:  "bg-emerald-500/20 text-emerald-400",
  LESSON_CREATED:   "bg-purple-500/20 text-purple-400",
  COURSE_CREATED:   "bg-cyan-500/20 text-cyan-400",
  SESSION_BOOKED:   "bg-orange-500/20 text-orange-400",
  SESSION_COMPLETED:"bg-green-500/20 text-green-400",
  QUIZ_SUBMITTED:   "bg-yellow-500/20 text-yellow-400",
};

const AllFeedback = () => {
  const [items, setItems]       = useState<ActivityItem[]>([]);
  const [filtered, setFiltered] = useState<ActivityItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  useEffect(() => { fetchData(1); }, []);

  useEffect(() => {
    let r = items;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.message?.toLowerCase().includes(q) || x.user?.name?.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") r = r.filter(x => x.type === typeFilter);
    setFiltered(r);
  }, [search, typeFilter, items]);

  const fetchData = async (p = 1) => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/activities/all", { params: { page: p, limit: 20 } });
      setItems(res.data.activities || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
      setPage(res.data.page || 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load activity feed");
    } finally { setLoading(false); }
  };

  const uniqueTypes = [...new Set(items.map(i => i.type))];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Activity Feed</h1>
          <p className="text-slate-500 text-sm">{total} total events recorded on the platform</p>
        </div>
        <button onClick={() => fetchData(1)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search message or user..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none">
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center text-slate-400">Loading activity...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
          <Activity size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No activity records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const colorCls = typeColor[item.type] || "bg-slate-700/30 text-slate-400";
            return (
              <div key={item._id || i} className="p-5 bg-slate-900/40 border border-white/10 rounded-2xl backdrop-blur-xl relative group hover:border-white/20 transition-all">
                <Quote className="absolute right-5 top-5 text-white/5" size={36} />
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                      {item.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.user?.name || "System"}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {item.user?.email || "—"} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${colorCls}`}>
                    {item.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed relative z-10">{item.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => fetchData(page - 1)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all">
              ← Prev
            </button>
            <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10 transition-all">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllFeedback;
