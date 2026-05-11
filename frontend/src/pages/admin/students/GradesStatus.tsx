import { useEffect, useState } from "react";
import { Award, AlertCircle, CheckCircle2, Search, TrendingUp, RefreshCw } from "lucide-react";
import api from "@/services/api";

interface GradeRecord {
  student: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  level: string;
  score: number;
  isCompleted: boolean;
  completedLessons: number;
  lastUpdated: string;
}

const ScoreBadge = ({ score }: { score: number }) => {
  if (score >= 90) return <span className="text-lg font-bold text-indigo-400">{score}%</span>;
  if (score >= 80) return <span className="text-lg font-bold text-emerald-400">{score}%</span>;
  if (score >= 60) return <span className="text-lg font-bold text-yellow-400">{score}%</span>;
  return <span className="text-lg font-bold text-red-400">{score}%</span>;
};

const GradesStatus = () => {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [filtered, setFiltered] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pass" | "fail" | "perfect">("all");

  useEffect(() => { fetchGrades(); }, []);

  useEffect(() => {
    let result = grades;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.student?.name?.toLowerCase().includes(q) ||
        r.course?.title?.toLowerCase().includes(q) ||
        r.level?.toLowerCase().includes(q)
      );
    }
    if (filter === "pass")    result = result.filter(r => r.score >= 80);
    if (filter === "fail")    result = result.filter(r => r.score < 80);
    if (filter === "perfect") result = result.filter(r => r.score === 100);
    setFiltered(result);
  }, [search, filter, grades]);

  const fetchGrades = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/grades");
      setGrades(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  // Summary stats
  const avgScore = grades.length
    ? Math.round(grades.reduce((s, r) => s + r.score, 0) / grades.length)
    : 0;
  const passCount   = grades.filter(r => r.score >= 80).length;
  const failCount   = grades.filter(r => r.score < 80).length;
  const perfectCount = grades.filter(r => r.score === 100).length;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Grades & Quiz Scores</h1>
          <p className="text-slate-400 text-sm mt-1">Level quiz results across all students and courses</p>
        </div>
        <button
          onClick={fetchGrades}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Score",     value: `${avgScore}%`,    color: "text-blue-400",    bg: "bg-blue-500/10",    icon: TrendingUp },
          { label: "Passed (≥80%)", value: passCount,         color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
          { label: "Needs Work",    value: failCount,         color: "text-orange-400",  bg: "bg-orange-500/10",  icon: AlertCircle },
          { label: "Perfect 100%", value: perfectCount,      color: "text-indigo-400",  bg: "bg-indigo-500/10",  icon: Award },
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
            placeholder="Search student, course, or level..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pass", "fail", "perfect"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "pass" ? "Passed" : f === "fail" ? "Failed" : "Perfect"}
            </button>
          ))}
        </div>
      </div>

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
              <th className="px-5 py-4">Level</th>
              <th className="px-5 py-4">Score</th>
              <th className="px-5 py-4">Result</th>
              <th className="px-5 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Loading grades...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  {grades.length === 0
                    ? "No quiz scores recorded yet. Students need to complete level quizzes."
                    : "No records match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
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
                  <td className="px-5 py-4 text-sm text-slate-300">{r.course?.title || "—"}</td>
                  <td className="px-5 py-4 text-sm text-slate-400">{r.level}</td>
                  <td className="px-5 py-4"><ScoreBadge score={r.score} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {r.score >= 80 ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-400">
                            {r.isCompleted ? "Level Unlocked" : "Pass"}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-orange-500" />
                          <span className="text-xs font-bold text-orange-400">Needs 80%</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {r.lastUpdated ? new Date(r.lastUpdated).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-600 text-right">
        Showing {filtered.length} of {grades.length} grade records
      </p>
    </div>
  );
};

export default GradesStatus;
