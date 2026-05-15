import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "sonner";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  BookOpen, Play, CheckCircle2, Lock,
  ChevronDown, ChevronUp, Trophy, ArrowLeft,
  FileText, Image, Video, Music, File as FileIcon, ExternalLink, Sparkles, Loader2, XCircle
} from "lucide-react";
import aiService from "@/services/aiService";

import { handleSidebarNav } from "@/lib/navHelper";

interface Level {
  _id: string;
  title: string;
  order: number;
  isUnlocked?: boolean;
  completedLessons?: number;
  score?: number;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  order: number;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    mimeType?: string;
    size?: number;
  }>;
}

interface Quiz {
  _id: string;
  questions: { 
    question: string; 
    options: string[]; 
    correctAnswer: number;
    explanation?: string;
  }[];
}

const Lessons = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizResult, setQuizResult] = useState<{ levelCompleted: boolean; message: string } | null>(null);
  const [isPracticeQuiz, setIsPracticeQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [courseTitle, setCourseTitle] = useState("My Course");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [summaryFormat, setSummaryFormat] = useState<"paragraph" | "bullets">("paragraph");
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("intermediate");
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const [extractingAttachments, setExtractingAttachments] = useState(false);
  const [quizMaterialError, setQuizMaterialError] = useState(false);

  // Track time spent on current lesson
  const [lessonOpenedAt, setLessonOpenedAt] = useState<number | null>(null);
  const MIN_LESSON_SECONDS = 30; // minimum engagement time

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const profileRes = await api.get("/users/profile");
      const userData = profileRes.data.user;
      setUser(userData);

      const courseId = userData.learningProfile?.course?.id;
      const title = userData.learningProfile?.course?.title;
      if (title) setCourseTitle(title);

      if (!courseId) {
        setLoading(false);
        return;
      }

      // Get roadmap (levels + lessons)
      try {
        const roadmapRes = await api.get(`/courses/${courseId}/roadmap`);
        const levelsData: Level[] = roadmapRes.data.levels || roadmapRes.data || [];

        // Get unlock status
        try {
          const unlockRes = await api.get(`/levels/${courseId}/unlock-status`);
          if (unlockRes.data.success) {
            const unlockMap = new Map((unlockRes.data.levels || []).map((l: Level) => [l._id, l]));
            levelsData.forEach(lv => {
              const u = unlockMap.get(lv._id) as Level | undefined;
              lv.isUnlocked = u ? u.isUnlocked : lv.order === 1;
              lv.completedLessons = u?.completedLessons || 0;
              lv.score = u?.score || 0;
            });
          } else {
            // Fallback: first level is always unlocked
            levelsData.forEach(lv => {
              lv.isUnlocked = lv.order === 1;
              lv.completedLessons = 0;
              lv.score = 0;
            });
          }
        } catch (unlockErr) {
          console.log("Unlock status fetch failed, using fallback:", unlockErr);
          levelsData.forEach(lv => {
            lv.isUnlocked = lv.order === 1;
            lv.completedLessons = 0;
            lv.score = 0;
          });
        }

        setLevels(levelsData);

        // Auto-expand first unlocked level
        const firstUnlocked = levelsData.find(l => l.isUnlocked);
        if (firstUnlocked) setExpandedLevel(firstUnlocked._id);

        // Get completed lessons for this user
        try {
          const progressRes = await api.get(`/progress/course/${courseId}`);
          if (progressRes.data.success && progressRes.data.completedLessonIds) {
            setCompletedLessons(new Set(progressRes.data.completedLessonIds));
          }
        } catch (progressErr) {
          console.log("Progress fetch failed (non-critical):", progressErr);
        }

      } catch (roadmapErr) {
        console.error("Roadmap fetch failed:", roadmapErr);
        // Show error message to user
        setLevels([]);
      }

    } catch (profileErr) {
      console.error("Profile fetch failed:", profileErr);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (completing || completedLessons.has(lessonId)) return;

    // Calculate time spent on this lesson
    const timeSpentSeconds = lessonOpenedAt
      ? Math.floor((Date.now() - lessonOpenedAt) / 1000)
      : 0;

    setCompleting(true);
    try {
      const response = await api.post(`/progress/lesson/${lessonId}/complete`, {
        timeSpentSeconds,
      });
      if (response.data.success) {
        setCompletedLessons(prev => new Set([...prev, lessonId]));
        const xpEarned = response.data.xpEarned || 0;
        toast.success(`Lesson completed! +${xpEarned} XP earned 🎉`);
        // Refresh levels to update unlock status
        fetchData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (err.response?.status === 400 && msg.includes("already completed")) {
        setCompletedLessons(prev => new Set([...prev, lessonId]));
      } else if (err.response?.status === 400 && msg.includes("seconds")) {
        // Engagement time not met
        toast.error(msg);
      } else if (err.response?.status === 403) {
        toast.error(msg || "Complete the previous lesson first.");
      } else {
        toast.error(msg || "Failed to mark lesson as complete");
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleOpenLesson = async (lesson: Lesson, levelId: string) => {
    setSelectedLesson(lesson);
    setSelectedLevelId(levelId);
    setShowQuiz(false);
    setQuiz(null);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizResult(null);
    setIsPracticeQuiz(false);
    setAiSummary(null);
    setIsSummarizing(false);
    setRevealedAnswers(new Set());
    // Start tracking time
    setLessonOpenedAt(Date.now());
    try {
      const res = await api.get(`/quizzes/lesson/${lesson._id}`);
      if (res.data.data) {
        setQuiz(res.data.data);
      }
    } catch { /* no quiz for this lesson */ }
  };

  const handleGeneratePracticeQuiz = async () => {
    if (!selectedLesson) return;

    // REQUIRE at least one material to be selected
    if (selectedAttachments.size === 0) {
      setQuizMaterialError(true);
      return;
    }
    setQuizMaterialError(false);
    setGeneratingQuiz(true);

    try {
      // Send file URLs to the backend — it reads files from disk and extracts text server-side
      const fileUrls = Array.from(selectedAttachments);
      const res = await aiService.quizFromFiles(fileUrls, quizNumQuestions, quizDifficulty);

      if (res.result && Array.isArray(res.result)) {
        setQuiz({ _id: "practice", questions: res.result });
        setIsPracticeQuiz(true);
        setShowQuiz(true);
        setQuizAnswers([]);
        setQuizSubmitted(false);
        setQuizResult(null);
        setRevealedAnswers(new Set());
        toast.success(`AI Practice Quiz generated with ${res.result.length} questions from your materials! ✨`);
      } else {
        toast.error("The AI could not generate questions from these materials. Please try a different file.");
      }
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error || e?.message || "AI is unavailable right now.";
      toast.error(msg);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedLesson?.content) return;

    setIsSummarizing(true);
    try {
      const res = await aiService.summarize(selectedLesson.content, summaryLength, summaryFormat);
      setAiSummary(res.summary);
      toast.success("Summary generated! ✨");
    } catch (error) {
      console.error("AI Summarizer Error:", error);
      toast.error("AI is currently offline. Please try again later.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (isPracticeQuiz) {
      setQuizResult({ levelCompleted: false, message: "Practice complete. This doesn't affect your formal progress." });
      return;
    }

    if (selectedLevelId) {
      try {
        const res = await api.post("/progress/level/score", { levelId: selectedLevelId, score });
        setQuizResult({
          levelCompleted: res.data.levelCompleted,
          message: res.data.message,
        });
        if (res.data.levelCompleted) {
          toast.success("Level completed! Next level unlocked 🎉");
          // Refresh to update unlock status
          setTimeout(() => fetchData(), 1000);
        } else if (score < 80) {
          toast.error(`Score: ${score}% — Need 80% to unlock next level. Try again!`);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to save quiz score");
      }
    }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="lessons"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <AnimatePresence mode="wait">

            {/* ── LESSON DETAIL VIEW ── */}
            {selectedLesson ? (
              <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <GlassButton variant="ghost" size="sm" onClick={() => setSelectedLesson(null)}>
                  <ArrowLeft size={16} className="mr-1" /> Back to Levels
                </GlassButton>

                <GlassCard className="p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{selectedLesson.title}</h1>
                      {selectedLesson.description && (
                        <p className="text-muted-foreground">{selectedLesson.description}</p>
                      )}
                    </div>
                    {completedLessons.has(selectedLesson._id) ? (
                      <div className="flex items-center gap-2 text-green-400 shrink-0">
                        <CheckCircle2 size={20} />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2 items-center">
                            {/* Summary Settings */}
                            <select
                              value={summaryLength}
                              onChange={(e) => setSummaryLength(e.target.value as any)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-muted-foreground outline-none"
                            >
                              <option value="short">Short (TL;DR)</option>
                              <option value="medium">Medium</option>
                              <option value="long">Long</option>
                            </select>
                            <select
                              value={summaryFormat}
                              onChange={(e) => setSummaryFormat(e.target.value as any)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-muted-foreground outline-none"
                            >
                              <option value="paragraph">Paragraph</option>
                              <option value="bullets">Bullets</option>
                            </select>

                            <GlassButton
                              variant="secondary"
                              size="sm"
                              onClick={handleSummarize}
                              disabled={isSummarizing || !selectedLesson.content}
                            >
                              {isSummarizing ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                              ) : (
                                <Sparkles size={16} className="mr-1 text-primary" />
                              )}
                              AI Summary
                            </GlassButton>
                          </div>

                          <GlassButton
                            variant="primary"
                            size="sm"
                            className="w-full"
                            onClick={() => handleCompleteLesson(selectedLesson._id)}
                            disabled={completing}
                          >
                            {completing ? "Saving..." : "Mark Complete"}
                          </GlassButton>
                        </div>
                        <p className="text-[10px] text-muted-foreground mr-2">
                          Spend ≥30s on this lesson
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Summary Box */}
                  <AnimatePresence>
                    {aiSummary && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles size={16} />
                            <h4 className="text-sm font-bold uppercase tracking-wider">AI Summary</h4>
                          </div>
                          <p className="text-sm text-white/90 leading-relaxed italic">
                            {aiSummary}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video */}
                  {selectedLesson.videoUrl && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe
                        src={
                          selectedLesson.videoUrl?.includes("youtube.com/watch?v=") 
                            ? selectedLesson.videoUrl.replace("watch?v=", "embed/").split("&")[0] 
                            : selectedLesson.videoUrl?.includes("youtu.be/")
                            ? selectedLesson.videoUrl.replace("youtu.be/", "youtube.com/embed/").split("?")[0]
                            : selectedLesson.videoUrl
                        }
                        className="w-full h-full"
                        allowFullScreen
                        title={selectedLesson.title}
                      />
                    </div>
                  )}

                  {/* Text content */}
                  {selectedLesson.content ? (
                    <div
                      className="prose prose-invert max-w-none leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                    />
                  ) : !selectedLesson.videoUrl && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                      <p>Lesson content will be available soon.</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Lesson Materials</h3>
                      <div className="grid gap-3">
                        {selectedLesson.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={`http://localhost:5001${attachment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              {attachment.type === "pdf" && <FileText size={20} className="text-primary" />}
                              {attachment.type === "doc" && <FileText size={20} className="text-blue-400" />}
                              {attachment.type === "image" && <Image size={20} className="text-green-400" />}
                              {attachment.type === "video" && <Video size={20} className="text-purple-400" />}
                              {attachment.type === "audio" && <Music size={20} className="text-orange-400" />}
                              {!["pdf", "doc", "image", "video", "audio"].includes(attachment.type) && <FileIcon size={20} className="text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.type.toUpperCase()} • {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : "Unknown size"}
                              </p>
                            </div>
                            <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Quiz section or Practice Generator */}
                {quiz ? (
                  <GlassCard className="p-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Trophy size={20} className="text-primary" /> {isPracticeQuiz ? "Practice Quiz" : "Lesson Quiz"}
                    </h2>

                    {!showQuiz ? (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-2">
                          {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} to test your knowledge
                        </p>
                        <p className="text-xs text-amber-400 mb-4 flex items-center justify-center gap-1">
                          <Trophy size={12} /> Score 80% or higher to unlock the next level
                        </p>
                        {quizSubmitted ? (
                          <div className="space-y-2">
                            <div className={`text-2xl font-bold ${quizScore >= 80 ? "text-green-400" : "text-orange-400"}`}>
                              Score: {quizScore}%
                            </div>
                            {quizResult && (
                              <p className={`text-sm ${quizResult.levelCompleted ? "text-green-400" : "text-orange-400"}`}>
                                {quizResult.message}
                              </p>
                            )}
                            {quizScore < 80 && (
                              <GlassButton variant="secondary" size="sm" onClick={() => {
                                setQuizSubmitted(false);
                                setQuizAnswers([]);
                                setQuizScore(0);
                                setQuizResult(null);
                                setShowQuiz(true);
                              }}>
                                Try Again
                              </GlassButton>
                            )}
                          </div>
                        ) : (
                          <GlassButton variant="primary" glow onClick={() => setShowQuiz(true)}>
                            Start Quiz
                          </GlassButton>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {quiz.questions.map((q, qi) => {
                          const isRevealed = revealedAnswers.has(qi) || quizSubmitted;
                          return (
                            <div key={qi} className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                              <p className="font-semibold">{qi + 1}. {q.question}</p>
                              <div className="grid gap-2">
                                {q.options.map((opt, oi) => {
                                  const isSelected = quizAnswers[qi] === oi;
                                  const isCorrect = isRevealed && oi === q.correctAnswer;
                                  const isWrong = isRevealed && isSelected && oi !== q.correctAnswer;
                                  return (
                                    <button
                                      key={oi}
                                      disabled={isRevealed && !isPracticeQuiz} // Only disable if not practice or if already revealed
                                      onClick={() => {
                                        if (isRevealed && isPracticeQuiz) return;
                                        const updated = [...quizAnswers];
                                        updated[qi] = oi;
                                        setQuizAnswers(updated);
                                        
                                        if (isPracticeQuiz) {
                                          setRevealedAnswers(prev => new Set(Array.from(prev).concat(qi)));
                                        }
                                      }}
                                      className={`p-3 rounded-xl text-left text-sm border transition-all ${
                                        isCorrect ? "border-green-500 bg-green-500/10 text-green-300"
                                        : isWrong ? "border-red-500 bg-red-500/10 text-red-300"
                                        : isSelected ? "border-primary bg-primary/10"
                                        : "border-white/10 hover:border-white/20 bg-white/5"
                                      }`}
                                    >
                                      <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Explanation for Practice Quizzes */}
                              <AnimatePresence>
                                {isPracticeQuiz && revealedAnswers.has(qi) && q.explanation && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="pt-2"
                                  >
                                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground italic">
                                      <strong className="text-primary not-italic">Explanation:</strong> {q.explanation}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {!quizSubmitted ? (
                          <GlassButton
                            variant="primary"
                            onClick={handleSubmitQuiz}
                            disabled={quizAnswers.length < quiz.questions.length}
                          >
                            Finish Quiz
                          </GlassButton>
                        ) : (
                          <div className="space-y-4 p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                            <div className={`text-3xl font-bold ${quizScore >= 80 ? "text-green-400" : "text-orange-400"}`}>
                              {quizScore}%
                            </div>
                            {quizResult && (
                              <p className="text-sm text-balance">
                                {quizResult.message}
                              </p>
                            )}
                            <div className="flex gap-4 justify-center">
                              {quizScore < 80 && (
                                <GlassButton variant="secondary" size="sm" onClick={() => {
                                  setQuizSubmitted(false);
                                  setQuizAnswers([]);
                                  setQuizScore(0);
                                  setQuizResult(null);
                                  setRevealedAnswers(new Set());
                                }}>
                                  Try Again
                                </GlassButton>
                              )}
                              <GlassButton variant="ghost" size="sm" onClick={() => {
                                setQuiz(null);
                                setShowQuiz(false);
                                setIsPracticeQuiz(false);
                              }}>
                                Close
                              </GlassButton>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </GlassCard>
                ) : (
                  <GlassCard className="p-8 flex flex-col items-center space-y-6">
                    {/* Header */}
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <Sparkles size={22} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">AI Practice Quiz</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        Upload lesson materials for the AI to analyze and generate quiz questions.
                      </p>
                    </div>

                    <div className="w-full max-w-sm space-y-5">
                      {/* Settings row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Questions (5–20)</label>
                          <select
                            value={quizNumQuestions}
                            onChange={(e) => setQuizNumQuestions(Number(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                          >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                            <option value={20}>20 Questions</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Difficulty</label>
                          <select
                            value={quizDifficulty}
                            onChange={(e) => setQuizDifficulty(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                      </div>

                      {/* REQUIRED: Lesson Material Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-bold px-1">Lesson Materials</label>
                          <span className="text-[10px] text-red-400 font-bold uppercase">* Required</span>
                        </div>

                        {(() => {
                          const validMaterials = selectedLesson.attachments?.filter(a => 
                            a.name.toLowerCase().endsWith('.pdf') || a.type === 'pdf'
                          ) || [];

                          if (validMaterials.length > 0) {
                            return (
                              <div
                                className={`rounded-2xl border-2 border-dashed p-4 space-y-3 transition-colors ${
                                  quizMaterialError ? "border-red-500/60 bg-red-500/5" : selectedAttachments.size > 0 ? "border-green-500/40 bg-green-500/5" : "border-white/15 bg-white/5"
                                }`}
                              >
                                <p className="text-[11px] text-muted-foreground">
                                  Select one or more PDF files the AI will use to generate questions:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {validMaterials.map((a, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        const next = new Set(selectedAttachments);
                                        if (next.has(a.url)) next.delete(a.url);
                                        else next.add(a.url);
                                        setSelectedAttachments(next);
                                        if (next.size > 0) setQuizMaterialError(false);
                                      }}
                                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                        selectedAttachments.has(a.url)
                                          ? "bg-primary/20 border-primary text-primary font-medium"
                                          : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30"
                                      }`}
                                    >
                                      <FileText size={11} />
                                      {a.name}
                                      {selectedAttachments.has(a.url) && (
                                        <CheckCircle2 size={11} className="text-primary" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                                {selectedAttachments.size > 0 && (
                                  <p className="text-[10px] text-green-400">
                                    ✓ {selectedAttachments.size} PDF file{selectedAttachments.size > 1 ? "s" : ""} selected
                                  </p>
                                )}
                              </div>
                            );
                          } else {
                            return (
                              <div className="rounded-2xl border-2 border-dashed border-orange-500/40 bg-orange-500/5 p-5 text-center space-y-2">
                                <FileText size={28} className="text-orange-400/60 mx-auto" />
                                <p className="text-sm text-orange-300 font-medium">No valid PDF materials uploaded</p>
                                <p className="text-xs text-muted-foreground">
                                  This lesson has no PDF files. AI quiz generation strictly requires a PDF file.
                                </p>
                              </div>
                            );
                          }
                        })()}

                        {/* Validation error */}
                        <AnimatePresence>
                          {quizMaterialError && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-red-400 font-medium px-1 flex items-center gap-1"
                            >
                              <XCircle size={12} /> Please select at least one lesson material before generating the quiz.
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Generate button */}
                      <GlassButton
                        variant="primary"
                        className="w-full"
                        onClick={handleGeneratePracticeQuiz}
                        disabled={generatingQuiz || extractingAttachments || !selectedLesson.attachments?.length}
                      >
                        {generatingQuiz || extractingAttachments ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles size={16} className="mr-2" />
                        )}
                        {extractingAttachments ? "Reading Materials..." : generatingQuiz ? "Generating Quiz..." : "Generate Quiz from Materials"}
                      </GlassButton>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ) : (

              /* ── LEVELS LIST VIEW ── */
              <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-1">{courseTitle}</h1>
                  <p className="text-muted-foreground text-sm">
                    7 levels from Awareness to Mastery. Score ≥80% on each quiz to unlock the next level.
                  </p>
                </div>

                {levels.length === 0 ? (
                  <GlassCard className="p-12 text-center text-muted-foreground">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No course content yet. Check back soon!</p>
                  </GlassCard>
                ) : (
                  levels.map((level, idx) => {
                    const isLocked = !level.isUnlocked;
                    const lessons = level.lessons || [];
                    const completedCount = lessons.filter(l => completedLessons.has(l._id)).length;
                    const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
                    const isExpanded = expandedLevel === level._id;

                    return (
                      <motion.div
                        key={level._id}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <GlassCard className={`overflow-hidden ${isLocked ? "opacity-50" : ""}`} hover={!isLocked}>
                          <div
                            className={`p-6 ${!isLocked ? "cursor-pointer" : "cursor-not-allowed"}`}
                            onClick={() => !isLocked && setExpandedLevel(isExpanded ? null : level._id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold ${isLocked ? "bg-muted text-muted-foreground"
                                : pct === 100 ? "bg-green-500/20 text-green-400"
                                  : "bg-primary/20 text-primary"
                                }`}>
                                {isLocked ? <Lock size={20} /> : pct === 100 ? <CheckCircle2 size={24} /> : level.order}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs text-primary font-bold uppercase tracking-wider">Level {level.order}</span>
                                  {!isLocked && pct === 100 && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Complete</span>}
                                  {!isLocked && pct > 0 && pct < 100 && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">In Progress</span>}
                                </div>
                                <h3 className="text-xl font-bold">{level.title}</h3>
                                {!isLocked && lessons.length > 0 && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                      <span>{completedCount}/{lessons.length} lessons</span>
                                      <span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-secondary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8 }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {!isLocked && (
                                <div className="shrink-0 text-muted-foreground">
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded lessons */}
                          <AnimatePresence>
                            {isExpanded && !isLocked && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 border-t border-white/10 pt-4">
                                  {lessons.length === 0 ? (
                                    <p className="text-muted-foreground text-sm italic">No lessons added yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {lessons.map(lesson => {
                                        const done = completedLessons.has(lesson._id);
                                        return (
                                          <button
                                            key={lesson._id}
                                            onClick={() => handleOpenLesson(lesson, level._id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group"
                                          >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-green-500/20 text-green-400" : "bg-primary/10 text-primary"}`}>
                                              {done ? <CheckCircle2 size={16} /> : <Play size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{lesson.title}</p>
                                              {lesson.description && (
                                                <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                                              )}
                                            </div>
                                            {lesson.videoUrl && (
                                              <span className="text-xs text-muted-foreground shrink-0">Video</span>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </GlassCard>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Lessons;
