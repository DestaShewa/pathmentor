import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { useChatSocket } from "@/hooks/useChatSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Loader2, AlertCircle } from "lucide-react";

const MentorChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isConnected, error: socketError } = useChatSocket();

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
      const profileRes = await api.get("/users/profile");
      const userData = profileRes.data.user;
      
      if (userData.role !== "mentor") {
        navigate("/dashboard");
        return;
      }

      setUser(userData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
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
            Real-time chat with your assigned students
          </p>
        </motion.div>

        {/* Connection Status */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3 mb-6"
          >
            <AlertCircle className="text-yellow-400" size={20} />
            <div>
              <p className="text-yellow-400 font-semibold text-sm">
                {socketError ? "Connection Error" : "Connecting..."}
              </p>
              <p className="text-yellow-300/70 text-xs">
                {socketError || "Establishing real-time connection..."}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Left: Conversation List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 h-full"
          >
            <ConversationList
              onSelectConversation={setSelectedConversation}
              selectedId={selectedConversation?._id}
            />
          </motion.div>

          {/* Right: Chat Window */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 h-full"
          >
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={user?._id}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MentorChat;
