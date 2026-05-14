import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, CheckCircle2, X, Star, MessageSquare, Video, CalendarClock, RefreshCw } from "lucide-react";

// Convert datetime-local input value to ISO UTC string
const convertLocalToUTC = (localDatetimeString: string): string => {
  if (!localDatetimeString) return "";
  const date = new Date(localDatetimeString);
  return date.toISOString();
};

// Convert ISO UTC string to local datetime-local format for display
const convertUTCToLocal = (utcString: string): string => {
  if (!utcString) return "";
  const date = new Date(utcString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface Session {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  date: string;
  status: "scheduled" | "completed" | "cancelled";
  summary?: string;
  feedback?: string;
  studentRating?: number;
  studentComment?: string;
  meetingLink?: string;
}

const statusColors = {
  scheduled: "bg-blue-500/20 text-blue-300",
  completed:  "bg-green-500/20 text-green-300",
  cancelled:  "bg-red-500/20 text-red-300",
};

const MentorSessions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser]         = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assignedStudents, setAssignedStudents] = useState<Array<{_id:string,name:string,email:string}>>([]);

  // Booking modal (mentor scheduling for a student)
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookStudentId, setBookStudentId] = useState<string | null>(null);
  const [bookDate, setBookDate] = useState("");
  const [booking, setBooking] = useState(false);

  // Complete session modal
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [summary, setSummary]   = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving]     = useState(false);

  // Postpone session modal
  const [postponingId, setPostponingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [postponing, setPostponing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, sessionsRes, studentsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/sessions"),
        api.get("/mentor/my-students")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setSessions(sessionsRes.data.data || []);
      setAssignedStudents(studentsRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) { navigate("/auth"); }
    } finally { setLoading(false); }
  };

  const handleBookSession = async () => {
    if (!bookStudentId || !bookDate) { toast({ title: "Error", description: "Select student and date/time", variant: "destructive" }); return; }
    const dt = new Date(bookDate);
    if (dt <= new Date()) { toast({ title: "Error", description: "Date must be in the future", variant: "destructive" }); return; }
    setBooking(true);
    try {
      const utcDate = convertLocalToUTC(bookDate);
      await api.post("/sessions/book-by-mentor", { studentId: bookStudentId, date: utcDate });
      toast({ title: "Session scheduled" });
      setShowBookModal(false); setBookStudentId(null); setBookDate("");
      fetchData();
    } catch (e: any) { toast({ title: "Error", description: e?.response?.data?.message || "Failed", variant: "destructive" }); }
    finally { setBooking(false); }
  };

  const handleComplete = async () => {
    if (!completingId) return;
    setSaving(true);
    try {
      await api.put(`/sessions/${completingId}/complete`, { summary, feedback });
      toast({ title: "Session completed!" });
      setCompletingId(null); setSummary(""); setFeedback("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleCancel = async (id: string, sessionDate: string) => {
    const sessionTime = new Date(sessionDate);
    const now = new Date();
    
    if (sessionTime <= now) {
      toast({ 
        title: "Cannot Cancel", 
        description: "Cannot cancel a session that has already started or passed", 
        variant: "destructive" 
      });
      return;
    }

    if (!confirm("Are you sure you want to cancel this session?")) return;

    try {
      await api.put(`/sessions/${id}/cancel`);
      toast({ title: "Session cancelled" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handlePostpone = async () => {
    if (!postponingId || !newDate) {
      toast({ title: "Error", description: "Please select a new date and time", variant: "destructive" });
      return;
    }

    const newDateTime = new Date(newDate);
    if (newDateTime <= new Date()) {
      toast({ title: "Error", description: "New date must be in the future", variant: "destructive" });
      return;
    }

    setPostponing(true);
    try {
      const utcDate = convertLocalToUTC(newDate);
      await api.put(`/sessions/${postponingId}/postpone`, { newDate: utcDate });
      toast({ title: "Session postponed successfully" });
      setPostponingId(null);
      setNewDate("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally {
      setPostponing(false);
    }
  };

  const canJoinSession = (sessionDate: string) => {
    const sessionTime = new Date(sessionDate);
    const now = new Date();
    const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / 60000);
    
    // Can join 15 minutes before until 60 minutes after
    return minutesUntil <= 15 && minutesUntil > -60;
  };

  const getTimeUntilSession = (sessionDate: string) => {
    const sessionTime = new Date(sessionDate);
    const now = new Date();
    const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / 60000);
    
    if (minutesUntil < 0) return "Session time passed";
    if (minutesUntil === 0) return "Starting now";
    if (minutesUntil < 60) return `In ${minutesUntil}m`;
    const hours = Math.floor(minutesUntil / 60);
    return `In ${hours}h ${minutesUntil % 60}m`;
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const upcoming  = sessions.filter(s => s.status === "scheduled");
  const completed = sessions.filter(s => s.status === "completed");
  const cancelled = sessions.filter(s => s.status === "cancelled");

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">My <span className="text-primary">Sessions</span></h1>
            <p className="text-muted-foreground text-sm mt-1">{sessions.length} total sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-sm">
              <RefreshCw size={15} />
            </button>
            <GlassButton variant="primary" onClick={() => setShowBookModal(true)}>
              Schedule Session
            </GlassButton>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Upcoming",  value: upcoming.length,  color: "text-blue-400",    bg: "bg-blue-500/10" },
            { label: "Completed", value: completed.length, color: "text-green-400",   bg: "bg-green-500/10" },
            { label: "Cancelled", value: cancelled.length, color: "text-red-400",     bg: "bg-red-500/10" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {sessions.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground text-sm">Students will book sessions with you once you're approved and visible.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, i) => (
              <motion.div key={session._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                        {session.studentId?.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <p className="font-bold">{session.studentId?.name}</p>
                        <p className="text-xs text-muted-foreground">{session.studentId?.email}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(session.date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(session.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        {session.summary && <p className="text-xs text-muted-foreground mt-1.5 italic">"{session.summary}"</p>}
                        {session.studentRating && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {Array.from({ length: session.studentRating }).map((_, i) => (
                              <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                            ))}
                            {session.studentComment && <span className="text-xs text-muted-foreground ml-1">"{session.studentComment}"</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[session.status]}`}>
                        {session.status.toUpperCase()}
                      </span>
                      {session.status === "scheduled" && (
                        <div className="flex flex-col gap-2">
                          {/* Join button - only available 15 min before until 60 min after */}
                          {canJoinSession(session.date) ? (
                            <button
                              onClick={() => {
                                if (session.meetingLink) {
                                  window.open(session.meetingLink, "_blank");
                                } else {
                                  navigate(`/room/${session._id}`);
                                }
                              }}
                              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-primary text-black hover:bg-primary/90 transition-all whitespace-nowrap"
                            >
                              <Video size={13} /> Join Session
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getTimeUntilSession(session.date)}
                            </span>
                          )}
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setPostponingId(session._id);
                                // Set default to 1 hour from now
                                const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
                                setNewDate(oneHourLater.toISOString().slice(0, 16));
                              }}
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
                            >
                              <CalendarClock size={13} /> Postpone
                            </button>
                            <button onClick={() => setCompletingId(session._id)}
                              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors whitespace-nowrap">
                              <CheckCircle2 size={13} /> Complete
                            </button>
                            <button onClick={() => handleCancel(session._id, session.date)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Complete session modal */}
      <AnimatePresence>
        {completingId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={() => setCompletingId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 border-green-500/30">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-400" /> Complete Session
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Session Summary
                    </label>
                    <textarea 
                      value={summary} 
                      onChange={e => setSummary(e.target.value)} 
                      rows={3}
                      placeholder="What was covered in this session?"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Feedback for Student
                    </label>
                    <textarea 
                      value={feedback} 
                      onChange={e => setFeedback(e.target.value)} 
                      rows={3}
                      placeholder="Feedback and next steps for the student..."
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none text-sm" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <GlassButton variant="primary" onClick={handleComplete} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : "Mark Complete"}
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={() => setCompletingId(null)}>Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book session modal (mentor) */}
      <AnimatePresence>
        {showBookModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBookModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold mb-4">Schedule Session for Student</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Student</label>
                    <select value={bookStudentId || ""} onChange={e => setBookStudentId(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground">
                      <option value="">Select a student...</option>
                      {assignedStudents.map(st => (
                        <option key={st._id} value={st._id}>{st.name} — {st.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Date & Time</label>
                    <input type="datetime-local" value={bookDate} onChange={e => setBookDate(e.target.value)} min={new Date().toISOString().slice(0,16)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <GlassButton variant="primary" onClick={handleBookSession} disabled={booking} className="flex-1">{booking ? "Scheduling..." : "Schedule"}</GlassButton>
                  <GlassButton variant="secondary" onClick={() => setShowBookModal(false)}>Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Postpone session modal */}
      <AnimatePresence>
        {postponingId && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={() => setPostponingId(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="w-full max-w-md"
            >
              <GlassCard className="p-6 border-blue-500/30">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CalendarClock size={20} className="text-blue-400" /> Postpone Session
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      New Date & Time
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input 
                        type="datetime-local" 
                        value={newDate} 
                        onChange={e => setNewDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      The student will be notified about the new time
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <GlassButton variant="primary" onClick={handlePostpone} disabled={postponing} className="flex-1">
                    {postponing ? "Postponing..." : "Confirm Postpone"}
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={() => setPostponingId(null)}>Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorSessions;
