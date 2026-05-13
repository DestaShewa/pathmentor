import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, BookOpen, Video } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const AdminLessons = () => {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewLesson, setViewLesson] = useState<any | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [order, setOrder] = useState(1);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");

  useEffect(() => {
    fetchLessons();
    fetchCourses();
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await api.get("/admin/lessons");
      setLessons(res.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load lessons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      const data = res.data.data || [];
      setCourses(data);
      const cats = Array.from(new Set(data.map((c: any) => (c.category || "")).filter(Boolean)));
      setCategories(cats);
    } catch { /* ignore */ }
  };

  const fetchLevels = async (courseId: string) => {
    if (!courseId) { setLevels([]); return; }
    try {
      const res = await api.get(`/levels/course/${courseId}`);
      setLevels(res.data.data || []);
    } catch { setLevels([]); }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    setVideoUrl("");
    setOrder(1);
    setSelectedCourseId("");
    setSelectedLevelId("");
    setLevels([]);
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedCourseId || !selectedLevelId) {
      toast({ title: "Error", description: "Title, course, and level are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/lessons", {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        videoUrl: videoUrl.trim() || undefined,
        order,
        levelId: selectedLevelId,
        courseId: selectedCourseId
      });
      toast({ title: "Lesson created!" });
      setShowModal(false);
      resetForm();
      fetchLessons();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await api.delete(`/admin/lesson/${id}`);
      setLessons(prev => prev.filter(l => l._id !== id));
      toast({ title: "Lesson deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lessons</h1>
          <p className="text-sm text-slate-400">Manage all lesson content across courses</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={18} /> Add Lesson
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setSelectedCourseFilter(""); }}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-white outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={selectedCourseFilter}
          onChange={e => setSelectedCourseFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-2 text-white outline-none focus:border-indigo-500"
        >
          <option value="">All Courses</option>
          {courses
            .filter(c => !categoryFilter || (c.category || "") === categoryFilter)
            .map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>

        <button
          onClick={() => { setCategoryFilter(""); setSelectedCourseFilter(""); }}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          Reset
        </button>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Lesson</h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={e => { setSelectedCourseId(e.target.value); fetchLevels(e.target.value); setSelectedLevelId(""); }}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select course...</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Level</label>
                  <select
                    value={selectedLevelId}
                    onChange={e => setSelectedLevelId(e.target.value)}
                    disabled={!selectedCourseId || levels.length === 0}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="">Select level...</option>
                    {levels.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="Lesson title"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Description</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Content (HTML or text)</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={5}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Lesson content..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Video URL (optional)</label>
                  <input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    placeholder="https://youtube.com/embed/..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                    min={1}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreate} disabled={submitting} className="bg-primary text-white px-5 py-2 rounded-xl hover:opacity-90 disabled:opacity-50">
                {submitting ? "Creating..." : "Create Lesson"}
              </button>
              <button onClick={() => setShowModal(false)} className="bg-white/5 text-white px-5 py-2 rounded-xl hover:bg-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{viewLesson.title}</h2>
            {viewLesson.videoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-black">
                <iframe src={viewLesson.videoUrl} className="w-full h-full" allowFullScreen title={viewLesson.title} />
              </div>
            )}
            <p className="text-muted-foreground mb-4">{viewLesson.description}</p>
            {viewLesson.content && (
              <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: viewLesson.content }} />
            )}
            <button onClick={() => setViewLesson(null)} className="mt-6 bg-primary text-white px-5 py-2 rounded-xl">Close</button>
          </div>
        </div>
      )}

      {/* Lessons table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading lessons...</div>
        ) : lessons.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No lessons yet. Create the first one!</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-bold">
              <tr>
                <th className="p-4">Lesson</th>
                <th className="p-4">Course</th>
                <th className="p-4">Type</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lessons
                .filter(lesson => {
                  if (selectedCourseFilter) return lesson.course?._id === selectedCourseFilter;
                  if (categoryFilter) return (lesson.course?.category || "") === categoryFilter;
                  return true;
                })
                .map(lesson => (
                <tr key={lesson._id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="font-medium text-white">{lesson.title}</div>
                    {lesson.description && <div className="text-xs text-slate-400 truncate max-w-xs">{lesson.description}</div>}
                  </td>
                  <td className="p-4 text-sm text-slate-400">{lesson.course?.title || "—"}</td>
                  <td className="p-4">
                    {lesson.videoUrl ? (
                      <span className="flex items-center gap-1 text-xs text-blue-400"><Video size={12} /> Video</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400"><BookOpen size={12} /> Text</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-400">{new Date(lesson.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => setViewLesson(lesson)} className="p-2 hover:bg-white/10 rounded text-slate-400">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleDelete(lesson._id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLessons;
