import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Users, UserPlus, CheckCircle2, BookOpen, Target, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatRoom } from "@/components/chat/ChatRoom";

import { handleSidebarNav } from "@/lib/navHelper";

interface Buddy { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string; experienceLevel?: string; learningGoal?: string; }; }
interface Match { matchId: string; buddy: Buddy; course: string; level: string; matchedAt: string; }

const StudyBuddies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Buddy[]>([]);
  const [myMatches, setMyMatches] = useState<Match[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"find" | "matches">("find");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, buddiesRes, matchesRes] = await Promise.all([
        api.get("/users/profile"), api.get("/match/buddies"), api.get("/match/my-matches")
      ]);
      setUser(profileRes.data.user);
      setSuggestions(buddiesRes.data.data || []);
      setMyMatches(matchesRes.data.data || []);
      setSentRequests(new Set((matchesRes.data.data || []).map((m: Match) => m.buddy._id)));
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleSendRequest = async (targetId: string) => {
    try {
      await api.post("/match/request", { targetUserId: targetId });
      setSentRequests(prev => new Set([...prev, targetId]));
      toast({ title: "Request sent!", description: "Study buddy request sent successfully." });
      const res = await api.get("/match/my-matches");
      setMyMatches(res.data.data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Could not send request", variant: "destructive" });
    }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  const handleOpenChat = (buddy: Buddy) => {
    setSelectedBuddy(buddy);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedBuddy(null);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";
  const skillTrack = user?.learningProfile?.skillTrack;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} activeView="community" onViewChange={(v) => handleSidebarNav(v, navigate)} />
      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className={`grid gap-6 ${showChat ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
            
            {/* Left side: Buddy list */}
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                  <div><h1 className="text-3xl font-bold">Study Buddies</h1><p className="text-muted-foreground text-sm">{skillTrack ? `Matched by: ${skillTrack} track` : "Connect with learners on the same path"}</p></div>
                </div>
              </motion.div>

          <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit">
            {(["find", "matches"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}>
                {tab === "find" ? `Find Buddies (${suggestions.length})` : `My Matches (${myMatches.length})`}
              </button>
            ))}
          </div>

          {activeTab === "find" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {!skillTrack ? (
                <GlassCard className="p-12 text-center text-muted-foreground"><Users size={48} className="mx-auto mb-4 opacity-30" /><p>Complete your profile to find study buddies on your track.</p><GlassButton variant="primary" className="mt-4" onClick={() => navigate("/register")}>Complete Profile</GlassButton></GlassCard>
              ) : suggestions.length === 0 ? (
                <GlassCard className="p-12 text-center text-muted-foreground"><Users size={48} className="mx-auto mb-4 opacity-30" /><p>No other students on your track yet. Check back soon!</p></GlassCard>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {suggestions.map((buddy, idx) => {
                    const isMatched = sentRequests.has(buddy._id);
                    return (
                      <motion.div key={buddy._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                        <GlassCard className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-black shrink-0">{buddy.name[0].toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate">{buddy.name}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {buddy.learningProfile?.skillTrack && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1"><BookOpen size={10} /> {buddy.learningProfile.skillTrack}</span>}
                                {buddy.learningProfile?.experienceLevel && <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">{buddy.learningProfile.experienceLevel}</span>}
                              </div>
                              {buddy.learningProfile?.learningGoal && <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><Target size={10} /> {buddy.learningProfile.learningGoal}</p>}
                            </div>
                          </div>
                          <div className="mt-4">
                            {isMatched ? (
                              <div className="flex items-center gap-2 text-green-400 text-sm font-medium"><CheckCircle2 size={16} /> Connected</div>
                            ) : (
                              <GlassButton variant="primary" size="sm" className="w-full" onClick={() => handleSendRequest(buddy._id)}><UserPlus size={14} /> Connect</GlassButton>
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

          {activeTab === "matches" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {myMatches.length === 0 ? (
                <GlassCard className="p-12 text-center text-muted-foreground"><Users size={48} className="mx-auto mb-4 opacity-30" /><p>No study buddies yet. Find and connect with learners!</p></GlassCard>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myMatches.map((match, idx) => (
                    <motion.div key={match.matchId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                      <GlassCard className="p-5 border-green-500/20">
                        <div className="flex items-start gap-4 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-xl font-bold text-green-400 shrink-0">{match.buddy?.name?.[0]?.toUpperCase() || "?"}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{match.buddy?.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {match.course && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{match.course}</span>}
                              {match.level && <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">{match.level}</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Matched {new Date(match.matchedAt).toLocaleDateString()}</p>
                          </div>
                          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                        </div>
                        <GlassButton 
                          variant="secondary" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleOpenChat(match.buddy)}
                        >
                          <MessageSquare size={14} /> Chat
                        </GlassButton>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
            </div>

            {/* Right side: Chat */}
            {showChat && selectedBuddy && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Chat with {selectedBuddy.name}</h2>
                  <button
                    onClick={handleCloseChat}
                    className="text-muted-foreground hover:text-white transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
                <ChatRoom
                  roomId={`buddy-${[user._id, selectedBuddy._id].sort().join("-")}`}
                  roomName={`Chat with ${selectedBuddy.name}`}
                  currentUserId={user._id}
                  currentUserName={user.name}
                />
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default StudyBuddies;
