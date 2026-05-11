import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { Award, Star, Zap, Trophy, BookOpen, Target, TrendingUp, CheckCircle2 } from "lucide-react";

import { handleSidebarNav } from "@/lib/navHelper";

interface Achievement { _id: string; title: string; description: string; earnedAt: string; }

const achievementIcons: Record<string, any> = {
  "First Step": BookOpen, "Fast Learner": Zap, "Level Up": TrendingUp,
  "Level Master": Trophy, "High Performer": Star, "XP Starter": Zap,
  "Perfect Score": CheckCircle2, "Course Completed": Award,
};
const achievementColors: Record<string, string> = {
  "First Step": "text-blue-400 bg-blue-400/20", "Fast Learner": "text-yellow-400 bg-yellow-400/20",
  "Level Up": "text-green-400 bg-green-400/20", "Level Master": "text-purple-400 bg-purple-400/20",
  "High Performer": "text-orange-400 bg-orange-400/20", "XP Starter": "text-cyan-400 bg-cyan-400/20",
  "Perfect Score": "text-emerald-400 bg-emerald-400/20", "Course Completed": "text-primary bg-primary/20",
};

const Achievements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, achRes, xpRes, streakRes] = await Promise.all([
        api.get("/users/profile"), api.get("/progress/achievements"),
        api.get("/progress/xp"), api.get("/progress/streak")
      ]);
      setUser(profileRes.data.user);
      setAchievements(achRes.data.data || []);
      setXp(xpRes.data.totalXP || 0);
      setStreak(streakRes.data.streak || { current: 0, longest: 0 });
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} activeView="achievements" onViewChange={(v) => handleSidebarNav(v, navigate)} />
      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Award className="w-5 h-5 text-primary" /></div><h1 className="text-3xl font-bold">Achievements</h1></div>
            <p className="text-muted-foreground">Your badges and milestones</p>
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="p-5 text-center"><Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" /><p className="text-2xl font-bold">{achievements.length}</p><p className="text-xs text-muted-foreground">Badges Earned</p></GlassCard>
            <GlassCard className="p-5 text-center"><Zap className="w-8 h-8 text-cyan-400 mx-auto mb-2" /><p className="text-2xl font-bold">{xp.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total XP</p></GlassCard>
            <GlassCard className="p-5 text-center"><Target className="w-8 h-8 text-orange-400 mx-auto mb-2" /><p className="text-2xl font-bold">{streak.current}</p><p className="text-xs text-muted-foreground">Day Streak 🔥</p></GlassCard>
          </div>

          {streak.longest > 0 && (
            <GlassCard className="p-5 flex items-center justify-between">
              <div><p className="font-semibold">Study Streak</p><p className="text-sm text-muted-foreground">Keep studying daily to maintain your streak!</p></div>
              <div className="text-right"><p className="text-3xl font-black text-orange-400">{streak.current} 🔥</p><p className="text-xs text-muted-foreground">Best: {streak.longest} days</p></div>
            </GlassCard>
          )}

          <div>
            <h2 className="text-lg font-bold mb-4">Earned Badges</h2>
            {achievements.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground"><Award size={48} className="mx-auto mb-4 opacity-30" /><p>No achievements yet. Complete lessons to earn your first badge!</p></GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((ach, idx) => {
                  const Icon = achievementIcons[ach.title] || Award;
                  const colorClass = achievementColors[ach.title] || "text-primary bg-primary/20";
                  const parts = colorClass.split(" ");
                  return (
                    <motion.div key={ach._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }}>
                      <GlassCard className="p-5 flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${parts[1]}`}><Icon className={`w-6 h-6 ${parts[0]}`} /></div>
                        <div className="min-w-0"><p className="font-bold truncate">{ach.title}</p><p className="text-sm text-muted-foreground">{ach.description}</p><p className="text-xs text-muted-foreground/60 mt-1">{new Date(ach.earnedAt).toLocaleDateString()}</p></div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 text-muted-foreground">Locked Badges</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-40">
              {[{ title: "7-Day Study Streak", desc: "Study 7 days in a row" }, { title: "React Warrior", desc: "Complete the React track" }, { title: "Bug Fix Hero", desc: "Score 100% on 3 quizzes" }, { title: "HTML Beginner", desc: "Complete the HTML level" }]
                .filter(l => !achievements.find(a => a.title === l.title))
                .map((locked, idx) => (
                  <GlassCard key={idx} className="p-5 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0"><Award className="w-6 h-6 text-muted-foreground" /></div>
                    <div><p className="font-bold">{locked.title}</p><p className="text-sm text-muted-foreground">{locked.desc}</p></div>
                  </GlassCard>
                ))}
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Achievements;
