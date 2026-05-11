import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { handleSidebarNav } from "@/lib/navHelper";
import { useToast } from "@/hooks/use-toast";
import {
  FolderKanban, Calendar, User, CheckCircle2,
  Clock, AlertCircle, Send, X, ExternalLink,
  ChevronDown, ChevronUp, RefreshCw, Star
} from "lucide-react";

interface Project {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate?: string;
  mentor: { _id: string; name: string; email: string };
  course?: { title: string };
  submissions: {
    student: string;
    submittedAt: string;
    description?: string;
    link?: string;
    grade?: string;
    feedback?: string;
    status: "submitted" | "reviewed" | "revision_needed";
  }[];
  status: "active" | "closed";
  createdAt: string;
}

const statusColors = {
  submitted:       "bg-blue-500/20 text-blue-300",
  reviewed:        "bg-green-500/20 text-green-300",
  revision_needed: "bg-amber-500/20 text-amber-300",
};

const StudentProjects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser]           = useState<any>(null);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);

  // Submit form
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitDesc, setSubmitDesc]     = useState("");
  const [submitLink, setSubmitLink]     = useState("");
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, projectsRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/users/my-projects")
      ]);
      setUser(profileRes.data.user);
      setProjects(projectsRes.data.data || []);
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (projectId: string) => {
    if (!submitDesc.trim() && !submitLink.trim()) {
      toast({ title: "Error", description: "Add a description or link to submit", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/users/my-projects/${projectId}/submit`, {
        description: submitDesc.trim(),
        link: submitLink.trim() || undefined
      });
      toast({ title: "Project submitted!", description: "Your mentor will review it soon." });
      setSubmittingId(null); setSubmitDesc(""); setSubmitLink("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const userId = user?._id;

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={user?.name || "Learner"}
        userEmail={user?.email || ""}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="projects"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Projects</h1>
                <p className="text-muted-foreground text-sm">Projects assigned by your mentor</p>
              </div>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-sm">
              <RefreshCw size={15} />
            </button>
          </motion.div>

          {/* Projects */}
          {projects.length === 0 ? (
            <GlassCard className="p-16 text-center">
              <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-bold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your mentor will assign projects as you progress. Keep completing lessons!
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {projects.map((project, idx) => {
                const mySubmission = project.submissions.find(s => s.student === userId);
                const isExpanded   = expanded === project._id;
                const isSubmitting = submittingId === project._id;
                const overdue      = project.dueDate && new Date(project.dueDate) < new Date() && !mySubmission;

                return (
                  <motion.div key={project._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                    <GlassCard className={`overflow-hidden ${overdue ? "border-red-500/20" : mySubmission?.status === "reviewed" ? "border-emerald-500/20" : ""}`}>
                      {/* Header */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-lg">{project.title}</h3>
                              {mySubmission && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[mySubmission.status]}`}>
                                  {mySubmission.status.replace("_", " ")}
                                </span>
                              )}
                              {overdue && (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertCircle size={10} /> Overdue
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><User size={11} /> {project.mentor?.name}</span>
                              {project.dueDate && (
                                <span className={`flex items-center gap-1 ${overdue ? "text-red-400" : ""}`}>
                                  <Calendar size={11} /> Due {new Date(project.dueDate).toLocaleDateString()}
                                </span>
                              )}
                              {mySubmission?.grade && (
                                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                  <Star size={11} fill="currentColor" /> Grade: {mySubmission.grade}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : project._id)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-all shrink-0"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                            <div className="border-t border-white/10 p-5 space-y-5">

                              {/* Instructions */}
                              {project.instructions && (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Instructions</p>
                                  <div className="bg-white/5 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap">{project.instructions}</div>
                                </div>
                              )}

                              {/* My submission */}
                              {mySubmission ? (
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Submission</p>
                                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[mySubmission.status]}`}>
                                        {mySubmission.status.replace("_", " ")}
                                      </span>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock size={11} /> {new Date(mySubmission.submittedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {mySubmission.description && <p className="text-sm text-foreground">{mySubmission.description}</p>}
                                    {mySubmission.link && (
                                      <a href={mySubmission.link} target="_blank" rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline flex items-center gap-1">
                                        <ExternalLink size={11} /> View submission
                                      </a>
                                    )}
                                    {mySubmission.grade && (
                                      <div className="pt-2 border-t border-white/10">
                                        <p className="text-xs font-bold text-yellow-400">Grade: {mySubmission.grade}</p>
                                        {mySubmission.feedback && <p className="text-sm text-muted-foreground mt-1 italic">"{mySubmission.feedback}"</p>}
                                      </div>
                                    )}
                                    {mySubmission.status === "revision_needed" && (
                                      <GlassButton variant="secondary" size="sm" onClick={() => setSubmittingId(project._id)}>
                                        Resubmit
                                      </GlassButton>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                /* Submit form */
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Submit Your Work</p>
                                  {isSubmitting ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={submitDesc}
                                        onChange={e => setSubmitDesc(e.target.value)}
                                        rows={3}
                                        placeholder="Describe what you built, what you learned, any challenges..."
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none text-sm"
                                      />
                                      <input
                                        value={submitLink}
                                        onChange={e => setSubmitLink(e.target.value)}
                                        placeholder="Link to your work (GitHub, live demo, Google Drive...)"
                                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-sm"
                                      />
                                      <div className="flex gap-3">
                                        <GlassButton variant="primary" onClick={() => handleSubmit(project._id)} disabled={submitting} className="flex-1">
                                          <Send size={15} /> {submitting ? "Submitting..." : "Submit Project"}
                                        </GlassButton>
                                        <GlassButton variant="secondary" onClick={() => { setSubmittingId(null); setSubmitDesc(""); setSubmitLink(""); }}>
                                          <X size={15} />
                                        </GlassButton>
                                      </div>
                                    </div>
                                  ) : (
                                    <GlassButton variant="primary" onClick={() => setSubmittingId(project._id)} className="w-full">
                                      <Send size={15} /> Submit Your Work
                                    </GlassButton>
                                  )}
                                </div>
                              )}
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
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default StudentProjects;
