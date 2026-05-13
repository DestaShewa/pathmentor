import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, HelpCircle, Plus, Trash2, Save,
  CheckCircle2, BookOpen, ChevronRight, Sparkles, Loader2
} from "lucide-react";
import aiService from "@/services/aiService";

interface Course { _id: string; title: string; }
interface Lesson { _id: string; title: string; level?: { title: string }; }
interface QuizQuestion { question: string; options: string[]; correctAnswer: number; }

const MentorTaskBuilder = () => {
  // id param is optional — can be a course ID or "general"
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(id && id !== "general" ? id : "");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 }
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (selectedCourse) fetchLessons(selectedCourse);
    else setLessons([]);
  }, [selectedCourse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, coursesRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/my-courses")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setCourses(coursesRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        navigate("/auth");
      } else {
        console.error("Failed to load quiz builder data:", e);
      }
    } finally { setLoading(false); }
  };

  const fetchLessons = async (courseId: string) => {
    try {
      const res = await api.get(`/mentor/course/${courseId}/lessons`);
      setLessons(res.data.data || []);
    } catch { setLessons([]); }
  };

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q));
  };

  const setCorrect = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, correctAnswer: oIdx } : q));
  };



  const handleSave = async () => {
    if (!selectedLesson) {
      toast({ title: "Error", description: "Select a lesson to attach this quiz to", variant: "destructive" });
      return;
    }
    const invalid = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (invalid) {
      toast({ title: "Error", description: "Fill in all questions and options", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.post("/mentor/quiz", { lessonId: selectedLesson, questions });
      setSaved(true);
      toast({ title: "Quiz saved!", description: `${questions.length} question${questions.length !== 1 ? "s" : ""} saved successfully.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to save quiz", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-3xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <GlassButton variant="ghost" size="sm" onClick={() => navigate("/mentor/dashboard")} className="mb-6">
          <ArrowLeft size={16} className="mr-1" /> Back
        </GlassButton>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold">Quiz <span className="text-primary">Builder</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Create a quiz and attach it to a lesson</p>
        </motion.div>

        {/* Course + Lesson selector */}
        <GlassCard className="p-6 space-y-4 mb-6">
          <h2 className="font-bold flex items-center gap-2"><BookOpen size={16} className="text-primary" /> Attach Quiz To</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Course</label>
              <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedLesson(""); }}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary">
                <option value="">Select course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Lesson</label>
              <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)}
                disabled={!selectedCourse || lessons.length === 0}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50">
                <option value="">Select lesson...</option>
                {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
              </select>
            </div>
          </div>
          {selectedCourse && lessons.length === 0 && (
            <p className="text-xs text-amber-400">No lessons in this course yet. <button onClick={() => navigate(`/mentor/upload/${selectedCourse}`)} className="underline">Add a lesson first.</button></p>
          )}


        </GlassCard>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((q, qi) => (
            <motion.div key={qi} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }}>
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle size={13} /> Question {qi + 1}
                  </span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <input value={q.question} onChange={e => updateQuestion(qi, e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary text-sm" />

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${q.correctAnswer === oi ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/5"}`}>
                      <button onClick={() => setCorrect(qi, oi)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${q.correctAnswer === oi ? "border-emerald-500 bg-emerald-500" : "border-white/30 hover:border-white/60"}`}>
                        {q.correctAnswer === oi && <CheckCircle2 size={11} className="text-white" />}
                      </button>
                      <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click the circle to mark the correct answer</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={addQuestion}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
            <Plus size={16} /> Add Question
          </button>
          <GlassButton variant="primary" glow onClick={handleSave} disabled={saving} className="flex-1">
            {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {saving ? "Saving..." : `Save Quiz (${questions.length} Q)`}</>}
          </GlassButton>
        </div>

        {saved && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <GlassCard className="p-4 border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-400">Quiz saved successfully!</p>
                  <p className="text-xs text-muted-foreground">Students will see this quiz after completing the lesson.</p>
                </div>
              </div>
              <button onClick={() => navigate("/mentor/classes")} className="flex items-center gap-1 text-xs text-primary hover:underline">
                View Classes <ChevronRight size={13} />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default MentorTaskBuilder;
