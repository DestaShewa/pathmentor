import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { CreateRoomModal } from "@/components/studyroom/CreateRoomModal";
import { RoomCard } from "@/components/studyroom/RoomCard";
import { handleSidebarNav } from "@/lib/navHelper";
import { Users, Plus, Loader2, BookOpen } from "lucide-react";

interface StudyRoom {
  _id: string;
  name: string;
  description: string;
  topic: string;
  creator: {
    _id: string;
    name: string;
    email: string;
  };
  participants: any[];
  activeParticipants: any[];
  maxParticipants: number;
  status: string;
  scheduledFor?: string;
  course?: { title: string };
  level?: { title: string };
  tags: string[];
  createdAt: string;
}

const StudyRooms = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [myRooms, setMyRooms] = useState<StudyRoom[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, roomsRes, myRoomsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/study-rooms?status=active"),
        api.get("/study-rooms/my-rooms")
      ]);
      setUser(profileRes.data.user);
      setRooms(roomsRes.data.data || []);
      setMyRooms(myRoomsRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData: any) => {
    try {
      const res = await api.post("/study-rooms", roomData);
      setMyRooms((prev) => [res.data.data, ...prev]);
      setRooms((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      navigate(`/study-rooms/${res.data.data._id}`);
    } catch (err: any) {
      console.error("Failed to create room:", err);
      alert(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    navigate(`/study-rooms/${roomId}`);
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

  const displayRooms = activeTab === "all" ? rooms : myRooms;

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
        activeView="study-rooms"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Study Rooms</h1>
                <p className="text-muted-foreground text-sm">
                  Join or create collaborative study sessions
                </p>
              </div>
            </div>
            <GlassButton
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <Plus size={18} /> Create Room
            </GlassButton>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit">
            {(["all", "my"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-primary text-black"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {tab === "all" ? `All Rooms (${rooms.length})` : `My Rooms (${myRooms.length})`}
              </button>
            ))}
          </div>

          {/* Rooms Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {displayRooms.length === 0 ? (
                <GlassCard className="p-12 text-center text-muted-foreground">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">
                    {activeTab === "all" ? "No active study rooms" : "You haven't joined any rooms yet"}
                  </p>
                  <p className="text-sm mb-6">
                    {activeTab === "all"
                      ? "Be the first to create a study room!"
                      : "Join an existing room or create your own"}
                  </p>
                  <GlassButton
                    variant="primary"
                    onClick={() => activeTab === "my" ? setActiveTab("all") : setShowCreateModal(true)}
                  >
                    {activeTab === "my" ? "Browse Rooms" : "Create Room"}
                  </GlassButton>
                </GlassCard>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayRooms.map((room, idx) => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      onJoin={handleJoinRoom}
                      delay={idx * 0.05}
                      isOwner={room.creator._id === user._id}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileBottomNav />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRoom}
        userCourse={user?.learningProfile?.course}
      />
    </div>
  );
};

export default StudyRooms;
