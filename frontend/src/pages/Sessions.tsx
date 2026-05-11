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
import { Calendar, Clock, Star, X, Video, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Mentor { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string }; }
interface Session {
  _id: string;
  mentorId: { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  summary?: string;
  studentRating?: number;
  meetingLink?: string;
}

import { handleSidebarNav } from "@/lib/navHelper";

const statusColors = { scheduled: "bg-blue-500/20 text-blue-300", completed: "bg-green-500/20 text-green-300", cancelled: "bg-red-500/20 text-red-300" };

const Sessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, mentorsRes, sessionsRes] = await Promise.all([
        api.get("/users/profile"), api.get("/sessions/mentors"), api.get("/sessions/my")
      ]);
      setUser(profileRes.data.user);
      setMentors(mentorsRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleBook = async () => {
    if (!selectedMentor || !selectedDate) { toast({ title: "Error", description: "Please select a mentor and date", variant: "destructive" }); return; }
    setBooking(true);
    try {
      await api.post("/sessions/book", { mentorId: selectedMentor, date: selectedDate });
      toast({ title: "Session booked!", description: "Your session has been scheduled." });
      setShowBookingForm(false); setSelectedMentor(""); setSelectedDate("");
      const res = await api.get("/sessions/my");
      setSessions(res.data.data || []);
    } catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Booking failed", variant: "destructive" }); }
    finally { setBooking(false); }
  };

  const handleCancel = async (sessionId: string) => {
    try {
      await api.put(`/sessions/${sessionId}/cancel`);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: "cancelled" as const } : s));
      toast({ title: "Session cancelled" });
    } catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Cancel failed", variant: "destructive" }); }
  };

  const handleSubmitRating = async () => {
    if (!ratingSessionId || rating === 0) return;
    try {
      await api.put(`/sessions/${ratingSessionId}/rate`, { rating, comment: ratingComment });
      setSessions(prev => prev.map(s => s._id === ratingSessionId ? { ...s, studentRating: rating } : s));
      setRatingSessionId(null); setRating(0); setRatingComment("");
      toast({ title: "Rating submitted!" });
    } catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Rating failed", variant: "destructive" }); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} activeView="sessions" onViewChange={(v) => handleSidebarNav(v, navigate)} />
      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Video className="w-5 h-5 text-primary" /></div>
              <div><h1 className="text-3xl font-bold">Mentor Sessions</h1><p className="text-muted-foreground text-sm">Book 1-on-1 sessions with approved mentors</p></div>
            </div>
            <GlassButton variant="primary" onClick={() => setShowBookingForm(true)}><Calendar size={16} /> Book Session</GlassButton>
          </motion.div>

          <AnimatePresence>
            {showBookingForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <GlassCard className="p-6 border-primary/30">
                  <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Book a Session</h2><button onClick={() => setShowBookingForm(false)} className="p-2 rounded-xl hover:bg-white/10"><X size={18} /></button></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Select Mentor</label>
                      <select value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary">
                        <option value="">Choose a mentor...</option>
                        {mentors.map(m => <option key={m._id} value={m._id}>{m.name}{m.learningProfile?.skillTrack ? ` — ${m.learningProfile.skillTrack}` : ""}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Date & Time</label>
                      <input type="datetime-local" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <GlassButton variant="primary" onClick={handleBook} disabled={booking}>{booking ? "Booking..." : "Confirm Booking"}</GlassButton>
                    <GlassButton variant="secondary" onClick={() => setShowBookingForm(false)}>Cancel</GlassButton>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <h2 className="text-lg font-bold mb-4">My Sessions</h2>
            {sessions.length === 0 ? (
              <GlassCard className="p-12 text-center text-muted-foreground"><Calendar size={48} className="mx-auto mb-4 opacity-30" /><p>No sessions yet. Book your first session with a mentor!</p></GlassCard>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, idx) => (
                  <motion.div key={session._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <GlassCard className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">{session.mentorId?.name?.[0]?.toUpperCase() || "M"}</div>
                          <div>
                            <p className="font-bold">{session.mentorId?.name}</p>
                            {session.mentorId?.learningProfile?.skillTrack && <p className="text-xs text-muted-foreground">{session.mentorId.learningProfile.skillTrack}</p>}
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(session.date).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(session.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            {session.summary && <p className="text-sm text-muted-foreground mt-2 italic">"{session.summary}"</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[session.status]}`}>{session.status.toUpperCase()}</span>
                          {session.status === "scheduled" && (
                            <>
                              {/* Join call button — available 15 min before */}
                              {(() => {
                                const minsUntil = Math.round((new Date(session.date).getTime() - Date.now()) / 60000);
                                return minsUntil <= 15 && minsUntil > -60 ? (
                                  <button
                                    onClick={() => navigate(`/room/${session._id}`)}
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all"
                                  >
                                    <Video size={13} /> Join Call
                                  </button>
                                ) : null;
                              })()}
                              <button onClick={() => handleCancel(session._id)} className="text-xs text-red-400 hover:text-red-300">Cancel</button>
                            </>
                          )}
                          {session.status === "completed" && !session.studentRating && <button onClick={() => setRatingSessionId(session._id)} className="text-xs text-primary flex items-center gap-1"><Star size={12} /> Rate</button>}
                          {session.studentRating && <div className="flex items-center gap-0.5 text-yellow-400 text-xs">{Array.from({ length: session.studentRating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {ratingSessionId && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRatingSessionId(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
                  <GlassCard className="p-6">
                    <h2 className="text-xl font-bold mb-4">Rate Your Session</h2>
                    <div className="flex gap-2 mb-4">{[1,2,3,4,5].map(star => <button key={star} onClick={() => setRating(star)} className={`text-3xl transition-transform hover:scale-110 ${star <= rating ? "text-yellow-400" : "text-white/20"}`}>★</button>)}</div>
                    <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Optional comment..." rows={3} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none mb-4" />
                    <div className="flex gap-3">
                      <GlassButton variant="primary" onClick={handleSubmitRating} disabled={rating === 0}>Submit Rating</GlassButton>
                      <GlassButton variant="secondary" onClick={() => setRatingSessionId(null)}>Cancel</GlassButton>
                    </div>
                  </GlassCard>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Sessions;
