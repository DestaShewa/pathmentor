import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ArrowLeft, Users, BookOpen, Trophy, TrendingUp, Zap, Target, BarChart3, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import aiService from "@/services/aiService";

interface AnalysisData {
  stats: {
    totalStudents: number;
    totalLessons: number;
    totalLevels: number;
    avgProgress: number;
    avgScore: number;
    completionRate: number;
    totalXP: number;
  };
  weeklyData: { day: string; count: number }[];
}

const CourseAnalysis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [id, navigate]);

  useEffect(() => { if (data) drawChart(); }, [data]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [profileRes, courseRes, analysisRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/mentor/course/${id}`),
        api.get(`/mentor/course/${id}/analysis`)
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setCourse(courseRes.data.course);
      setData(analysisRes.data);
      setData(analysisRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load analytics");
    } finally { setLoading(false); }
  };



  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.parentElement?.clientWidth || 500;
    const H = canvas.height = 160;
    const chartData = data.weeklyData;
    const maxVal = Math.max(...chartData.map(d => d.count), 1);
    const padL = 30, padB = 28, padT = 8, padR = 8;
    const cW = W - padL - padR, cH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Grid
    for (let i = 0; i <= 3; i++) {
      const y = padT + cH - (i / 3) * cH;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    const pts = chartData.map((d, i) => ({
      x: padL + (i / (chartData.length - 1)) * cW,
      y: padT + cH - (d.count / maxVal) * cH
    }));

    // Fill
    const grad = ctx.createLinearGradient(0, padT, 0, padT + cH);
    grad.addColorStop(0, "rgba(51,182,255,0.3)");
    grad.addColorStop(1, "rgba(51,182,255,0)");
    ctx.beginPath();
    ctx.moveTo(pts[0].x, padT + cH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padT + cH);
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = "#33b6ff"; ctx.lineWidth = 2.5; ctx.stroke();

    // Dots + labels
    pts.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#33b6ff"; ctx.fill();
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.font = "10px Inter"; ctx.textAlign = "center";
      ctx.fillText(chartData[i].day, p.x, H - 6);
    });
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const health = !data ? "—" :
    data.stats.avgProgress >= 70 ? "Excellent 🚀" :
      data.stats.avgProgress >= 40 ? "Good 👍" : "Needs Attention ⚠️";

  const healthColor = !data ? "" :
    data.stats.avgProgress >= 70 ? "text-emerald-400" :
      data.stats.avgProgress >= 40 ? "text-blue-400" : "text-orange-400";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <GlassButton variant="ghost" size="sm" onClick={() => navigate("/mentor/classes")} className="mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Classes
        </GlassButton>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        {course && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-extrabold">{course.title} <span className="text-primary">Analytics</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time performance data for your course</p>
          </motion.div>
        )}

        {data && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Users, label: "Enrolled", value: data.stats.totalStudents, color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: TrendingUp, label: "Avg Progress", value: `${data.stats.avgProgress}%`, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { icon: Trophy, label: "Avg Quiz Score", value: `${data.stats.avgScore}%`, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                { icon: CheckCircle2, label: "Completion", value: `${data.stats.completionRate}%`, color: "text-purple-400", bg: "bg-purple-500/10" },
                { icon: BookOpen, label: "Lessons", value: data.stats.totalLessons, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                { icon: Target, label: "Levels", value: data.stats.totalLevels, color: "text-pink-400", bg: "bg-pink-500/10" },
                { icon: Zap, label: "Total XP", value: data.stats.totalXP.toLocaleString(), color: "text-orange-400", bg: "bg-orange-500/10" },
                { icon: BarChart3, label: "Health", value: health, color: healthColor, bg: "bg-white/5" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-5">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon size={16} className={s.color} />
                    </div>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Chart + insights */}
            <div className="grid lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2 p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> New Enrollments — Last 7 Days
                </h3>
                <canvas ref={canvasRef} className="w-full" />
              </GlassCard>

              <GlassCard className="p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                  <Sparkles size={16} /> AI Course Assistant
                </h3>
                {[
                  { label: "Avg Progress", value: data.stats.avgProgress, max: 100, color: "bg-emerald-500" },
                  { label: "Avg Quiz Score", value: data.stats.avgScore, max: 100, color: "bg-yellow-500" },
                  { label: "Completion Rate", value: data.stats.completionRate, max: 100, color: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-bold text-white">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}


              </GlassCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CourseAnalysis;
