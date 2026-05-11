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
  BookOpen, Upload, BarChart3, ChevronRight,
  Layers, Users, RefreshCw, Plus
} from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  totalLessons: number;
  totalLevels: number;
  enrollments: number;
}

const MentorContentManager = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/my-courses")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setCourses(coursesRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) navigate("/auth");
    } finally {
      setLoading(false);
    }
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
      <MentorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={user?.name}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">
              Content <span className="text-primary">Manager</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage lessons, files, and quizzes for your courses
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-muted-foreground hover:text-white text-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </motion.div>

        {courses.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <BookOpen size={56} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">No Courses Assigned</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You haven't been assigned to any courses yet. Contact an admin to get courses assigned.
            </p>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
              >
                <GlassCard className="overflow-hidden flex flex-col h-full">
                  {/* Color accent bar */}
                  <div className={`h-1.5 w-full ${
                    idx % 3 === 0 ? "bg-gradient-to-r from-blue-500 to-cyan-400" :
                    idx % 3 === 1 ? "bg-gradient-to-r from-purple-500 to-pink-400" :
                    "bg-gradient-to-r from-emerald-500 to-teal-400"
                  }`} />

                  <div className="p-6 flex flex-col flex-1">
                    {course.category && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit mb-3">
                        {course.category}
                      </span>
                    )}

                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {course.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {[
                        { icon: Users,    label: "Students", value: course.enrollments },
                        { icon: BookOpen, label: "Lessons",  value: course.totalLessons },
                        { icon: Layers,   label: "Levels",   value: course.totalLevels },
                      ].map((s, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-2.5 text-center">
                          <s.icon size={14} className="text-primary mx-auto mb-1" />
                          <p className="text-sm font-bold">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <GlassButton
                        variant="primary"
                        className="w-full"
                        onClick={() => navigate(`/mentor/upload/${course._id}`)}
                      >
                        <Upload size={15} /> Add Lesson / Files
                      </GlassButton>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => navigate(`/mentor/class/${course._id}`)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
                        >
                          <BookOpen size={13} /> View
                        </button>
                        <button
                          onClick={() => navigate(`/mentor/analysis/${course._id}`)}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-xs font-medium"
                        >
                          <BarChart3 size={13} /> Stats
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MentorContentManager;
