import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, X, Save, Users, Calendar,
  CheckCircle2, Clock, AlertCircle, ChevronDown,
  ChevronUp, FileText, Star, RefreshCw, FolderKanban,
  Sparkles, Loader2
} from "lucide-react";
import aiService from "@/services/aiService";

interface Student { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } }
interface Submission {
  _id: string;
  student: { _id: string; name: string; email: string };
  submittedAt: string;
  description?: string;
  link?: string;
  aiUnderstandingScore?: number;
  aiAuthenticityScore?: number;
  aiProbability?: number;
  aiFeedback?: string;
  aiRecommendations?: string[];
  mentorScore?: number;
  finalScore?: number;
  grade?: string;
  feedback?: string;
  status: "submitted" | "reviewed" | "revision_needed";
}
interface Project {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: string;
  assignedTo: Student[];
  submissions: Submission[];
  status: "active" | "closed";
  createdAt: string;
}

const statusColors = {
  submitted:        "bg-blue-500/20 text-blue-300",
  reviewed:         "bg-green-500/20 text-green-300",
  revision_needed:  "bg-amber-500/20 text-amber-300",
};

const MentorProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser]           = useState<any>(null);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [students, setStudents]   = useState<Student[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Create form
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate]           = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [saving, setSaving]             = useState(false);

  // Grade modal
  const [gradingProject, setGradingProject] = useState<string | null>(null);
  const [gradingStudent, setGradingStudent] = useState<string | null>(null);
  const [grade, setGrade]     = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  const [checkingAi, setCheckingAi] = useState(false);
  const [aiCheckResult, setAiCheckResult] = useState<{ similarity: number, reason: string } | null>(null);
  const [submissionToAnalyze, setSubmissionToAnalyze] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, projectsRes, studentsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/mentor/projects"),
        api.get("/mentor/my-students")
      ]);

      if (profileRes.data.user.role !== "mentor") {
        navigate("/dashboard");
        return;
      }

      setUser(profileRes.data.user);
      setProjects(projectsRes.data.data || []);
      setStudents(studentsRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    if (!selectedStudents.length) {
      toast({ title: "Error", description: "Assign to at least one student", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editingProjectId) {
        await api.put(`/mentor/projects/${editingProjectId}`, {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim() || undefined,
          dueDate: dueDate || undefined,
          assignedTo: selectedStudents
        });
        toast({ title: "Project updated!" });
      } else {
        await api.post("/mentor/projects", {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim() || undefined,
          dueDate: dueDate || undefined,
          assignedTo: selectedStudents
        });
        toast({ title: "Project assigned!" });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project._id);
    setTitle(project.title || "");
    setDescription(project.description || "");
    setInstructions(project.instructions || "");
    setDueDate(project.dueDate || "");
    setSelectedStudents(project.assignedTo?.map(s => s._id) || []);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/mentor/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast({ title: "Project deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleGrade = async () => {
    if (!gradingProject || !gradingStudent) return;
    setGrading(true);
    try {
      await api.put(`/mentor/projects/${gradingProject}/grade/${gradingStudent}`, {
        grade, feedback, status: "reviewed"
      });
      toast({ title: "Graded!" });
      setGradingProject(null); setGradingStudent(null); setGrade(""); setFeedback("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setGrading(false); }
  };
  
  const handleAiCheck = async () => {
    if (!submissionToAnalyze.trim()) {
      toast({ title: "No content", description: "This submission has no text to analyze.", variant: "destructive" });
      return;
    }
    setCheckingAi(true);
    try {
      const res = await aiService.aiDetector(submissionToAnalyze);
      setAiCheckResult(res);
      toast({ title: "Analysis complete", description: `AI Probability: ${res.similarity}%` });
    } catch (e) {
      toast({ title: "Error", description: "AI detector service unavailable", variant: "destructive" });
    } finally {
      setCheckingAi(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setInstructions(""); setDueDate(""); setSelectedStudents([]);
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
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

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">
              <span className="text-primary">Projects</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Assign practical projects to your students · {students.length} assigned student{students.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-sm">
              <RefreshCw size={15} />
            </button>
            <GlassButton variant="primary" onClick={() => setShowModal(true)} disabled={students.length === 0}>
              <Plus size={16} /> Assign Project
            </GlassButton>
          </div>
        </motion.div>

        {students.length === 0 && (
          <GlassCard className="p-8 text-center mb-6 border-amber-500/20">
            <Users size={32} className="mx-auto mb-3 text-amber-400 opacity-60" />
            <p className="font-semibold text-amber-400">No assigned students yet</p>
            <p className="text-muted-foreground text-sm mt-1">Students are assigned to you automatically based on skill track. Once you have students, you can assign them projects.</p>
          </GlassCard>
        )}

        {/* Projects list */}
        {projects.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground text-sm">Assign your first project to help students apply what they've learned.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {projects.map((project, idx) => {
              const isExpanded = expanded === project._id;
              const submittedCount = project.submissions.length;
              const reviewedCount  = project.submissions.filter(s => s.status === "reviewed").length;
              const overdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status === "active";

              return (
                <motion.div key={project._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <GlassCard className={`overflow-hidden ${overdue ? "border-red-500/20" : ""}`}>
                    {/* Project header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg">{project.title}</h3>
                            {overdue && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Overdue</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Users size={11} /> {project.assignedTo.length} student{project.assignedTo.length !== 1 ? "s" : ""}</span>
                            <span className="flex items-center gap-1"><FileText size={11} /> {submittedCount} submission{submittedCount !== 1 ? "s" : ""}</span>
                            {reviewedCount > 0 && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={11} /> {reviewedCount} reviewed</span>}
                            {project.dueDate && (
                              <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : ""}`}>
                                <Calendar size={11} /> Due {new Date(project.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleEditProject(project)} className="p-2 text-primary hover:bg-white/5 rounded-xl transition-all">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(project._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                            <Trash2 size={15} />
                          </button>
                          <button onClick={() => setExpanded(isExpanded ? null : project._id)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: submissions + assigned students */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="border-t border-white/10 p-5 space-y-5">
                            {/* Instructions */}
                            {project.instructions && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Instructions</p>
                                <p className="text-sm text-foreground bg-white/5 rounded-xl p-3">{project.instructions}</p>
                              </div>
                            )}

                            {/* Assigned students */}
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Assigned To</p>
                              <div className="flex flex-wrap gap-2">
                                {project.assignedTo.map(s => (
                                  <span key={s._id} className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                    <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-[9px] font-bold">{s.name[0]}</div>
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Submissions */}
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                Submissions ({submittedCount}/{project.assignedTo.length})
                              </p>
                              {submittedCount === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No submissions yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {project.submissions.map(sub => (
                                    <div key={sub._id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                            {sub.student?.name?.[0]?.toUpperCase()}
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold">{sub.student?.name}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[sub.status]}`}>
                                            {sub.status.replace("_", " ")}
                                          </span>
                                          {sub.grade && <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">{sub.grade}</span>}
                                          <button
                                            onClick={() => { 
                                              setGradingProject(project._id); 
                                              setGradingStudent(sub.student._id); 
                                              setGrade(sub.mentorScore?.toString() || ""); 
                                              setFeedback(sub.feedback || ""); 
                                              setSubmissionToAnalyze(sub.description || "");
                                              setAiCheckResult(sub.aiProbability !== undefined ? { similarity: sub.aiProbability, reason: sub.aiFeedback || "" } : null);
                                            }}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                          >
                                            <Star size={11} /> {sub.grade ? "Re-grade" : "Grade"}
                                          </button>
                                        </div>
                                      </div>
                                      {sub.description && <p className="text-sm text-muted-foreground mt-2 ml-11">{sub.description}</p>}
                                      {sub.link && (
                                        <a href={sub.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 ml-11 block">
                                          View submission →
                                        </a>
                                      )}
                                      {sub.feedback && <p className="text-xs text-emerald-400 mt-1 ml-11 italic">Feedback: {sub.feedback}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <GlassCard className="p-6 border-primary/20">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FolderKanban size={18} className="text-primary" /> {editingProjectId ? "Edit Project" : "Assign New Project"}</h2>
                  <button onClick={() => { setShowModal(false); resetForm(); setEditingProjectId(null); }} className="p-2 rounded-xl hover:bg-white/10"><X size={18} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Build a REST API with Node.js"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Description *</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                      placeholder="What should students build or accomplish?"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Detailed Instructions</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                      placeholder="Step-by-step instructions, requirements, acceptance criteria..."
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Due Date (optional)
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input 
                        type="datetime-local" 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary [color-scheme:dark]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to select date and time
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Assign To * ({selectedStudents.length} selected)
                    </label>
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No assigned students yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
                        {/* Select all */}
                        <button
                          onClick={() => setSelectedStudents(selectedStudents.length === students.length ? [] : students.map(s => s._id))}
                          className="text-xs text-primary hover:underline"
                        >
                          {selectedStudents.length === students.length ? "Deselect all" : "Select all"}
                        </button>
                        {students.map(s => (
                          <label key={s._id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedStudents.includes(s._id) ? "bg-primary/10 border border-primary/30" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                            <input type="checkbox" checked={selectedStudents.includes(s._id)} onChange={() => toggleStudent(s._id)} className="hidden" />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedStudents.includes(s._id) ? "border-primary bg-primary" : "border-white/30"}`}>
                              {selectedStudents.includes(s._id) && <CheckCircle2 size={12} className="text-black" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.learningProfile?.skillTrack || s.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <GlassButton variant="primary" glow onClick={handleCreate} disabled={saving} className="flex-1">
                    <Save size={16} /> {saving ? (editingProjectId ? "Saving..." : "Assigning...") : (editingProjectId ? "Update Project" : "Assign Project")}
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={() => { setShowModal(false); resetForm(); setEditingProjectId(null); }}>Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grade Modal */}
      <AnimatePresence>
        {gradingProject && gradingStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setGradingProject(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-md">
              <GlassCard className="p-6 border-yellow-500/20">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> Grade Submission</h2>
                <div className="space-y-4">
                  {/* AI Evaluation Metrics Section */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-bold uppercase text-primary">AI Understanding</span>
                        </div>
                        <div className="flex items-end justify-between">
                           <span className="text-2xl font-black">{submissionToAnalyze ? (projects.find(p => p._id === gradingProject)?.submissions.find(s => s.student._id === gradingStudent)?.aiUnderstandingScore || 0) : 0}</span>
                           <span className="text-[10px] text-muted-foreground pb-1">/ 20</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight italic">Score based on depth and clarity analysis.</p>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-bold uppercase text-emerald-400">Authenticity</span>
                        </div>
                        <div className="flex items-end justify-between">
                           <span className="text-2xl font-black">{submissionToAnalyze ? (projects.find(p => p._id === gradingProject)?.submissions.find(s => s.student._id === gradingStudent)?.aiAuthenticityScore || 0) : 0}</span>
                           <span className="text-[10px] text-muted-foreground pb-1">/ 30</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight italic">Score based on human-writing patterns.</p>
                    </div>
                  </div>

                  {/* AI Feedback Snippet */}
                  {projects.find(p => p._id === gradingProject)?.submissions.find(s => s.student._id === gradingStudent)?.aiFeedback && (
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl mb-4">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">AI Diagnostic Insight</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                        "{projects.find(p => p._id === gradingProject)?.submissions.find(s => s.student._id === gradingStudent)?.aiFeedback}"
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Mentor Manual Grade (0 - 50) *
                    </label>
                    <div className="relative">
                      <input 
                        type="number"
                        min="0"
                        max="50"
                        value={grade} 
                        onChange={e => setGrade(e.target.value)} 
                        placeholder="Evaluate core quality, UI/UX, and implementation..."
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-lg font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">/ 50</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Combine with AI scores for a total of 100 points.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Feedback</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4}
                      placeholder="Detailed feedback for the student..."
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <GlassButton variant="primary" onClick={handleGrade} disabled={grading} className="flex-1">
                    {grading ? "Saving..." : "Submit Grade"}
                  </GlassButton>
                  <GlassButton variant="secondary" onClick={() => setGradingProject(null)}>Cancel</GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorProjects;
