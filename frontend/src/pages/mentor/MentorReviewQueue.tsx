import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Search,
  RefreshCw, Trophy, Clock, BookOpen, TrendingUp
} from "lucide-react";

interface ReviewItem {
  student: { _id: string; name: string; email: string };
  course:  { _id: string; title: string };
  level:   string;
  score:   number;
  isCompleted: boolean;
  completedLessons: number;
  submittedAt: string;
}

const ScoreBadge = ({ score }: { score: number }) => {
  const cls = score >= 90 ? "text-indigo-400" : score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xl font-black ${cls}`}>{score}%</span>;
};

const MentorReviewQueue = () => {
  const navigate = useNavigate();
  const [user, setUser]         = useState<any>(null);
  const [items, setItems]       = useState<ReviewItem[]>([]);
  const [filtered, setFiltered] = useState<ReviewItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "pass" | "fail" | "unlocked">("all");
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    let r = items;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.student?.name?.toLowerCase().includes(q) || x.course?.title?.toLowerCase().includes(q) || x.level?.toLowerCase().includes(q));
    }
    if (filter === "pass")     r = r.filter(x => x.score >= 80);
    if (filter === "fail")     r = r.filter(x => x.score < 80);
    if (filter === "unlocked") r = r.filter(x => x.isCompleted);
    setFiltered(r);
  }, [search, filter, items]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [profileRes, queueRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/review-queue")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setItems(queueRes.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load review queue");
    } finally { setLoading(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  const avgScore = items.length ? Math.round(items.reduce((s, r) => s + r.score, 0) / items.length) : 0;
  const passCount = items.filter(r => r.score >= 80).length;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <GlassButton variant="ghost" size="sm" onClick={() => navigate("/mentor/dashboard")} className="mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </GlassButton>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Review <span className="text-primary">Queue</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Quiz scores from students in your courses</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white text-sm">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen,    label: "Total Submissions", value: items.length,  color: "text-blue-400" },
            { icon: TrendingUp,  label: "Avg Score",         value: `${avgScore}%`, color: "text-yellow-400" },
            { icon: CheckCircle2,label: "Passed (≥80%)",     value: passCount,     color: "text-emerald-400" },
            { icon: AlertCircle, label: "Needs Work",        value: items.length - passCount, color: "text-orange-400" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search student, course, or level..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            {(["all","pass","fail","unlocked"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filter === f ? "bg-primary text-black" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"}`}>
                {f === "all" ? "All" : f === "pass" ? "Passed" : f === "fail" ? "Failed" : "Unlocked"}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        {loading ? (
          <GlassCard className="p-12 text-center text-muted-foreground">Loading submissions...</GlassCard>
        ) : filtered.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-bold mb-2">
              {items.length === 0 ? "No Submissions Yet" : "No Matching Records"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {items.length === 0
                ? "Quiz scores will appear here once students complete level quizzes in your courses."
                : "Try adjusting your search or filter."}
            </p>
          </GlassCard>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Level / Quiz</th>
                  <th className="px-5 py-4">Score</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {item.student?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.student?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{item.course?.title}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{item.level}</td>
                    <td className="px-5 py-4"><ScoreBadge score={item.score} /></td>
                    <td className="px-5 py-4">
                      {item.score >= 80 ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={13} /> {item.isCompleted ? "Level Unlocked" : "Passed"}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                          <AlertCircle size={13} /> Needs 80%
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground/40 text-right mt-3">Showing {filtered.length} of {items.length} records</p>
      </main>
    </div>
  );
};

export default MentorReviewQueue;
