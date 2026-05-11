import { motion } from "framer-motion";
import { Play, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { Lesson, LessonProgress } from "@/hooks/useLessons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Progress } from "@/components/ui/progress";

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
  onClick: () => void;
  index: number;
}

export const LessonCard = ({ lesson, progress, onClick, index }: LessonCardProps) => {
  const isCompleted = progress?.is_completed;
  const hasStarted = !!progress;
  const videoProgress = progress?.video_progress_seconds || 0;
  const progressPercent = lesson.duration_minutes > 0 
    ? Math.min(100, (videoProgress / (lesson.duration_minutes * 60)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        className="p-0 overflow-hidden cursor-pointer group"
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          {lesson.thumbnail_url ? (
            <img
              src={lesson.thumbnail_url}
              alt={lesson.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary/40" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <motion.div
              className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </motion.div>
          </div>

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-foreground">
            {lesson.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {lesson.title}
          </h3>
          
          {lesson.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {lesson.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lesson.duration_minutes} min
            </div>
            <div className="capitalize">{lesson.experience_level}</div>
          </div>

          {/* Progress bar */}
          {hasStarted && !isCompleted && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
