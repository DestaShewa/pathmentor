import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { 
  Calendar, Clock, Video, MessageSquare, Star, 
  ChevronLeft, Users, Shield, FileText, CheckCircle2,
  AlertCircle, History, ExternalLink, Hand, Smile
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Session {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  mentorId: { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  meetingLink: string;
  summary?: string;
  feedback?: string;
  studentRating?: number;
  studentComment?: string;
}

const SessionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [id, navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, sessionRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/sessions/${id}`)
      ]);
      setUser(profileRes.data.user);
      setSession(sessionRes.data.data);
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to load session details", variant: "destructive" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session || session.status !== "scheduled") return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const sessionDate = new Date(session.date).getTime();
      const distance = sessionDate - now;

      if (distance < 0) {
        setTimeLeft("Session started");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!session) return null;

  const isMentor = user?.role === "mentor";
  const otherUser = isMentor ? session.studentId : session.mentorId;
  const sessionTime = new Date(session.date);
  const canJoin = session.status === "scheduled" && (sessionTime.getTime() - new Date().getTime()) <= 15 * 60 * 1000;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav 
        userName={user?.name || "User"} 
        userEmail={user?.email || ""} 
        onSignOut={handleSignOut} 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {isMentor ? (
        <MentorSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userName={user?.name}
          userEmail={user?.email}
          onSignOut={handleSignOut}
        />
      ) : (
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          activeView="sessions" 
          onViewChange={(v) => navigate("/sessions")} 
        />
      )}

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-6 group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Sessions
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              <GlassCard className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-black shrink-0">
                      {otherUser?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-white">{isMentor ? "Session with Student" : "Mentor Session"}</h1>
                      <p className="text-muted-foreground">{otherUser?.name}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      session.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                      session.status === "completed" ? "bg-green-500/20 text-green-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {session.status}
                    </span>
                    <p className="text-xs text-muted-foreground">ID: {session._id.slice(-8)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Calendar className="text-primary mb-2" size={20} />
                    <p className="text-sm font-bold">{sessionTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Session Date</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <Clock className="text-primary mb-2" size={20} />
                    <p className="text-sm font-bold">{sessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Start Time</p>
                  </div>
                </div>

                {session.status === "scheduled" && (
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-4">
                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Countdown to Live</h3>
                    <p className="text-4xl font-black font-mono tracking-tighter">{timeLeft || "--h --m --s"}</p>
                    <div className="pt-2">
                      <GlassButton 
                        variant="primary" 
                        glow 
                        className="w-full py-4 text-lg"
                        disabled={!canJoin}
                        onClick={() => navigate(`/room/${session._id}`)}
                      >
                        <Video size={20} />
                        {canJoin ? "Join Live Session" : "Join available 15m before"}
                      </GlassButton>
                    </div>
                  </div>
                )}

                {session.status === "completed" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
                      <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <CheckCircle2 size={16} /> Session Summary
                      </h3>
                      <p className="text-muted-foreground leading-relaxed italic">
                        {session.summary || "No summary provided for this session."}
                      </p>
                    </div>
                    {session.feedback && (
                      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <FileText size={16} /> Mentor Feedback
                        </h3>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {session.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Hand size={20} className="text-primary" /> Session Features
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                   {[
                     { title: "Direct Join", desc: "Access the call without third-party links", icon: Video },
                     { title: "Live Chat", desc: "In-session real-time messaging", icon: MessageSquare },
                     { title: "Raise Hand", desc: "Get mentor's attention during call", icon: Hand },
                     { title: "Reactions", desc: "Express yourself with live emojis", icon: Smile },
                     { title: "Screen Share", desc: "Share your code or presentation", icon: Users },
                     { title: "Recording", desc: "Session archived for later review", icon: History },
                   ].map((feat, i) => (
                     <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <feat.icon className="text-primary" size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{feat.title}</p>
                          <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </GlassCard>

            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              
              <GlassCard className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Participant</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {otherUser?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{otherUser?.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{otherUser?.email}</p>
                  </div>
                </div>
                {!isMentor && session.mentorId?.learningProfile?.skillTrack && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Expertise</p>
                    <p className="text-xs font-medium">{session.mentorId.learningProfile.skillTrack}</p>
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Resources</h3>
                <div className="space-y-2">
                  <button className="w-full p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-left hover:border-primary/50 transition-all group">
                    <FileText size={16} className="text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-medium">Session Guide.pdf</span>
                  </button>
                  <button className="w-full p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-left hover:border-primary/50 transition-all group">
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary" />
                    <span className="text-xs font-medium">Shared Repository</span>
                  </button>
                </div>
              </GlassCard>

              {session.studentRating && (
                <GlassCard className="p-6 border-amber-500/30">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400 mb-4">Rating</h3>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className={i < session.studentRating! ? "text-amber-400 fill-amber-400" : "text-white/10"} />
                    ))}
                  </div>
                  {session.studentComment && (
                    <p className="text-xs text-muted-foreground italic">"{session.studentComment}"</p>
                  )}
                </GlassCard>
              )}

            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default SessionDetail;
