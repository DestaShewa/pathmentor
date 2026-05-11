import { useEffect, useState } from "react";
import { TrendingUp, Clock, Search, BookOpen, Zap, Award, RefreshCw } from "lucide-react";
import api from "@/services/api";

interface ProgressRecord {
  _id: string;
  student: { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  course: { _id: string; title: string };
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  xpEarned: number;
  completedLevels: number;
  lastUpdated: string;
}

const StudentProgress = () => {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [filtered, setFiltered] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    let result = records;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.student?.name?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q) ||
        r.course?.title?.toLowerCase().includes(q)
      );
    }
    if (filter === "high")   result = result.filter(r => r.progressPercent >= 70);
    if (filter === "medium") result = result.filter(r => r.progressPercent >= 30 && r.progressPercent < 70);
    if (filter === "low")    result = result.filter(r => r.progressPercent < 30);
    setFiltered(result);
  }, [search, filter, records]);

  const fetchProgress = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/students-progress");
      setRecords(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load progress data");
    } finally {
      setLoading(false);
    }
  };

  // Summary stats
  const avgProgress = records.length
    ? Math.round(records.reduce((s, r) => s + r.progressPercent, 0) / records.length)
    : 0;
  const totalXP = records.reduce((s, r) => s + r.xpEarned, 0);
  const highPerformers = records.filter(r => r.progressPercent >= 70).length;

  const getProgressColor = (pct: number) => {
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 30) return "bg-blue-500";
    return "bg-orange-500";
  };

  const getProgressBadge = (pct: number) => {
    if (pct >= 70) return "bg-emerald-500/10 text-emerald-400";
    if (pct >= 30) return "bg-blue-500/10 text-blue-400";
    return "bg-orange-500/10 text-orange-400";
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Progress Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time learning progress across all courses</p>
        </div>
        <button
          onClick={fetchProgress}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Enrollments", value: records.length, icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "High Performers", value: highPerformers, icon: Award, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or course..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "high", "medium", "low"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "high" ? "≥70%" : f === "medium" ? "30–70%" : "<30%"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Course</th>
              <th className="px-5 py-4">Progress</th>
              <th className="px-5 py-4">Lessons</th>
              <th className="px-5 py-4">XP</th>
              <th className="px-5 py-4">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading progress data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No progress records found.</td></tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {r.student?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{r.student?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{r.student?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-200">{r.course?.title || "—"}</p>
                    {r.student?.learningProfile?.skillTrack && (
                      <p className="text-xs text-slate-500">{r.student.learningProfile.skillTrack}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressColor(r.progressPercent)}`}
                          style={{ width: `${r.progressPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getProgressBadge(r.progressPercent)}`}>
                        {r.progressPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {r.completedLessons}/{r.totalLessons}
                    <span className="text-xs text-slate-500 ml-1">lessons</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-yellow-400">{r.xpEarned}</span>
                    <span className="text-xs text-slate-500 ml-1">XP</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString() : "—"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 text-right">
        Showing {filtered.length} of {records.length} records
      </p>
    </div>
  );
};

export default StudentProgress;
