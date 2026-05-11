import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, CheckCircle2, BookOpen } from "lucide-react";
import { Lesson, LessonProgress, LessonQuiz } from "@/hooks/useLessons";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Progress } from "@/components/ui/progress";
import { LessonQuizSection } from "./LessonQuizSection";

interface LessonContentProps {
  lesson: Lesson;
  quizzes: LessonQuiz[];
  progress: LessonProgress | null;
  onBack: () => void;
  onUpdateProgress: (updates: Partial<LessonProgress>) => void;
}

export const LessonContent = ({
  lesson,
  quizzes,
  progress,
  onBack,
  onUpdateProgress,
}: LessonContentProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleMarkComplete = () => {
    onUpdateProgress({ is_completed: true });
  };

  const handleQuizComplete = (score: number) => {
    onUpdateProgress({ 
      quiz_completed: true, 
      quiz_score: score,
      is_completed: true 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back button */}
      <GlassButton variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lessons
      </GlassButton>

      {/* Video section */}
      {lesson.video_url ? (
        <GlassCard className="p-0 overflow-hidden">
          <div className="relative aspect-video bg-black">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-8 flex items-center justify-center aspect-video bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-primary/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Text-based lesson</p>
          </div>
        </GlassCard>
      )}

      {/* Lesson info */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                {lesson.category}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {lesson.experience_level}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{lesson.title}</h1>
            <p className="text-muted-foreground mt-2">{lesson.description}</p>
          </div>
          
          {progress?.is_completed ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          ) : (
            <GlassButton variant="primary" size="sm" onClick={handleMarkComplete}>
              Mark Complete
            </GlassButton>
          )}
        </div>

        {/* Progress */}
        {progress && !progress.is_completed && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Your progress</span>
              <span>{Math.round((progress.video_progress_seconds || 0) / 60)} min watched</span>
            </div>
            <Progress 
              value={(progress.video_progress_seconds || 0) / (lesson.duration_minutes * 60) * 100} 
              className="h-2"
            />
          </div>
        )}
      </GlassCard>

      {/* Text content */}
      {lesson.content && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold mb-4">Lesson Content</h2>
          <div 
            className="prose prose-invert max-w-none text-foreground/90"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </GlassCard>
      )}

      {/* Quiz section */}
      {quizzes.length > 0 && (
        <GlassCard className="p-6">
          {!showQuiz ? (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Ready for the Quiz?</h2>
              <p className="text-muted-foreground mb-6">
                Test your knowledge with {quizzes.length} question{quizzes.length > 1 ? 's' : ''}
              </p>
              {progress?.quiz_completed ? (
                <div className="text-green-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">Quiz completed! Score: {progress.quiz_score}%</p>
                </div>
              ) : (
                <GlassButton variant="primary" glow onClick={() => setShowQuiz(true)}>
                  Start Quiz
                </GlassButton>
              )}
            </div>
          ) : (
            <LessonQuizSection
              quizzes={quizzes}
              onComplete={handleQuizComplete}
              onClose={() => setShowQuiz(false)}
            />
          )}
        </GlassCard>
      )}
    </motion.div>
  );
};
