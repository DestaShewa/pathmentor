import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { handleSidebarNav } from "@/lib/navHelper";
import { toast } from "sonner";
import {
  Ticket, Plus, Send, ChevronDown, ChevronUp,
  Clock, CheckCircle2, AlertCircle, X, MessageSquare
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

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const SupportPage = () => {
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, ticketsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/support-tickets/my"),
      ]);
      setUser(profileRes.data.user);
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

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={user?.name || "User"}
        userEmail={user?.email || ""}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="support"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Ticket size={28} className="text-primary" /> Support
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Submit a ticket and our team will respond shortly
              </p>
            </div>
            <GlassButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> New Ticket
            </GlassButton>
          </motion.div>

          {/* New ticket form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary">
                          {["Technical", "Course", "Mentor", "Account", "Billing", "Other"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary">
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
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none" />
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
              <GlassCard className="p-12 text-center text-muted-foreground">
                <Ticket size={48} className="mx-auto mb-4 opacity-30" />
                <p>No support tickets yet. Submit one if you need help!</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => {
                  const isExpanded = expandedId === ticket._id;
                  return (
                    <GlassCard key={ticket._id} className="overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                #{ticket._id.slice(-6).toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status]}`}>
                                {ticket.status}
                              </span>
                              <span className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                                {ticket.category}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white">{ticket.subject}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(ticket.createdAt)}</span>
                              {ticket.replies.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare size={11} /> {ticket.replies.length} repl{ticket.replies.length === 1 ? "y" : "ies"}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                            className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground">
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
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default SupportPage;
