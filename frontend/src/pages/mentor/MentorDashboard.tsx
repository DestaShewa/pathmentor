import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { initSocket, disconnectSocket } from "@/services/socket";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  Users, BookOpen, Calendar, Star, Activity,
  CheckCircle2, Clock, Plus, ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer, Tooltip, XAxis, AreaChart, Area,
} from "recharts";
import { motion } from "framer-motion";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "students" | "lessons">("overview");

  // Lesson creation state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }

    // Initialize socket for real-time notifications
    initSocket();

    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    try {
      const profileRes = await api.get("/users/profile");
      const userData = profileRes.data.user;

      // Only redirect non-mentors, don't redirect on API errors
      if (userData.role !== "mentor") {
        navigate("/dashboard");
        return;
      }
      setUser(userData);

      try {
        const dashRes = await api.get("/mentor/dashboard");
        setStats(dashRes.data.stats || {});
        setUpcomingSessions(dashRes.data.upcomingSessions || []);
        setStudents(dashRes.data.students || []);
        setCourses(dashRes.data.courses || []);
        setWeeklyData(dashRes.data.weeklyData || []);
      } catch (dashErr: any) {
        // Dashboard data failed — still show the page with empty state
        console.error("Mentor dashboard data error:", dashErr?.response?.data?.message || dashErr.message);
        setStats({});
      }
    } catch (profileErr: any) {
      // Only redirect if auth actually failed (401)
      if (profileErr?.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/auth");
      }
      console.error("Profile fetch error:", profileErr?.response?.data?.message || profileErr.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async (courseId: string) => {
    if (!courseId) { setLevels([]); return; }
    try {
      const res = await api.get(`/levels/course/${courseId}`);
      setLevels(res.data.data || []);
    } catch { setLevels([]); }
  };

  const handleCreateLesson = async () => {
    setLessonError("");
    if (!lessonTitle.trim() || !selectedCourseId || !selectedLevelId) {
      setLessonError("Title, course, and level are required");
      return;
    }
    setSavingLesson(true);
    try {
      await api.post("/mentor/lesson", {
        title: lessonTitle.trim(),
        description: lessonDesc.trim(),
        content: lessonContent.trim(),
        videoUrl: lessonVideoUrl.trim() || undefined,
        order: lessonOrder,
        levelId: selectedLevelId,
        courseId: selectedCourseId
      });
      setShowLessonModal(false);
      setLessonTitle(""); setLessonDesc(""); setLessonContent("");
      setLessonVideoUrl(""); setSelectedCourseId(""); setSelectedLevelId("");
    } catch (e: any) {
      setLessonError(e.response?.data?.message || "Failed to create lesson");
    } finally {
      setSavingLesson(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    disconnectSocket();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.name || "Mentor";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />

      <DashboardTopNav
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <MentorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-extrabold">
            Mentor <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Welcome back, {userName}</p>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "My Students", value: stats?.totalStudents ?? 0, color: "text-primary bg-primary/20" },
            { icon: BookOpen, label: "My Courses", value: stats?.totalCourses ?? 0, color: "text-blue-400 bg-blue-400/20" },
            { icon: Calendar, label: "Sessions Done", value: stats?.completedSessions ?? 0, color: "text-green-400 bg-green-400/20" },
            { icon: Clock, label: "Upcoming", value: upcomingSessions.length, color: "text-orange-400 bg-orange-400/20" },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </GlassCard>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit mb-8">
          {(["overview", "sessions", "students", "lessons"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <GlassCard className="lg:col-span-2 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary" /> Weekly Session Activity
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData.length ? weeklyData : [
                    { name: "Mon", val: 0 }, { name: "Tue", val: 0 }, { name: "Wed", val: 0 },
                    { name: "Thu", val: 0 }, { name: "Fri", val: 0 }, { name: "Sat", val: 0 }, { name: "Sun", val: 0 }
                  ]}>
                    <defs>
                      <linearGradient id="mentorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#33b6ff" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#33b6ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Area type="monotone" dataKey="val" stroke="#33b6ff" strokeWidth={2} fillOpacity={1} fill="url(#mentorGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Top student */}
            <GlassCard className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-400" /> Top Student
              </h3>
              {stats?.topMentee ? (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-black">
                    {stats.topMentee.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{stats.topMentee.name}</p>
                    <p className="text-sm text-primary">{stats.topMentee.score} XP earned</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No students yet</p>
              )}

              <div className="mt-6 pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold mb-3">My Courses</h4>
                {courses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No courses assigned</p>
                ) : (
                  <div className="space-y-2">
                    {courses.slice(0, 3).map(c => (
                      <div key={c._id} className="flex items-center gap-2 text-sm">
                        <BookOpen size={14} className="text-primary shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-xl font-bold">Upcoming Sessions</h2>
            {upcomingSessions.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground">
                <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                <p>No upcoming sessions scheduled.</p>
              </GlassCard>
            ) : (
              upcomingSessions.map((session, idx) => (
                <GlassCard key={session._id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {session.studentId?.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <p className="font-semibold">{session.studentId?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Scheduled</span>
                  </div>
                </GlassCard>
              ))
            )}
          </motion.div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-xl font-bold">My Students ({students.length})</h2>
            {students.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-30" />
                <p>No students enrolled in your courses yet.</p>
              </GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student, idx) => (
                  <GlassCard key={student._id || idx} className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                        {student.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{student.course || "Enrolled"}</span>
                      <span className="text-yellow-400 font-bold">{student.xp || 0} XP</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Upload Lessons</h2>
              <GlassButton variant="primary" onClick={() => setShowLessonModal(true)}>
                <Plus size={16} /> Add Lesson
              </GlassButton>
            </div>

            {courses.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p>You have no courses assigned. Ask an admin to assign you to a course.</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {courses.map(course => (
                  <GlassCard key={course._id} className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen size={18} className="text-primary" />
                      <div>
                        <p className="font-semibold">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedCourseId(course._id); fetchLevels(course._id); setShowLessonModal(true); }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Add Lesson <ChevronRight size={14} />
                    </button>
                  </GlassCard>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Lesson Creation Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Lesson</h2>
            {lessonError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{lessonError}</div>}
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={e => { setSelectedCourseId(e.target.value); fetchLevels(e.target.value); setSelectedLevelId(""); }}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Level</label>
                  <select
                    value={selectedLevelId}
                    onChange={e => setSelectedLevelId(e.target.value)}
                    disabled={!selectedCourseId || levels.length === 0}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="">Select level...</option>
                    {levels.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title</label>
                <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" placeholder="Lesson title" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Description</label>
                <input value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" placeholder="Short description" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Content</label>
                <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={4} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none" placeholder="Lesson content..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Video URL (optional)</label>
                  <input value={lessonVideoUrl} onChange={e => setLessonVideoUrl(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" placeholder="https://youtube.com/embed/..." />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Order</label>
                  <input type="number" value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} min={1} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <GlassButton variant="primary" onClick={handleCreateLesson} disabled={savingLesson}>
                {savingLesson ? "Saving..." : "Create Lesson"}
              </GlassButton>
              <GlassButton variant="secondary" onClick={() => { setShowLessonModal(false); setLessonError(""); }}>Cancel</GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
