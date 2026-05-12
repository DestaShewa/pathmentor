import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  ArrowLeft, BookOpen, Users, ChevronDown, ChevronUp,
  Play, CheckCircle2, Zap, Clock, BarChart3, Upload, Plus
} from "lucide-react";

interface Level {
  _id: string;
  title: string;
  order: number;
  lessons: { _id: string; title: string; videoUrl?: string; description?: string }[];
}

interface Student {
  _id: string;
  name: string;
  email: string;
  xp: number;
  progressPercent: number;
  completedLessons: number;
  lastActive: string;
}

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser]         = useState<any>(null);
  const [course, setCourse]     = useState<any>(null);
  const [levels, setLevels]     = useState<Level[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"curriculum" | "students">("curriculum");
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [id, navigate]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [profileRes, courseRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/mentor/course/${id}`)
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setCourse(courseRes.data.course);
      setLevels(courseRes.data.levels || []);
      setStudents(courseRes.data.students || []);
      setTotalLessons(courseRes.data.totalLessons || 0);
      // Auto-expand first level
      if (courseRes.data.levels?.length > 0) setExpandedLevel(courseRes.data.levels[0]._id);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load course");
    } finally { setLoading(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        {/* Back */}
        <GlassButton variant="ghost" size="sm" onClick={() => navigate("/mentor/classes")} className="mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back to Classes
        </GlassButton>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        {course && (
          <>
            {/* Course header */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  {course.category && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{course.category}</span>}
                  <h1 className="text-3xl font-extrabold mt-2">{course.title}</h1>
                  <p className="text-muted-foreground mt-1">{course.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <GlassButton variant="primary" size="sm" onClick={() => navigate(`/mentor/upload/${id}`)}>
                    <Upload size={15} /> Add Lesson
                  </GlassButton>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                {[
                  { icon: Users,    label: "Students",  value: students.length,  color: "text-blue-400" },
                  { icon: BookOpen, label: "Lessons",   value: totalLessons,     color: "text-purple-400" },
                  { icon: Zap,      label: "Levels",    value: levels.length,    color: "text-yellow-400" },
                  { icon: CheckCircle2, label: "Avg Progress", value: students.length > 0 ? `${Math.round(students.reduce((s, st) => s + st.progressPercent, 0) / students.length)}%` : "0%", color: "text-emerald-400" },
                ].map((s, i) => (
                  <GlassCard key={i} className="p-4 text-center">
                    <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit mb-6">
              {(["curriculum", "students"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}>
                  {tab} {tab === "students" && `(${students.length})`}
                </button>
              ))}
            </div>

            {/* Curriculum */}
            {activeTab === "curriculum" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {levels.length === 0 ? (
                  <GlassCard className="p-12 text-center text-muted-foreground">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No levels yet. Levels are created automatically when a course is set up.</p>
                  </GlassCard>
                ) : (
                  levels.map((level, idx) => {
                    const isExpanded = expandedLevel === level._id;
                    return (
                      <GlassCard key={level._id} className="overflow-hidden">
                        <button
                          onClick={() => setExpandedLevel(isExpanded ? null : level._id)}
                          className="w-full flex items-center justify-between p-5 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {level.order}
                            </div>
                            <div>
                              <p className="font-bold">{level.title}</p>
                              <p className="text-xs text-muted-foreground">{level.lessons.length} lesson{level.lessons.length !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="px-5 pb-5 border-t border-white/5 pt-4">
                                {level.lessons.length === 0 ? (
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground italic">No lessons in this level yet.</p>
                                    <button onClick={() => navigate(`/mentor/upload/${id}`)}
                                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                                      <Plus size={12} /> Add Lesson
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {level.lessons.map((lesson, li) => (
                                      <div key={lesson._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                          {lesson.videoUrl ? <Play size={12} /> : <BookOpen size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">{lesson.title}</p>
                                          {lesson.description && <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>}
                                        </div>
                                        {lesson.videoUrl && <span className="text-xs text-blue-400 shrink-0">Video</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* Students */}
            {activeTab === "students" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {students.length === 0 ? (
                  <GlassCard className="p-12 text-center text-muted-foreground">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No students enrolled yet.</p>
                  </GlassCard>
                ) : (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        <tr>
                          <th className="px-5 py-4">Student</th>
                          <th className="px-5 py-4">Progress</th>
                          <th className="px-5 py-4">Lessons</th>
                          <th className="px-5 py-4">XP</th>
                          <th className="px-5 py-4">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {students.map((st, i) => (
                          <tr key={st._id || i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {st.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{st.name}</p>
                                  <p className="text-xs text-muted-foreground">{st.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${st.progressPercent}%` }} />
                                </div>
                                <span className="text-xs font-bold text-primary shrink-0">{st.progressPercent}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">{st.completedLessons}/{totalLessons}</td>
                            <td className="px-5 py-4"><span className="text-sm font-bold text-yellow-400">{st.xp}</span></td>
                            <td className="px-5 py-4 text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={11} /> {st.lastActive ? new Date(st.lastActive).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ClassDetails;
