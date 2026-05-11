import { motion } from "framer-motion";
import { TrendingUp, Clock, Target, Zap, Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface WeeklyReport {
  hoursStudied: number;
  topicsMastered: number;
  xpEarned: number;
  lessonsCompleted: number;
  achievementsEarned: number;
}

export const WeeklyGrowthReport = () => {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get("/progress/weekly-report");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Weekly Growth Report</h3>
            <p className="text-xs text-muted-foreground">Your progress this week</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
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
