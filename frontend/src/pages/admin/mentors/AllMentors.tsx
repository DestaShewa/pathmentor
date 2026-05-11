import React, { useEffect, useRef, useState } from "react";
import {
  Search, Plus, MoreVertical, Star, Eye, EyeOff,
  X, User, Mail, BookOpen, Users, CheckCircle2,
  XCircle, Clock, Trash2, Edit3, RefreshCw
} from "lucide-react";
import api from "../../../services/api";

interface Mentor {
  _id: string;
  name: string;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  studentCount?: number;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
    commitmentTime?: string;
    learningGoal?: string;
    personalGoal?: string;
  };
  mentorVerification?: {
    status?: string;
    documents?: string[];
    reviewedAt?: string;
  };
  createdAt?: string;
  avgRating?: number;
  reviewCount?: number;
}

const AllMentors = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add mentor modal
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [savingMentor, setSavingMentor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mentorForm, setMentorForm] = useState({ name: "", email: "", password: "", confirmPassword: "", skillTrack: "" });
  const [formError, setFormError] = useState("");

  // View profile modal
  const [profileMentor, setProfileMentor] = useState<Mentor | null>(null);

  // 3-dot menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMentors = async (name = "") => {
    setLoading(true);
    try {
      const endpoint = name
        ? `/admin/search-mentors?name=${encodeURIComponent(name)}`
        : "/admin/mentors";
      const res = await api.get(endpoint);
      const raw: Mentor[] = res.data?.mentors || [];

      // Fetch real ratings for each mentor from session reviews
      const withRatings = await Promise.all(
        raw.map(async (m) => {
          try {
            const ratingRes = await api.get("/admin/session-reviews");
            const reviews = (ratingRes.data.data || []).filter(
              (r: any) => r.mentorId?._id === m._id
            );
            const avg =
              reviews.length > 0
                ? Math.round((reviews.reduce((s: number, r: any) => s + r.studentRating, 0) / reviews.length) * 10) / 10
                : null;
            return { ...m, avgRating: avg, reviewCount: reviews.length };
          } catch {
            return m;
          }
        })
      );
      setMentors(withRatings);
    } catch (err) {
      console.error("Failed to load mentors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMentors(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchMentors(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!mentorForm.name || !mentorForm.email || !mentorForm.password || !mentorForm.confirmPassword) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (mentorForm.password !== mentorForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!pattern.test(mentorForm.password)) {
      setFormError("Password must include uppercase, number, symbol, and be 8+ characters.");
      return;
    }
    setSavingMentor(true);
    try {
      await api.post("/admin/mentor", {
        name: mentorForm.name,
        email: mentorForm.email,
        password: mentorForm.password,
        skillTrack: mentorForm.skillTrack,
      });
      setShowAddMentor(false);
      setMentorForm({ name: "", email: "", password: "", confirmPassword: "", skillTrack: "" });
      fetchMentors();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Unable to create mentor.");
    } finally {
      setSavingMentor(false);
    }
  };

  const handleDeleteMentor = async (id: string) => {
    try {
      await api.delete(`/admin/user/${id}`);
      setMentors((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete mentor");
    } finally {
      setDeletingId(null);
      setMenuOpen(null);
    }
  };

  const handleToggleApproval = async (mentor: Mentor) => {
    const isApproved = mentor.mentorVerification?.status === "approved";
    try {
      if (isApproved) {
        await api.put(`/admin/mentor/${mentor._id}/reject`);
      } else {
        await api.put(`/admin/mentor/${mentor._id}/approve`);
      }
      fetchMentors();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update mentor status");
    } finally {
      setMenuOpen(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Approved</span>;
      case "rejected":
        return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full"><XCircle size={10} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock size={10} /> Pending</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mentors</h2>
          <p className="text-slate-400 text-sm mt-1">
            {mentors.length} mentor{mentors.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search mentors..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>
          <button
            onClick={() => { setMentorForm({ name: "", email: "", password: "", confirmPassword: "", skillTrack: "" }); setFormError(""); setShowAddMentor(true); }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> Add Mentor
          </button>
          <button onClick={() => fetchMentors(searchTerm)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading mentors...</div>
        ) : mentors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">No mentors found.</div>
        ) : (
          mentors.map((mentor) => (
            <div
              key={mentor._id}
              className="group relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl p-6 hover:border-cyan-500/30 transition-all duration-300 shadow-xl"
            >
              {/* 3-dot menu */}
              <div className="absolute top-4 right-4" ref={menuOpen === mentor._id ? menuRef : null}>
                <button
                  onClick={() => setMenuOpen(menuOpen === mentor._id ? null : mentor._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                >
                  <MoreVertical size={18} />
                </button>
                {menuOpen === mentor._id && (
                  <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                    <button
                      onClick={() => { setProfileMentor(mentor); setMenuOpen(null); }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <User size={14} /> View Profile
                    </button>
                    <button
                      onClick={() => handleToggleApproval(mentor)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      {mentor.mentorVerification?.status === "approved"
                        ? <><XCircle size={14} className="text-red-400" /> Revoke Approval</>
                        : <><CheckCircle2 size={14} className="text-emerald-400" /> Approve</>
                      }
                    </button>
                    <div className="border-t border-white/5" />
                    <button
                      onClick={() => setDeletingId(mentor._id)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                  {mentor.name?.[0]?.toUpperCase() || "M"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{mentor.name}</h3>
                  <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider truncate">
                    {mentor.learningProfile?.skillTrack || "Mentor"}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                {getStatusBadge(mentor.mentorVerification?.status)}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 py-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Students</p>
                  <p className="text-white font-bold flex items-center gap-1">
                    <Users size={12} className="text-cyan-400" />
                    {mentor.studentCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Rating</p>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={12} fill="currentColor" />
                    {mentor.avgRating != null
                      ? `${mentor.avgRating} (${mentor.reviewCount})`
                      : "No reviews"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setProfileMentor(mentor)}
                className="w-full mt-3 py-2 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-cyan-500/20 hover:text-cyan-300 transition-all border border-white/5"
              >
                View Full Profile
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── ADD MENTOR MODAL ── */}
      {showAddMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Add Mentor</h3>
                <p className="text-slate-400 text-sm">Create a new approved mentor account.</p>
              </div>
              <button onClick={() => setShowAddMentor(false)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMentor} className="space-y-4">
              {formError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm text-slate-200">
                  Full Name *
                  <input
                    value={mentorForm.name}
                    onChange={(e) => setMentorForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Mentor name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-1.5 text-sm text-slate-200">
                  Email *
                  <input
                    type="email"
                    value={mentorForm.email}
                    onChange={(e) => setMentorForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="mentor@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="relative space-y-1.5 text-sm text-slate-200">
                  Password *
                  <input
                    type={showPassword ? "text" : "password"}
                    value={mentorForm.password}
                    onChange={(e) => setMentorForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Strong password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-cyan-500"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>
                <label className="relative space-y-1.5 text-sm text-slate-200">
                  Confirm Password *
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={mentorForm.confirmPassword}
                    onChange={(e) => setMentorForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white outline-none focus:border-cyan-500"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-white">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </label>
              </div>

              <label className="space-y-1.5 text-sm text-slate-200">
                Skill Track
                <input
                  value={mentorForm.skillTrack}
                  onChange={(e) => setMentorForm((p) => ({ ...p, skillTrack: e.target.value }))}
                  placeholder="e.g. Full-Stack Coding"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </label>

              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowAddMentor(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  Cancel
                </button>
                <button type="submit" disabled={savingMentor}
                  className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60">
                  {savingMentor ? "Creating..." : "Create Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW FULL PROFILE MODAL ── */}
      {profileMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setProfileMentor(null)}>
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Mentor Profile</h3>
              <button onClick={() => setProfileMentor(null)} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Avatar + basic info */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {profileMentor.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{profileMentor.name}</h4>
                <p className="text-slate-400 text-sm">{profileMentor.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(profileMentor.mentorVerification?.status)}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Skill Track", value: profileMentor.learningProfile?.skillTrack || "—", icon: <BookOpen size={13} /> },
                { label: "Experience", value: profileMentor.learningProfile?.experienceLevel || "—", icon: <User size={13} /> },
                { label: "Availability", value: profileMentor.learningProfile?.commitmentTime || "—", icon: <Clock size={13} /> },
                { label: "Students", value: String(profileMentor.studentCount ?? 0), icon: <Users size={13} /> },
                { label: "Rating", value: profileMentor.avgRating != null ? `${profileMentor.avgRating} ★ (${profileMentor.reviewCount} reviews)` : "No reviews", icon: <Star size={13} /> },
                { label: "Joined", value: profileMentor.createdAt ? new Date(profileMentor.createdAt).toLocaleDateString() : "—", icon: <CheckCircle2 size={13} /> },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                    {item.icon} {item.label}
                  </p>
                  <p className="text-sm text-white font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Learning goal */}
            {profileMentor.learningProfile?.learningGoal && (
              <div className="p-3 bg-white/5 rounded-xl mb-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Teaching Goal</p>
                <p className="text-sm text-slate-300">{profileMentor.learningProfile.learningGoal}</p>
              </div>
            )}

            {/* Bio */}
            {profileMentor.learningProfile?.personalGoal && (
              <div className="p-3 bg-white/5 rounded-xl mb-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Bio</p>
                <p className="text-sm text-slate-300">{profileMentor.learningProfile.personalGoal}</p>
              </div>
            )}

            {/* Documents */}
            {profileMentor.mentorVerification?.documents && profileMentor.mentorVerification.documents.length > 0 && (
              <div className="p-3 bg-white/5 rounded-xl mb-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Uploaded Documents</p>
                <div className="space-y-1">
                  {profileMentor.mentorVerification.documents.map((doc, i) => (
                    <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-cyan-400 hover:underline">
                      <BookOpen size={12} /> Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { handleToggleApproval(profileMentor); setProfileMentor(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  profileMentor.mentorVerification?.status === "approved"
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                }`}
              >
                {profileMentor.mentorVerification?.status === "approved" ? "Revoke Approval" : "Approve Mentor"}
              </button>
              <button onClick={() => setProfileMentor(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Mentor?</h3>
            <p className="text-slate-400 text-sm mb-6">This will permanently remove the mentor and all their data. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteMentor(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">
                Delete
              </button>
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper used inside modal
const getStatusBadge = (status?: string) => {
  switch (status) {
    case "approved":
      return <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} /> Approved</span>;
    case "rejected":
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full"><XCircle size={10} /> Rejected</span>;
    default:
      return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock size={10} /> Pending</span>;
  }
};

export default AllMentors;
