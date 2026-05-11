import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Users, MessageSquare, Search, Loader2 } from "lucide-react";

interface Student {
  _id: string;
  name: string;
  email: string;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
  };
}

const MentorChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, studentsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/my-students"),
      ]);

      const userData = profileRes.data.user;
      if (userData.role !== "mentor") {
        navigate("/dashboard");
        return;
      }

      setUser(userData);
      setStudents(studentsRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.name || "Mentor";
  const userEmail = user?.email || "";

  // Generate room ID for mentor-student chat
  const getRoomId = (studentId: string) => {
    const ids = [user._id, studentId].sort();
    return `mentor-${ids[0]}-${ids[1]}`;
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

      <MentorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />

      <main
        className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold">
            Student <span className="text-primary">Messages</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Chat with your assigned students
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Student List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">My Students</h3>
                  <p className="text-xs text-muted-foreground">
                    {students.length} student{students.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">
                      {searchQuery
                        ? "No students found"
                        : "No students assigned yet"}
                    </p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedStudent?._id === student._id
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-black shrink-0">
                          {student.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.learningProfile?.skillTrack || "Student"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Right: Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {selectedStudent ? (
              <ChatRoom
                roomId={getRoomId(selectedStudent._id)}
                roomName={`Chat with ${selectedStudent.name}`}
                currentUserId={user._id}
                currentUserName={user.name}
              />
            ) : (
              <GlassCard className="p-12 text-center h-[500px] flex items-center justify-center">
                <div>
                  <MessageSquare size={64} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-bold mb-2">
                    Select a Student to Chat
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a student from the list to start messaging
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MentorChat;
