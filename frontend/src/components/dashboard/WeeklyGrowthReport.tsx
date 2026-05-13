import { motion } from "framer-motion";
import { TrendingUp, Clock, Target, Zap, Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyLog {
  date: string;
  xp: number;
  lessons: number;
}

interface WeeklyReport {
  hoursStudied: number;
  topicsMastered: number;
  xpEarned: number;
  lessonsCompleted: number;
  achievementsEarned: number;
  dailyLogs?: DailyLog[];
}

export const WeeklyGrowthReport = () => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get("/progress/weekly");
        setReport(res.data.report);
      } catch (err) {
        console.error("Failed to fetch weekly report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </GlassCard>
    );
  }

  if (!report) return null;

  const stats = [
    { icon: Clock, label: "Hours Studied", value: report.hoursStudied, color: "text-blue-400" },
    { icon: Target, label: "Topics Mastered", value: report.topicsMastered, color: "text-green-400" },
    { icon: Zap, label: "XP Earned", value: report.xpEarned, color: "text-yellow-400" },
    { icon: Award, label: "Achievements", value: report.achievementsEarned, color: "text-purple-400" },
  ];

  // Map daily logs for the chart
  const chartData = report.dailyLogs?.map(log => ({
    name: new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' }),
    xp: log.xp,
    lessons: log.lessons
  })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Weekly Growth Report</h3>
              <p className="text-xs text-muted-foreground">Your progress this week</p>
            </div>
          </div>
        </div>

        {/* Real Data Chart */}
        <div className="h-48 w-full mb-6 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ADFA1D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ADFA1D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#ADFA1D' }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#ADFA1D"
                fillOpacity={1}
                fill="url(#colorXp)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {report.lessonsCompleted > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-bold text-primary">{report.lessonsCompleted}</span> lessons completed this week! 🎉
            </p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
};
