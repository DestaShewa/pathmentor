import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

interface ProgressHeroCardProps {
  stage: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  onStartLearning?: () => void;
}

export const ProgressHeroCard = ({
  stage,
  progressPercent,
  totalLessons,
  completedLessons,
  onStartLearning,
}: ProgressHeroCardProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 500);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-premium-hover p-6 md:p-8 mb-8"
    >
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Circular Progress */}
        <div className="relative">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            className="transform -rotate-90 progress-ring-glow"
          >
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(200, 100%, 60%)" />
                <stop offset="50%" stopColor="hsl(270, 80%, 65%)" />
                <stop offset="100%" stopColor="hsl(175, 80%, 50%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-4xl font-bold text-gradient"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
            >
              {Math.round(animatedProgress)}%
            </motion.span>
            <span className="text-xs text-muted-foreground mt-1">Complete</span>
          </div>
        </div>

        {/* Stage info */}
        <div className="flex-1 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              Current Stage
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mt-1 mb-4">{stage}</h2>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
              <div className="glass-inner-glow px-4 py-2 rounded-xl">
                <span className="text-2xl font-bold text-primary">{completedLessons}</span>
                <span className="text-sm text-muted-foreground ml-2">Completed</span>
              </div>
              <div className="glass-inner-glow px-4 py-2 rounded-xl">
                <span className="text-2xl font-bold text-secondary">{totalLessons - completedLessons}</span>
                <span className="text-sm text-muted-foreground ml-2">Remaining</span>
              </div>
            </div>

            {/* Start Learning Button */}
            {onStartLearning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GlassButton
                  variant="primary"
                  size="lg"
                  glow
                  onClick={onStartLearning}
                  className="px-8 py-4"
                >
                  <PlayCircle size={20} className="mr-2" />
                  Start Learning
                </GlassButton>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* 3D Decorative element */}
        <motion.div
          className="hidden lg:block absolute -right-4 -top-4 w-32 h-32 rounded-full bg-gradient-primary opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
};
