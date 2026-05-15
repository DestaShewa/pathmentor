import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Send, UserCircle2, MoreVertical, Phone, Video,
  Hash, Paperclip, X, Mic, VideoOff, PhoneOff, 
  Image as ImageIcon, FileText, Users, ChevronLeft, Loader2, MessageCircle
} from "lucide-react";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { handleSidebarNav } from "@/lib/navHelper";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { initSocket } from "@/services/socket";
import { toast } from "sonner";

// --- Types ---
type ContactType = "direct" | "study_buddy" | "group";

interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Conversation {
  _id: string;
  participant: Participant;
  lastMessage?: {
    message: string;
    sender: { _id: string; name: string };
    createdAt: string;
  };
  lastMessageAt: string;
  unreadCount: number;
  isTyping: boolean;
  type: ContactType;
  isVirtual?: boolean;
}

interface Message {
  _id: string;
  conversation: string;
  sender: Participant;
  message: string;
  messageType: "text" | "document" | "audio" | "image" | "video";
  attachments: any[];
  createdAt: string;
}

const SocialChat = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // --- State ---
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "user" | "group">("all");
  const [messageText, setMessageText] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ file: File; name: string; type: string } | null>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);

  // --- Logic ---
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, convRes] = await Promise.all([
          api.get("/users/profile"),
          api.get("/conversations")
        ]);
        setUser(profileRes.data.user);
        setConversations(convRes.data.conversations);
        setLoading(false);
      } catch (err) {
        console.error("Fetch initial data error:", err);
        setLoading(false);
        toast.error("Failed to load chat data");
      }
    };
    fetchData();

    const socket = initSocket();
    if (socket) {
      socketRef.current = socket;
      socket.on("new_message", (data: { conversationId: string; message: Message }) => {
        if (selectedConversationId === data.conversationId) {
          setMessages(prev => [...prev, data.message]);
          api.post(`/conversations/${data.conversationId}/read`).catch(() => {});
        }
        setConversations(prev => prev.map(conv => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                message: data.message.message,
                sender: data.message.sender,
                createdAt: data.message.createdAt
              },
              lastMessageAt: data.message.createdAt,
              unreadCount: selectedConversationId === data.conversationId ? 0 : (conv.unreadCount + 1)
            };
          }
          return conv;
        }));
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("new_message");
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || selectedConversationId.startsWith("virtual-")) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await api.get(`/conversations/${selectedConversationId}/messages`);
        setMessages(res.data.messages);
        if (socketRef.current) {
          socketRef.current.emit("join_conversation", { conversationId: selectedConversationId });
        }
        setConversations(prev => prev.map(c => 
          c._id === selectedConversationId ? { ...c, unreadCount: 0 } : c
        ));
      } catch (err) {
        console.error("Fetch messages error:", err);
        toast.error("Failed to load messages");
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();

    return () => {
      if (socketRef.current && selectedConversationId) {
        socketRef.current.emit("leave_conversation", { conversationId: selectedConversationId });
      }
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageText.trim() && !previewMedia) || !selectedConversationId) return;

    let targetConvId = selectedConversationId;
    setSending(true);
    try {
      if (selectedConversationId.startsWith("virtual-")) {
        const participantId = selectedConversationId.replace("virtual-", "");
        const res = await api.post("/conversations", { otherUserId: participantId });
        const newConv = res.data.conversation;
        targetConvId = newConv._id;
        setConversations(prev => {
          const filtered = prev.filter(c => c._id !== selectedConversationId);
          return [newConv, ...filtered];
        });
        setSelectedConversationId(newConv._id);
      }

      const formData = new FormData();
      formData.append("message", messageText.trim());
      if (previewMedia) formData.append("attachments", previewMedia.file);

      await api.post(`/conversations/${targetConvId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMessageText("");
      setPreviewMedia(null);
    } catch (err) {
      console.error("Send message error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewMedia({ file, name: file.name, type: file.type });
  };

  const filteredConversations = conversations.filter((c) => {
    const name = c.participant?.name || "Unknown";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
                      (activeTab === "user" && (c.type === "direct" || c.type === "study_buddy")) ||
                      (activeTab === "group" && c.type === "group");
    return matchesSearch && matchesTab;
  });

  const activeConversation = conversations.find((c) => c._id === selectedConversationId);
  const isMentor = user?.role === "mentor";

  return (
    <div className="min-h-screen relative bg-background text-white flex flex-col overflow-hidden">
      <ParticlesBackground />
      <DashboardTopNav 
        userName={user?.name || "Learner"} 
        userEmail={user?.email || ""} 
        onSignOut={() => { localStorage.removeItem("token"); navigate("/auth"); }} 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        role={user?.role}
        avatarUrl={user?.avatarUrl}
      />
      
      {isMentor ? (
        <MentorSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          userName={user?.name}
          userEmail={user?.email}
          onSignOut={() => { localStorage.removeItem("token"); navigate("/auth"); }}
        />
      ) : (
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeView="socialchat" 
          onViewChange={(v) => handleSidebarNav(v, navigate)} 
        />
      )}

      <main className={`flex-1 relative z-10 pt-20 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="h-[calc(100vh-5rem)] p-4 md:p-6 overflow-hidden">
          <div className="relative flex flex-col lg:flex-row h-full w-full min-h-0 gap-4">
      
      {/* SIDEBAR */}
      <GlassCard className="w-full lg:w-80 flex flex-col p-4 backdrop-blur-2xl bg-white/5 border-white/10 shrink-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-foreground/5 rounded-2xl py-2.5 pl-10 pr-4 outline-none text-sm border border-white/5 focus:border-primary/50 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Tab Selector */}
        <div className="flex gap-1 mb-4 bg-black/20 p-1 rounded-xl">
          {["all", "user", "group"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                activeTab === tab ? "bg-gradient-to-r from-primary to-secondary text-black shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {tab === "user" ? "Contacts" : tab}
            </button>
          ))}
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Loading chats...</span>
            </div>
          ) : filteredConversations.length > 0 ? (
            <>
              {["group", "user"].map((type) => {
                const section = filteredConversations.filter(c => {
                  if (type === "group") return c.type === "group";
                  return c.type === "direct" || c.type === "study_buddy";
                });
                if (section.length === 0) return null;
                return (
                  <div key={type} className="mb-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2 opacity-60">
                      {type === "group" ? "Groups" : "Contacts"}
                    </h3>
                    {section.map((conv) => (
                      <button
                        key={conv._id}
                        onClick={() => setSelectedConversationId(conv._id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group relative mb-1",
                          selectedConversationId === conv._id ? "bg-primary/20 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="relative">
                          <div className={cn("text-primary", selectedConversationId === conv._id ? "text-white" : "")}>
                            {conv.type === 'group' ? (
                              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                                <Users size={20}/>
                              </div>
                            ) : (
                              conv.participant?.avatar ? 
                              <img src={conv.participant.avatar} className="w-10 h-10 rounded-2xl object-cover" /> :
                              <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center">
                                <UserCircle2 size={24}/>
                              </div>
                            )}
                          </div>
                          {conv.participant?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary border-2 border-[#0B0B0F] rounded-full shadow-lg" />
                          )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold truncate text-foreground/90">{conv.participant?.name || "Unknown User"}</p>
                            {conv.lastMessageAt && (
                              <span className="text-[9px] text-muted-foreground/60 font-medium whitespace-nowrap ml-2">
                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate leading-relaxed">
                            {conv.lastMessage ? conv.lastMessage.message : conv.participant?.role || "Contact"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-lg min-w-[18px] text-center shadow-lg shadow-primary/20">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-xs opacity-50">No results found</div>
          )}
        </div>
      </GlassCard>

      {/* CHAT AREA */}
      <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden backdrop-blur-2xl bg-white/5 border-white/10 relative">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="lg:hidden cursor-pointer hover:text-primary transition" onClick={() => setSelectedConversationId(null)}><ChevronLeft size={20}/></div>
                <div className="text-primary">
                   {activeConversation.type === 'group' ? (
                      <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <Users size={20}/>
                      </div>
                    ) : (
                      activeConversation.participant?.avatar ? 
                      <img src={activeConversation.participant.avatar} className="w-10 h-10 rounded-2xl object-cover" /> :
                      <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center">
                        <UserCircle2 size={24}/>
                      </div>
                   )}
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground/90">{activeConversation.participant?.name || "Unknown User"}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", activeConversation.participant?.isOnline ? "bg-secondary animate-pulse" : "bg-muted-foreground/40")} />
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {activeConversation.participant?.isOnline ? "Active Now" : activeConversation.participant?.lastSeen ? `Last seen ${new Date(activeConversation.participant.lastSeen).toLocaleDateString()}` : "Offline"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-muted-foreground">
                <button className="p-2 hover:bg-white/5 rounded-xl transition hover:text-foreground">
                  <Phone size={18} />
                </button>
                <button className="p-2 hover:bg-primary/20 rounded-xl transition hover:text-primary" onClick={() => setIsCalling(true)}>
                  <Video size={20} />
                </button>
                <button className="p-2 hover:bg-white/5 rounded-xl transition hover:text-foreground">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none bg-black/5">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Fetching history...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
                  const isOwn = msg.sender._id === user?._id;
                  return (
                    <div key={msg._id} className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
                      <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
                        {activeConversation.type === 'group' && !isOwn && (
                          <span className="text-[10px] font-bold text-muted-foreground/60 mb-1.5 ml-2 uppercase tracking-wider">{msg.sender.name}</span>
                        )}
                        <div className={cn(
                          "p-4 rounded-3xl shadow-2xl relative group transition-all duration-300",
                          isOwn 
                            ? "bg-gradient-to-br from-primary to-primary/80 rounded-tr-none text-black font-medium" 
                            : "bg-white/5 rounded-tl-none border border-white/10 text-foreground/90 backdrop-blur-md"
                        )}>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className={cn(
                                  "p-2.5 rounded-2xl flex items-center gap-3 border max-w-[240px] transition-colors",
                                  isOwn ? "bg-black/10 border-black/5" : "bg-white/5 border-white/10"
                                )}>
                                  <div className={cn("p-2 rounded-xl", isOwn ? "bg-black/20" : "bg-primary/20 text-primary")}>
                                    {att.type === 'image' ? <ImageIcon size={16}/> : <FileText size={16}/>}
                                  </div>
                                  <a href={`http://localhost:5001${att.url}`} target="_blank" rel="noreferrer" className="text-[11px] font-bold truncate hover:underline underline-offset-4">
                                    {att.filename}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[13px] leading-relaxed break-words">{msg.message}</p>
                          <div className={cn("flex items-center gap-1.5 mt-2 opacity-50", isOwn ? "justify-end" : "justify-start")}>
                            <span className="text-[9px] font-bold">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && <div className="w-1 h-1 rounded-full bg-black/40" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <Hash size={24} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-1">Channel Empty</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Send a message to break the ice.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/5 border-t border-white/10 backdrop-blur-xl">
              {previewMedia && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                       {previewMedia.type.includes('image') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold truncate max-w-[200px] text-foreground">{previewMedia.name}</p>
                      <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">{(previewMedia.file.size / 1024).toFixed(1)} KB Ready</p>
                    </div>
                  </div>
                  <button onClick={() => setPreviewMedia(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-foreground/5 p-1.5 rounded-[2rem] border border-white/10 focus-within:border-primary/40 transition-all duration-300">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-muted-foreground hover:text-primary transition-all rounded-full hover:bg-primary/10"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Message..."
                    className="w-full bg-transparent py-3 px-2 outline-none text-sm placeholder:text-muted-foreground/30 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={(!messageText.trim() && !previewMedia) || sending}
                  className={cn(
                    "w-11 h-11 rounded-full transition-all flex items-center justify-center shadow-xl",
                    messageText.trim() || previewMedia
                      ? "bg-primary text-black hover:scale-105 active:scale-95 shadow-primary/20" 
                      : "bg-white/5 text-muted-foreground/30"
                  )}
                >
                  {sending ? <Loader2 size={20} className="animate-spin"/> : <Send size={18} className="ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/10">
            <div className="relative mb-10">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
              <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl relative z-10 backdrop-blur-sm">
                <MessageCircle size={40} className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-black mb-3 tracking-tight">Social Hub</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-10 leading-relaxed font-medium">
              Join the conversation with the community. Select a contact or group to begin.
            </p>
            <div className="flex gap-4 w-full max-w-sm">
              <div className="flex-1 p-5 rounded-[2rem] bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Hash size={20} className="text-primary" />
                </div>
                <p className="text-xs font-extrabold mb-1 uppercase tracking-wider">Tracks</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Collaborate in specialized groups.</p>
              </div>
              <div className="flex-1 p-5 rounded-[2rem] bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                  <UserCircle2 size={20} className="text-secondary" />
                </div>
                <p className="text-xs font-extrabold mb-1 uppercase tracking-wider">Buddies</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Personal guidance and support.</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
          </div>
        </div>
      </main>
      
      {/* CALL MODAL */}
      {isCalling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-50" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-md flex flex-col items-center relative z-10"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 blur-3xl bg-primary/30 rounded-full animate-pulse" />
              <div className="w-28 h-28 rounded-[3rem] bg-primary flex items-center justify-center text-black relative z-10 shadow-2xl">
                 <UserCircle2 size={64}/>
              </div>
            </div>
            <h2 className="text-3xl font-black mb-1 tracking-tighter">{activeConversation?.participant?.name}</h2>
            <div className="flex items-center gap-2 mb-16">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <p className="text-primary uppercase tracking-[0.3em] text-[10px] font-black">Establishing Connection</p>
            </div>
            
            <div className="flex gap-8">
              <button className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 backdrop-blur-xl">
                <Mic size={24} />
              </button>
              <button className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 backdrop-blur-xl">
                <VideoOff size={24} />
              </button>
              <button 
                onClick={() => setIsCalling(false)}
                className="w-16 h-16 rounded-[2rem] bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-all shadow-2xl shadow-red-500/40 text-white"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SocialChat;