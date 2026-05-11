import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Lock, Star, ChevronDown, ChevronUp, Play, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { handleSidebarNav } from "@/lib/navHelper";

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  order: number;
}

interface Level {
  _id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  isUnlocked?: boolean;
  completedLessons?: number;
  score?: number;
}

const Roadmap = () => {
  const navigate = useNavigate();
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("My Learning Roadmap");
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const profileRes = await api.get("/users/profile");
      const userData = profileRes.data.user;
      setUser(userData);

      const courseId = userData.learningProfile?.course?.id;
      const title = userData.learningProfile?.course?.title;
      if (title) setCourseTitle(title + " — Roadmap");

      if (!courseId) { setLoading(false); return; }

      // Get roadmap (levels + lessons)
      const roadmapRes = await api.get(`/courses/${courseId}/roadmap`);
      const levelsData: Level[] = roadmapRes.data.levels || [];

      // Get unlock status + completed lessons
      try {
        const [unlockRes, progressRes] = await Promise.all([
          api.get(`/levels/${courseId}/unlock-status`),
          api.get(`/progress/course/${courseId}`)
        ]);

        const unlockMap = new Map(
          (unlockRes.data.levels || []).map((l: Level) => [l._id, l])
        );

        levelsData.forEach(lv => {
          const u = unlockMap.get(lv._id) as Level | undefined;
          lv.isUnlocked = u ? u.isUnlocked : lv.order === 1;
          lv.completedLessons = u?.completedLessons || 0;
          lv.score = u?.score || 0;
        });

        // Build set of completed lesson IDs from progress
        if (progressRes.data?.completedLessonIds) {
          setCompletedLessonIds(new Set(progressRes.data.completedLessonIds));
        }
      } catch {
        levelsData.forEach(lv => { lv.isUnlocked = lv.order === 1; });
      }

      setLevels(levelsData);

      // Auto-expand current (in-progress) level
      const currentLevel = levelsData.find(lv => {
        if (!lv.isUnlocked) return false;
        const total = lv.lessons?.length || 0;
        const done = lv.completedLessons || 0;
        return done < total;
      });
      if (currentLevel) setExpandedLevel(currentLevel._id);
      else {
        const firstUnlocked = levelsData.find(l => l.isUnlocked);
        if (firstUnlocked) setExpandedLevel(firstUnlocked._id);
      }
    } catch {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  const getLevelStatus = (level: Level): "completed" | "current" | "locked" => {
    if (!level.isUnlocked) return "locked";
    const total = level.lessons?.length || 0;
    const done = level.completedLessons || 0;
    if (total > 0 && done >= total) return "completed";
    return "current";
  };

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="roadmap"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Your Learning <span className="text-gradient">Roadmap</span>
            </h1>
            <p className="text-muted-foreground">
              {courseTitle} — Progress through 7 levels from Awareness to Mastery.
            </p>

            {/* Overall progress bar */}
            {levels.length > 0 && (() => {
              const totalLessons = levels.reduce((s, l) => s + (l.lessons?.length || 0), 0);
              const doneLessons = levels.reduce((s, l) => s + (l.completedLessons || 0), 0);
              const pct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
              return (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{doneLessons} of {totalLessons} lessons completed</span>
                    <span className="text-primary font-bold">{pct}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>

          {/* No course enrolled */}
          {levels.length === 0 && (
            <GlassCard className="p-12 text-center text-muted-foreground">
              <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No course enrolled yet</p>
              <p className="text-sm">Complete your onboarding to get a personalized roadmap.</p>
            </GlassCard>
          )}

          {/* Levels */}
          {levels.map((level, index) => {
            const status = getLevelStatus(level);
            const lessons = level.lessons || [];
            const completedCount = level.completedLessons || 0;
            const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
            const isExpanded = expandedLevel === level._id;

            return (
              <motion.div
                key={level._id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative mb-6"
              >
                {/* Connector line */}
                {index < levels.length - 1 && (
                  <div className="absolute left-8 top-full w-0.5 h-6 bg-gradient-to-b from-primary/40 to-transparent z-0" />
                )}

                <GlassCard
                  className={`overflow-hidden ${status === "locked" ? "opacity-50" : ""}`}
                  hover={status !== "locked"}
                >
                  {/* Level header */}
                  <div
                    className={`p-6 ${status !== "locked" ? "cursor-pointer" : "cursor-not-allowed"}`}
                    onClick={() => status !== "locked" && setExpandedLevel(isExpanded ? null : level._id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                        status === "completed" ? "bg-green-500/20 text-green-400"
                        : status === "current" ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {status === "completed" ? <Check className="w-8 h-8" />
                          : status === "locked" ? <Lock className="w-6 h-6" />
                          : <Star className="w-8 h-8" />}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm text-primary font-bold uppercase tracking-wider">Level {level.order}</span>
                          {status === "current" && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">In Progress</span>
                          )}
                          {status === "completed" && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">Complete</span>
                          )}
                          {level.score !== undefined && level.score > 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                              Quiz: {level.score}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-1">{level.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                          {status !== "locked" && ` · ${completedCount} completed`}
                        </p>

                        {/* Progress bar */}
                        {status !== "locked" && lessons.length > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{completedCount}/{lessons.length} lessons</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expand icon */}
                      {status !== "locked" && (
                        <div className="flex-shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded lessons */}
                  <AnimatePresence>
                    {isExpanded && status !== "locked" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/10">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Lessons</h4>
                          {lessons.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No lessons added yet.</p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-2">
                              {lessons.map((lesson) => {
                                const isDone = completedLessonIds.has(lesson._id) || (completedCount >= lesson.order);
                                return (
                                  <button
                                    key={lesson._id}
                                    onClick={() => navigate("/lessons")}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-3 text-left transition-all group"
                                  >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      isDone ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary"
                                    }`}>
                                      {isDone ? <Check className="w-4 h-4" /> : <Play className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                        {lesson.title}
                                      </p>
                                      {lesson.description && (
                                        <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Go to lessons CTA */}
                          <button
                            onClick={() => navigate("/lessons")}
                            className="mt-4 w-full py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-all"
                          >
                            Open in Lessons →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Roadmap;
