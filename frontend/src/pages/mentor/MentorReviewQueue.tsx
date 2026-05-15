import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Search,
  RefreshCw, Trophy, Clock, BookOpen, TrendingUp,
  FolderKanban, Star, ExternalLink, Sparkles, X
} from "lucide-react";

interface ReviewItem {
  type: "quiz" | "project";
  _id?: string; // for quiz
  projectId?: string;
  submissionId?: string;
  student: { _id: string; name: string; email: string };
  course:  { _id: string; title: string };
  level:   string;
  score:   number;
  status:  string;
  submittedAt: string;
  description?: string;
  link?: string;
  aiFeedback?: string;
}

const ScoreBadge = ({ score, type }: { score: number, type: string }) => {
  if (type === "project" && score === 0) return <span className="text-xs text-muted-foreground italic">Pending AI</span>;
  const cls = score >= 90 ? "text-indigo-400" : score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return <span className={`text-xl font-black ${cls}`}>{score}%</span>;
};

const MentorReviewQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser]         = useState<any>(null);
  const [items, setItems]       = useState<ReviewItem[]>([]);
  const [filtered, setFiltered] = useState<ReviewItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "quiz" | "project" | "needs_action">("all");
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Grading Modal State
  const [gradingItem, setGradingItem] = useState<ReviewItem | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    let r = items;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => 
        x.student?.name?.toLowerCase().includes(q) || 
        x.course?.title?.toLowerCase().includes(q) || 
        x.level?.toLowerCase().includes(q)
      );
    }
    if (filter === "quiz")     r = r.filter(x => x.type === "quiz");
    if (filter === "project")  r = r.filter(x => x.type === "project");
    if (filter === "needs_action") r = r.filter(x => x.type === "project" && x.status === "pending");
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

  const handleGrade = async (status: "reviewed" | "revision_needed" = "reviewed") => {
    if (!gradingItem || !gradingItem.projectId || !gradingItem.student._id) return;
    setGrading(true);
    try {
      await api.put(`/mentor/projects/${gradingItem.projectId}/grade/${gradingItem.student._id}`, {
        grade, feedback, status
      });
      toast({ title: status === "reviewed" ? "Project graded!" : "Revision requested" });
      setGradingItem(null); setGrade(""); setFeedback("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setGrading(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  const quizCount = items.filter(r => r.type === "quiz").length;
  const projectCount = items.filter(r => r.type === "project").length;
  const needsAction = items.filter(r => r.type === "project" && r.status === "pending").length;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">Unified <span className="text-primary">Grading Center</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Review quiz results and grade pending projects in one place</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white text-sm">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BookOpen,     label: "Quiz Results",      value: quizCount,    color: "text-blue-400" },
            { icon: FolderKanban, label: "Total Projects",    value: projectCount, color: "text-indigo-400" },
            { icon: Star,         label: "Needs Grading",    value: needsAction,  color: "text-yellow-400" },
            { icon: TrendingUp,   label: "Recent Activity",   value: items.length, color: "text-emerald-400" },
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
            {(["all","quiz","project","needs_action"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filter === f ? "bg-primary text-black" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"}`}>
                {f.replace("_", " ")}
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
              Quiz scores and project submissions will appear here automatically.
            </p>
          </GlassCard>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Item Type</th>
                  <th className="px-5 py-4">Title / Level</th>
                  <th className="px-5 py-4">Performance</th>
                  <th className="px-5 py-4">Actions</th>
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
                          <p className="text-[10px] text-muted-foreground">{item.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full w-fit ${item.type === 'quiz' ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {item.type === 'quiz' ? <BookOpen size={10} /> : <FolderKanban size={10} />}
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-foreground font-medium">{item.course?.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.level}</p>
                    </td>
                    <td className="px-5 py-4"><ScoreBadge score={item.score} type={item.type} /></td>
                    <td className="px-5 py-4">
                      {item.type === "project" ? (
                        <GlassButton 
                          variant="primary" 
                          size="sm" 
                          onClick={() => setGradingItem(item)}
                          className="h-8 px-3 text-[10px]"
                        >
                          <Star size={12} className="mr-1" /> Grade Project
                        </GlassButton>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-emerald-400" /> Auto-graded
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[10px] text-muted-foreground flex items-center gap-1 mt-3">
                      <Clock size={11} /> {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Unified Grading Modal */}
      <AnimatePresence>
        {gradingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md">
              <GlassCard className="p-6 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Star size={20} className="text-yellow-400" /> Grade Submission
                  </h2>
                  <button onClick={() => setGradingItem(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={18} /></button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-widest">Student</p>
                    <p className="text-sm font-bold">{gradingItem.student.name}</p>
                    <p className="text-xs text-muted-foreground">{gradingItem.course.title} · {gradingItem.level}</p>
                  </div>

                  {gradingItem.description && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                       <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-widest">Student Description</p>
                       <p className="text-sm italic text-foreground">"{gradingItem.description}"</p>
                    </div>
                  )}

                  {gradingItem.link && (
                    <a href={gradingItem.link} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-all">
                      <ExternalLink size={14} /> View Project Work
                    </a>
                  )}

                  {gradingItem.aiFeedback && (
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={12} className="text-emerald-400" />
                        <p className="text-[10px] font-bold uppercase text-emerald-400">AI Diagnostic Insight</p>
                      </div>
                      <p className="text-[11px] text-emerald-100/70 italic leading-relaxed">
                        "{gradingItem.aiFeedback}"
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Manual Grade (0 - 50) *
                    </label>
                    <div className="relative">
                      <input type="number" min="0" max="50" value={grade} onChange={e => setGrade(e.target.value)} 
                        placeholder="Points for quality \u0026 UI..."
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-lg font-bold" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">/ 50</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Feedback for Student</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
                      placeholder="Great work! Next time try to..."
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none text-sm" />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <GlassButton variant="primary" onClick={() => handleGrade("reviewed")} disabled={grading} className="flex-1">
                    {grading ? "Saving..." : "Submit Grade"}
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={() => handleGrade("revision_needed")} disabled={grading} className="flex-1">
                    Request Revision
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorReviewQueue;
