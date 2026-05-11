import { useEffect, useState } from "react";
import { FileCheck, AlertCircle, Search, RefreshCw, Trophy, Clock } from "lucide-react";
import api from "@/services/api";

interface GradeRecord {
  student:          { _id: string; name: string; email: string };
  course:           { _id: string; title: string };
  level:            string;
  score:            number;
  isCompleted:      boolean;
  completedLessons: number;
  lastUpdated:      string;
}

const statusOf = (score: number, completed: boolean) => {
  if (score >= 80 && completed) return { label: "Level Unlocked", cls: "bg-emerald-500/10 text-emerald-400" };
  if (score >= 80)              return { label: "Passed",         cls: "bg-blue-500/10 text-blue-400" };
  if (score >= 60)              return { label: "Needs Work",     cls: "bg-amber-500/10 text-amber-400" };
  return                               { label: "Failed",         cls: "bg-red-500/10 text-red-400" };
};

const AdminAssignments = () => {
  const [records, setRecords]   = useState<GradeRecord[]>([]);
  const [filtered, setFiltered] = useState<GradeRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"pass"|"fail"|"unlocked">("all");

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let r = records;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.student?.name?.toLowerCase().includes(q) ||
        x.course?.title?.toLowerCase().includes(q) ||
        x.level?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "pass")     r = r.filter(x => x.score >= 80);
    if (statusFilter === "fail")     r = r.filter(x => x.score < 80);
    if (statusFilter === "unlocked") r = r.filter(x => x.isCompleted);
    setFiltered(r);
  }, [search, statusFilter, records]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/grades");
      setRecords(res.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load assignment data");
    } finally { setLoading(false); }
  };

  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assignment & Quiz Results</h1>
          <p className="text-slate-400 text-sm mt-1">Level quiz scores submitted by students across all courses</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: records.length,                                    color: "text-blue-400" },
          { label: "Avg Score",         value: `${avgScore}%`,                                    color: "text-yellow-400" },
          { label: "Passed (≥80%)",     value: records.filter(r => r.score >= 80).length,         color: "text-emerald-400" },
          { label: "Levels Unlocked",   value: records.filter(r => r.isCompleted).length,         color: "text-purple-400" },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student, course, or level..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50" />
        </div>
        <div className="flex gap-2">
          {(["all","pass","fail","unlocked"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${statusFilter === f ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"}`}>
              {f === "all" ? "All" : f === "pass" ? "Passed" : f === "fail" ? "Failed" : "Unlocked"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {/* Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <tr>
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Course</th>
              <th className="px-5 py-4">Level / Quiz</th>
              <th className="px-5 py-4">Score</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading submissions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  {records.length === 0
                    ? "No quiz submissions yet. Students need to complete level quizzes."
                    : "No records match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => {
                const st = statusOf(r.score, r.isCompleted);
                const scoreColor = r.score >= 90 ? "text-indigo-400" : r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-yellow-400" : "text-red-400";
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {r.student?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{r.student?.name}</p>
                          <p className="text-xs text-slate-500">{r.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{r.course?.title || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{r.level}</td>
                    <td className="px-5 py-4">
                      <span className={`text-lg font-bold ${scoreColor}`}>{r.score}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${st.cls}`}>
                        {r.score >= 80 ? <FileCheck size={12} /> : <AlertCircle size={12} />}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={11} /> {r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600 text-right">Showing {filtered.length} of {records.length} records</p>
    </div>
  );
};

export default AdminAssignments;
