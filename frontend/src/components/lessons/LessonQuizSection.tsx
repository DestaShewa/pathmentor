import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import { LessonQuiz } from "@/hooks/useLessons";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Progress } from "@/components/ui/progress";

interface LessonQuizSectionProps {
  quizzes: LessonQuiz[];
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const LessonQuizSection = ({ quizzes, onComplete, onClose }: LessonQuizSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuiz = quizzes[currentIndex];
  const progress = ((currentIndex + 1) / quizzes.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    if (selectedAnswer === currentQuiz.correct_answer_index) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const score = Math.round((correctAnswers / quizzes.length) * 100);
      setIsComplete(true);
      onComplete(score);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectAnswers(0);
    setIsComplete(false);
  };

  if (isComplete) {
    const score = Math.round((correctAnswers / quizzes.length) * 100);
    const passed = score >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
            passed ? "bg-green-500/20" : "bg-orange-500/20"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          ) : (
            <XCircle className="w-12 h-12 text-orange-500" />
          )}
        </motion.div>

        <h3 className="text-2xl font-bold mb-2">
          {passed ? "Congratulations!" : "Keep Practicing!"}
        </h3>
        <p className="text-4xl font-bold text-primary mb-2">{score}%</p>
        <p className="text-muted-foreground mb-6">
          You got {correctAnswers} out of {quizzes.length} questions correct
        </p>

        <div className="flex gap-4 justify-center">
          {!passed && (
            <GlassButton variant="secondary" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </GlassButton>
          )}
          <GlassButton variant="primary" onClick={onClose}>
            Continue
          </GlassButton>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {quizzes.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold">{currentQuiz.question}</h3>

          <div className="space-y-3">
            {currentQuiz.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuiz.correct_answer_index;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    showCorrect
                      ? "border-green-500 bg-green-500/10"
                      : showWrong
                      ? "border-red-500 bg-red-500/10"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  }`}
                  whileHover={!showResult ? { scale: 1.02 } : undefined}
                  whileTap={!showResult ? { scale: 0.98 } : undefined}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        showCorrect
                          ? "border-green-500 bg-green-500 text-white"
                          : showWrong
                          ? "border-red-500 bg-red-500 text-white"
                          : isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-foreground">{option}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                    {showWrong && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && currentQuiz.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-primary/10 border border-primary/20"
            >
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Explanation:</strong> {currentQuiz.explanation}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {!showResult ? (
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            Submit Answer
          </GlassButton>
        ) : (
          <GlassButton variant="primary" onClick={handleNext}>
            {currentIndex < quizzes.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              "See Results"
            )}
          </GlassButton>
        )}
      </div>
    </div>
  );
};
