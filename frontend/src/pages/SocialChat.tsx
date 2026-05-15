import React, { useState, useRef, useEffect } from "react";
import {
  Search, Send, UserCircle2, MoreVertical, Phone, Video,
  Hash, Paperclip, X, Mic, VideoOff, PhoneOff, 
  Image as ImageIcon, FileText, Users, ChevronLeft, Loader2
} from "lucide-react";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
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
  
  // Initial data fetch
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

    // Socket initialization
    const socket = initSocket();
    if (socket) {
      socketRef.current = socket;
      
      socket.on("new_message", (data: { conversationId: string; message: Message }) => {
        // If we're looking at this conversation, add the message
        if (selectedConversationId === data.conversationId) {
          setMessages(prev => [...prev, data.message]);
          // Mark as read immediately if active
          api.post(`/conversations/${data.conversationId}/read`).catch(() => {});
        }
        
        // Update conversation list
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

      socket.on("conversation_updated", (data: any) => {
        // Handle generic updates if needed
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("new_message");
        socketRef.current.off("conversation_updated");
      }
    };
  }, [selectedConversationId]);

  // Fetch messages when conversation selected
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
        
        // Join socket room
        if (socketRef.current) {
          socketRef.current.emit("join_conversation", { conversationId: selectedConversationId });
        }

        // Reset unread locally
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

  // Auto-scroll
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
      // If it's a virtual conversation, create it first
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
      if (previewMedia) {
        formData.append("attachments", previewMedia.file);
      }

      const res = await api.post(`/conversations/${targetConvId}/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // UI will be updated via socket, but we can optimistically update or rely on socket
      // For now, let the socket handle it for consistency, but reset input
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

  const renderContactItem = (conv: Conversation) => (
    <button
      key={conv._id}
      onClick={() => setSelectedConversationId(conv._id)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
        selectedConversationId === conv._id ? "bg-purple-600/20 border-purple-500/30" : "hover:bg-white/5"
      )}
    >
      <div className="relative">
        <div className={cn("text-purple-400", selectedConversationId === conv._id ? "text-white" : "")}>
          {conv.type === 'group' ? <Users size={24}/> : (
             conv.participant?.avatar ? 
             <img src={conv.participant.avatar} className="w-10 h-10 rounded-full object-cover" /> :
             <UserCircle2 size={40}/>
          )}
        </div>
        {conv.participant?.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
        )}
      </div>
      <div className="text-left min-w-0 flex-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold truncate">{conv.participant?.name || "Unknown User"}</p>
          {conv.lastMessageAt && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <p className="text-[11px] opacity-70 truncate">
          {conv.lastMessage ? conv.lastMessage.message : conv.participant?.role || "Contact"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {conv.unreadCount}
        </span>
      )}
    </button>
  );

  const renderContactItem = (contact: Contact) => (
    <button
      key={contact.id}
      onClick={() => setSelectedUser(contact.id)}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition border border-transparent mb-1",
        selectedUser === contact.id ? "bg-purple-600/20 border-purple-500/30 text-white" : "hover:bg-white/5 text-muted-foreground"
      )}
    >
      <div className="relative flex-shrink-0">
        {contact.type === "group" ? (
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Users size={20} />
          </div>
        ) : (
          <UserCircle2 size={40} className={cn(selectedUser === contact.id ? "text-purple-400" : "text-muted-foreground")} />
        )}
        {contact.status === "Online" && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
        )}
      </div>
      <div className="text-left min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{contact.name}</p>
        <p className="text-[11px] opacity-70 truncate">{contact.role}</p>
      </div>
    </button>
  );
  return (
    <div className="min-h-screen relative bg-background text-white flex flex-col">
      <ParticlesBackground />
      <DashboardTopNav 
        userName={user?.name || "Learner"} 
        userEmail={user?.email || ""} 
        onSignOut={() => { localStorage.removeItem("token"); navigate("/auth"); }} 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        activeView="socialchat" 
        onViewChange={(v) => handleSidebarNav(v, navigate)} 
      />

      <main className={`flex-1 relative z-10 pt-20 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="h-[calc(100vh-5rem)] p-4 md:p-6">
          <div className="relative flex flex-col lg:flex-row h-full w-full min-h-0 gap-4">
      
      {/* SIDEBAR */}
      <GlassCard className="w-full lg:w-80 flex flex-col p-4 backdrop-blur-xl bg-white/5 border-white/10 shrink-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-secondary/30 rounded-full py-2 pl-10 pr-4 outline-none text-sm focus:ring-2 ring-purple-500/40 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Tab Selector */}
        <div className="flex gap-1 mb-4 bg-black/20 p-1 rounded-lg">
          {["all", "user", "group"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                activeTab === tab ? "bg-purple-600 text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {tab === "user" ? "Contacts" : tab}
            </button>
          ))}
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
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
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                      {type === "group" ? "Groups" : "Contacts"}
                    </h3>
                    {section.map((conv) => (
                      <button
                        key={conv._id}
                        onClick={() => setSelectedConversationId(conv._id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                          selectedConversationId === conv._id ? "bg-purple-600/20 border-purple-500/30" : "hover:bg-white/5"
                        )}
                      >
                        <div className="relative">
                          <div className={cn("text-purple-400", selectedConversationId === conv._id ? "text-white" : "")}>
                            {conv.type === 'group' ? <Users size={24}/> : (
                              conv.participant?.avatar ? 
                              <img src={conv.participant.avatar} className="w-10 h-10 rounded-full object-cover" /> :
                              <UserCircle2 size={40}/>
                            )}
                          </div>
                          {conv.participant?.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                          )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold truncate">{conv.participant?.name || "Unknown User"}</p>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-70 truncate">
                            {conv.lastMessage ? conv.lastMessage.message : conv.participant?.role || "Contact"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
            <div className="text-center py-10 text-muted-foreground text-xs">No results found</div>
          )}
        </div>
      </GlassCard>

      {/* CHAT AREA */}
      <GlassCard className="flex-1 flex flex-col min-h-0 overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 relative">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="lg:hidden" onClick={() => setSelectedConversationId(null)}><ChevronLeft size={20}/></div>
                <div className="text-purple-400">
                   {activeConversation.type === 'group' ? <Users size={24}/> : (
                      activeConversation.participant?.avatar ? 
                      <img src={activeConversation.participant.avatar} className="w-8 h-8 rounded-full object-cover" /> :
                      <UserCircle2 size={32}/>
                   )}
                </div>
                <div>
                  <h2 className="font-bold text-sm">{activeConversation.participant?.name || "Unknown User"}</h2>
                  <p className={cn("text-[10px]", activeConversation.participant?.isOnline ? "text-green-400" : "text-muted-foreground")}>
                    {activeConversation.participant?.isOnline ? "Online" : activeConversation.participant?.lastSeen ? `Last seen ${new Date(activeConversation.participant.lastSeen).toLocaleDateString()}` : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Phone size={18} className="cursor-pointer hover:text-white transition" />
                <Video size={20} className="cursor-pointer hover:text-purple-400 transition" onClick={() => setIsCalling(true)} />
                <MoreVertical size={18} className="cursor-pointer hover:text-white transition" />
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-black/10">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Fetching messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg._id} className={cn("flex max-w-[85%] flex-col", msg.sender._id === user?._id ? "ml-auto items-end" : "items-start")}>
                    {activeConversation.type === 'group' && msg.sender._id !== user?._id && (
                      <span className="text-[10px] text-muted-foreground mb-1 ml-2">{msg.sender.name}</span>
                    )}
                    <div className={cn("p-3 rounded-2xl shadow-xl relative group", msg.sender._id === user?._id ? "bg-purple-600 rounded-tr-none text-white" : "bg-white/10 rounded-tl-none border border-white/5")}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx} className="p-2 bg-black/20 rounded-lg flex items-center gap-2 border border-white/10 max-w-[200px]">
                              {att.type === 'image' ? <ImageIcon size={14}/> : <FileText size={14}/>}
                              <a href={`http://localhost:5001${att.url}`} target="_blank" rel="noreferrer" className="text-[10px] truncate hover:underline">
                                {att.filename}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      <span className={cn("text-[9px] mt-1 block opacity-60", msg.sender._id === user?._id ? "text-purple-100" : "text-muted-foreground")}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                  <div className="p-4 rounded-full bg-white/5 border border-white/10">
                    <Hash size={32} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">No messages yet</p>
                  <p className="text-[10px] text-center max-w-[200px]">Start the conversation by typing a message below.</p>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white/5 border-t border-white/10">
              {previewMedia && (
                <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-600 rounded-lg">
                       {previewMedia.type.includes('image') ? <ImageIcon size={16}/> : <FileText size={16}/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate max-w-[200px]">{previewMedia.name}</p>
                      <p className="text-[9px] opacity-60 uppercase">{(previewMedia.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setPreviewMedia(null)} className="p-1 hover:bg-white/10 rounded-full transition">
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaUpload}
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-muted-foreground hover:text-white transition rounded-full hover:bg-white/5"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-secondary/30 rounded-full py-2.5 px-4 outline-none text-sm focus:ring-2 ring-purple-500/40 transition placeholder:text-muted-foreground/50"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Mic size={16} className="text-muted-foreground cursor-pointer hover:text-white" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={(!messageText.trim() && !previewMedia) || sending}
                  className={cn(
                    "p-2.5 rounded-full transition-all flex items-center justify-center",
                    messageText.trim() || previewMedia
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95" 
                      : "bg-white/5 text-muted-foreground"
                  )}
                >
                  {sending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
              <Users size={40} className="text-purple-400 opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">Social Community</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Connect with mentors, study buddies, and peers across different tracks. 
              Select a conversation to start messaging.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                <Hash size={18} className="text-purple-400 mb-2" />
                <p className="text-xs font-bold mb-1">Study Groups</p>
                <p className="text-[10px] text-muted-foreground">Join collaborative spaces for your track.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                <UserCircle2 size={18} className="text-purple-400 mb-2" />
                <p className="text-xs font-bold mb-1">Peer Matching</p>
                <p className="text-[10px] text-muted-foreground">Direct message with your matched buddies.</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
          </div>
        </div>
      </main>
      
      {/* CALL MODAL (STILL MOCK FOR NOW) */}
      {isCalling && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-purple-600 mb-6 flex items-center justify-center animate-pulse">
               <UserCircle2 size={64}/>
            </div>
            <h2 className="text-2xl font-bold mb-1">{activeConversation?.participant?.name}</h2>
            <p className="text-purple-400 mb-12 uppercase tracking-widest text-xs font-bold">Calling...</p>
            
            <div className="flex gap-6">
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <Mic size={24} />
              </button>
              <button className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <VideoOff size={24} />
              </button>
              <button 
                onClick={() => setIsCalling(false)}
                className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition shadow-lg shadow-red-500/40"
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