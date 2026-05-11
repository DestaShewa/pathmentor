import React, { useEffect, useState } from "react";
import {
  Search, UserPlus, MoreHorizontal, Filter,
  Edit3, Trash2, RefreshCw, Eye, EyeOff, X
} from "lucide-react";
import api from "../../../services/api";

const AllStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Form fields
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [selectedLevelTitle, setSelectedLevelTitle] = useState("");

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Dropdown data
  const [courses, setCourses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  // 3-dot menu
  const [isActionOpen, setIsActionOpen] = useState<string | null>(null);

  const buildStudentId = (id: string) => (id ? `STU${id.slice(-6).toUpperCase()}` : "N/A");

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/admin/students?${params.toString()}`);
      setStudents(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get("/admin/courses");
      setCourses(res.data.data || res.data || []);
    } catch {
      setCourses([]);
    }
  };

  const fetchLevels = async (courseId: string) => {
    if (!courseId) { setLevels([]); return; }
    try {
      const res = await api.get(`/levels/course/${courseId}`);
      setLevels(res.data.data || []);
    } catch {
      setLevels([]);
    }
  };

  useEffect(() => { fetchStudents(); }, [searchTerm, statusFilter]);
  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setStudentName(""); setStudentEmail("");
    setStudentPassword(""); setStudentConfirmPassword("");
    setShowPassword(false); setShowConfirmPassword(false);
    setSelectedCourseId(""); setSelectedCourseTitle(""); setSelectedLevelTitle("");
    setFormError(""); setFormSuccess("");
    setIsEditing(false); setSelectedStudentId(null);
  };

  const openCreate = () => { resetForm(); fetchCourses(); setIsModalOpen(true); };

  const openEdit = (student: any) => {
    setIsEditing(true);
    setSelectedStudentId(student._id);
    setStudentName(student.name || "");
    setStudentEmail(student.email || "");
    setStudentPassword(""); setStudentConfirmPassword("");
    setShowPassword(false); setShowConfirmPassword(false);
    setSelectedCourseId(student.learningProfile?.course?.id || "");
    setSelectedCourseTitle(student.learningProfile?.course?.title || student.learningProfile?.skillTrack || "");
    setSelectedLevelTitle(student.learningProfile?.courseLevel || student.learningProfile?.experienceLevel || "");
    setFormError(""); setFormSuccess("");
    fetchCourses();
    if (student.learningProfile?.course?.id) fetchLevels(student.learningProfile.course.id);
    setIsModalOpen(true);
    setIsActionOpen(null);
  };

  const validateForm = () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      setFormError("Name and email are required."); return false;
    }
    if (!isEditing) {
      if (!studentPassword || !studentConfirmPassword) {
        setFormError("Password and confirmation are required."); return false;
      }
    }
    if (studentPassword || studentConfirmPassword) {
      if (studentPassword !== studentConfirmPassword) {
        setFormError("Passwords do not match."); return false;
      }
      const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      if (!regex.test(studentPassword)) {
        setFormError("Password must contain uppercase, number, symbol, and be 8+ characters."); return false;
      }
    }
    if (!isEditing && (!selectedCourseId || !selectedLevelTitle)) {
      setFormError("Please select a course and level."); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setFormError(""); setFormSuccess("");
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      const payload: any = {
        name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        ...(studentPassword ? { password: studentPassword } : {}),
        ...(selectedCourseTitle ? { courseTitle: selectedCourseTitle, courseId: selectedCourseId } : {}),
        ...(selectedLevelTitle ? { courseLevel: selectedLevelTitle } : {}),
      };
      if (isEditing && selectedStudentId) {
        await api.put(`/admin/students/${selectedStudentId}`, payload);
        setFormSuccess("Student updated successfully.");
      } else {
        await api.post("/admin/students", payload);
        setFormSuccess("Student created successfully.");
      }
      fetchStudents();
      setTimeout(() => { setIsModalOpen(false); resetForm(); }, 1200);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this student? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/students/${id}`);
      fetchStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to delete student.");
    } finally {
      setIsActionOpen(null);
    }
  };

  const handleToggleStatus = async (student: any) => {
    try {
      await api.patch(`/admin/students/${student._id}/status`, {
        status: student.onboardingCompleted ? "inactive" : "active",
      });
      fetchStudents();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to change status.");
    } finally {
      setIsActionOpen(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Directory</h1>
          <p className="text-slate-400 text-sm">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition font-bold">
          <UserPlus size={18} /> Add New Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={fetchStudents} className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-4 font-semibold">Student</th>
                <th className="px-5 py-4 font-semibold">ID</th>
                <th className="px-5 py-4 font-semibold">Course</th>
                <th className="px-5 py-4 font-semibold">Assigned Mentor</th>
                <th className="px-5 py-4 font-semibold">Joined</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No students found.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {student.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{student.name || "Student"}</div>
                          <div className="text-slate-500 text-xs">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{buildStudentId(student._id)}</td>
                    <td className="px-5 py-4">
                      <div className="text-white text-sm">
                        {student.learningProfile?.course?.title || student.learningProfile?.skillTrack || "—"}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {student.learningProfile?.courseLevel || student.learningProfile?.experienceLevel || ""}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {student.assignedMentor ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {student.assignedMentor.name?.[0]?.toUpperCase() || "M"}
                          </div>
                          <div>
                            <div className="text-white text-xs font-medium">{student.assignedMentor.name}</div>
                            <div className="text-slate-500 text-[10px]">{student.assignedMentor.learningProfile?.skillTrack || ""}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-sm">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        student.onboardingCompleted
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}>
                        {student.onboardingCompleted ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="relative inline-flex">
                        <button
                          onClick={() => setIsActionOpen(isActionOpen === student._id ? null : student._id)}
                          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {isActionOpen === student._id && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl z-10 overflow-hidden">
                            <button onClick={() => openEdit(student)}
                              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
                              <Edit3 size={14} /> Edit
                            </button>
                            <button onClick={() => handleToggleStatus(student)}
                              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-200 hover:bg-white/5">
                              <RefreshCw size={14} /> {student.onboardingCompleted ? "Set Inactive" : "Set Active"}
                            </button>
                            <div className="border-t border-white/5" />
                            <button onClick={() => handleDelete(student._id)}
                              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{isEditing ? "Edit Student" : "Add New Student"}</h2>
                <p className="text-slate-400 text-sm">{isEditing ? "Update student details." : "Create a new student account."}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {(formError || formSuccess) && (
              <div className={`rounded-2xl border p-4 mb-5 text-sm ${
                formError ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}>
                {formError || formSuccess}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm text-slate-200">
                Full Name *
                <input value={studentName} onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Student name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500" />
              </label>
              <label className="space-y-1.5 text-sm text-slate-200">
                Email Address *
                <input value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)}
                  type="email" placeholder="student@example.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500" />
              </label>

              <label className="space-y-1.5 text-sm text-slate-200">
                Course {!isEditing && "*"}
                <select value={selectedCourseId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const c = courses.find((x) => x._id === id);
                    setSelectedCourseId(id);
                    setSelectedCourseTitle(c?.title || "");
                    setSelectedLevelTitle("");
                    fetchLevels(id);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500">
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm text-slate-200">
                Level {!isEditing && "*"}
                <select value={selectedLevelTitle}
                  onChange={(e) => setSelectedLevelTitle(e.target.value)}
                  disabled={!selectedCourseId || levels.length === 0}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:opacity-50">
                  <option value="">Select level</option>
                  {levels.map((l) => <option key={l._id} value={l.title}>{l.title}</option>)}
                </select>
              </label>

              {/* Password with show/hide */}
              <label className="relative space-y-1.5 text-sm text-slate-200">
                {isEditing ? "New Password (optional)" : "Password *"}
                <input
                  type={showPassword ? "text" : "password"}
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep current" : "Strong password"}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 pr-11 text-white outline-none focus:border-indigo-500"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
              <label className="relative space-y-1.5 text-sm text-slate-200">
                {isEditing ? "Confirm New Password" : "Confirm Password *"}
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={studentConfirmPassword}
                  onChange={(e) => setStudentConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 pr-11 text-white outline-none focus:border-indigo-500"
                />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-white">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={formLoading}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-60">
                {formLoading ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save Changes" : "Create Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllStudents;
