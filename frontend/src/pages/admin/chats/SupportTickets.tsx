import { useEffect, useState } from "react";
import { Ticket, Clock, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, User, Bell } from "lucide-react";
import api from "@/services/api";

interface ActivityItem {
  _id: string;
  user?: { name: string; email: string; role?: string };
  type: string;
  message: string;
  createdAt: string;
}

// Map activity types to ticket-like display
const typeConfig: Record<string, { label: string; priority: string; color: string; bg: string; icon: any }> = {
  USER_REGISTERED:   { label: "New Registration",    priority: "Low",      color: "text-blue-400",    bg: "bg-blue-500/10",    icon: User },
  MENTOR_APPROVED:   { label: "Mentor Approved",     priority: "Medium",   color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  LESSON_CREATED:    { label: "Content Added",       priority: "Low",      color: "text-purple-400",  bg: "bg-purple-500/10",  icon: Bell },
  COURSE_CREATED:    { label: "Course Created",      priority: "Medium",   color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: Bell },
  SESSION_BOOKED:    { label: "Session Booked",      priority: "High",     color: "text-orange-400",  bg: "bg-orange-500/10",  icon: Clock },
  SESSION_COMPLETED: { label: "Session Completed",   priority: "Low",      color: "text-green-400",   bg: "bg-green-500/10",   icon: CheckCircle2 },
  QUIZ_SUBMITTED:    { label: "Quiz Submitted",      priority: "Medium",   color: "text-yellow-400",  bg: "bg-yellow-500/10",  icon: MessageSquare },
  MENTOR_ASSIGNED:   { label: "Mentor Assigned",     priority: "Medium",   color: "text-pink-400",    bg: "bg-pink-500/10",    icon: User },
  COURSE_ENROLLED:   { label: "Course Enrollment",   priority: "High",     color: "text-indigo-400",  bg: "bg-indigo-500/10",  icon: Bell },
};

const priorityColors: Record<string, string> = {
  Low:      "bg-slate-500/20 text-slate-400",
  Medium:   "bg-blue-500/20 text-blue-400",
  High:     "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

const SupportTickets = () => {
  const [items, setItems]   = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/activities/all", { params: { page: 1, limit: 30 } });
      setItems(res.data.activities || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load activity tickets");
    } finally { setLoading(false); }
  };

  const getConfig = (type: string) => typeConfig[type] || {
    label: type.replace(/_/g, " "),
    priority: "Low",
    color: "text-slate-400",
    bg: "bg-slate-700/30",
    icon: Bell
  };

  const filtered = items.filter(item => {
    if (filter === "all") return true;
    const cfg = getConfig(item.type);
    return cfg.priority.toLowerCase() === filter;
  });

  const highCount   = items.filter(i => getConfig(i.type).priority === "High").length;
  const mediumCount = items.filter(i => getConfig(i.type).priority === "Medium").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket size={22} className="text-blue-400" /> Activity Tickets
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Platform events displayed as support tickets — {items.length} total
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Priority",   value: highCount,   color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Medium Priority", value: mediumCount, color: "text-blue-400",   bg: "bg-blue-500/10" },
          { label: "Total Events",    value: items.length, color: "text-slate-300", bg: "bg-white/5" },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "high", "medium", "low"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white/5 border border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {f === "all" ? `All (${items.length})` :
             f === "high" ? `High (${highCount})` :
             f === "medium" ? `Medium (${mediumCount})` :
             `Low (${items.filter(i => getConfig(i.type).priority === "Low").length})`}
          </button>
        ))}
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
          <Ticket size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => {
            const cfg = getConfig(item.type);
            const Icon = cfg.icon;
            const timeAgo = (() => {
              const diff = Date.now() - new Date(item.createdAt).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return "Just now";
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              return `${Math.floor(hrs / 24)}d ago`;
            })();

            return (
              <div
                key={item._id || i}
                className="group p-5 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 ${cfg.bg}`}>
                    <Icon size={20} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono text-blue-400 tracking-tighter">
                        #{item._id?.slice(-6).toUpperCase() || String(i + 1000)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${priorityColors[cfg.priority]}`}>
                        {cfg.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1 truncate">{item.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {item.user && (
                        <span className="flex items-center gap-1">
                          <User size={11} /> {item.user.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {timeAgo}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={13} /> Logged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
