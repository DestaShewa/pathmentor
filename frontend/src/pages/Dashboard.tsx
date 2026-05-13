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
  User, Calendar, MessageSquare, Loader2
} from "lucide-react";
import aiService from "@/services/aiService";

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
  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

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
          lesson_length: userData.learningProfile.commitmentTime || "1h",
          content_priority: "Mixed",
          project_recommendation: "",
          commitment_time: userData.learningProfile.commitmentTime || "1h",
          learning_goal: userData.learningProfile.learningGoal || "",
          learning_style: userData.learningProfile.learningStyle || "Visual",
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
                <WelcomeSection userName={userName} personaType={preferences?.persona_type} />

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

                  {/* ── AI Career Planner ── */}
                  <GlassCard className="p-6">
                    <h3 className="font-bold flex items-center gap-2 text-primary mb-4">
                      <Sparkles size={18} /> AI Career Planner
                    </h3>
                    {!aiRecommendation && !loadingAi ? (
                      <div className={"text-center py-4"}>
                        <p className="text-sm text-muted-foreground mb-4">Get a personalized learning roadmap and project ideas based on your track.</p>
                        <GlassButton variant="primary" onClick={handleGetRecommendation}>Generate Recommendations</GlassButton>
                      </div>
                    ) : loadingAi ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Building your dynamic roadmap...</p>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm text-white/90 leading-relaxed max-h-64 overflow-y-auto pr-2 custom-[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                        {aiRecommendation}
                      </div>
                    )}
                  </GlassCard>

                  <div className="grid lg:grid-cols-2 gap-8">
                    <RoadmapSnapshot currentStage={1} />
                    <SkillGrowthChart />
                  </div>
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