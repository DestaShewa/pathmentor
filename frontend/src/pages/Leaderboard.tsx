import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trophy, Zap, Medal, Crown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user: { _id: string; name: string; email: string };
  totalXP: number;
}

import { handleSidebarNav } from "@/lib/navHelper";

const rankColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const rankBg = ["bg-yellow-400/20", "bg-slate-300/20", "bg-amber-600/20"];
const rankIcons = [Crown, Medal, Medal];

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [yourXP, setYourXP] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [courses, setCourses] = useState<{ _id: string, title: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCourseId, setSelectedCourseId] = useState("All");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
    fetchFilterData();
  }, [navigate]);

  const fetchFilterData = async () => {
    try {
      const res = await api.get("/courses/categories");
      if (res.data.success) {
        setCategories(res.data.data.map((c: any) => c.name));
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch filter data:", err);
    }
  };

  const fetchData = async (cat?: string, courseId?: string) => {
    try {
      const params = new URLSearchParams();
      if (cat && cat !== "All") params.append("category", cat);
      if (courseId && courseId !== "All") params.append("courseId", courseId);

      const queryStr = params.toString() ? `?${params.toString()}` : "";

      const [profileRes, lbRes, xpRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/leaderboard${queryStr}`),
        api.get("/progress/xp")
      ]);
      setUser(profileRes.data.user);
      setLeaderboard(lbRes.data.leaderboard || []);
      setYourRank(lbRes.data.yourRank);
      setYourXP(xpRes.data.totalXP || 0);
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedCourseId("All"); // Reset course when category changes
    setLoading(true);
    fetchData(cat, "All");
  };

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id);
    setSelectedCategory("All"); // Reset category when specific course chosen
    setLoading(true);
    fetchData("All", id);
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} activeView="leaderboard" onViewChange={(v) => handleSidebarNav(v, navigate)} />
      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center"><Trophy className="w-5 h-5 text-yellow-400" /></div>
              <h1 className="text-3xl font-bold">Leaderboard</h1>
            </div>
            <p className="text-muted-foreground">Top learners ranked by XP earned</p>
          </motion.div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => handleCategoryChange("All")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedCategory === "All" && selectedCourseId === "All"
                    ? "bg-primary text-black"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                    selectedCategory === cat
                      ? "bg-primary text-black"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Course Dropdown */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
              >
                <option value="All" className="bg-background text-white">Filter by Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id} className="bg-background text-white font-medium">
                    {course.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <GlassCard className="p-6 border-primary/30">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Position</p><p className="text-4xl font-bold text-primary">#{yourRank || "—"}</p></div>
              <div className="text-right"><p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your XP</p><div className="flex items-center gap-2 justify-end"><Zap className="w-5 h-5 text-yellow-400" /><p className="text-4xl font-bold text-yellow-400">{yourXP.toLocaleString()}</p></div></div>
            </div>
          </GlassCard>

          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, i) => {
                const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const heights = ["h-28", "h-36", "h-24"];
                const Icon = rankIcons[actualRank - 1];
                return (
                  <div key={entry.rank} className={`flex flex-col items-center justify-end ${heights[i]}`}>
                    <div className={`w-12 h-12 rounded-2xl ${rankBg[actualRank - 1]} flex items-center justify-center mb-2`}><Icon className={`w-6 h-6 ${rankColors[actualRank - 1]}`} /></div>
                    <p className="text-sm font-bold truncate max-w-full px-1 text-center">{entry.user?.name}</p>
                    <p className={`text-xs font-bold ${rankColors[actualRank - 1]}`}>{entry.totalXP} XP</p>
                    <div className={`w-full mt-2 rounded-t-xl ${rankBg[actualRank - 1]} border border-white/10 flex items-center justify-center py-2`}><span className={`text-lg font-black ${rankColors[actualRank - 1]}`}>#{actualRank}</span></div>
                  </div>
                );
              })}
            </div>
          )}

          <GlassCard className="overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground"><Trophy size={48} className="mx-auto mb-4 opacity-30" /><p>No leaderboard data yet. Complete lessons to earn XP!</p></div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry, idx) => {
                  const isYou = entry.user?._id === user?._id;
                  const Icon = idx < 3 ? rankIcons[idx] : null;
                  return (
                    <motion.div key={entry.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className={`flex items-center gap-4 px-6 py-4 ${isYou ? "bg-primary/10" : "hover:bg-white/5"} transition-colors`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${idx < 3 ? rankBg[idx] : "bg-white/5"}`}>
                        {Icon ? <Icon className={`w-4 h-4 ${rankColors[idx]}`} /> : <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isYou ? "text-primary" : ""}`}>{entry.user?.name} {isYou && <span className="text-xs text-primary/70">(You)</span>}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0"><Zap className="w-4 h-4 text-yellow-400" /><span className="font-bold text-yellow-400">{entry.totalXP.toLocaleString()}</span><span className="text-xs text-muted-foreground">XP</span></div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Leaderboard;
