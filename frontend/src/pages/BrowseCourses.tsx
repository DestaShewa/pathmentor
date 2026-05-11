import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { handleSidebarNav } from "@/lib/navHelper";
import { toast } from "sonner";
import {
  BookOpen, Users, PlayCircle, CheckCircle2,
  Loader2, Search, Filter
} from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor?: {
    name: string;
    email: string;
  };
  lessonCount?: number;
  createdAt: string;
}

const BrowseCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [enrolledCourseId, setEnrolledCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, categoryFilter, courses]);

  const fetchData = async () => {
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/courses"),
      ]);

      const userData = profileRes.data.user;
      setUser(userData);
      setEnrolledCourseId(userData.learningProfile?.course?.id || null);

      setCourses(coursesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== "All") {
      filtered = filtered.filter((course) => course.category === categoryFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      const response = await api.post(`/courses/${courseId}/enroll`);
      
      if (response.data.success) {
        setEnrolledCourseId(courseId);
        
        // Refresh user data to get updated course info
        const profileRes = await api.get("/users/profile");
        const updatedUser = profileRes.data.user;
        setUser(updatedUser);
        
        // Update localStorage if it exists
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.learningProfile = updatedUser.learningProfile;
            localStorage.setItem("user", JSON.stringify(parsed));
          } catch (parseErr) {
            console.log("Failed to update localStorage user:", parseErr);
          }
        }
        
        toast.success("Successfully enrolled! You can now access the course lessons.");
        
        // Auto-redirect to lessons after a short delay
        setTimeout(() => {
          navigate("/lessons");
        }, 1500);
      } else {
        throw new Error(response.data.message || "Enrollment failed");
      }
    } catch (err: any) {
      console.error("Enrollment error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to enroll in course";
      toast.error(errorMessage);
    } finally {
      setEnrolling(null);
    }
  };

  const handleStartLearning = (courseId: string) => {
    navigate("/lessons");
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  // Get unique categories
  const categories = ["All", ...new Set(courses.map((c) => c.category).filter(Boolean))];

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
        activeView="browse-courses"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main
        className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold mb-2">
              Browse <span className="text-primary">Courses</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Explore and enroll in courses to start your learning journey
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-muted-foreground" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    categoryFilter === category
                      ? "bg-primary text-black"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Enrolled Course Banner */}
          {enrolledCourseId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <GlassCard className="p-6 border-primary/30">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Currently Enrolled</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.learningProfile?.course?.title}
                      </p>
                    </div>
                  </div>
                  <GlassButton
                    variant="primary"
                    onClick={() => handleStartLearning(enrolledCourseId)}
                  >
                    <PlayCircle size={16} /> Continue Learning
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-12 text-center text-muted-foreground">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p>
                  {searchQuery || categoryFilter !== "All"
                    ? "No courses found matching your criteria"
                    : "No courses available yet"}
                </p>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, idx) => {
                const isEnrolled = enrolledCourseId === course._id;
                const isEnrolling = enrolling === course._id;

                return (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GlassCard className="p-6 h-full flex flex-col">
                      {/* Category Badge */}
                      {course.category && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary w-fit mb-4">
                          {course.category}
                        </span>
                      )}

                      {/* Title */}
                      <h3 className="text-xl font-bold mb-2">{course.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {course.description || "No description available"}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-white/10">
                        {course.instructor && (
                          <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>{course.instructor.name}</span>
                          </div>
                        )}
                        {course.lessonCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <BookOpen size={14} />
                            <span>{course.lessonCount} lessons</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {isEnrolled ? (
                        <GlassButton
                          variant="primary"
                          className="w-full"
                          onClick={() => handleStartLearning(course._id)}
                        >
                          <PlayCircle size={16} /> Start Learning
                        </GlassButton>
                      ) : (
                        <GlassButton
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleEnroll(course._id)}
                          disabled={isEnrolling || !!enrolledCourseId}
                        >
                          {isEnrolling ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Enrolling...
                            </>
                          ) : enrolledCourseId ? (
                            "Already Enrolled in Another Course"
                          ) : (
                            "Enroll Now"
                          )}
                        </GlassButton>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default BrowseCourses;
