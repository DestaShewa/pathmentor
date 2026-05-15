import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { useChatSocket } from "@/hooks/useChatSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/useConversations";
import { Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const MentorChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isConnected, error: socketError } = useChatSocket();
  const { createConversation } = useConversations();
  const [isCreating, setIsCreating] = useState(false);

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

  const handleSelectConversation = async (conv: any) => {
    if (conv.isVirtual) {
      setIsCreating(true);
      try {
        const userId = conv.participant._id;
        const realConv = await createConversation(userId);
        setSelectedConversation(realConv);
      } catch (err) {
        console.error("Failed to create conversation:", err);
      } finally {
        setIsCreating(false);
      }
    } else {
      setSelectedConversation(conv);
    }
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
    <div className="min-h-screen relative bg-[#050810] text-white overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background */}
      <ParticlesBackground />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(20,255,236,0.1),transparent_50%)] pointer-events-none z-0" />

      <DashboardTopNav
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        role="mentor"
        avatarUrl={user?.avatarUrl}
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
        className={`relative z-10 pt-28 pb-10 px-4 md:px-8 transition-all duration-500 ease-in-out ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(20,255,236,0.15)] backdrop-blur-md">
                  <MessageSquare className="text-primary" size={28} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-[#050810] animate-pulse shadow-[0_0_10px_rgba(20,255,236,0.5)]" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none mb-2">
                  Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Messages</span>
                </h1>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Secure Communication Channel</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Assigned Students</p>
                <p className="text-xl font-black text-white leading-none">12 <span className="text-xs font-medium text-slate-500 ml-1">Active</span></p>
              </div>
            </div>
          </motion.div>

          {/* Connection Status - More Subtle */}
          <AnimatePresence>
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-3 mb-8 backdrop-blur-xl shadow-lg">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="text-yellow-500" size={18} />
                  </div>
                  <div>
                    <p className="text-yellow-500 font-black text-xs uppercase tracking-widest">
                      {socketError ? "Connection Interrupted" : "Syncing Encrypted Stream"}
                    </p>
                    <p className="text-yellow-200/50 text-[10px] font-medium leading-relaxed">
                      {socketError || "Establishing high-speed websocket connection to the secure message relay..."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Layout */}
          <GlassCard className="h-[calc(100vh-280px)] border-white/10 p-0 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex flex-col md:flex-row relative z-10 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:pointer-events-none">
            {/* Left: Conversation List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full md:w-80 lg:w-[400px] border-r border-white/5 h-full relative flex flex-col shrink-0 bg-white/[0.01]"
            >
              {isCreating && (
                <div className="absolute inset-0 z-50 bg-[#050810]/80 backdrop-blur-md flex flex-col items-center justify-center">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                    <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0 [animation-duration:3s]" />
                  </div>
                  <p className="mt-4 text-[10px] font-black text-primary animate-pulse uppercase tracking-[0.3em]">Accessing Channel</p>
                </div>
              )}
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedId={selectedConversation?._id}
              />
            </motion.div>

            {/* Right: Chat Window */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 h-full relative"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,255,236,0.02),transparent)] pointer-events-none" />
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={user?._id}
              />
            </motion.div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};

export default MentorChat;
