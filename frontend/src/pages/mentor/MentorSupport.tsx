import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { disconnectSocket } from "@/services/socket";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { toast } from "sonner";
import {
  Ticket, Plus, Send, ChevronDown, ChevronUp,
  Clock, CheckCircle2, X, MessageSquare,
  AlertCircle, RefreshCw
} from "lucide-react";

interface Reply {
  _id: string;
  author: { name: string; role: string };
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  replies: Reply[];
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  "Open":        "bg-yellow-500/20 text-yellow-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "Resolved":    "bg-emerald-500/20 text-emerald-400",
  "Closed":      "bg-slate-500/20 text-slate-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low:      "bg-slate-500/20 text-slate-400",
  Medium:   "bg-amber-500/20 text-amber-400",
  High:     "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

const CATEGORIES = ["Technical", "Student Issue", "Course", "Platform", "Account", "Other"];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const MentorSupport = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, ticketsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/support-tickets/my"),
      ]);
      const userData = profileRes.data.user;
      if (userData.role !== "mentor") { navigate("/dashboard"); return; }
      if (userData.mentorVerification?.status !== "approved") { navigate("/mentor/pending"); return; }
      setUser(userData);
      setTickets(ticketsRes.data.data || []);
    } catch {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Subject and description are required");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/support-tickets", { subject, description, category, priority });
      toast.success("Support ticket submitted! We'll respond shortly.");
      setSubject(""); setDescription(""); setCategory("Technical"); setPriority("Medium");
      setShowForm(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) {
      toast.error("Reply message cannot be empty");
      return;
    }
    setSendingReply(true);
    try {
      await api.post(`/support-tickets/${ticketId}/reply`, { message: replyText });
      toast.success("Reply sent!");
      setReplyText("");
      setReplyingTo(null);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    disconnectSocket();
    navigate("/auth");
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const openCount = tickets.filter(t => t.status === "Open").length;
  const inProgressCount = tickets.filter(t => t.status === "In Progress").length;
  const resolvedCount = tickets.filter(t => ["Resolved", "Closed"].includes(t.status)).length;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={user?.name || "Mentor"}
        userEmail={user?.email || ""}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <MentorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={user?.name}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Ticket size={28} className="text-primary" /> Help & <span className="text-primary">Support</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Submit tickets for technical issues, student concerns, or platform feedback
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-sm">
              <RefreshCw size={15} />
            </button>
            <GlassButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> New Ticket
            </GlassButton>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Open", value: openCount, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "In Progress", value: inProgressCount, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Resolved", value: resolvedCount, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          ].map((s, i) => (
            <GlassCard key={i} className="p-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* New ticket form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
              <GlassCard className="p-6 border-primary/30">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">Submit Support Ticket</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-white/10">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Subject *</label>
                    <input value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm">
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Priority</label>
                      <select value={priority} onChange={(e) => setPriority(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm">
                        {["Low", "Medium", "High", "Critical"].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Description *</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={4} placeholder="Describe your issue in detail..."
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none text-sm" />
                  </div>

                  <div className="flex gap-3">
                    <GlassButton variant="primary" onClick={handleSubmit} disabled={submitting} className="flex-1">
                      <Send size={15} /> {submitting ? "Submitting..." : "Submit Ticket"}
                    </GlassButton>
                    <GlassButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</GlassButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My tickets */}
        <div>
          <h2 className="text-lg font-bold mb-4">My Tickets ({tickets.length})</h2>
          {tickets.length === 0 ? (
            <GlassCard className="p-16 text-center text-muted-foreground">
              <Ticket size={48} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-bold mb-2 text-white">No Tickets Yet</h3>
              <p className="text-sm">Need help? Submit a support ticket and our admin team will respond shortly.</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, i) => {
                const isExpanded = expandedId === ticket._id;
                return (
                  <motion.div key={ticket._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard className="overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{ticket._id.slice(-6).toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status] || STATUS_STYLES["Open"]}`}>
                                {ticket.status}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES["Medium"]}`}>
                                {ticket.priority}
                              </span>
                              <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                                {ticket.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(ticket.createdAt)}</span>
                              {ticket.replies.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare size={11} /> {ticket.replies.length} repl{ticket.replies.length === 1 ? "y" : "ies"}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                            className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground shrink-0">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="border-t border-white/10 p-5 space-y-4">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Issue</p>
                                <p className="text-sm text-slate-300 bg-white/5 rounded-xl p-3">{ticket.description}</p>
                              </div>

                              {ticket.replies.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Replies</p>
                                  <div className="space-y-3">
                                    {ticket.replies.map((reply) => (
                                      <div key={reply._id} className={`flex gap-3 ${reply.isAdmin ? "flex-row-reverse" : ""}`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                          reply.isAdmin ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-300"
                                        }`}>
                                          {reply.author?.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className={`max-w-[80%] ${reply.isAdmin ? "items-end" : ""}`}>
                                          <div className={`rounded-2xl px-4 py-3 text-sm ${
                                            reply.isAdmin
                                              ? "bg-primary/20 border border-primary/30 text-white"
                                              : "bg-white/5 border border-white/10 text-slate-300"
                                          }`}>
                                            {reply.message}
                                          </div>
                                          <p className={`text-[10px] text-muted-foreground mt-1 ${reply.isAdmin ? "text-right" : ""}`}>
                                            {reply.author?.name} {reply.isAdmin && "· Admin"} · {timeAgo(reply.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {ticket.status === "Resolved" && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl text-emerald-400 text-sm">
                                  <CheckCircle2 size={15} /> This ticket has been resolved.
                                </div>
                              )}

                              {ticket.status === "Closed" && (
                                <div className="flex items-center gap-2 p-3 bg-slate-500/10 rounded-xl text-slate-400 text-sm">
                                  <AlertCircle size={15} /> This ticket is closed.
                                </div>
                              )}

                              {/* Reply box — only for open or in-progress tickets */}
                              {!["Resolved", "Closed"].includes(ticket.status) && (
                                <div>
                                  {replyingTo === ticket._id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        rows={3}
                                        placeholder="Write your reply..."
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <GlassButton variant="primary" onClick={() => handleReply(ticket._id)} disabled={sendingReply} className="text-sm">
                                          <Send size={13} /> {sendingReply ? "Sending..." : "Send Reply"}
                                        </GlassButton>
                                        <GlassButton variant="secondary" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-sm">
                                          Cancel
                                        </GlassButton>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setReplyingTo(ticket._id)}
                                      className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                      <MessageSquare size={13} /> Reply to this ticket
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MentorSupport;
