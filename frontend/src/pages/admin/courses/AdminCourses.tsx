import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../services/api";

const AdminCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [viewCourse, setViewCourse] = useState<any | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [mentorFilter, setMentorFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchCourses = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in as admin to load courses.");
      setCourses([]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/admin/courses", {
        params: {
          search: searchTerm || undefined,
          mentorId: mentorFilter || undefined,
          category: categoryFilter || undefined,
          page,
          limit: pageSize,
        },
      });
      const courseData = res.data?.data ?? res.data;
      const totalCount = res.data?.total ?? (Array.isArray(courseData) ? courseData.length : 0);
      setCourses(courseData || []);
      setTotal(totalCount);
      setPage(res.data?.page ?? 1);
      setPages(res.data?.pages ?? 1);
    } catch (err: any) {
      console.error("Failed to load courses", err);
      setError(err?.response?.data?.message || "Unable to load courses.");
      setCourses([]);
      setTotal(0);
      setPage(1);
      setPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, mentorFilter, categoryFilter, page, pageSize]);

  const fetchMentors = async () => {
    try {
      const res = await api.get("/admin/mentors");
      setMentors(res.data.mentors || []);
    } catch (err: any) {
      console.error("Failed to load mentors", err);
      setMentors([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      const categoryList = res.data.data || res.data || [];
      setCategories(categoryList.map((cat: any) => cat.name));
    } catch (err: any) {
      console.error("Failed to load categories", err);
      setCategories([]);
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setCourseTitle("");
    setCourseDescription("");
    setCourseCategory("");
    setSelectedMentorId("");
    setFormError("");
    setFormSuccess("");
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseTitle(course.title || "");
    setCourseDescription(course.description || "");
    setCourseCategory(course.category || "");
    setSelectedMentorId(course.instructor?._id || "");
    setFormError("");
    setFormSuccess("");
    setIsModalOpen(true);
  };

  const handleViewCourse = (course: any) => {
    setViewCourse(course);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const confirmed = window.confirm("Delete this course? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/admin/course/${courseId}`);
      await fetchCourses();
    } catch (err: any) {
      console.error("Failed to delete course", err);
      setError(err?.response?.data?.message || "Unable to delete course.");
    }
  };

  const handleSaveCourse = async () => {
    setFormError("");
    setFormSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError("Please sign in as admin before saving a course.");
      return;
    }

    if (!courseTitle.trim() || !courseDescription.trim() || !courseCategory.trim() || !selectedMentorId) {
      setFormError("Title, description, category, and assigned mentor are required.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        title: courseTitle.trim(),
        description: courseDescription.trim(),
        category: courseCategory.trim(),
        instructorId: selectedMentorId,
      };

      let response;
      if (editingCourse) {
        response = await api.put(`/admin/course/${editingCourse._id}`, payload);
        if (response.data?.success !== false) {
          setFormSuccess("Course updated successfully!");
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } else {
        response = await api.post("/admin/courses", payload);
        if (response.data?.success !== false) {
          setFormSuccess("Course created successfully!");
        } else {
          throw new Error(response.data?.message || "Creation failed");
        }
      }

      setPage(1);
      await fetchCourses();
      
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1200);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || (editingCourse ? "Unable to update course." : "Unable to create course.");
      setFormError(message);
      
      if (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized")) {
        setError("Please sign in as admin before managing courses.");
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <button
          onClick={handleOpenModal}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
        >
          <Plus size={18} /> Create New Course
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              type="text"
              placeholder="Search courses, description, or category..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-11 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={mentorFilter}
            onChange={(event) => {
              setMentorFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All mentors</option>
            {mentors.map((mentor) => (
              <option key={mentor._id} value={mentor._id}>
                {mentor.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("");
              setMentorFilter("");
              setPage(1);
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{editingCourse ? "Edit Course" : "New Course"}</h2>
                <p className="text-slate-400 text-sm">
                  {editingCourse ? "Update the course details and assigned mentor." : "Add a new course to the platform."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-white/5 p-3 text-slate-300 hover:bg-white/10"
                aria-label="Close course modal"
              >
                ✕
              </button>
            </div>

            {(formError || formSuccess) && (
              <div className={`rounded-2xl border p-4 mb-5 text-sm ${formError ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
                {formError || formSuccess}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Course Title
                <input
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                  type="text"
                  placeholder="React for Beginners"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Category
                <select
                  value={courseCategory}
                  onChange={(event) => setCourseCategory(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Assign Mentor
                <select
                  value={selectedMentorId}
                  onChange={(event) => setSelectedMentorId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select an approved mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} ({mentor.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-slate-200 sm:col-span-2">
                Description
                <textarea
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
                  placeholder="Describe the course structure and learning outcomes."
                  className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                disabled={submitLoading}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? (editingCourse ? "Saving..." : "Creating...") : editingCourse ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Course Details</h2>
                <p className="text-slate-400 text-sm">View the selected course information.</p>
              </div>
              <button
                onClick={() => setViewCourse(null)}
                className="rounded-full bg-white/5 p-3 text-slate-300 hover:bg-white/10"
                aria-label="Close course details"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-200">
                <div className="font-semibold text-white">Course Title</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200">
                  {viewCourse.title}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="font-semibold text-white">Category</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200">
                  {viewCourse.category || "Uncategorized"}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-200 sm:col-span-2">
                <div className="font-semibold text-white">Description</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200">
                  {viewCourse.description}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="font-semibold text-white">Assigned Mentor</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200">
                  {viewCourse.instructor?.name || "—"}
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="font-semibold text-white">Created By</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-slate-200">
                  {viewCourse.createdBy?.name || "Admin"}
                </div>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setViewCourse(null)}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Course List</h2>
            <p className="text-sm text-slate-400">Showing {total} course{total === 1 ? "" : "s"} across {pages} pages.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span>{courses.length} visible</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-white outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold">
            <tr>
              <th className="p-4">Course Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Assigned Mentor</th>
              <th className="p-4">Created By</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Loading courses...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  No courses available.
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{course.title}</td>
                  <td className="p-4 text-slate-400">{course.category || "Uncategorized"}</td>
                  <td className="p-4 text-slate-400">{course.instructor?.name || "—"}</td>
                  <td className="p-4 text-slate-400">{course.createdBy?.name || "Admin"}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                      Published
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleViewCourse(course)}
                      className="p-2 hover:bg-white/10 rounded"
                      aria-label="View course"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCourse(course)}
                      className="p-2 hover:bg-white/10 rounded"
                      aria-label="Edit course"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded"
                      aria-label="Delete course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-300">
        <p>Page {page} of {pages}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft size={18} /> Prev
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-50"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCourses;