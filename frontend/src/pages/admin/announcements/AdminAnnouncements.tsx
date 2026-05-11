import { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Tag, Link as LinkIcon } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["General", "Events", "Internship", "Hackathon", "News"];

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load announcements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
      });
      toast({ title: "Announcement created!" });
      setShowModal(false);
      setTitle("");
      setMessage("");
      setCategory("General");
      setImageUrl("");
      setLink("");
      setExpiresAt("");
      fetchAnnouncements();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast({ title: "Announcement deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-sm text-slate-400">Post platform-wide announcements for students</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={18} /> New Announcement
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Announcement message"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Expires At (optional)</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Image URL (optional)</label>
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Link (optional)</label>
                <input
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="bg-primary text-white px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-white/5 text-white px-5 py-2 rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No announcements yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-bold">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Created</th>
                <th className="p-4">Expires</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {announcements.map(ann => {
                const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
                return (
                  <tr key={ann._id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="font-medium text-white">{ann.title}</div>
                      <div className="text-xs text-slate-400 truncate max-w-md">{ann.message}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{ann.category}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-sm text-slate-400">
                      {ann.expiresAt ? (
                        <span className={isExpired ? "text-red-400" : ""}>
                          {new Date(ann.expiresAt).toLocaleDateString()}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(ann._id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
