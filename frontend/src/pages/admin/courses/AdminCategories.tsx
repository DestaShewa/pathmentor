import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, Check, X, RefreshCw, Tag, Search } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Category {
  name: string;
  courseCount: number;
  courses: { _id: string; title: string }[];
}

const PRESET_COLORS = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "bg-red-500/20 text-red-400 border-red-500/30",
];

const AdminCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add new category state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCat, setAddingCat] = useState(false);

  // Rename state
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Expanded category
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (!search) { setFiltered(categories); return; }
    const q = search.toLowerCase();
    setFiltered(categories.filter(c => c.name.toLowerCase().includes(q)));
  }, [search, categories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data.data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Add: creates a placeholder course with the new category, or just renames via a course update
  // Since categories are derived from courses, "adding" a category means creating a course with that category
  // We'll just show a toast explaining this and let them create a course with that category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    // Check if already exists
    if (categories.find(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast({ title: "Already exists", description: "A category with this name already exists.", variant: "destructive" });
      return;
    }
    setAddingCat(true);
    try {
      // Create a course with this category to register it
      await api.post("/admin/courses", {
        title: `${newCatName.trim()} — Starter Course`,
        description: `Introductory course for the ${newCatName.trim()} category.`,
        category: newCatName.trim(),
        instructorId: undefined
      });
      toast({ title: "Category created!", description: `"${newCatName.trim()}" added. A starter course was created under it.` });
      setNewCatName("");
      setShowAddForm(false);
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to create category", variant: "destructive" });
    } finally {
      setAddingCat(false);
    }
  };

  const handleRename = async (oldName: string) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingCat(null);
      return;
    }
    setRenaming(true);
    try {
      await api.put("/admin/categories/rename", { oldName, newName: editValue.trim() });
      toast({ title: "Category renamed!", description: `"${oldName}" → "${editValue.trim()}"` });
      setEditingCat(null);
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to rename", variant: "destructive" });
    } finally {
      setRenaming(false);
    }
  };

  const [deleting, setDeleting] = useState<string | null>(null);
  const handleDeleteCategory = async (name: string) => {
    if (!window.confirm(`Delete category "${name}"? This will move its courses to Uncategorized.`)) return;
    setDeleting(name);
    try {
      await api.delete(`/admin/categories/${encodeURIComponent(name)}`);
      toast({ title: "Category removed", description: `Moved courses from "${name}" to Uncategorized.` });
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to delete category", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const totalCourses = categories.reduce((s, c) => s + c.courseCount, 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Course Categories</h1>
          <p className="text-slate-400 text-sm mt-1">
            {categories.length} categories · {totalCourses} total courses
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setShowAddForm(true); setNewCatName(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white/[0.03] border border-blue-500/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">New Category</h3>
          <div className="flex gap-3">
            <input
              autoFocus
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowAddForm(false); }}
              placeholder="e.g. Data Science, Cybersecurity..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={handleAddCategory}
              disabled={addingCat || !newCatName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-all"
            >
              {addingCat ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-sm hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            This will create a starter course under the new category. You can edit it later.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Categories grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.02] border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
          <Tag size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">
            {categories.length === 0
              ? "No categories yet. Create a course with a category to get started."
              : "No categories match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, idx) => {
            const colorClass = PRESET_COLORS[idx % PRESET_COLORS.length];
            const isEditing = editingCat === cat.name;
            const isExpanded = expandedCat === cat.name;

            return (
              <div
                key={cat.name}
                className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleRename(cat.name); if (e.key === "Escape") setEditingCat(null); }}
                          className="flex-1 bg-white/10 border border-blue-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                        />
                        <button onClick={() => handleRename(cat.name)} disabled={renaming} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingCat(null)} className="p-1.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {cat.name}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setEditingCat(cat.name); setEditValue(cat.name); }}
                          className="p-1.5 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                          title="Rename"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.name)}
                          className="p-1.5 bg-white/5 text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
                          title="Delete"
                          disabled={deleting === cat.name}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={14} className="text-slate-500" />
                    <span className="text-2xl font-bold text-white">{cat.courseCount}</span>
                    <span className="text-xs text-slate-500">course{cat.courseCount !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Course list toggle */}
                  {cat.courses.length > 0 && (
                    <button
                      onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? "Hide courses ▲" : `View ${cat.courses.length} course${cat.courses.length !== 1 ? "s" : ""} ▼`}
                    </button>
                  )}
                </div>

                {/* Expanded course list */}
                {isExpanded && cat.courses.length > 0 && (
                  <div className="border-t border-white/5 px-5 py-3 space-y-1.5 bg-white/[0.02]">
                    {cat.courses.map(course => (
                      <div key={course._id} className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        <span className="truncate">{course.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary table */}
      {!loading && categories.length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Category Summary</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Courses</th>
                <th className="px-5 py-3">Share</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((cat, idx) => {
                const share = totalCourses > 0 ? Math.round((cat.courseCount / totalCourses) * 100) : 0;
                return (
                  <tr key={cat.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRESET_COLORS[idx % PRESET_COLORS.length]}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-white font-semibold">{cat.courseCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{share}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => { setEditingCat(cat.name); setEditValue(cat.name); }}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          <Pencil size={12} /> Rename
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.name)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                          disabled={deleting === cat.name}
                        ><Trash2 size={12} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
