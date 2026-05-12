import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import {
  Users, UserCheck, Bell, ArrowUpRight, Activity,
  BookOpen, Check, X, TrendingUp, Zap, RefreshCw
} from "lucide-react";

const glass =
  "relative overflow-hidden rounded-2xl " +
  "bg-white/10 backdrop-blur-3xl border border-white/20 " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18),0_0_20px_rgba(34,211,238,0.12)] " +
  "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none " +
  "hover:border-cyan-300/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_25px_rgba(34,211,238,0.2)] transition-all duration-300";

const AdminDashboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [pendingMentors, setPendingMentors] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<{
    totalUsers?: number;
    mentors?: number;
    students?: number;
    pending?: number;
    totalCourses?: number;
    activeStudents?: number;
    activeMentors?: number;
    enrollmentCount?: number;
    chartData?: { label: string; value: number }[];
    liveActivity?: { name: string; course: string; message: string; time: string }[];
  }>({});
  const [chartData, setChartData] = useState<number[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, actRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/pending-mentors"),
        api.get("/admin/activities"),
      ]);

      // Extract stats from response
      const stats = statsRes.data.stats || {};
      setDashboardStats({
        totalUsers: stats.totalStudents + stats.totalMentors + (stats.totalAdmins || 0),
        students: stats.totalStudents,
        mentors: stats.totalMentors,
        pending: stats.pendingMentors,
        totalCourses: stats.totalCourses,
        activeStudents: stats.activeUsers,
        activeMentors: stats.totalMentors, // All approved mentors are considered active
        enrollmentCount: stats.totalEnrollments,
        chartData: statsRes.data.chartData || [],
        liveActivity: statsRes.data.weeklyData || []
      });

      // Set chart data for visualization
      setChartData(statsRes.data.chartData?.map((item: any) => item.value) || []);

      const pending = pendingRes.data;
      setPendingMentors(Array.isArray(pending) ? pending : pending.mentors || []);

      // Only use real activities — no fallback fake data
      setRecentActivities(Array.isArray(actRes.data) ? actRes.data : []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveMentor = async (id: string) => {
    try {
      await api.put(`/admin/mentor/${id}/approve`);
      setPendingMentors((prev) => prev.filter((m) => m._id !== id));
      loadAll(); // refresh stats
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  const rejectMentor = async (id: string) => {
    try {
      await api.put(`/admin/mentor/${id}/reject`);
      setPendingMentors((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawChart = () => {
      const W = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const H = (canvas.height = 300);
      const data = chartData.length ? chartData : new Array(7).fill(0);
      const padLeft = 48, padBottom = 40;
      const chartW = W - padLeft - 20;
      const chartH = H - 20 - padBottom;
      const maxVal = Math.max(...data, 1);

      ctx.clearRect(0, 0, W, H);
      ctx.font = "11px Inter";

      for (let i = 0; i <= 5; i++) {
        const tick = Math.round((maxVal / 5) * i);
        const y = 20 + chartH - (tick / maxVal) * chartH;
        ctx.fillStyle = "rgba(148,163,184,.8)";
        ctx.textAlign = "right";
        ctx.fillText(tick === 0 ? "0" : tick.toString(), padLeft - 10, y + 4);
        ctx.strokeStyle = "rgba(255,255,255,.06)";
        ctx.beginPath(); ctx.moveTo(padLeft, y); ctx.lineTo(padLeft + chartW, y); ctx.stroke();
      }

      const pts = data.map((v, i) => ({
        x: padLeft + (i / Math.max(data.length - 1, 1)) * chartW,
        y: 20 + chartH - (v / maxVal) * chartH,
      }));

      const grad = ctx.createLinearGradient(0, 20, 0, 20 + chartH);
      grad.addColorStop(0, "rgba(34,211,238,.28)");
      grad.addColorStop(1, "rgba(34,211,238,0)");

      ctx.beginPath();
      ctx.moveTo(pts[0].x, 20 + chartH);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, 20 + chartH);
      ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 2.5; ctx.stroke();

      // Dots
      pts.forEach((p) => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#22d3ee"; ctx.fill();
        ctx.strokeStyle = "#020617"; ctx.lineWidth = 2; ctx.stroke();
      });
    };

    drawChart();
    window.addEventListener("resize", drawChart);
    return () => window.removeEventListener("resize", drawChart);
  }, [chartData]);

  return (
    <div className="space-y-8 pb-10 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-2">

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={loadAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassStatCard
          label="Total Students"
          value={dashboardStats.students?.toLocaleString() ?? "—"}
          sub={`${dashboardStats.activeStudents ?? 0} active`}
          icon={<Users className="text-cyan-300" />}
          color="#22d3ee"
        />
        <GlassStatCard
          label="Mentors"
          value={dashboardStats.mentors?.toLocaleString() ?? "—"}
          sub={`${dashboardStats.activeMentors ?? 0} active`}
          icon={<UserCheck className="text-fuchsia-400" />}
          color="#d946ef"
        />
        <GlassStatCard
          label="Courses"
          value={dashboardStats.totalCourses?.toLocaleString() ?? "—"}
          sub={`${dashboardStats.enrollmentCount ?? 0} enrollments`}
          icon={<BookOpen className="text-emerald-400" />}
          color="#10b981"
        />
        <GlassStatCard
          label="Pending Approvals"
          value={pendingMentors.length.toString()}
          sub="mentor applications"
          icon={<Bell className="text-orange-400" />}
          color="#fb923c"
          isNegative={pendingMentors.length > 0}
        />
      </div>

      {/* CHART + ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className={`${glass} lg:col-span-2 p-8`}>
          <div className="relative z-10 flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Enrollment Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">New enrollments — last 7 days</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Students</p>
                <p className="text-lg font-bold text-white">{dashboardStats.activeStudents ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Mentors</p>
                <p className="text-lg font-bold text-white">{dashboardStats.activeMentors ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Enrolled</p>
                <p className="text-lg font-bold text-white">{dashboardStats.enrollmentCount ?? "—"}</p>
              </div>
            </div>
          </div>

          <canvas ref={canvasRef} className="relative z-10 w-full" />

          <div className="relative z-10 flex justify-between mt-4 px-10 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {(dashboardStats.chartData?.length ? dashboardStats.chartData : Array(6).fill({ label: "—", month: "—" }))
              .map((item: any, i: number) => <span key={i}>{item.month || item.label || "—"}</span>)}
          </div>
        </div>

        {/* Live Activity — REAL DATA ONLY */}
        <div className={`${glass} p-8`}>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button
              className="text-cyan-300 text-xs font-bold hover:underline"
              onClick={() => navigate("/admin/activities")}
            >
              View All
            </button>
          </div>

          <div className="relative z-10 space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="text-slate-500 text-sm">No recent activity yet.</p>
                <p className="text-slate-600 text-xs mt-1">Activity will appear as users interact with the platform.</p>
              </div>
            ) : (
              recentActivities.slice(0, 6).map((item: any, index: number) => {
                const date = item.createdAt ? new Date(item.createdAt) : null;
                const timeText = date && !isNaN(date.getTime())
                  ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "";
                return (
                  <div key={index} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 font-medium leading-tight truncate">
                        {item.message}
                      </p>
                      {timeText && (
                        <span className="text-[10px] text-slate-500 font-bold uppercase block mt-0.5">
                          {timeText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PENDING MENTORS */}
      {pendingMentors.length > 0 && (
        <div className={`${glass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Pending Mentor Applications
              <span className="ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                {pendingMentors.length}
              </span>
            </h3>
            <button
              onClick={() => navigate("/admin/applications")}
              className="text-cyan-300 text-xs font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 uppercase text-[11px] font-bold tracking-wider bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Applied</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingMentors.map((m: any) => (
                  <tr key={m._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{m.name}</td>
                    <td className="px-4 py-3 text-slate-400">{m.email}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {m.learningProfile?.skillTrack || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => approveMentor(m._id)}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                        title="Approve"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => rejectMentor(m._id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                        title="Reject"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH */}
      <div className={`${glass} p-6`}>
        <h3 className="text-sm font-bold text-white mb-4">System Health</h3>
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HealthRow label="API Server" status="Operational" ok />
          <HealthRow label="Database" status={loading ? "Checking..." : "Connected"} ok={!loading} />
          <HealthRow label="Total Users" status={`${dashboardStats.totalUsers ?? 0} registered`} ok />
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────── */

const GlassStatCard = ({ label, value, sub, icon, color, isNegative }: any) => (
  <div className={`${glass} p-6 flex flex-col group`}>
    <div className="relative z-10 flex justify-between items-start mb-3">
      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-right">
        <h2 className="text-2xl font-bold text-white leading-none">{value}</h2>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
    <p className="relative z-10 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
      {label}
    </p>
    <div className="relative z-10 h-8 w-full mt-auto opacity-50 group-hover:opacity-80 transition-opacity">
      <svg viewBox="0 0 100 20" className="w-full h-full">
        <path
          d="M0,15 C20,12 40,18 60,10 C80,2 100,15 100,15"
          fill="none"
          stroke={isNegative ? "#fb923c" : color}
          strokeWidth="2"
        />
      </svg>
    </div>
  </div>
);

const HealthRow = ({ label, status, ok }: any) => (
  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl">
    <div className="flex items-center gap-2 text-slate-400">
      <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-400" : "bg-orange-400"}`} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-xs font-bold ${ok ? "text-emerald-400" : "text-orange-400"}`}>
      {status}
    </span>
  </div>
);

export default AdminDashboard;
