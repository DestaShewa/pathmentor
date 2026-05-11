import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { initSocket, getSocket } from "@/services/socket";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ParticipantList } from "@/components/studyroom/ParticipantList";
import { handleSidebarNav } from "@/lib/navHelper";
import {
  ArrowLeft, Users, BookOpen, Tag, Calendar,
  LogOut, StopCircle, Loader2
} from "lucide-react";

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
  course?: { title: string };
  level?: { title: string };
  tags: string[];
  createdAt: string;
}

const StudyRoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (!room) return;

    const socket = initSocket();
    
    // Join room for real-time updates
    socket.emit("join", `room-${room._id}`);

    // Listen for participant events
    socket.on("participantJoined", () => {
      fetchData(); // Refresh room data
    });

    socket.on("participantLeft", () => {
      fetchData(); // Refresh room data
    });

    socket.on("roomEnded", () => {
      alert("This study room has ended");
      navigate("/study-rooms");
    });

    return () => {
      socket.emit("leave", `room-${room._id}`);
      socket.off("participantJoined");
      socket.off("participantLeft");
      socket.off("roomEnded");
    };
  }, [room, navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, roomRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/study-rooms/${id}`)
      ]);
      setUser(profileRes.data.user);
      setRoom(roomRes.data.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      navigate("/study-rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!room) return;
    setJoining(true);
    try {
      await api.post(`/study-rooms/${room._id}/join`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to join room");
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    setLeaving(true);
    try {
      await api.post(`/study-rooms/${room._id}/leave`);
      navigate("/study-rooms");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to leave room");
    } finally {
      setLeaving(false);
    }
  };

  const handleEndRoom = async () => {
    if (!room) return;
    if (!confirm("Are you sure you want to end this study room? This cannot be undone.")) return;
    
    try {
      await api.put(`/study-rooms/${room._id}/end`);
      navigate("/study-rooms");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to end room");
    }
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

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Room not found</p>
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";
  const isCreator = room.creator._id === user?._id;
  const isParticipant = room.participants.some((p: any) => p._id === user?._id);
  const isFull = room.participants.length >= room.maxParticipants;

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
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate("/study-rooms")}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            Back to Study Rooms
          </motion.button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Room Info + Participants */}
            <div className="lg:col-span-1 space-y-6">
              {/* Room Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <GlassCard className="p-6">
                  <h1 className="text-2xl font-bold mb-2">{room.name}</h1>
                  
                  {room.description && (
                    <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={16} className="text-primary" />
                      <span className="font-medium">{room.topic}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users size={16} />
                      <span>
                        {room.participants.length}/{room.maxParticipants} participants
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={16} />
                      <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Course/Level */}
                  {(room.course || room.level) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.course && (
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                          {room.course.title}
                        </span>
                      )}
                      {room.level && (
                        <span className="text-xs bg-white/5 text-muted-foreground px-3 py-1 rounded-full">
                          {room.level.title}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white/5 text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    {!isParticipant && !isFull && (
                      <GlassButton
                        variant="primary"
                        className="w-full"
                        onClick={handleJoinRoom}
                        disabled={joining}
                      >
                        {joining ? "Joining..." : "Join Room"}
                      </GlassButton>
                    )}

                    {isParticipant && !isCreator && (
                      <GlassButton
                        variant="ghost"
                        className="w-full"
                        onClick={handleLeaveRoom}
                        disabled={leaving}
                      >
                        <LogOut size={16} /> {leaving ? "Leaving..." : "Leave Room"}
                      </GlassButton>
                    )}

                    {isCreator && (
                      <GlassButton
                        variant="ghost"
                        className="w-full text-red-400 hover:text-red-300"
                        onClick={handleEndRoom}
                      >
                        <StopCircle size={16} /> End Room
                      </GlassButton>
                    )}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Participants List */}
              <ParticipantList
                participants={room.participants}
                activeParticipants={room.activeParticipants}
                creator={room.creator}
              />
            </div>

            {/* Right: Chat */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {isParticipant ? (
                  <ChatRoom
                    roomId={`study-room-${room._id}`}
                    roomName={room.name}
                    currentUserId={user._id}
                    currentUserName={user.name}
                  />
                ) : (
                  <GlassCard className="p-12 text-center h-[500px] flex items-center justify-center">
                    <div>
                      <Users size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium mb-2">Join to participate</p>
                      <p className="text-sm text-muted-foreground mb-6">
                        Join this study room to chat with other participants
                      </p>
                      <GlassButton
                        variant="primary"
                        onClick={handleJoinRoom}
                        disabled={joining || isFull}
                      >
                        {isFull ? "Room Full" : joining ? "Joining..." : "Join Room"}
                      </GlassButton>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default StudyRoomDetail;
