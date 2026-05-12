import { useEffect, useState } from "react";
import {
  Ticket, RefreshCw, Search, ChevronDown, ChevronUp,
  Send, Trash2, X, AlertCircle, CheckCircle2, Clock,
  MessageSquare, User, Filter
} from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Reply {
  _id: string;
  author: { _id: string; name: string; role: string };
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  submittedBy: { _id: string; name: string; email: string; role: string };
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Low:      "bg-slate-500/20 text-slate-400",
  Medium:   "bg-blue-500/20 text-blue-400",
  High:     "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

const STATUS_STYLES: Record<string, string> = {
  "Open":        "bg-yellow-500/20 text-yellow-400",
  "In Progress": "bg-blue-500/20 text-blue-400",
  "Resolved":    "bg-emerald-500/20 text-emerald-400",
  "Closed":      "bg-slate-500/20 text-slate-400",
};

const STATUS_ICON: Record<string, any> = {
  "Open":        AlertCircle,
  "In Progress": Clock,
  "Resolved":    CheckCircle2,
  "Closed":      X,
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

const SupportTickets = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      const res = await api.get("/support-tickets", { params });
      setTickets(res.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [statusFilter, priorityFilter]);

  const handleReply = async (ticketId: string) => {
    const msg = replyText[ticketId]?.trim();
    if (!msg) return;
    setSendingReply(ticketId);
    try {
      const res = await api.post(`/support-tickets/${ticketId}/reply`, { message: msg });
      setTickets((prev) => prev.map((t) => t._id === ticketId ? res.data.data : t));
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
      toast({ title: "Reply sent!" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed to send reply", variant: "destructive" });
    } finally {
      setSendingReply(null);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    setUpdatingStatus(ticketId);
    try {
      const res = await api.put(`/support-tickets/${ticketId}`, { status });
      setTickets((prev) => prev.map((t) => t._id === ticketId ? res.data.data : t));
      toast({ title: `Status updated to ${status}` });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed", variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm("Delete this ticket permanently?")) return;
    try {
      await api.delete(`/support-tickets/${ticketId}`);
      setTickets((prev) => prev.filter((t) => t._id !== ticketId));
      toast({ title: "Ticket deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const filtered = tickets.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.subject.toLowerCase().includes(q) ||
      t.submittedBy?.name?.toLowerCase().includes(q) ||
      t.submittedBy?.email?.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  // Summary counts
  const openCount = tickets.filter((t) => t.status === "Open").length;
  const inProgressCount = tickets.filter((t) => t.status === "In Progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket size={22} className="text-blue-400" /> Support Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage and respond to support requests from students and mentors
          </p>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: tickets.length, color: "text-white",         bg: "bg-white/5" },
          { label: "Open",        value: openCount,      color: "text-yellow-400",    bg: "bg-yellow-500/10" },
          { label: "In Progress", value: inProgressCount,color: "text-blue-400",      bg: "bg-blue-500/10" },
          { label: "Resolved",    value: resolvedCount,  color: "text-emerald-400",   bg: "bg-emerald-500/10" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} border border-white/10 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets, users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {/* Tickets list */}
      {loading ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center text-slate-400">
          Loading tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
          <Ticket size={48} className="mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-2">No Support Tickets</h3>
          <p className="text-slate-400 text-sm">
            {tickets.length === 0
              ? "No tickets have been submitted yet. Students and mentors can submit tickets from their dashboards."
              : "No tickets match your current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const isExpanded = expandedId === ticket._id;
            const StatusIcon = STATUS_ICON[ticket.status] || AlertCircle;

            return (
              <div
                key={ticket._id}
                className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
              >
                {/* Ticket header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Ticket size={18} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500">
                            #{ticket._id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[ticket.priority]}`}>
                            {ticket.priority}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_STYLES[ticket.status]}`}>
                            <StatusIcon size={10} /> {ticket.status}
                          </span>
                          <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">
                            {ticket.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">{ticket.subject}</h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{ticket.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {ticket.submittedBy?.name}
                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              ticket.submittedBy?.role === "mentor"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-blue-500/20 text-blue-400"
                            }`}>
                              {ticket.submittedBy?.role}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {timeAgo(ticket.createdAt)}
                          </span>
                          {ticket.replies.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare size={11} /> {ticket.replies.length} repl{ticket.replies.length === 1 ? "y" : "ies"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status changer */}
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        disabled={updatingStatus === ticket._id}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none disabled:opacity-50"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                        className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        onClick={() => handleDelete(ticket._id)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: full description + replies + reply form */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 space-y-5">
                    {/* Full description */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</p>
                      <div className="bg-white/5 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap">
                        {ticket.description}
                      </div>
                    </div>

                    {/* Submitter info */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {ticket.submittedBy?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{ticket.submittedBy?.name}</p>
                        <p className="text-xs text-slate-500">{ticket.submittedBy?.email}</p>
                      </div>
                    </div>

                    {/* Replies thread */}
                    {ticket.replies.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Conversation ({ticket.replies.length})
                        </p>
                        <div className="space-y-3">
                          {ticket.replies.map((reply) => (
                            <div
                              key={reply._id}
                              className={`flex gap-3 ${reply.isAdmin ? "flex-row-reverse" : ""}`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                reply.isAdmin
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-slate-700 text-slate-300"
                              }`}>
                                {reply.author?.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className={`flex-1 max-w-[80%] ${reply.isAdmin ? "items-end" : ""}`}>
                                <div className={`rounded-2xl px-4 py-3 text-sm ${
                                  reply.isAdmin
                                    ? "bg-blue-600/20 border border-blue-500/30 text-blue-100"
                                    : "bg-white/5 border border-white/10 text-slate-300"
                                }`}>
                                  {reply.message}
                                </div>
                                <p className={`text-[10px] text-slate-600 mt-1 ${reply.isAdmin ? "text-right" : ""}`}>
                                  {reply.author?.name} · {timeAgo(reply.createdAt)}
                                  {reply.isAdmin && <span className="ml-1 text-blue-500">Admin</span>}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reply form */}
                    {ticket.status !== "Closed" && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reply as Admin</p>
                        <div className="flex gap-3">
                          <textarea
                            value={replyText[ticket._id] || ""}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply(ticket._id);
                            }}
                            placeholder="Type your reply... (Ctrl+Enter to send)"
                            rows={3}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                          />
                          <button
                            onClick={() => handleReply(ticket._id)}
                            disabled={sendingReply === ticket._id || !replyText[ticket._id]?.trim()}
                            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-2 self-end"
                          >
                            <Send size={15} />
                            {sendingReply === ticket._id ? "Sending..." : "Send"}
                          </button>
                        </div>
                      </div>
                    )}

                    {ticket.status === "Closed" && (
                      <div className="flex items-center gap-2 p-3 bg-slate-700/20 rounded-xl text-slate-400 text-sm">
                        <X size={15} /> This ticket is closed. Change status to reply.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
