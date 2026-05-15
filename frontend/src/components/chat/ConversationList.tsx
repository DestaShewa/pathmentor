import { useConversations } from "@/hooks/useConversations";
import { Search, Loader2, MessageSquare, Users, Plus, X, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { GlassButton } from "@/components/ui/GlassButton";
import api from "@/services/api";
import { toast } from "sonner";

interface ConversationListProps {
  onSelectConversation: (conversation: any) => void;
  selectedId?: string | null;
}

export const ConversationList = ({ onSelectConversation, selectedId }: ConversationListProps) => {
  const { conversations, loading, refetch } = useConversations();
  const [search, setSearch] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Get potential participants (all unique participants from existing conversations)
  const potentialParticipants = useMemo(() => {
    const usersMap = new Map();
    conversations.forEach((c: any) => {
      if (c.type === "direct" || c.type === "study_buddy") {
        if (c.participant) {
          usersMap.set(c.participant._id, c.participant);
        }
      }
    });
    return Array.from(usersMap.values());
  }, [conversations]);

  const filtered = conversations.filter((conv: any) => {
    const name = conv.type === "group" ? conv.name : conv.participant?.name;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 1) {
      toast.error("Please select at least one student");
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await api.post("/conversations/group", {
        name: groupName.trim(),
        participantIds: selectedUsers
      });
      
      toast.success("Group created successfully!");
      setIsGroupModalOpen(false);
      setGroupName("");
      setSelectedUsers([]);
      refetch(); // Refresh list
      onSelectConversation(res.data.conversation);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

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
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs font-bold text-primary animate-pulse tracking-widest uppercase">Syncing Messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 space-y-5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white tracking-tight">Messages</h3>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Live</span>
          </div>
          
          <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all border border-white/5 hover:border-primary/20 active:scale-90 flex items-center justify-center group relative overflow-hidden"
                title="Create Group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus size={20} className="group-hover:rotate-90 transition-transform relative z-10" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0A0F1E]/95 border-white/10 text-white max-w-md backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Create <span className="text-primary">Group Channel</span></DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2.5 block">Channel Identity</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all text-sm font-medium"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2.5 block">Assign Members ({selectedUsers.length})</label>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {potentialParticipants.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-sm text-slate-500 font-medium italic">No potential members found</p>
                      </div>
                    ) : (
                      potentialParticipants.map(u => (
                        <button
                          key={u._id}
                          onClick={() => toggleUserSelection(u._id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group/item ${
                            selectedUsers.includes(u._id) 
                              ? "bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(20,255,236,0.05)]" 
                              : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                              selectedUsers.includes(u._id) ? "bg-primary text-black" : "bg-white/5 text-slate-400 group-hover/item:text-white"
                            }`}>
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">{u.name}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{u.role}</p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedUsers.includes(u._id) ? "bg-primary border-primary" : "border-white/10"
                          }`}>
                            {selectedUsers.includes(u._id) && <Plus size={14} className="text-black rotate-45" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <GlassButton 
                    variant="secondary" 
                    onClick={() => setIsGroupModalOpen(false)}
                    className="flex-1 font-bold h-12"
                  >
                    Discard
                  </GlassButton>
                  <GlassButton 
                    variant="primary" 
                    onClick={handleCreateGroup}
                    disabled={creatingGroup || !groupName.trim() || selectedUsers.length === 0}
                    className="flex-1 font-black h-12 shadow-[0_10px_20px_rgba(20,255,236,0.2)]"
                  >
                    {creatingGroup ? "Initializing..." : "Create Channel"}
                  </GlassButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-primary transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-10 opacity-50">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 rotate-12 border border-white/10">
              <MessageSquare size={32} className="text-slate-400" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">
              {search ? "No matches found" : "Void Channel"}
            </p>
            <p className="text-[10px] text-slate-600 mt-2 text-center uppercase tracking-tighter">
              {search ? "Try a different signal." : "Launch a new conversation."}
            </p>
          </div>
        ) : (
          <div className="py-4 px-3 space-y-1">
            {filtered.map((conv: any) => {
              const isActive = selectedId === conv._id;
              const name = conv.type === "group" ? conv.name : conv.participant?.name;
              
              return (
                <motion.button
                  key={conv._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full p-4 rounded-2xl transition-all duration-300 text-left relative group ${
                    isActive ? "bg-primary/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full shadow-[0_0_15px_rgba(20,255,236,0.6)]" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-transparent rounded-2xl" />
                    </>
                  )}
                  
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Avatar Container */}
                    <div className="relative shrink-0">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl transition-all duration-500 ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      } ${
                        conv.type === "group" 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "bg-gradient-to-br from-primary to-secondary text-black"
                      }`}>
                        {conv.type === "group" ? (
                          <Users size={24} />
                        ) : (
                          name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      
                      {/* High-end Online Indicator */}
                      {conv.type !== "group" && conv.participant?.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#050810] rounded-full flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`text-sm font-black tracking-tight truncate transition-colors ${isActive ? "text-primary" : "text-white group-hover:text-primary/80"}`}>
                          {name || "Anonymous"}
                        </p>
                        {conv.lastMessageAt && (
                          <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${isActive ? "text-primary/50" : "text-slate-600"}`}>
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {conv.isTyping ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                                <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
                              </div>
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Signal Incoming</span>
                            </div>
                          ) : (
                            <p className={`text-xs truncate leading-relaxed ${conv.unreadCount > 0 ? "text-slate-200 font-bold" : "text-slate-500"}`}>
                              {conv.lastMessage?.sender?.name === "You" && <span className="text-primary/40 font-black mr-1">YOU</span>}
                              {conv.lastMessage?.message || <span className="italic opacity-50">Empty Channel</span>}
                            </p>
                          )}
                        </div>
                        
                        {conv.unreadCount > 0 && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-primary text-black text-[9px] font-black rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(20,255,236,0.4)] shrink-0"
                          >
                            {conv.unreadCount > 99 ? "!" : conv.unreadCount}
                          </motion.span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
