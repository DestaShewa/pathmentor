import { useEffect, useState } from "react";
import { ShieldAlert, Flag, RefreshCw, Activity, CheckCircle2, Clock, Search } from "lucide-react";
import api from "@/services/api";

interface ActivityItem {
  _id: string;
  user?: { name: string; email: string };
  type: string;
  message: string;
  createdAt: string;
}

// Map activity types to incident categories
const INCIDENT_TYPES = [
  "USER_REGISTERED", "MENTOR_APPROVED", "SESSION_BOOKED",
  "SESSION_COMPLETED", "LESSON_CREATED", "COURSE_CREATED", "QUIZ_SUBMITTED"
];

const typeIcon: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  USER_REGISTERED:   { icon: Activity,     color: "text-blue-400",    bg: "bg-blue-500/10",    label: "Registration" },
  MENTOR_APPROVED:   { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Approval" },
  SESSION_BOOKED:    { icon: Clock,        color: "text-orange-400",  bg: "bg-orange-500/10",  label: "Session" },
  SESSION_COMPLETED: { icon: CheckCircle2, color: "text-green-400",   bg: "bg-green-500/10",   label: "Completed" },
  LESSON_CREATED:    { icon: Flag,         color: "text-purple-400",  bg: "bg-purple-500/10",  label: "Content" },
  COURSE_CREATED:    { icon: Flag,         color: "text-cyan-400",    bg: "bg-cyan-500/10",    label: "Content" },
  QUIZ_SUBMITTED:    { icon: Activity,     color: "text-yellow-400",  bg: "bg-yellow-500/10",  label: "Quiz" },
};

const FeedbackReports = () => {
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
      const res = await api.get("/admin/activities/all", { params: { page: p, limit: 25 } });
      setItems(res.data.activities || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
      setPage(res.data.page || 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load reports");
    } finally { setLoading(false); }
  };

  const uniqueTypes = [...new Set(items.map(i => i.type))];

  // Summary counts
  const counts = items.reduce((acc: Record<string, number>, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl"><ShieldAlert size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Activity Reports</h1>
            <p className="text-slate-500 text-sm">{total} total platform events logged</p>
          </div>
        </div>
        <button onClick={() => fetchData(1)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Type summary cards */}
      {!loading && Object.keys(counts).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(counts).slice(0, 8).map(([type, count]) => {
            const meta = typeIcon[type] || { icon: Activity, color: "text-slate-400", bg: "bg-slate-700/30", label: type };
            const Icon = meta.icon;
            return (
              <button key={type} onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
                className={`p-4 rounded-2xl border text-left transition-all ${typeFilter === type ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                <div className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center mb-2`}>
                  <Icon size={15} className={meta.color} />
                </div>
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{meta.label}</p>
              </button>
            );
          })}
        </div>
      )}

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

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Message</th>
              <th className="px-5 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">Loading reports...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400">No records found.</td></tr>
            ) : (
              filtered.map((item, i) => {
                const meta = typeIcon[item.type] || { icon: Activity, color: "text-slate-400", bg: "bg-slate-700/30", label: item.type };
                const Icon = meta.icon;
                return (
                  <tr key={item._id || i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {item.user?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{item.user?.name || "System"}</p>
                          <p className="text-[10px] text-slate-500">{item.user?.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.bg} ${meta.color}`}>
                        <Icon size={10} /> {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300 max-w-xs truncate">{item.message}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => fetchData(page - 1)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10">← Prev</button>
            <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg disabled:opacity-40 hover:bg-white/10">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackReports;
