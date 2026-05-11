import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface MotivationData {
  message: string;
  type: "positive" | "neutral" | "warning";
  streak: number;
  totalXP: number;
  totalLessons: number;
}

export const DailyMotivation = () => {
  const [motivation, setMotivation] = useState<MotivationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMotivation = async () => {
      try {
        const res = await api.get("/progress/motivation");
        setMotivation(res.data.motivation);
      } catch (err) {
        console.error("Failed to fetch motivation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMotivation();
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

  if (!motivation) return null;

  const getIcon = () => {
    if (motivation.type === "positive") return <Sparkles className="w-5 h-5 text-yellow-400" />;
    if (motivation.type === "warning") return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    return <TrendingUp className="w-5 h-5 text-primary" />;
  };

  const getBgClass = () => {
    if (motivation.type === "positive") return "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20";
    if (motivation.type === "warning") return "bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20";
    return "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <GlassCard className={`p-6 border ${getBgClass()}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">Daily Motivation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {motivation.message}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>🔥 {motivation.streak} day streak</span>
              <span>⚡ {motivation.totalXP} XP</span>
              <span>📚 {motivation.totalLessons} lessons</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
