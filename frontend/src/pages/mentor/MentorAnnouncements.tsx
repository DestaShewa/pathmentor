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
  Bell, Plus, Trash2, Calendar, ExternalLink,
  RefreshCw, X, Save, Tag
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  category: string;
  imageUrl?: string;
  link?: string;
  expiresAt?: string;
  createdBy?: { name: string };
  createdAt: string;
}

const CATEGORIES = ["General", "Events", "Internship", "Hackathon", "News"];

const categoryColors: Record<string, string> = {
  General:    "bg-slate-500/20 text-slate-300",
  Events:     "bg-blue-500/20 text-blue-300",
  Internship: "bg-green-500/20 text-green-300",
  Hackathon:  "bg-purple-500/20 text-purple-300",
  News:       "bg-orange-500/20 text-orange-300",
};

const MentorAnnouncements = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser]                   = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Form state
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink]         = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, annRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/announcements")
      ]);
      if (profileRes.data.user.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(profileRes.data.user);
      setAnnouncements(annRes.data.data || []);
    } catch (e: any) {
      if (e?.response?.status === 401) navigate("/auth");
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/announcements", {
        title: title.trim(),
        message: message.trim(),
        category,
        imageUrl: imageUrl.trim() || undefined,
        link: link.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      toast({ title: "Announcement posted!" });
      resetForm();
      setShowModal(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to post", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast({ title: "Announcement deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setCategory("General");
    setImageUrl(""); setLink(""); setExpiresAt("");
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  // Only show announcements created by this mentor
  const myAnnouncements = announcements.filter(
    a => a.createdBy?.name === user?.name
  );

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={user?.name || "Mentor"}
        userEmail={user?.email || ""}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <MentorSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        userName={user?.name}
        userEmail={user?.email}
        onSignOut={handleSignOut}
      />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold">
              <span className="text-primary">Announcements</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Post updates and news for your students
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-xl text-muted-foreground hover:text-foreground text-sm transition-all"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <GlassButton variant="primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Announcement
            </GlassButton>
          </div>
        </motion.div>

        {/* Create Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl"
              >
                <GlassCard className="p-6 border-primary/20">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Bell size={18} className="text-primary" /> New Announcement
                    </h2>
                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title *</label>
                      <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Announcement title"
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Message *</label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Write your announcement..."
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                        <select
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Expires At (optional)</label>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={e => setExpiresAt(e.target.value)}
                          className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Link (optional)</label>
                      <input
                        value={link}
                        onChange={e => setLink(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <GlassButton variant="primary" glow onClick={handleCreate} disabled={submitting} className="flex-1">
                      <Save size={16} /> {submitting ? "Posting..." : "Post Announcement"}
                    </GlassButton>
                    <GlassButton variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                      Cancel
                    </GlassButton>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All announcements (platform-wide, read) */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <GlassCard className="p-16 text-center">
              <Bell size={48} className="mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-bold mb-2">No Announcements Yet</h3>
              <p className="text-muted-foreground text-sm">Post your first announcement to notify students.</p>
            </GlassCard>
          ) : (
            announcements.map((ann, idx) => {
              const isOwn = ann.createdBy?.name === user?.name;
              const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
              const catColor = categoryColors[ann.category] || categoryColors.General;

              return (
                <motion.div
                  key={ann._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <GlassCard className={`p-5 ${isExpired ? "opacity-50" : ""} ${isOwn ? "border-primary/20" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>
                            {ann.category}
                          </span>
                          {isOwn && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                              Your Post
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                          )}
                        </div>

                        <h3 className="text-base font-bold mb-1">{ann.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{ann.message}</p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                          {ann.createdBy && <span>By {ann.createdBy.name}</span>}
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                          {ann.expiresAt && !isExpired && (
                            <span className="text-orange-400">
                              Expires {new Date(ann.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {ann.link && (
                          <a
                            href={ann.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(ann._id)}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default MentorAnnouncements;
