import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bell, Bookmark, BookmarkCheck, ExternalLink, Calendar } from "lucide-react";

interface Announcement {
  _id: string; title: string; message: string; category: string;
  imageUrl?: string; link?: string; expiresAt?: string;
  createdBy?: { name: string }; bookmarkedBy?: string[]; createdAt: string;
}

import { handleSidebarNav } from "@/lib/navHelper";

const CATEGORIES = ["All", "General", "Events", "Internship", "Hackathon", "News"];
const categoryColors: Record<string, string> = {
  General: "bg-slate-500/20 text-slate-300", Events: "bg-blue-500/20 text-blue-300",
  Internship: "bg-green-500/20 text-green-300", Hackathon: "bg-purple-500/20 text-purple-300",
  News: "bg-orange-500/20 text-orange-300",
};

 const Announcements = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  useEffect(() => { if (!loading) fetchAnnouncements(); }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const res = await api.get("/users/profile");
      setUser(res.data.user);
      await fetchAnnouncements();
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const fetchAnnouncements = async () => {
    try {
      const params = selectedCategory !== "All" ? `?category=${selectedCategory}` : "";
      const res = await api.get(`/announcements${params}`);
      const data: Announcement[] = res.data.data || [];
      setAnnouncements(data);
      const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
      if (userId) setBookmarkedIds(new Set(data.filter(a => a.bookmarkedBy?.includes(userId)).map(a => a._id)));
    } catch { /* ignore */ }
  };

  const handleToggleBookmark = async (id: string) => {
    try {
      const res = await api.put(`/announcements/${id}/bookmark`);
      setBookmarkedIds(prev => { const next = new Set(prev); if (res.data.bookmarked) next.add(id); else next.delete(id); return next; });
    } catch { /* ignore */ }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };
  const displayedAnnouncements = showBookmarks ? announcements.filter(a => bookmarkedIds.has(a._id)) : announcements;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={userName} userEmail={userEmail} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} activeView="announcements" onViewChange={(v) => handleSidebarNav(v, navigate)} />
      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
                <div><h1 className="text-3xl font-bold">Announcements</h1><p className="text-muted-foreground text-sm">Stay updated with the latest news</p></div>
              </div>
              <button onClick={() => setShowBookmarks(!showBookmarks)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showBookmarks ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
                {showBookmarks ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {showBookmarks ? "All" : "Saved"}
              </button>
            </div>
          </motion.div>

          {!showBookmarks && (
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? "bg-primary text-black" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{cat}</button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {displayedAnnouncements.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="p-12 text-center text-muted-foreground"><Bell size={48} className="mx-auto mb-4 opacity-30" /><p>{showBookmarks ? "No saved announcements." : "No announcements yet."}</p></GlassCard>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {displayedAnnouncements.map((ann, idx) => {
                  const isBookmarked = bookmarkedIds.has(ann._id);
                  const catColor = categoryColors[ann.category] || categoryColors.General;
                  const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
                  return (
                    <motion.div key={ann._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                      <GlassCard className={`p-6 ${isExpired ? "opacity-50" : ""}`}>
                        {ann.imageUrl && <img src={ann.imageUrl} alt={ann.title} className="w-full h-40 object-cover rounded-xl mb-4" />}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColor}`}>{ann.category}</span>
                              {isExpired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Expired</span>}
                            </div>
                            <h3 className="text-lg font-bold mb-2">{ann.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{ann.message}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              {ann.createdBy && <span>By {ann.createdBy.name}</span>}
                              <span className="flex items-center gap-1"><Calendar size={12} />{new Date(ann.createdAt).toLocaleDateString()}</span>
                              {ann.expiresAt && !isExpired && <span className="text-orange-400">Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => handleToggleBookmark(ann._id)} className={`p-2 rounded-xl transition-all ${isBookmarked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}>
                              {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                            </button>
                            {ann.link && <a href={ann.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"><ExternalLink size={16} /></a>}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Announcements;
