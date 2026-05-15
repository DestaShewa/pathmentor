import { useMessages } from "@/hooks/useMessages";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { Loader2, MessageSquare, Circle, Trash2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

interface ChatWindowProps {
  conversation: any;
  currentUserId: string;
  onDeleteConversation?: () => void;
}

export const ChatWindow = ({ conversation, currentUserId, onDeleteConversation }: ChatWindowProps) => {
  const { messages, loading, typing, sendMessage, handleTyping, messagesEndRef } = useMessages(
    conversation?._id
  );

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-transparent p-10">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10 shadow-[0_0_50px_rgba(20,255,236,0.05)]">
            <MessageSquare size={40} className="opacity-30 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Select a conversation</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Choose a conversation from the list or create a new group to start communicating with your students.
          </p>
        </div>
      </div>
    );
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Last seen recently";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  const isGroup = conversation.type === "group";
  const name = isGroup ? conversation.name : conversation.participant?.name;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-2xl z-20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.05] to-transparent opacity-50 pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative group/avatar">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-2xl transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:rotate-3 ${
              isGroup 
                ? "bg-primary/10 text-primary border border-primary/30" 
                : "bg-gradient-to-br from-primary via-secondary to-primary bg-[length:200%_200%] animate-gradient text-black"
            }`}>
              {isGroup ? <Users size={32} /> : (name?.[0]?.toUpperCase() || "?")}
            </div>
            {!isGroup && conversation.participant?.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#050810] rounded-full flex items-center justify-center shadow-2xl">
                <div className="w-3.5 h-3.5 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="min-w-0">
            <p className="font-black text-white text-2xl tracking-tight leading-none mb-2">
              {name || "Secure Channel"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                <span className={`w-1.5 h-1.5 rounded-full ${isGroup || conversation.participant?.isOnline ? "bg-primary shadow-[0_0_10px_rgba(20,255,236,0.5)]" : "bg-slate-600"}`} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isGroup ? `${conversation.participants?.length || 0} Members` : conversation.participant?.isOnline ? "Active Signal" : "Offline"}
                </span>
              </div>
              {!isGroup && !conversation.participant?.isOnline && (
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                  {formatLastSeen(conversation.participant?.lastSeen)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {/* Action Placeholders for feature-rich look */}
          <div className="hidden lg:flex items-center gap-2 mr-2 border-r border-white/10 pr-4">
            <button className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center border border-white/5 active:scale-90 opacity-50 cursor-not-allowed">
              <span className="sr-only">Call</span>
              <Circle size={18} className="fill-current" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center border border-white/5 active:scale-90 opacity-50 cursor-not-allowed">
              <span className="sr-only">Video</span>
              <Circle size={18} className="fill-current" />
            </button>
          </div>

          {onDeleteConversation && (
            <button
              onClick={() => {
                if (window.confirm("CRITICAL: Wipe entire encrypted history? This action is irreversible.")) {
                  onDeleteConversation();
                }
              }}
              className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20 active:scale-90 group shadow-lg"
              title="Terminate Channel"
            >
              <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-[#050810]/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary opacity-10" />
              <Loader2 className="w-16 h-16 animate-spin text-primary absolute inset-0 [animation-duration:2s]" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-black text-primary/60 uppercase tracking-[0.4em] animate-pulse">Decrypting Transcript</p>
              <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-tighter">Establishing secure handshake...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <MessageList messages={messages} currentUserId={currentUserId} />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Typing indicator - Improved UI */}
        <AnimatePresence>
          {typing.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-6 left-8 px-5 py-2.5 bg-[#0A0F1E]/90 backdrop-blur-2xl border border-primary/30 rounded-2xl text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3 z-30 shadow-[0_10px_30px_rgba(20,255,236,0.15)]"
            >
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(20,255,236,0.8)]" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(20,255,236,0.8)]" style={{ animationDelay: "200ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce shadow-[0_0_5px_rgba(20,255,236,0.8)]" style={{ animationDelay: "400ms" }} />
              </div>
              <span>{typing.join(", ")} {typing.length === 1 ? "is" : "are"} active</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 bg-white/[0.01] border-t border-white/5">
        <GlassCard className="border-white/10 bg-[#0A0F1E]/50 p-0 overflow-hidden shadow-2xl relative">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <MessageInput onSend={sendMessage} onTyping={handleTyping} disabled={false} />
        </GlassCard>
      </div>
    </div>
  );
};
