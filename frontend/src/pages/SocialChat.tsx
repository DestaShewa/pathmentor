import React, { useState, useRef, useEffect } from "react";
import {
  Search, Send, UserCircle2, MoreVertical, Phone, Video,
  Hash, Paperclip, X, Mic, VideoOff, PhoneOff, 
  Image as ImageIcon, FileText, Users, ChevronLeft
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

// --- Types ---
type ContactType = "user" | "group"; // Removed 'ai'

interface Contact {
  id: number | string;
  name: string;
  status: string;
  role: string;
  type: ContactType;
}

const SocialChat = () => {
  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | string>(1);
  const [activeTab, setActiveTab] = useState<"all" | ContactType>("all");
  const [message, setMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ name: string; type: string } | null>(null);

  // Dynamic Chat History (Removed AI history)
  const [chatHistory, setChatHistory] = useState<Record<string | number, any[]>>({
    1: [
      { id: 101, text: "Selam! Great progress on PathMentor 🚀", sender: "them", time: "10:45 AM" },
      { id: 102, text: "Finished authentication module today.", sender: "me", time: "10:47 AM" },
    ],
    "group-1": [
      { id: 201, text: "Does anyone have the notes for the Distributed Systems lecture?", sender: "them", name: "Sara", time: "11:00 AM" },
    ],
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data (Removed AI Contact) ---
  const contacts: Contact[] = [
    { id: 1, name: "Abebe Kebede", status: "Online", role: "Mentor", type: "user" },
    { id: 2, name: "Sara Tesfaye", status: "Last seen 2h ago", role: "Student", type: "user" },
    { id: 3, name: "Samuel Hailu", status: "Online", role: "Admin", type: "user" },
    { id: "group-1", name: "Web Dev 2026", status: "12 Members", role: "Study Group", type: "group" },
    { id: "group-2", name: "MERN Project Team", status: "5 Members", role: "Project Group", type: "group" },
  ];

  // --- Logic ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, selectedUser]);

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || c.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const activeContact = contacts.find((c) => c.id === selectedUser);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() && !previewMedia) return;

    const newMessage = {
      id: Date.now(),
      text: message,
      media: previewMedia,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => ({
      ...prev,
      [selectedUser]: [...(prev[selectedUser] || []), newMessage]
    }));

    setMessage("");
    setPreviewMedia(null);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreviewMedia({ name: file.name, type: file.type });
  };

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
    <div className="relative flex flex-col lg:flex-row h-full w-full min-h-0 gap-4 p-2 lg:p-0">
      
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

        {/* Categories Tab Selector (Removed AI) */}
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
          {filteredContacts.length > 0 ? (
            <>
              {["group", "user"].map((type) => {
                const section = filteredContacts.filter(c => c.type === type);
                if (section.length === 0) return null;
                return (
                  <div key={type} className="mb-4">
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                      {type === "group" ? "Groups" : "Contacts"}
                    </h3>
                    {section.map(renderContactItem)}
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
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="lg:hidden" onClick={() => setSelectedUser("")}><ChevronLeft size={20}/></div>
                <div className="text-purple-400">
                   {activeContact.type === 'group' ? <Users size={24}/> : <UserCircle2 size={32}/>}
                </div>
                <div>
                  <h2 className="font-bold text-sm">{activeContact.name}</h2>
                  <p className={cn("text-[10px]", activeContact.status.includes("Online") ? "text-green-400" : "text-muted-foreground")}>
                    {activeContact.status}
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
              {chatHistory[selectedUser]?.map((msg) => (
                <div key={msg.id} className={cn("flex max-w-[85%] flex-col", msg.sender === "me" ? "ml-auto items-end" : "items-start")}>
                  {msg.name && <span className="text-[10px] text-muted-foreground mb-1 ml-2">{msg.name}</span>}
                  <div className={cn("p-3 rounded-2xl shadow-xl", msg.sender === "me" ? "bg-purple-600 rounded-tr-none text-white" : "bg-white/10 rounded-tl-none border border-white/5")}>
                    {msg.media && (
                      <div className="mb-2 p-2 bg-black/20 rounded-lg flex items-center gap-2 border border-white/10">
                        {msg.media.type.includes('image') ? <ImageIcon size={14}/> : <FileText size={14}/>}
                        <span className="text-[10px] truncate max-w-[120px]">{msg.media.name}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span className={cn("text-[9px] mt-1 block opacity-60", msg.sender === "me" ? "text-purple-100" : "text-muted-foreground")}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-md">
              {previewMedia && (
                <div className="mb-3 flex items-center justify-between bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-xs text-purple-200">
                    <Paperclip size={14} />
                    <span className="truncate">{previewMedia.name}</span>
                  </div>
                  <button onClick={() => setPreviewMedia(null)} className="text-muted-foreground hover:text-white"><X size={16} /></button>
                </div>
              )}
              <form className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-3 focus-within:ring-1 ring-purple-500/50 transition" onSubmit={handleSendMessage}>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-purple-400 transition">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  placeholder="Message..."
                  className="flex-1 bg-transparent outline-none text-sm px-2 text-white"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!message.trim() && !previewMedia}
                  className={cn("p-2 rounded-xl transition", (message.trim() || previewMedia) ? "bg-purple-600 text-white" : "bg-gray-600/20 text-gray-500")}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 opacity-40">
            <Hash size={60} className="mb-4 stroke-[1px]" />
            <p className="text-sm font-medium">Select a group or contact to start</p>
          </div>
        )}

        {/* Video Call Simulation */}
        {isCalling && (
          <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-32 h-32 rounded-full bg-purple-600/20 flex items-center justify-center mb-6 ring-2 ring-purple-500 ring-offset-4 ring-offset-black animate-pulse">
              <UserCircle2 size={80} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{activeContact?.name}</h2>
            <p className="text-purple-400 text-sm mb-16 font-mono tracking-tighter">ESTABLISHING P2P CONNECTION...</p>
            <div className="flex gap-8">
              <button className="p-5 bg-white/5 rounded-full hover:bg-white/10 border border-white/10 transition text-white"><Mic size={28} /></button>
              <button className="p-5 bg-white/5 rounded-full hover:bg-white/10 border border-white/10 transition text-white"><VideoOff size={28} /></button>
              <button onClick={() => setIsCalling(false)} className="p-5 bg-red-600 rounded-full hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition text-white"><PhoneOff size={28} /></button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default SocialChat;