import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  BookOpen, Users, Upload, ChevronRight,
  RefreshCw, Layers, Trophy, Plus
} from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  totalLessons: number;
  totalLevels: number;
  enrollments: number;
  completedCount: number;
  createdAt: string;
}

const MyClasses = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/my-courses")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setCourses(coursesRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        navigate("/auth");
      } else {
        console.error("Failed to load classes:", e);
        setError(e?.response?.data?.message || "Failed to load classes");
      }
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
      <DashboardTopNav
        userName={user?.name || "Mentor"}
        userEmail={user?.email || ""}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">My <span className="text-primary">Classes</span></h1>
            <p className="text-muted-foreground text-sm mt-1">{courses.length} course{courses.length !== 1 ? "s" : ""} assigned to you</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white text-sm">
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <GlassButton variant="primary" onClick={() => navigate("/mentor/dashboard")}>
              Dashboard
            </GlassButton>
          </div>
        </motion.div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

        {courses.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <BookOpen size={56} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You haven't been assigned to any courses yet. Contact an admin to get courses assigned to your profile.
            </p>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => {
              const completionRate = course.enrollments > 0
                ? Math.round((course.completedCount / course.enrollments) * 100)
                : 0;

              return (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <GlassCard className="overflow-hidden flex flex-col h-full">
                    {/* Color bar */}
                    <div className={`h-1.5 w-full ${
                      idx % 4 === 0 ? "bg-gradient-to-r from-blue-500 to-cyan-400" :
                      idx % 4 === 1 ? "bg-gradient-to-r from-purple-500 to-pink-400" :
                      idx % 4 === 2 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                      "bg-gradient-to-r from-orange-500 to-yellow-400"
                    }`} />

                    <div className="p-6 flex flex-col flex-1">
                      {/* Category badge */}
                      {course.category && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit mb-3">
                          {course.category}
                        </span>
                      )}

                      <h3 className="text-lg font-bold mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{course.description}</p>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { icon: Users,   label: "Students", value: course.enrollments },
                          { icon: BookOpen, label: "Lessons",  value: course.totalLessons },
                          { icon: Layers,  label: "Levels",   value: course.totalLevels },
                        ].map((s, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-2.5 text-center">
                            <s.icon size={14} className="text-primary mx-auto mb-1" />
                            <p className="text-sm font-bold">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Completion bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Completion rate</span>
                          <span className="font-bold text-white">{completionRate}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${completionRate}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.07 }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/mentor/class/${course._id}`)}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-bold"
                        >
                          <ChevronRight size={16} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/mentor/upload/${course._id}`)}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all text-xs font-bold"
                        >
                          <Upload size={16} /> Upload
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyClasses;
