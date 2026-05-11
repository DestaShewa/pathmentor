import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import api from "@/services/api";

interface Stage {
  id: number;
  name: string;
  status: "completed" | "current" | "locked";
}

interface RoadmapSnapshotProps {
  currentStage?: number;
  stages?: Stage[];
}

export const RoadmapSnapshot = ({
  currentStage,
  stages,
}: RoadmapSnapshotProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [realStages, setRealStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If stages are provided as prop, use them
    if (stages && stages.length > 0) {
      setRealStages(stages);
      setLoading(false);
      return;
    }

    // Otherwise fetch from backend
    const fetchRoadmap = async () => {
      try {
        const profileRes = await api.get("/users/profile");
        const courseId = profileRes.data.user?.learningProfile?.course?.id;
        
        if (!courseId) {
          setLoading(false);
          return;
        }

        // Get roadmap levels
        const roadmapRes = await api.get(`/courses/${courseId}/roadmap`);
        const levels = roadmapRes.data.levels || [];

        // Get unlock status
        let unlockMap = new Map();
        try {
          const unlockRes = await api.get(`/levels/${courseId}/unlock-status`);
          unlockMap = new Map((unlockRes.data.levels || []).map((l: any) => [l._id, l]));
        } catch { /* ignore */ }

        // Build stages from real levels
        const builtStages: Stage[] = levels.map((level: any, idx: number) => {
          const unlockData = unlockMap.get(level._id);
          const isUnlocked = unlockData?.isUnlocked ?? (level.order === 1);
          const completedLessons = unlockData?.completedLessons || 0;
          const totalLessons = level.lessons?.length || 0;
          const isCompleted = totalLessons > 0 && completedLessons >= totalLessons;

          let status: "completed" | "current" | "locked" = "locked";
          if (isCompleted) status = "completed";
          else if (isUnlocked) status = "current";

          return {
            id: level.order,
            name: level.title,
            status
          };
        });

        setRealStages(builtStages);
      } catch (err) {
        console.error("Failed to fetch roadmap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [stages]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="glass-premium p-6 rounded-3xl mb-8"
      >
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (realStages.length === 0) {
    return null;
  }

  // Calculate current stage from status
  const currentStageCalc = realStages.findIndex(s => s.status === "current") + 1 || 1;
  const activeStage = currentStage || currentStageCalc;

  const stagesWithStatus = realStages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="glass-premium p-6 rounded-3xl mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Your Roadmap</h3>
        <Link
          to="/roadmap"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View full roadmap <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stages - horizontal scroll on mobile */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-7 md:gap-2"
      >
        {stagesWithStatus.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "min-w-[100px] md:min-w-0 snap-start flex flex-col items-center p-4 rounded-2xl transition-all cursor-pointer",
              stage.status === "completed" &&
                "bg-white/5 hover:bg-white/10",
              stage.status === "current" &&
                "bg-primary/20 border border-primary/40 shadow-glow-sm",
              stage.status === "locked" &&
                "bg-white/3 opacity-50"
            )}
          >
            {/* Icon */}
            <motion.div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                stage.status === "completed" && "bg-green-500/20 text-green-400",
                stage.status === "current" &&
                  "bg-primary text-primary-foreground",
                stage.status === "locked" && "bg-white/10 text-muted-foreground"
              )}
              whileHover={stage.status !== "locked" ? { scale: 1.1 } : {}}
            >
              {stage.status === "completed" && <Check className="w-5 h-5" />}
              {stage.status === "current" && (
                <Play className="w-5 h-5 fill-current" />
              )}
              {stage.status === "locked" && <Lock className="w-4 h-4" />}
            </motion.div>

            {/* Label */}
            <span
              className={cn(
                "text-xs font-medium text-center",
                stage.status === "current" && "text-primary",
                stage.status === "locked" && "text-muted-foreground"
              )}
            >
              {stage.name}
            </span>

            {/* Stage number */}
            <span className="text-[10px] text-muted-foreground mt-1">
              Stage {stage.id}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${((activeStage - 1) / (stagesWithStatus.length - 1)) * 100}%`,
            }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Stage {activeStage} of {stagesWithStatus.length}
        </span>
      </div>
    </motion.div>
  );
};
