import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useChatSocket } from "@/hooks/useChatSocket";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Users, Loader2, AlertCircle } from "lucide-react";

const glass =
  "relative overflow-hidden rounded-2xl " +
  "bg-white/10 backdrop-blur-3xl border border-white/20 " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] " +
  "hover:border-cyan-300/30 transition-all duration-300";

const AdminChatPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected, error: socketError } = useChatSocket();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/users/profile");
      setCurrentUser(res.data.user);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-white mb-2">
          User <span className="text-cyan-400">Messages</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Real-time chat with students and mentors
        </p>
      </motion.div>

      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3"
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

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
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
            currentUserId={currentUser?._id}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AdminChatPage;
