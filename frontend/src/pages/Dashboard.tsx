import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { initSocket, disconnectSocket } from "@/services/socket";
import { PersonaType } from "@/lib/registrationTypes";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { ProgressHeroCard } from "@/components/dashboard/ProgressHeroCard";
import { SkillGrowthChart } from "@/components/dashboard/SkillGrowthChart";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RoadmapSnapshot } from "@/components/dashboard/RoadmapSnapshot";
import { AIMentorOrb } from "@/components/dashboard/AIMentorOrb";
import { DailyMotivation } from "@/components/dashboard/DailyMotivation";
import { WeeklyGrowthReport } from "@/components/dashboard/WeeklyGrowthReport";
import { SmartReminder } from "@/components/dashboard/SmartReminder";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  ArrowRight, Sparkles, CheckCircle2, Moon, Sun,
  Bell, Shield, Monitor, PlayCircle, BookOpen, Clock, Star,
  User, Calendar, MessageSquare, Loader2, Brain, Trophy, Layers,
  TrendingUp, AlertTriangle, Lightbulb, Compass, Rocket
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell 
} from "recharts";
import aiService from "@/services/aiService";

// ─── AI SKILL GAP ANALYSIS COMPONENT ──────────────────────────────────────────
const SkillGapAnalysis = ({ data, onReanalyze, isLoading }: { data: any, onReanalyze: () => void, isLoading: boolean }) => {
  if (!data && !isLoading) return null;

  return (
    <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Brain size={150} className="text-primary" />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
              <Brain className="text-primary" /> AI Skill Gap Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Intelligent assessment of your learning progress and weak areas.</p>
          </div>
          <GlassButton 
            variant="primary" 
            size="sm" 
            onClick={onReanalyze} 
            disabled={isLoading}
            className="shrink-0"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
            {isLoading ? "Analyzing..." : "Re-analyze Progress"}
          </GlassButton>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
               <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
               <Brain className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
            </div>
            <p className="text-primary font-bold animate-pulse text-sm">Deeply analyzing your learning patterns...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Visualization & Stats */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {[
                   { label: "XP Earned", value: data.rawStats?.xp || 0, icon: Star, color: "text-amber-400" },
                   { label: "Lessons", value: data.rawStats?.lessonCount || 0, icon: BookOpen, color: "text-blue-400" },
                   { label: "Study Time", value: `${data.rawStats?.studyHours || 0}h`, icon: Clock, color: "text-green-400" },
                   { label: "Completion", value: `${data.rawStats?.completion || 0}%`, icon: TrendingUp, color: "text-primary" },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                     <stat.icon className={`${stat.color} mb-2`} size={18} />
                     <p className="text-xl font-black">{stat.value}</p>
                     <p className="text-[10px] font-bold uppercase text-muted-foreground">{stat.label}</p>
                   </div>
                 ))}
              </div>

              <div className="h-[250px] w-full bg-white/5 rounded-3xl p-6 border border-white/10">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                   <TrendingUp size={14} /> Performance Insights
                 </h4>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Mon', xp: 20 }, { name: 'Tue', xp: 45 }, { name: 'Wed', xp: 30 },
                      { name: 'Thu', xp: 70 }, { name: 'Fri', xp: 50 }, { name: 'Sat', xp: 90 },
                      { name: 'Sun', xp: data.rawStats?.xp % 100 || 60 }
                    ]}>
                      <defs>
                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#0D9488' }}
                      />
                      <Area type="monotone" dataKey="xp" stroke="#0D9488" fillOpacity={1} fill="url(#colorXp)" strokeWidth={3} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </div>

            {/* Right: AI Insights */}
            <div className="space-y-4">
              <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-green-400 mb-3 flex items-center gap-2">
                   <CheckCircle2 size={12} /> Key Strengths
                 </h4>
                 <ul className="space-y-2">
                    {data.data?.strengths?.map((s: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 opacity-90">
                        <span className="text-green-400">•</span> {s}
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
                   <AlertTriangle size={12} /> Weak Areas
                 </h4>
                 <ul className="space-y-2">
                    {data.data?.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 opacity-90">
                        <span className="text-red-400">•</span> {w}
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                   <Lightbulb size={12} /> Study Strategy
                 </h4>
                 <p className="text-xs leading-relaxed opacity-90 italic">
                   "{data.data?.insights?.strategy}"
                 </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && data && (
          <div className="pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Compass size={14} /> Next Topics to Focus
                </h4>
                <div className="space-y-3">
                   {data.data?.nextTopics?.map((topic: any, i: number) => (
                     <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                          <Rocket size={14} className="text-primary group-hover:text-black" />
                        </div>
                        <div>
                           <p className="text-xs font-bold">{topic.title}</p>
                           <p className="text-[10px] text-muted-foreground">{topic.reason}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles size={14} /> Personalized Advice
                </h4>
                <div className="flex flex-col gap-3">
                   {data.data?.recommendations?.map((rec: string, i: number) => (
                     <div key={i} className="text-xs p-3 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        {rec}
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

interface UserPreferences {
  skill_track: string;
  experience_level: string;
  persona_type: PersonaType;
  starting_stage: string;
  lesson_length: string;
  content_priority: string;
  project_recommendation: string;
  commitment_time: string;
  learning_goal: string;
  learning_style: string;
}

interface RecommendedLesson {
  id: string;
  lesson_title: string;
  lesson_category: string;
  match_score: number;
  is_completed: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assignedMentor, setAssignedMentor] = useState<any>(null);
  

  // Real course progress state
  const [courseProgress, setCourseProgress] = useState<{
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    xpEarned: number;
  } | null>(null);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loadingAi, setLoadingAi] = useState(false);
  const [skillGapData, setSkillGapData] = useState<any>(null);
  const [loadingSkillGap, setLoadingSkillGap] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    initSocket();
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const res = await api.get("/users/profile");
      const userData = res.data.user;
      setUser(userData);

      if (userData.learningProfile) {
        setPreferences({
          skill_track: userData.learningProfile.skillTrack || "",
          experience_level: userData.learningProfile.experienceLevel || "",
          persona_type: userData.learningProfile.persona,
          starting_stage: userData.learningProfile.experienceLevel || "Beginner",
          lesson_length: (userData.learningProfile.commitmentTime || "1h").replace(/_/g, " "),
          content_priority: "Mixed",
          project_recommendation: "",
          commitment_time: userData.learningProfile.commitmentTime || "1h",
          learning_goal: userData.learningProfile.learningGoal || "",
          learning_style:(userData.learningProfile.learningStyle || "Visual").replace(/_/g, " "),
        });
      }

      // Fetch course progress if enrolled
      const courseId = userData.learningProfile?.course?.id;
      if (courseId) {
        try {
          const [progressRes, streakRes] = await Promise.all([
            api.get(`/progress/course/${courseId}`),
            api.get("/progress/streak"),
          ]);

          if (progressRes.data.success) {
            setCourseProgress(progressRes.data);
          } else {
            setCourseProgress({ totalLessons: 0, completedLessons: 0, progressPercentage: 0, xpEarned: 0 });
          }

          if (streakRes.data.success) {
            setStreak(streakRes.data.streak || { current: 0, longest: 0 });
          }
        } catch (progressErr) {
          console.log("Progress fetch failed (non-critical):", progressErr);
          setCourseProgress({ totalLessons: 0, completedLessons: 0, progressPercentage: 0, xpEarned: 0 });
        }
      } else {
        setCourseProgress(null);
      }

      // Fetch assigned mentor
      try {
        const mentorRes = await api.get("/users/my-mentor");
        if (mentorRes.data.success) {
          setAssignedMentor(mentorRes.data.mentor);
        }
      } catch (mentorErr) {
        console.log("Mentor fetch failed (non-critical):", mentorErr);
        setAssignedMentor(null);
      }

    } catch (err: any) {
      console.error("Profile fetch failed:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/auth");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchSkillGap = async () => {
    setLoadingSkillGap(true);
    try {
      const res = await aiService.getProgressSkillGap();
      if (res.success) {
        setSkillGapData(res);
      }
    } catch (err) {
      console.error("Skill gap analysis failed:", err);
    } finally {
      setLoadingSkillGap(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    disconnectSocket();
    navigate("/auth");
  };

  const handleGetRecommendation = async () => {
    setLoadingAi(true);
    try {
      const topic = preferences?.skill_track || enrolledCourse?.title || "Web Development";
      const res = await aiService.getRecommendation(topic);
      setAiRecommendation(res.suggestion || "Insights fetched!");
    } catch (e) {
      setAiRecommendation("Focus on completing your assigned lessons first, then practice building small projects to cement your understanding.");
    } finally {
      setLoadingAi(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background" />;

  const userName = user?.name || user?.username || "Learner";
  const userEmail = user?.email || "";
  const enrolledCourse = user?.learningProfile?.course;
  const courseId = enrolledCourse?.id;
  const courseTitle = enrolledCourse?.title || preferences?.skill_track || "Your Course";

  const totalLessons = courseProgress?.totalLessons ?? 0;
  const completedLessons = courseProgress?.completedLessons ?? 0;
  const progressPercent = courseProgress?.progressPercentage ?? 0;
  const newLessons: any[] = [];
  const finishedLessons: any[] = [];

  return (
    <div className={`min-h-screen relative ${isDarkMode ? "bg-background text-white" : "bg-slate-50 text-slate-900"}`}>
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={(view) => {
          // Dedicated pages — navigate away
          if (view === "lessons") { navigate("/lessons"); return; }
          if (view === "courses") { navigate("/courses"); return; }
          if (view === "leaderboard") { navigate("/leaderboard"); return; }
          if (view === "achievements") { navigate("/achievements"); return; }
          if (view === "announcements") { navigate("/announcements"); return; }
          if (view === "community") { navigate("/study-buddies"); return; }
          if (view === "sessions") { navigate("/sessions"); return; }
          if (view === "profile") { navigate("/profile"); return; }
          if (view === "settings") { navigate("/settings"); return; }
          if (view === "projects") { navigate("/projects"); return; }
          if (view === "progress") { navigate("/progress"); return; }
          if (view === "socialchat") { navigate("/social-chat"); return; }
          // In-page views (dashboard)
          setActiveView(view);
        }}
        pendingMode={user?.status === 'pending'}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <AnimatePresence mode="wait">

            {/* --- DASHBOARD VIEW --- */}
            {activeView === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <WelcomeSection 
                  userName={userName} 
                  personaType={user?.learningProfile?.personaType} 
                  customPersona={user?.learningProfile?.persona}
                />

                {/* Smart Reminder Banner */}
                <SmartReminder />

                <div className="space-y-8 mt-6">
                  <StatsGrid
                    inProgress={totalLessons - completedLessons}
                    completed={completedLessons}
                    dailyGoal={preferences?.lesson_length || "1h"}
                    learningStyle={preferences?.learning_style || "Visual"}
                    streak={streak.current}
                  />

                  {/* Daily Motivation + Weekly Growth Report */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <DailyMotivation />
                    <WeeklyGrowthReport />
                  </div>

                  <ProgressHeroCard
                    stage={courseTitle}
                    progressPercent={progressPercent}
                    totalLessons={totalLessons}
                    completedLessons={completedLessons}
                    onStartLearning={() => {
                      if (courseId) {
                        navigate("/lessons");
                      } else {
                        navigate("/courses");
                      }
                    }}
                  />

                  {/* ── Current Course Card ── */}
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <BookOpen size={18} className="text-primary" /> Current Course
                      </h3>
                      {enrolledCourse && (
                        <button
                          onClick={() => navigate("/lessons")}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <PlayCircle size={12} /> Continue Learning
                        </button>
                      )}
                    </div>

                    {enrolledCourse ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-black shrink-0">
                            {enrolledCourse.title?.[0]?.toUpperCase() || "C"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-lg truncate">{enrolledCourse.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {completedLessons} of {totalLessons} lessons completed
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-primary">{progressPercent}%</span>
                            </div>
                          </div>
                        </div>
                        <GlassButton
                          variant="primary"
                          className="w-full"
                          onClick={() => navigate("/lessons")}
                        >
                          <PlayCircle size={16} /> Continue Learning
                        </GlassButton>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                          <BookOpen size={24} className="opacity-40" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">No course enrolled</p>
                          <p className="text-sm">Browse and enroll in a course to start learning.</p>
                          <GlassButton
                            variant="secondary"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate("/courses")}
                          >
                            Browse Courses
                          </GlassButton>
                        </div>
                      </div>
                    )}
                  </GlassCard>

                  {/* ── Assigned Mentor Card ── */}
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <User size={18} className="text-primary" /> Your Mentor
                      </h3>
                      {assignedMentor && (
                        <button
                          onClick={() => navigate("/sessions")}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <Calendar size={12} /> Book Session
                        </button>
                      )}
                    </div>

                    {assignedMentor ? (
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-black shrink-0">
                          {assignedMentor.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">{assignedMentor.name}</p>
                          <p className="text-sm text-muted-foreground">{assignedMentor.skillTrack}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {assignedMentor.avgRating && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                                <Star size={11} fill="currentColor" /> {assignedMentor.avgRating} ({assignedMentor.reviewCount} reviews)
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {assignedMentor.studentCount}/20 students
                            </span>
                          </div>
                        </div>
                        <GlassButton variant="secondary" size="sm" onClick={() => navigate("/sessions")}>
                          <MessageSquare size={14} /> Message
                        </GlassButton>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                          <User size={24} className="opacity-40" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">No mentor assigned yet</p>
                          <p className="text-sm">A mentor will be assigned based on your skill track and level.</p>
                        </div>
                      </div>
                    )}
                  </GlassCard>

                  {/* ── AI Personalized Roadmap ── */}
                  <GlassCard className="p-6 border-primary/20 bg-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Sparkles size={120} className="text-primary" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Sparkles size={18} className="text-primary" /> AI Personalized Roadmap
                        </h3>
                        {user?.onboardingCompleted && (
                          <GlassButton 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => navigate("/onboarding-persona")}
                            className="text-[10px] h-7"
                          >
                            Reset Roadmap
                          </GlassButton>
                        )}
                      </div>

                      {user?.onboardingCompleted && user.learningProfile?.persona ? (
                        <div className="space-y-6">
                          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Your Learning Persona</p>
                              <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{user.learningProfile.persona}</h4>
                              <p className="text-primary font-bold text-sm mt-1">{user.learningProfile.tagline || "Visionary Learner"}</p>
                            </div>
                            <GlassButton 
                              variant="primary" 
                              size="sm" 
                              onClick={handleGetRecommendation}
                              disabled={loadingAi}
                              className="text-[10px] h-8 shrink-0"
                            >
                              {loadingAi ? <Loader2 size={12} className="animate-spin mr-2" /> : <Sparkles size={12} className="mr-2" />}
                              Get Weekly AI Insight
                            </GlassButton>
                          </div>

                          <div className="space-y-4">
                            <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3 leading-relaxed">
                              "{user.learningProfile.recommendation}"
                            </p>
                            
                            {aiRecommendation && (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-primary/20 border border-primary/30 rounded-2xl relative overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                  <Brain size={40} className="text-primary" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                                  <Lightbulb size={12} /> Fresh AI Recommendation
                                </p>
                                <p className="text-xs leading-relaxed font-medium">
                                  {aiRecommendation}
                                </p>
                              </motion.div>
                            )}
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Layers size={12} className="text-primary" /> Roadmap Focus
                              </p>
                              <div className="space-y-2">
                                {user.learningProfile.roadmap && Object.entries(user.learningProfile.roadmap).slice(0, 3).map(([key, value]: [string, any], i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-[11px] bg-white/5 p-2 rounded-xl border border-white/5">
                                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center font-bold">
                                      {i + 1}
                                    </span>
                                    <span className="truncate opacity-80">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Trophy size={12} className="text-primary" /> Core Projects
                              </p>
                              <div className="space-y-2">
                                {user.learningProfile.projects?.slice(0, 3).map((project: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-[11px] bg-white/5 p-2 rounded-xl border border-white/5">
                                    <CheckCircle2 size={10} className="text-primary" />
                                    <span className="truncate opacity-80">{typeof project === 'string' ? project : project.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                              <BookOpen size={12} /> Top Recommended Lessons
                            </p>
                            <div className="space-y-2">
                               {user.learningProfile.firstLessons?.slice(0, 2).map((lesson: any, i: number) => (
                                 <div key={i} className="flex items-center justify-between group cursor-pointer" onClick={() => navigate("/lessons")}>
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold group-hover:bg-primary group-hover:text-black transition-colors">{i+1}</div>
                                      <p className="text-xs font-medium group-hover:text-primary transition-colors">{lesson.title}</p>
                                   </div>
                                   <span className="text-[10px] font-bold text-primary">{lesson.matchScore}% Match</span>
                                 </div>
                               ))}
                            </div>
                            <GlassButton variant="primary" size="sm" className="w-full mt-1" onClick={() => navigate("/lessons")}>
                              Start Learning Now
                            </GlassButton>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-dashed border-primary/30">
                            <Brain className="w-8 h-8 text-primary/40" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-lg">Build Your AI-Powered Roadmap</h4>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                              Take a 2-minute survey about your goals and vision to unlock a perfectly tailored master's path.
                            </p>
                          </div>
                          <GlassButton 
                            variant="primary" 
                            glow 
                            onClick={() => navigate("/onboarding-persona")}
                            className="px-8"
                          >
                            Start Personalization <ArrowRight size={16} className="ml-2" />
                          </GlassButton>
                        </div>
                      )}
                    </div>
                  </GlassCard>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <RoadmapSnapshot currentStage={1} />
                    <SkillGrowthChart />
                  </div>

                  {/* AI Skill Gap Analysis Section */}
                  <SkillGapAnalysis 
                    data={skillGapData} 
                    isLoading={loadingSkillGap} 
                    onReanalyze={handleFetchSkillGap} 
                  />
                  
                  {!skillGapData && !loadingSkillGap && (
                    <GlassCard className="p-12 text-center border-dashed border-primary/30 bg-primary/5">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <TrendingUp size={32} className="text-primary/60" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Unlock Your Skill Gap Analysis</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
                        Get a deep dive into your learning patterns, missing fundamentals, and personalized growth strategies.
                      </p>
                      <GlassButton variant="primary" glow onClick={handleFetchSkillGap}>
                        Generate Analysis <Sparkles size={16} className="ml-2" />
                      </GlassButton>
                    </GlassCard>
                  )}
                </div>
              </motion.div>
            )}

            {/* --- MY COURSES VIEW --- */}
            {activeView === "courses" && (
              <motion.div key="courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
                <h2 className="text-4xl font-bold">My Learning Path</h2>

                {/* Enrolled Course */}
                <div className="space-y-4">
                  <h3 className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <PlayCircle size={16} className="animate-pulse" /> Current Course
                  </h3>
                  {enrolledCourse ? (
                    <GlassCard className="p-8 border-primary/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BookOpen size={160} />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <h3 className="text-3xl font-bold">{courseTitle}</h3>
                        <p className="text-muted-foreground max-w-xl">
                          Continue your learning journey. You've completed {completedLessons} of {totalLessons} lessons ({progressPercent}%).
                        </p>
                        <GlassButton
                          className="px-8 py-6 text-lg group bg-primary text-black border-none hover:bg-primary/90"
                          onClick={() => navigate("/lessons")}
                        >
                          Continue Learning <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </GlassButton>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-8 text-center text-muted-foreground border-dashed">
                      <p className="mb-4">No course enrolled yet. Browse available courses to get started!</p>
                      <GlassButton variant="primary" onClick={() => navigate("/courses")}>
                        Browse Courses <ArrowRight size={16} />
                      </GlassButton>
                    </GlassCard>
                  )}
                </div>

                {/* Course Progress Stats */}
                {enrolledCourse && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <GlassCard className="p-5 text-center">
                      <p className="text-3xl font-bold text-primary">{completedLessons}</p>
                      <p className="text-sm text-muted-foreground mt-1">Lessons Completed</p>
                    </GlassCard>
                    <GlassCard className="p-5 text-center">
                      <p className="text-3xl font-bold text-yellow-400">{totalLessons - completedLessons}</p>
                      <p className="text-sm text-muted-foreground mt-1">Lessons Remaining</p>
                    </GlassCard>
                    <GlassCard className="p-5 text-center">
                      <p className="text-3xl font-bold text-green-400">{progressPercent}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Overall Progress</p>
                    </GlassCard>
                  </div>
                )}
              </motion.div>
            )}

            {/* --- PROGRESS VIEW --- */}
            {activeView === "progress" && (
              <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-1">Learning Progress</h2>
                  <p className="text-muted-foreground">Your weekly activity and skill growth</p>
                </div>
                <SkillGrowthChart />
                <ProgressHeroCard
                  stage={courseTitle}
                  progressPercent={progressPercent}
                  totalLessons={totalLessons}
                  completedLessons={completedLessons}
                  onStartLearning={() => {
                    if (courseId) {
                      navigate("/lessons");
                    } else {
                      navigate("/courses");
                    }
                  }}
                />
                <div className="grid sm:grid-cols-3 gap-4">
                  <GlassCard className="p-5 text-center">
                    <p className="text-3xl font-bold text-primary">{completedLessons}</p>
                    <p className="text-sm text-muted-foreground mt-1">Lessons Completed</p>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <p className="text-3xl font-bold text-yellow-400">{totalLessons - completedLessons}</p>
                    <p className="text-sm text-muted-foreground mt-1">Lessons Remaining</p>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <p className="text-3xl font-bold text-green-400">{progressPercent}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Overall Progress</p>
                  </GlassCard>
                </div>
              </motion.div>
            )}

            {/* --- PROJECTS VIEW --- */}
            {activeView === "projects" && (
              <motion.div key="projects" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-1">Projects</h2>
                    <p className="text-muted-foreground">Practical projects assigned by your mentor</p>
                  </div>
                  <GlassButton variant="primary" onClick={() => navigate("/projects")}>
                    View All Projects <ArrowRight size={16} />
                  </GlassButton>
                </div>
                <GlassCard className="p-8 text-center border-primary/20">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Star size={28} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Your Projects</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Your mentor assigns hands-on projects to help you apply what you've learned.
                    Submit your work and get graded feedback.
                  </p>
                  <GlassButton variant="primary" onClick={() => navigate("/projects")}>
                    Open Projects <ArrowRight size={16} />
                  </GlassButton>
                </GlassCard>
              </motion.div>
            )}

            {/* --- SETTINGS VIEW (UNTOUCHED) --- */}
            {activeView === "settings" && (
              <motion.div key="sett" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl space-y-8">
                <h2 className="text-3xl font-bold">Settings</h2>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Monitor size={20} className="text-primary" /> Appearance</h3>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-muted-foreground">Adjust the interface theme</p>
                      </div>
                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-14 h-7 rounded-full p-1 transition-colors ${isDarkMode ? "bg-primary" : "bg-slate-400"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isDarkMode ? "translate-x-7" : "translate-x-0"} flex items-center justify-center`}>
                          {isDarkMode ? <Moon size={12} className="text-primary" /> : <Sun size={12} className="text-orange-500" />}
                        </div>
                      </button>
                    </div>
                  </GlassCard>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Bell size={20} className="text-primary" /> Notifications</h3>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Get alerts for lesson reminders</p>
                      </div>
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={`w-14 h-7 rounded-full p-1 transition-colors ${notificationsEnabled ? "bg-primary" : "bg-slate-300"}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? "translate-x-7" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </GlassCard>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><Shield size={20} className="text-primary" /> Account Security</h3>
                  <GlassCard className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">Email: <span className="text-muted-foreground">{userEmail}</span></p>
                      <GlassButton variant="secondary" className="text-xs h-8">Change Password</GlassButton>
                    </div>
                  </GlassCard>
                </section>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <MobileBottomNav />
      <AIMentorOrb />
    </div>
  );
};

export default Dashboard;

function setAiRecommendation(arg0: any) {
  throw new Error("Function not implemented.");
}
