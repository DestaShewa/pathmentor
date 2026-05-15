import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  TrendingUp, Zap, BookOpen, Trophy, Search, 
  ChevronRight, Users, Target, ArrowUpDown, Star
} from "lucide-react";

interface CourseStat {
  courseId: string;
  title: string;
  xp: number;
  lessons: number;
  avgScore: number;
}

interface StudentPerformance {
  _id: string;
  name: string;
  email: string;
  track: string;
  level: string;
  totalXP: number;
  totalLessons: number;
  avgQuizScore: number;
  courses: CourseStat[];
}

const StudentPerformance = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [filtered, setFiltered] = useState<StudentPerformance[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(students.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.email.toLowerCase().includes(q) || 
      s.track?.toLowerCase().includes(q)
    ));
  }, [search, students]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, perfRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/students-performance")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setStudents(perfRes.data.data || []);
    } catch (e) {
      console.error("Failed to load performance data", e);
    } finally { setLoading(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold">Student <span className="text-primary">Performance</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor progress and achievements of your assigned students</p>
        </motion.div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users,    label: "Total Students", value: students.length, color: "text-blue-400" },
            { icon: Zap,      label: "Avg Total XP",   value: students.length ? Math.round(students.reduce((a,b)=>a+b.totalXP,0)/students.length).toLocaleString() : 0, color: "text-yellow-400" },
            { icon: Trophy,   label: "Avg Quiz Score", value: students.length ? Math.round(students.reduce((a,b)=>a+b.avgQuizScore,0)/students.length) + "%" : "0%", color: "text-emerald-400" },
            { icon: BookOpen, label: "Lessons Completed", value: students.reduce((a,b)=>a+b.totalLessons,0), color: "text-indigo-400" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-4 text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or skill track..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {filtered.map((student, idx) => (
              <motion.div key={student._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                <GlassCard className="overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Rank & Avatar */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${idx < 3 ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground'}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-lg group-hover:text-primary transition-colors">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total XP</p>
                          <p className="font-bold text-yellow-400">{student.totalXP.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Lessons</p>
                          <p className="font-bold text-indigo-400">{student.totalLessons}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy size={14} className="text-emerald-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                          <p className="font-bold text-emerald-400">{student.avgQuizScore}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="shrink-0 text-right hidden lg:block">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{student.track || "General"}</p>
                      <p className="text-sm font-medium text-primary/80">{student.level || "Beginner"}</p>
                    </div>

                    <ChevronRight size={20} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </div>

                  {/* Course Details Expansion (Always visible but subtle) */}
                  <div className="bg-white/[0.02] border-t border-white/5 px-5 py-3 flex flex-wrap gap-x-6 gap-y-2">
                    {student.courses.map(course => (
                      <div key={course.courseId} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-medium text-muted-foreground">{course.title}:</span>
                        <span className="text-[10px] font-bold text-foreground">{course.xp} XP</span>
                        <span className="text-[10px] text-muted-foreground/60">·</span>
                        <span className="text-[10px] font-bold text-emerald-400">{course.avgScore}%</span>
                      </div>
                    ))}
                    {student.courses.length === 0 && <p className="text-[10px] text-muted-foreground italic">No course activity recorded yet.</p>}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
            
            {filtered.length === 0 && (
              <GlassCard className="p-20 text-center text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>No students found matching your search.</p>
              </GlassCard>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPerformance;
