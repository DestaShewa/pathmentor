import { useConversations } from "@/hooks/useConversations";
import { Search, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface ConversationListProps {
  onSelectConversation: (conversation: any) => void;
  selectedId?: string | null;
}

export const ConversationList = ({ onSelectConversation, selectedId }: ConversationListProps) => {
  const { conversations, loading } = useConversations();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((conv: any) =>
    conv.participant?.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white mb-3">Messages</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-xs mt-2">Start chatting with someone!</p>
          </div>
        ) : (
          filtered.map((conv: any) => (
            <motion.button
              key={conv._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onSelectConversation(conv)}
              className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all text-left ${
                selectedId === conv._id ? "bg-white/10 border-l-4 border-l-primary" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-black">
                    {conv.participant?.name[0]?.toUpperCase() || "?"}
                  </div>
                  {conv.participant?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-white truncate">
                      {conv.participant?.name || "Unknown User"}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-slate-500 ml-2 shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-400 truncate flex-1">
                      {conv.isTyping ? (
                        <span className="text-primary italic">typing...</span>
                      ) : conv.lastMessage?.message ? (
                        <span className={conv.unreadCount > 0 ? "font-semibold text-white" : ""}>
                          {conv.lastMessage.message}
                        </span>
                      ) : (
                        <span className="text-slate-500">No messages yet</span>
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-primary text-black text-xs font-bold rounded-full shrink-0">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};
