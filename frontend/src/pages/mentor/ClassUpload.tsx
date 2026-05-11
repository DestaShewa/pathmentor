import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Plus, Trash2, CheckCircle2, Save, HelpCircle, FileText, Image, Music, Upload, File, X, Paperclip, Link as LinkIcon, Video } from "lucide-react";

interface Level { _id: string; title: string; order: number; }
interface Attachment { name: string; url: string; type: string; mimeType: string; size: number; }
interface Lesson { _id: string; title: string; description?: string; videoUrl?: string; attachments?: Attachment[]; level: { title: string; order: number }; }
interface QuizQuestion { question: string; options: string[]; correctAnswer: number; }

const FILE_ICONS: Record<string, { icon: any; color: string }> = {
  pdf: { icon: FileText, color: "text-red-400" },
  doc: { icon: FileText, color: "text-blue-400" },
  ppt: { icon: FileText, color: "text-orange-400" },
  xls: { icon: FileText, color: "text-green-400" },
  image: { icon: Image, color: "text-purple-400" },
  video: { icon: Video, color: "text-cyan-400" },
  audio: { icon: Music, color: "text-pink-400" },
  other: { icon: File, color: "text-slate-400" },
};

const formatSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const ACCEPTED = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.ogg,.wav";

const ClassUpload = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(id && id !== "general" ? id : "");
  const [levels, setLevels] = useState<Level[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCourseData, setLoadingCourseData] = useState(false);
  const [activeTab, setActiveTab] = useState<"lesson" | "quiz">("lesson");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideo, setLessonVideo] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState<any>(null);

  useEffect(() => { const t = localStorage.getItem("token"); if (!t) { navigate("/auth"); return; } fetchData(); }, [id, navigate]);
  useEffect(() => { if (selectedLesson) fetchExistingQuiz(selectedLesson); }, [selectedLesson]);
  useEffect(() => { if (selectedCourseId && selectedCourseId !== "general") fetchCourseData(selectedCourseId); }, [selectedCourseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pR = await api.get("/users/profile");
      if (pR.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(pR.data.user);

      // Always fetch all mentor courses for the selector
      const coursesRes = await api.get("/mentor/my-courses");
      setAllCourses(coursesRes.data.data || []);

      // If we have a real course ID, load its data
      if (selectedCourseId && selectedCourseId !== "general") {
        await fetchCourseData(selectedCourseId);
      }
    } catch (e: any) { if (e?.response?.status === 401) navigate("/auth"); }
    finally { setLoading(false); }
  };

  const fetchCourseData = async (courseId: string) => {
    setLoadingCourseData(true);
    try {
      const [cR, lR, lsR] = await Promise.all([
        api.get(`/mentor/course/${courseId}`),
        api.get(`/levels/course/${courseId}`),
        api.get(`/mentor/course/${courseId}/lessons`)
      ]);
      setCourse(cR.data.course);
      setLevels(lR.data.data || []);
      setLessons(lsR.data.data || []);
      if (lR.data.data?.length > 0) setSelectedLevel(lR.data.data[0]._id);
    } catch (e: any) {
      console.error("Failed to load course data:", e);
    } finally { setLoadingCourseData(false); }
  };

  const fetchExistingQuiz = async (lid: string) => {
    try { const r = await api.get(`/mentor/quiz/${lid}`); setExistingQuiz(r.data.data); if (r.data.data?.questions?.length > 0) setQuestions(r.data.data.questions.map((q: any) => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer }))); }
    catch { setExistingQuiz(null); }
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !selectedLevel) { toast({ title: "Error", description: "Title and level are required", variant: "destructive" }); return; }
    setSavingLesson(true);
    try {
      await api.post("/mentor/lesson", { title: lessonTitle.trim(), description: lessonDesc.trim(), content: lessonContent.trim(), videoUrl: lessonVideo.trim() || undefined, order: lessonOrder, levelId: selectedLevel, courseId: selectedCourseId });
      toast({ title: "Lesson created!" });
      setLessonTitle(""); setLessonDesc(""); setLessonContent(""); setLessonVideo(""); setLessonOrder(1);
      const r = await api.get(`/mentor/course/${selectedCourseId}/lessons`); setLessons(r.data.data || []);
    } catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" }); }
    finally { setSavingLesson(false); }
  };

  const handleFileSelect = (files: FileList | null) => { if (files) setUploadFiles(prev => [...prev, ...Array.from(files)]); };
  const removeUploadFile = (idx: number) => setUploadFiles(prev => prev.filter((_, i) => i !== idx));

  const handleUploadFiles = async (lessonId: string) => {
    if (!uploadFiles.length) { toast({ title: "Error", description: "Select files first", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const fd = new FormData(); uploadFiles.forEach(f => fd.append("files", f));
      await api.post(`/mentor/lesson/${lessonId}/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Files uploaded!", description: `${uploadFiles.length} file(s) attached.` });
      setUploadFiles([]); setUploadingTo(null);
      const r = await api.get(`/mentor/course/${selectedCourseId}/lessons`); setLessons(r.data.data || []);
    } catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Upload failed", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const handleDeleteAttachment = async (lessonId: string, url: string) => {
    try { await api.delete(`/mentor/lesson/${lessonId}/attachment`, { data: { url } }); toast({ title: "File removed" }); const r = await api.get(`/mentor/course/${selectedCourseId}/lessons`); setLessons(r.data.data || []); }
    catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" }); }
  };

  const addQ = () => setQuestions(p => [...p, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  const removeQ = (i: number) => setQuestions(p => p.filter((_, j) => j !== i));
  const updateQ = (i: number, f: string, v: any) => setQuestions(p => p.map((q, j) => j === i ? { ...q, [f]: v } : q));
  const updateOpt = (qi: number, oi: number, v: string) => setQuestions(p => p.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k) => k === oi ? v : o) } : q));

  const handleSaveQuiz = async () => {
    if (!selectedLesson) { toast({ title: "Error", description: "Select a lesson first", variant: "destructive" }); return; }
    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) { toast({ title: "Error", description: "Fill all questions and options", variant: "destructive" }); return; }
    setSavingQuiz(true);
    try { await api.post("/mentor/quiz", { lessonId: selectedLesson, questions }); toast({ title: "Quiz saved!" }); }
    catch (e: any) { toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" }); }
    finally { setSavingQuiz(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />
      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>
        <GlassButton variant="ghost" size="sm" onClick={() => navigate(`/mentor/class/${selectedCourseId || "classes"}`)} className="mb-6"><ArrowLeft size={16} className="mr-1" /> Back to Course</GlassButton>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold">Upload <span className="text-primary">Content</span></h1>
          <p className="text-muted-foreground text-sm mt-1">{course?.title || "Select a course below"} — Add lessons, files (PDF, video, images, docs), and quizzes</p>
        </motion.div>

        {/* Course selector — always visible */}
        <GlassCard className="p-5 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Course *</label>
              <select
                value={selectedCourseId}
                onChange={e => { setSelectedCourseId(e.target.value); setLevels([]); setLessons([]); setCourse(null); setSelectedLevel(""); }}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Select a course...</option>
                {allCourses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            {course && (
              <div className="flex items-center gap-3 pt-5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{course.title}</p>
                  <p className="text-xs text-muted-foreground">{course.category} · {levels.length} levels · {lessons.length} lessons</p>
                </div>
              </div>
            )}
            {loadingCourseData && (
              <div className="pt-5 flex items-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                Loading course data...
              </div>
            )}
          </div>
        </GlassCard>

        {/* Guard: require course selection */}
        {!selectedCourseId && (
          <GlassCard className="p-12 text-center">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-2">Select a Course</h3>
            <p className="text-muted-foreground text-sm">Choose a course above to start adding lessons and content.</p>
          </GlassCard>
        )}
        {/* Tabs + content — only when course is selected */}
        {selectedCourseId && !loadingCourseData && (
          <>
        <div className="flex gap-2 p-1 glass-inner-glow rounded-xl w-fit mb-8">
          {(["lesson", "quiz"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-2 ${activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}>
              {tab === "lesson" ? <BookOpen size={15} /> : <HelpCircle size={15} />}
              {tab === "lesson" ? "Add Lesson" : "Add Quiz"}
            </button>
          ))}
        </div>

        {activeTab === "lesson" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard className="p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2"><BookOpen size={18} className="text-primary" /> Lesson Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Level *</label>
                  <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary">
                    <option value="">Select level...</option>
                    {levels.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Order</label>
                  <input type="number" value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} min={1} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title *</label>
                <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} placeholder="e.g. Introduction to React Hooks" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Short Description</label>
                <input value={lessonDesc} onChange={e => setLessonDesc(e.target.value)} placeholder="Brief summary" className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block flex items-center gap-1"><LinkIcon size={12} /> Video URL (YouTube embed, Vimeo, or direct link)</label>
                <input value={lessonVideo} onChange={e => setLessonVideo(e.target.value)} placeholder="https://www.youtube.com/embed/..." className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                <p className="text-xs text-muted-foreground mt-1">For file uploads (MP4, PDF, etc.) use the "Attach Files" button after saving the lesson</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Lesson Content (text or HTML)</label>
                <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={5} placeholder="Write your lesson content here..." className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none" />
              </div>
              <GlassButton variant="primary" glow onClick={handleSaveLesson} disabled={savingLesson} className="w-full">
                <Save size={16} /> {savingLesson ? "Saving..." : "Save Lesson"}
              </GlassButton>
            </GlassCard>

            {lessons.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Paperclip size={16} className="text-primary" /> Attach Files to Lessons</h3>
                <p className="text-xs text-muted-foreground mb-4">Supported: PDF, Word, PowerPoint, Excel, Images (JPG/PNG/GIF), Videos (MP4/WebM), Audio (MP3/WAV) — up to 100 MB each</p>
                <div className="space-y-4">
                  {lessons.map((lesson, i) => {
                    const isUp = uploadingTo === lesson._id;
                    return (
                      <div key={lesson._id} className="border border-white/10 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-white/5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.level?.title} · {lesson.attachments?.length || 0} file(s) attached</p>
                          </div>
                          <button onClick={() => { setUploadingTo(isUp ? null : lesson._id); setUploadFiles([]); }}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${isUp ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"}`}>
                            <Paperclip size={13} /> {isUp ? "Cancel" : "Attach Files"}
                          </button>
                        </div>

                        {lesson.attachments && lesson.attachments.length > 0 && (
                          <div className="px-4 pb-3 pt-2 border-t border-white/5 space-y-1.5">
                            {lesson.attachments.map((att, ai) => {
                              const m = FILE_ICONS[att.type] || FILE_ICONS.other;
                              const Icon = m.icon;
                              return (
                                <div key={ai} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 group">
                                  <Icon size={14} className={`${m.color} shrink-0`} />
                                  <a href={`http://localhost:5001${att.url}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-foreground hover:text-primary truncate">{att.name}</a>
                                  <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(att.size)}</span>
                                  <button onClick={() => handleDeleteAttachment(lesson._id, att.url)} className="p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all"><X size={12} /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <AnimatePresence>
                          {isUp && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="p-4 border-t border-white/10 space-y-3">
                                <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-white/20 hover:border-primary/50 hover:bg-white/5"}`}>
                                  <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                                  <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
                                  <p className="text-xs text-muted-foreground mt-1">PDF · Word · PowerPoint · Excel · Images · Videos · Audio</p>
                                  <input ref={fileInputRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={e => handleFileSelect(e.target.files)} />
                                </div>
                                {uploadFiles.length > 0 && (
                                  <div className="space-y-1.5">
                                    {uploadFiles.map((f, fi) => {
                                      const tk = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "audio" : f.type === "application/pdf" ? "pdf" : "doc";
                                      const m = FILE_ICONS[tk] || FILE_ICONS.other; const Icon = m.icon;
                                      return (
                                        <div key={fi} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10">
                                          <Icon size={15} className={`${m.color} shrink-0`} />
                                          <span className="flex-1 text-xs text-foreground truncate">{f.name}</span>
                                          <span className="text-[10px] text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                                          <button onClick={() => removeUploadFile(fi)} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><X size={12} /></button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {uploadFiles.length > 0 && (
                                  <GlassButton variant="primary" onClick={() => handleUploadFiles(lesson._id)} disabled={uploading} className="w-full">
                                    <Upload size={15} /> {uploading ? "Uploading..." : `Upload ${uploadFiles.length} file(s)`}
                                  </GlassButton>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <GlassCard className="p-6 space-y-5">
              <h2 className="font-bold text-lg flex items-center gap-2"><HelpCircle size={18} className="text-primary" /> Quiz Builder</h2>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Attach to Lesson *</label>
                <select value={selectedLesson} onChange={e => setSelectedLesson(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary">
                  <option value="">Select a lesson...</option>
                  {lessons.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                </select>
                {existingQuiz && <p className="text-xs text-amber-400 mt-1">This lesson already has a quiz. Saving will create a new one.</p>}
              </div>
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={qi} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Question {qi + 1}</span>
                      {questions.length > 1 && <button onClick={() => removeQ(qi)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>}
                    </div>
                    <input value={q.question} onChange={e => updateQ(qi, "question", e.target.value)} placeholder="Enter your question..." className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-sm" />
                    <div className="grid sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button onClick={() => updateQ(qi, "correctAnswer", oi)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${q.correctAnswer === oi ? "border-emerald-500 bg-emerald-500" : "border-white/20 hover:border-white/40"}`}>
                            {q.correctAnswer === oi && <CheckCircle2 size={12} className="text-white" />}
                          </button>
                          <input value={opt} onChange={e => updateOpt(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-sm" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Click the circle to mark the correct answer</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={addQ} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"><Plus size={15} /> Add Question</button>
                <GlassButton variant="primary" glow onClick={handleSaveQuiz} disabled={savingQuiz} className="flex-1"><Save size={16} /> {savingQuiz ? "Saving..." : `Save Quiz (${questions.length} Q)`}</GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
          </>
        )}
      </main>
    </div>
  );
};

export default ClassUpload;
