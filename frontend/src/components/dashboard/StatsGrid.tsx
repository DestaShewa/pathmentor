import { motion } from "framer-motion";
import { BookOpen, Trophy, Clock, TrendingUp, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  icon: typeof BookOpen;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

interface StatsGridProps {
  inProgress: number;
  completed: number;
  dailyGoal: string;
  learningStyle: string;
  streak?: number;
  totalHours?: number;
}

export const StatsGrid = ({
  inProgress,
  completed,
  dailyGoal,
  learningStyle,
  streak = 7,
  totalHours = 24,
}: StatsGridProps) => {
  const stats: Stat[] = [
    {
      icon: BookOpen,
      label: "In Progress",
      value: inProgress.toString(),
      color: "text-primary",
      bgColor: "bg-primary/20",
    },
    {
      icon: Trophy,
      label: "Completed",
      value: completed.toString(),
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
    },
    {
      icon: Clock,
      label: "Daily Goal",
      value: dailyGoal,
      color: "text-secondary",
      bgColor: "bg-secondary/20",
    },
    {
      icon: Target,
      label: "Style",
      value: learningStyle,
      color: "text-teal",
      bgColor: "bg-teal/20",
    },
    {
      icon: Zap,
      label: "Streak",
      value: `${streak} days`,
      color: "text-orange-400",
      bgColor: "bg-orange-400/20",
    },
    {
      icon: TrendingUp,
      label: "Total Hours",
      value: `${totalHours}h`,
      color: "text-green-400",
      bgColor: "bg-green-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className="glass-premium p-4 rounded-2xl cursor-pointer group min-h-[170px] flex flex-col"
        >
          <motion.div
            className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bgColor)}
            whileHover={{ rotate: 10 }}
          >
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </motion.div>
          <div className="text-xl font-bold mb-1 group-hover:text-gradient transition-all break-words whitespace-normal leading-tight">
            {stat.value}
          </div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};
