import { useEffect, useState, useRef } from "react";
import { Users, BookOpen, TrendingUp, Award, Zap, Target, RefreshCw, Download, BarChart2 } from "lucide-react";
import api from "@/services/api";

interface ReportData {
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    totalLessons: number;
    totalXP: number;
    completionRate: number;
    avgScore: number;
    totalAchievements: number;
  };
  topCourses: { title: string; category: string; enrollments: number }[];
  trackDistribution: { track: string; count: number }[];
  newStudentsChart: { label: string; count: number }[];
}

const TRACK_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16"
];

const StudentReports = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [range, setRange] = useState<"daily"|"weekly"|"monthly"|"yearly">("weekly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { fetchReports(); }, [range]);

  useEffect(() => {
    if (data) drawChart();
  }, [data]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/reports?range=${range}`);
      // backend returns { success, stats, topCourses, trackDistribution, newStudentsChart, range }
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.parentElement?.clientWidth || 600;
    const H = canvas.height = 220;
    const chartData = data.newStudentsChart;
    const maxVal = Math.max(...chartData.map(d => d.count), 1);
    const padL = 40, padB = 30, padT = 15, padR = 15;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Grid lines & Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const y = padT + chartH - (i / 5) * chartH;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = "rgba(148,163,184,0.6)";
      ctx.font = "9px Inter";
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round((maxVal / 5) * i)), padL - 6, y + 3);
    }

    // Draw multiple data points if available
    const pointsCount = chartData.length;
    const pointSpacing = pointsCount > 1 ? chartW / (pointsCount - 1) : 0;

    // Draw bars for better visualization
    chartData.forEach((d, i) => {
      const x = padL + i * pointSpacing;
      const barHeight = (d.count / maxVal) * chartH;
      const barWidth = Math.max(8, pointSpacing * 0.6);
      const y = padT + chartH - barHeight;

      // Gradient fill for bars
      const barGrad = ctx.createLinearGradient(0, y, 0, padT + chartH);
      barGrad.addColorStop(0, "rgba(59,130,246,0.8)");
      barGrad.addColorStop(1, "rgba(59,130,246,0.3)");
      
      ctx.fillStyle = barGrad;
      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
      
      // Bar border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1;
      ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);

      // Value label on top of bar
      if (d.count > 0) {
        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 8px Inter";
        ctx.textAlign = "center";
        ctx.fillText(String(d.count), x, y - 4);
      }
    });

    // X labels
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    chartData.forEach((d, i) => {
      const x = padL + i * pointSpacing;
      ctx.save();
      ctx.translate(x, H - 8);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(d.label, 0, 0);
      ctx.restore();
    });

    // Y-axis label
    ctx.save();
    ctx.translate(8, padT + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(148,163,184,0.6)";
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    ctx.fillText("New Registrations", 0, 0);
    ctx.restore();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const timestamp = new Date().toISOString();
    const reportDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    
    // Map range to readable format
    const rangeLabel = {
      daily: "Last 24 Hours",
      weekly: "Last 7 Days",
      monthly: "Last 30 Days",
      yearly: "Last 12 Months"
    }[range];

    const rows: (string | number)[][] = [];
    
    // Report Header
    rows.push(["PATHMENTOR ANALYTICS & REPORTS"]);
    rows.push(["Generated", timestamp]);
    rows.push(["Report Date", reportDate]);
    rows.push(["Time Period", rangeLabel]);
    rows.push([]);

    // Platform Statistics Section
    rows.push(["=== PLATFORM STATISTICS ==="]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Students", data.stats.totalStudents]);
    rows.push(["Active Students (Onboarded)", data.stats.activeStudents]);
    rows.push(["Inactive Students", data.stats.totalStudents - data.stats.activeStudents]);
    rows.push(["Active Rate (%)", Math.round((data.stats.activeStudents / Math.max(data.stats.totalStudents, 1)) * 100)]);
    rows.push([]);
    rows.push(["Total Courses", data.stats.totalCourses]);
    rows.push(["Total Lessons", data.stats.totalLessons]);
    rows.push(["Average Lessons per Course", Math.round(data.stats.totalLessons / Math.max(data.stats.totalCourses, 1))]);
    rows.push([]);
    rows.push(["Completion Rate (%)", data.stats.completionRate]);
    rows.push(["Average Quiz Score (%)", data.stats.avgScore]);
    rows.push(["Total Achievements Earned", data.stats.totalAchievements]);
    rows.push(["Total XP Earned by All Students", data.stats.totalXP]);
    rows.push(["Average XP per Student", Math.round(data.stats.totalXP / Math.max(data.stats.totalStudents, 1))]);
    rows.push([]);

    // Top Courses Section
    rows.push(["=== TOP ENROLLED COURSES ==="]);
    rows.push(["Rank", "Course Title", "Category", "Enrollments", "% of Total"]);
    const totalEnrollments = data.topCourses.reduce((s, c) => s + c.enrollments, 0);
    data.topCourses.forEach((course, idx) => {
      const share = totalEnrollments > 0 ? Math.round((course.enrollments / totalEnrollments) * 100) : 0;
      rows.push([idx + 1, course.title, course.category || "Uncategorized", course.enrollments, share]);
    });
    rows.push([]);

    // Skill Track Distribution Section
    rows.push(["=== SKILL TRACK DISTRIBUTION ==="]);
    rows.push(["Track Name", "Student Count", "% of Total"]);
    const totalStudentsInTracks = data.trackDistribution.reduce((s, t) => s + t.count, 0);
    data.trackDistribution.forEach(track => {
      const pct = totalStudentsInTracks > 0 ? Math.round((track.count / totalStudentsInTracks) * 100) : 0;
      rows.push([track.track, track.count, pct]);
    });
    rows.push([]);

    // Timeline Data Section
    rows.push([`=== NEW STUDENTS TIMELINE (${rangeLabel}) ===`]);
    rows.push(["Date/Period", "New Registrations", "Cumulative Trend"]);
    let cumulative = 0;
    data.newStudentsChart.forEach(entry => {
      cumulative += entry.count;
      rows.push([entry.label, entry.count, cumulative]);
    });
    rows.push([]);
    rows.push(["Total New Students in Period", data.newStudentsChart.reduce((s, d) => s + d.count, 0)]);
    rows.push([]);

    // Summary Stats Section
    rows.push(["=== SUMMARY HEALTH METRICS ==="]);
    rows.push(["Metric", "Status", "Threshold"]);
    rows.push([
      "Quiz Performance",
      data.stats.avgScore >= 70 ? "Excellent" : data.stats.avgScore >= 50 ? "Good" : "Needs Improvement",
      ">= 70% is Excellent"
    ]);
    rows.push([
      "Course Completion",
      data.stats.completionRate >= 60 ? "Excellent" : data.stats.completionRate >= 30 ? "Good" : "Needs Improvement",
      ">= 60% is Excellent"
    ]);
    rows.push([
      "Student Engagement",
      (data.stats.activeStudents / Math.max(data.stats.totalStudents, 1)) >= 0.6 ? "Excellent" : "Needs Improvement",
      ">= 60% is Excellent"
    ]);
    rows.push([]);

    // Footer
    rows.push(["Report Generated by PathMentor Analytics System"]);
    rows.push(["For more details, visit the admin dashboard"]);

    // Convert to CSV format
    const csv = rows.map(r => r.map(c => {
      const val = String(c);
      const needsQuotes = val.includes(",") || val.includes('"') || val.includes("\n");
      return needsQuotes ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",")).join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PathMentor_Report_${range}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">{error}</div>
      </div>
    );
  }

  if (!data) return null;
  const { stats, topCourses, trackDistribution, newStudentsChart } = data;
  const inactiveStudents = stats.totalStudents - stats.activeStudents;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide statistics from real data</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students",    value: stats.totalStudents,    icon: Users,      color: "text-blue-400",    bg: "bg-blue-500/10",    sub: `${stats.activeStudents} active` },
          { label: "Active Rate",       value: `${stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: `${inactiveStudents} inactive` },
          { label: "Completion Rate",   value: `${stats.completionRate}%`, icon: Target,  color: "text-purple-400",  bg: "bg-purple-500/10",  sub: "lessons completed" },
          { label: "Avg Quiz Score",    value: `${stats.avgScore}%`,   icon: Award,      color: "text-yellow-400",  bg: "bg-yellow-500/10",  sub: "across all levels" },
          { label: "Total Courses",     value: stats.totalCourses,     icon: BookOpen,   color: "text-cyan-400",    bg: "bg-cyan-500/10",    sub: `${stats.totalLessons} lessons` },
          { label: "Total XP Earned",   value: stats.totalXP.toLocaleString(), icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10",  sub: "by all students" },
          { label: "Achievements",      value: stats.totalAchievements, icon: Award,     color: "text-pink-400",    bg: "bg-pink-500/10",    sub: "badges earned" },
          { label: "Skill Tracks",      value: trackDistribution.length, icon: BarChart2, color: "text-indigo-400", bg: "bg-indigo-500/10",  sub: "active tracks" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider font-bold">{stat.label}</p>
            <p className="text-xs text-slate-600 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* New students chart */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" /> Registration Timeline
              </h3>
              <p className="text-xs text-slate-500 mt-1">New student registrations — {range === "daily" ? "Last 24 Hours" : range === "monthly" ? "Last 30 Days" : range === "yearly" ? "Last 12 Months" : "Last 7 Days"}</p>
            </div>
            <div className="flex items-center gap-2">
              <select value={range} onChange={e => setRange(e.target.value as any)} className="rounded-xl bg-white/5 border border-white/10 text-sm text-white px-3 py-2">
                <option value="daily">Daily (24h)</option>
                <option value="weekly">Weekly (7d)</option>
                <option value="monthly">Monthly (30d)</option>
                <option value="yearly">Yearly (12m)</option>
              </select>
            </div>
          </div>
          <div className="w-full">
            <canvas ref={canvasRef} className="w-full" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Total New</p>
              <p className="text-lg font-bold text-blue-400 mt-1">
                {newStudentsChart.reduce((s, d) => s + d.count, 0)}
              </p>
              <p className="text-xs text-slate-600 mt-1">registrations this period</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Peak Day</p>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {Math.max(...newStudentsChart.map(d => d.count), 0)}
              </p>
              <p className="text-xs text-slate-600 mt-1">highest daily registrations</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Average</p>
              <p className="text-lg font-bold text-purple-400 mt-1">
                {newStudentsChart.length > 0 
                  ? Math.round(newStudentsChart.reduce((s, d) => s + d.count, 0) / newStudentsChart.length)
                  : 0}
              </p>
              <p className="text-xs text-slate-600 mt-1">daily average</p>
            </div>
          </div>
        </div>

        {/* Skill track distribution */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-purple-400" /> Students by Track
          </h3>
          {trackDistribution.length === 0 ? (
            <p className="text-slate-500 text-sm">No track data yet</p>
          ) : (
            <div className="space-y-3">
              {trackDistribution.map((t, i) => {
                const maxCount = trackDistribution[0].count;
                const pct = Math.round((t.count / maxCount) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate max-w-[140px]">{t.track}</span>
                      <span className="text-slate-400 font-bold shrink-0 ml-2">{t.count}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: TRACK_COLORS[i % TRACK_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top courses */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-cyan-400" /> Most Enrolled Courses
          </h3>
          <span className="text-xs text-slate-500">Top {topCourses.length}</span>
        </div>
        {topCourses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No enrollment data yet</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Enrollments</th>
                <th className="px-5 py-3">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topCourses.map((course, i) => {
                const totalEnrollments = topCourses.reduce((s, c) => s + c.enrollments, 0);
                const share = totalEnrollments > 0 ? Math.round((course.enrollments / totalEnrollments) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        i === 1 ? "bg-slate-500/20 text-slate-300" :
                        i === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-white/5 text-slate-500"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-white">{course.title}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">{course.category || "—"}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-white">{course.enrollments}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Student status breakdown */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Student Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "Active (onboarded)", value: stats.activeStudents, color: "bg-emerald-500", total: stats.totalStudents },
              { label: "Inactive (not onboarded)", value: inactiveStudents, color: "bg-slate-600", total: stats.totalStudents },
            ].map((item, i) => {
              const pct = stats.totalStudents > 0 ? Math.round((item.value / stats.totalStudents) * 100) : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="text-white font-bold">{item.value} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Platform Health</h3>
          <div className="space-y-3">
            {[
              { label: "Avg Quiz Score",   value: `${stats.avgScore}%`,   good: stats.avgScore >= 70,   warn: stats.avgScore >= 50 },
              { label: "Completion Rate",  value: `${stats.completionRate}%`, good: stats.completionRate >= 60, warn: stats.completionRate >= 30 },
              { label: "Active Rate",      value: `${stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%`, good: stats.activeStudents / Math.max(stats.totalStudents, 1) >= 0.6, warn: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className={`text-sm font-bold ${item.good ? "text-emerald-400" : item.warn ? "text-yellow-400" : "text-red-400"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReports;
