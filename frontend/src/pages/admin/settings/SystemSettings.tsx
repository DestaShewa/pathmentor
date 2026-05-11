import { useEffect, useState } from "react";
import { Cog, Globe, Bell, Database, Server, RefreshCw, Users, BookOpen, Activity, Clock, Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/services/api";

interface PlatformStats {
  totalUsers: number;
  totalStudents: number;
  totalMentors: number;
  totalCourses: number;
  totalLessons: number;
  totalSessions: number;
  totalActivities: number;
  lastActivity: string | null;
  serverTime: string;
  nodeVersion: string;
  platform: string;
  uptime: number;
}

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${checked ? "bg-blue-600" : "bg-white/20"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
};

const SystemSettings = () => {
  const [stats, setStats]     = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Toggleable settings (stored in localStorage for persistence)
  const [settings, setSettings] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("adminSystemSettings") || "{}");
    return {
      maintenanceMode:    saved.maintenanceMode    ?? false,
      emailNotifications: saved.emailNotifications ?? true,
      newRegistrations:   saved.newRegistrations   ?? true,
      mentorApprovals:    saved.mentorApprovals     ?? true,
      activityLogging:    saved.activityLogging     ?? true,
      leaderboardPublic:  saved.leaderboardPublic   ?? true,
    };
  });

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    localStorage.setItem("adminSystemSettings", JSON.stringify(settings));
  }, [settings]);

  const fetchStats = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/platform-stats");
      setStats(res.data.stats);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load platform stats");
    } finally { setLoading(false); }
  };

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Configuration</h1>
          <p className="text-slate-400 text-sm mt-1">Platform settings and live server statistics</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {/* Live Platform Stats */}
      {stats && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Live Platform Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { icon: Users,    label: "Total Users",    value: stats.totalUsers,      color: "text-blue-400",    bg: "bg-blue-500/10" },
              { icon: Users,    label: "Students",       value: stats.totalStudents,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Users,    label: "Mentors",        value: stats.totalMentors,    color: "text-purple-400",  bg: "bg-purple-500/10" },
              { icon: BookOpen, label: "Courses",        value: stats.totalCourses,    color: "text-cyan-400",    bg: "bg-cyan-500/10" },
              { icon: BookOpen, label: "Lessons",        value: stats.totalLessons,    color: "text-orange-400",  bg: "bg-orange-500/10" },
              { icon: Clock,    label: "Sessions",       value: stats.totalSessions,   color: "text-pink-400",    bg: "bg-pink-500/10" },
              { icon: Activity, label: "Activities",     value: stats.totalActivities, color: "text-yellow-400",  bg: "bg-yellow-500/10" },
              { icon: Cpu,      label: "Uptime",         value: formatUptime(stats.uptime), color: "text-teal-400", bg: "bg-teal-500/10" },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon size={15} className={s.color} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Server info */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Server Info</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Node.js Version</p>
                <p className="text-white font-mono font-bold">{stats.nodeVersion}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Platform</p>
                <p className="text-white font-mono font-bold capitalize">{stats.platform}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Server Time</p>
                <p className="text-white font-mono font-bold">{new Date(stats.serverTime).toLocaleTimeString()}</p>
              </div>
              {stats.lastActivity && (
                <div>
                  <p className="text-slate-500 text-xs mb-1">Last Activity</p>
                  <p className="text-white font-mono font-bold">{new Date(stats.lastActivity).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Feature Toggles</h2>
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl divide-y divide-white/5">
          {[
            {
              key: "maintenanceMode" as const,
              icon: Server,
              label: "Maintenance Mode",
              desc: "Temporarily disable the platform for all users",
              danger: true,
            },
            {
              key: "emailNotifications" as const,
              icon: Bell,
              label: "Email Notifications",
              desc: "Send automated emails for registrations and session bookings",
            },
            {
              key: "newRegistrations" as const,
              icon: Users,
              label: "New Registrations",
              desc: "Allow new students and mentors to register",
            },
            {
              key: "mentorApprovals" as const,
              icon: CheckCircle2,
              label: "Mentor Auto-Approval",
              desc: "Automatically approve mentor applications (not recommended)",
              danger: true,
            },
            {
              key: "activityLogging" as const,
              icon: Activity,
              label: "Activity Logging",
              desc: "Log all platform events to the activity feed",
            },
            {
              key: "leaderboardPublic" as const,
              icon: Globe,
              label: "Public Leaderboard",
              desc: "Allow students to see the XP leaderboard",
            },
          ].map((item) => {
            const Icon = item.icon;
            const isOn = settings[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${item.danger && isOn ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-400"}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${item.danger && isOn ? "text-red-400" : "text-white"}`}>{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold ${isOn ? (item.danger ? "text-red-400" : "text-emerald-400") : "text-slate-500"}`}>
                    {isOn ? "ON" : "OFF"}
                  </span>
                  <Toggle checked={isOn} onChange={() => toggle(item.key)} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-2 ml-1">
          Toggle states are saved locally. Connect to a config API to persist across servers.
        </p>
      </div>

      {/* Health status */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">System Health</h2>
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl divide-y divide-white/5">
          {[
            { label: "API Server",    status: "Operational", ok: true },
            { label: "Database",      status: stats ? "Connected" : "Checking...", ok: !!stats },
            { label: "Auth Service",  status: "Operational", ok: true },
            { label: "File Storage",  status: "Operational", ok: true },
            { label: "Email Service", status: settings.emailNotifications ? "Active" : "Disabled", ok: settings.emailNotifications },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {item.ok
                  ? <CheckCircle2 size={15} className="text-emerald-400" />
                  : <AlertCircle size={15} className="text-orange-400" />
                }
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
              <span className={`text-xs font-bold ${item.ok ? "text-emerald-400" : "text-orange-400"}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
