import { motion } from "framer-motion";
import { Play, Clock, Sparkles } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

interface ContinueLearningCardProps {
  lessonTitle: string;
  lessonCategory: string;
  duration: string;
  progress: number;
  matchScore: number;
}

export const ContinueLearningCard = ({
  lessonTitle,
  lessonCategory,
  duration,
  progress,
  matchScore,
}: ContinueLearningCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass-premium-hover p-6 md:p-8 mb-8 relative overflow-hidden"
    >
      {/* Liquid background animation */}
      <motion.div
        className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-gradient-secondary opacity-10 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <motion.span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Recommended
          </motion.span>
          <span className="px-3 py-1.5 rounded-full bg-secondary/20 text-secondary text-sm">
            {lessonCategory.replace("_", " ")}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(matchScore * 100)}% match
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-semibold mb-3">
              {lessonTitle}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {duration}
              </div>
              <span>•</span>
              <span>Continue where you left off</span>
            </div>

            {/* Progress bar */}
            <div className="max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Play Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <GlassButton
              variant="primary"
              glow
              size="lg"
              className="w-full lg:w-auto px-8 py-4 rounded-2xl"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-semibold">Continue Learning</span>
            </GlassButton>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
