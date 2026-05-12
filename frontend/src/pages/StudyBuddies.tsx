import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { handleSidebarNav } from "@/lib/navHelper";
import { toast } from "sonner";
import {
  Users, UserPlus, CheckCircle2, BookOpen, Target,
  MessageSquare, Clock, X, Bell, RefreshCw, UserX
} from "lucide-react";

interface Buddy {
  _id: string;
  name: string;
  email: string;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
    learningGoal?: string;
  };
}

interface Match {
  matchId: string;
  buddy: Buddy;
  course: string;
  level: string;
  matchedAt: string;
}

interface PendingRequest {
  matchId: string;
  from: Buddy;
  course: string;
  level: string;
  sentAt: string;
}

interface SentRequest {
  matchId: string;
  to: Buddy;
  course: string;
  sentAt: string;
}

type Tab = "find" | "matches" | "requests";

const StudyBuddies = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Buddy[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("find");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Chat state — only for accepted matches
  const [chatBuddy, setChatBuddy] = useState<Buddy | null>(null);
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, buddiesRes, matchesRes, pendingRes, sentRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/match/buddies"),
        api.get("/match/my-matches"),
        api.get("/match/pending"),
        api.get("/match/sent"),
      ]);
      setUser(profileRes.data.user);
      setSuggestions(buddiesRes.data.data || []);
      setMyMatches(matchesRes.data.data || []);
      setPendingRequests(pendingRes.data.data || []);
      setSentRequests(sentRes.data.data || []);
    } catch {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    setActionLoading(targetId);
    try {
      await api.post("/match/request", { targetUserId: targetId });
      toast.success("Study buddy request sent! Waiting for acceptance.");
      // Remove from suggestions, add to sent
      setSuggestions((prev) => prev.filter((b) => b._id !== targetId));
      await fetchAll();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Could not send request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await api.put(`/match/${matchId}/accept`);
      toast.success("Study buddy accepted! You can now chat.");
      await fetchAll();
      setActiveTab("matches");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (matchId: string) => {
    setActionLoading(matchId);
    try {
      await api.put(`/match/${matchId}/reject`);
      toast.success("Request declined.");
      setPendingRequests((prev) => prev.filter((r) => r.matchId !== matchId));
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMatch = async (matchId: string) => {
    if (!window.confirm("Remove this study buddy connection?")) return;
    setActionLoading(matchId);
    try {
      await api.delete(`/match/${matchId}`);
      toast.success("Connection removed.");
      setMyMatches((prev) => prev.filter((m) => m.matchId !== matchId));
      if (chatMatchId === matchId) { setChatBuddy(null); setChatMatchId(null); }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove");
    } finally {
      setActionLoading(null);
    }
  };

  const openChat = (buddy: Buddy, matchId: string) => {
    setChatBuddy(buddy);
    setChatMatchId(matchId);
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";
  const skillTrack = user?.learningProfile?.skillTrack;

  const tabCounts: Record<Tab, number> = {
    find: suggestions.length,
    matches: myMatches.length,
    requests: pendingRequests.length,
  };

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
        activeView="community"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className={`grid gap-6 ${chatBuddy ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>

            {/* ── LEFT: Buddy system ── */}
            <div className="space-y-6">
              {/* Header */}
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Study Buddies</h1>
                      <p className="text-muted-foreground text-sm">
                        {skillTrack ? `Track: ${skillTrack}` : "Connect with learners on the same path"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={fetchAll}
                    className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </motion.div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit">
                {(["find", "matches", "requests"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {tab === "find" ? `Find (${tabCounts.find})` : tab === "matches" ? `Connected (${tabCounts.matches})` : "Requests"}
                    {tab === "requests" && pendingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── FIND TAB ── */}
              <AnimatePresence mode="wait">
                {activeTab === "find" && (
                  <motion.div key="find" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {!skillTrack ? (
                      <GlassCard className="p-12 text-center text-muted-foreground">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Complete your profile to find study buddies on your track.</p>
                        <GlassButton variant="primary" className="mt-4" onClick={() => navigate("/register")}>
                          Complete Profile
                        </GlassButton>
                      </GlassCard>
                    ) : suggestions.length === 0 ? (
                      <GlassCard className="p-12 text-center text-muted-foreground">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No new students on your track yet.</p>
                        <p className="text-sm mt-1">Check back as more students join the {skillTrack} track.</p>
                      </GlassCard>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {suggestions.map((buddy, idx) => {
                          const isSent = sentRequests.some((s) => s.to._id === buddy._id);
                          return (
                            <motion.div key={buddy._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                              <GlassCard className="p-5">
                                <div className="flex items-start gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-black shrink-0">
                                    {buddy.name[0].toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{buddy.name}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {buddy.learningProfile?.skillTrack && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                          <BookOpen size={10} /> {buddy.learningProfile.skillTrack}
                                        </span>
                                      )}
                                      {buddy.learningProfile?.experienceLevel && (
                                        <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                                          {buddy.learningProfile.experienceLevel}
                                        </span>
                                      )}
                                    </div>
                                    {buddy.learningProfile?.learningGoal && (
                                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <Target size={10} /> {buddy.learningProfile.learningGoal}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  {isSent ? (
                                    <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                      <Clock size={15} /> Request Pending
                                    </div>
                                  ) : (
                                    <GlassButton
                                      variant="primary"
                                      size="sm"
                                      className="w-full"
                                      disabled={actionLoading === buddy._id}
                                      onClick={() => handleSendRequest(buddy._id)}
                                    >
                                      <UserPlus size={14} />
                                      {actionLoading === buddy._id ? "Sending..." : "Connect"}
                                    </GlassButton>
                                  )}
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── MATCHES TAB (accepted only — chat enabled) ── */}
                {activeTab === "matches" && (
                  <motion.div key="matches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {myMatches.length === 0 ? (
                      <GlassCard className="p-12 text-center text-muted-foreground">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No accepted connections yet.</p>
                        <p className="text-sm mt-1">Send requests and wait for them to be accepted.</p>
                      </GlassCard>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {myMatches.map((match, idx) => {
                          const isChattingWith = chatMatchId === match.matchId;
                          return (
                            <motion.div key={match.matchId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                              <GlassCard className={`p-5 ${isChattingWith ? "border-primary/40" : "border-emerald-500/20"}`}>
                                <div className="flex items-start gap-4 mb-3">
                                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl font-bold text-emerald-400 shrink-0">
                                    {match.buddy?.name?.[0]?.toUpperCase() || "?"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold truncate">{match.buddy?.name}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {match.course && (
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{match.course}</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Connected {new Date(match.matchedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-1" />
                                </div>
                                <div className="flex gap-2">
                                  <GlassButton
                                    variant={isChattingWith ? "primary" : "secondary"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      if (isChattingWith) { setChatBuddy(null); setChatMatchId(null); }
                                      else openChat(match.buddy, match.matchId);
                                    }}
                                  >
                                    <MessageSquare size={14} />
                                    {isChattingWith ? "Close Chat" : "Chat"}
                                  </GlassButton>
                                  <button
                                    onClick={() => handleRemoveMatch(match.matchId)}
                                    disabled={actionLoading === match.matchId}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                    title="Remove connection"
                                  >
                                    <UserX size={14} />
                                  </button>
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── REQUESTS TAB (incoming pending requests) ── */}
                {activeTab === "requests" && (
                  <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                    {/* Incoming requests */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Bell size={14} /> Incoming Requests ({pendingRequests.length})
                      </h3>
                      {pendingRequests.length === 0 ? (
                        <GlassCard className="p-8 text-center text-muted-foreground">
                          <Bell size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No pending requests.</p>
                        </GlassCard>
                      ) : (
                        <div className="space-y-3">
                          {pendingRequests.map((req) => (
                            <GlassCard key={req.matchId} className="p-4 border-amber-500/20">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg font-bold text-amber-400 shrink-0">
                                  {req.from?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm">{req.from?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {req.from?.learningProfile?.skillTrack || req.course} · {new Date(req.sentAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => handleAccept(req.matchId)}
                                    disabled={actionLoading === req.matchId}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50"
                                  >
                                    <CheckCircle2 size={13} />
                                    {actionLoading === req.matchId ? "..." : "Accept"}
                                  </button>
                                  <button
                                    onClick={() => handleReject(req.matchId)}
                                    disabled={actionLoading === req.matchId}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
                                  >
                                    <X size={13} />
                                    Decline
                                  </button>
                                </div>
                              </div>
                            </GlassCard>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sent requests */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock size={14} /> Sent Requests ({sentRequests.length})
                      </h3>
                      {sentRequests.length === 0 ? (
                        <GlassCard className="p-8 text-center text-muted-foreground">
                          <Clock size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No pending sent requests.</p>
                        </GlassCard>
                      ) : (
                        <div className="space-y-3">
                          {sentRequests.map((req) => (
                            <GlassCard key={req.matchId} className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold text-white shrink-0">
                                  {req.to?.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm">{req.to?.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Sent {new Date(req.sentAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                  <Clock size={10} /> Pending
                                </span>
                              </div>
                            </GlassCard>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RIGHT: Chat (only for accepted matches) ── */}
            <AnimatePresence>
              {chatBuddy && chatMatchId && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <MessageSquare size={18} className="text-primary" />
                      Chat with {chatBuddy.name}
                    </h2>
                    <button
                      onClick={() => { setChatBuddy(null); setChatMatchId(null); }}
                      className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <ChatRoom
                    roomId={`buddy-${[user._id, chatBuddy._id].sort().join("-")}`}
                    roomName={`Chat with ${chatBuddy.name}`}
                    currentUserId={user._id}
                    currentUserName={user.name}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default StudyBuddies;
