import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  FileText,
  BadgeCheck,
  Mail,
  User,
  Briefcase,
  CalendarDays,
  RefreshCcw,
  LogOut,
} from "lucide-react";

const MentorPendingDashboard = () => {
  const navigate = useNavigate();

  // Sidebar removed for pending approval page
  const [loading, setLoading] = useState(true);

  const [mentor, setMentor] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [applicationData, setApplicationData] = useState({
    skillTrack: "",
    experienceLevel: "",
    commitmentTime: "",
    learningStyle: "",
    learningGoal: "",
    personalGoal: "",
    persona: "",
    strengths: "",
    recommendation: "",
  });
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [savingApplication, setSavingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/auth");
      return;
    }

    try {
      const res = await api.get("/users/profile");
      const user = res.data.user;

      if (user.role !== "mentor") {
        navigate("/dashboard");
        return;
      }

      // If approved go to real mentor dashboard
      if (user.mentorVerification?.status === "approved") {
        navigate("/mentor/dashboard");
        return;
      }

      setMentor(user);
      const savedProfile = user.learningProfile || {};
      const hasSubmittedApplication = Boolean(
        savedProfile.skillTrack ||
        savedProfile.experienceLevel ||
        savedProfile.commitmentTime ||
        savedProfile.learningStyle ||
        savedProfile.learningGoal ||
        savedProfile.personalGoal ||
        savedProfile.persona ||
        (savedProfile.strengths && savedProfile.strengths.length) ||
        savedProfile.recommendation
      );

      setApplicationData({
        skillTrack: savedProfile.skillTrack || "",
        experienceLevel: savedProfile.experienceLevel || "",
        commitmentTime: savedProfile.commitmentTime || "",
        learningStyle: savedProfile.learningStyle || "",
        learningGoal: savedProfile.learningGoal || "",
        personalGoal: savedProfile.personalGoal || "",
        persona: savedProfile.persona || "",
        strengths: Array.isArray(savedProfile.strengths) ? savedProfile.strengths.join(", ") : "",
        recommendation: savedProfile.recommendation || "",
      });
      setIsEditing(!hasSubmittedApplication);
    } catch (error) {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const handleApplicationChange = (field: string, value: string) => {
    setApplicationData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditMode = () => {
    setIsEditing(true);
    setApplicationSuccess("");
    setApplicationError("");
  };

  const handleDocumentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedDocuments(Array.from(files));
    }
  };

  const submitApplication = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApplicationError("");
    setApplicationSuccess("");
    setSavingApplication(true);

    try {
      const formData = new FormData();
      formData.append("skillTrack", applicationData.skillTrack);
      formData.append("experienceLevel", applicationData.experienceLevel);
      formData.append("commitmentTime", applicationData.commitmentTime);
      formData.append("learningStyle", applicationData.learningStyle);
      formData.append("learningGoal", applicationData.learningGoal);
      formData.append("personalGoal", applicationData.personalGoal);
      formData.append("persona", applicationData.persona);
      formData.append("strengths", applicationData.strengths);
      formData.append("recommendation", applicationData.recommendation);

      selectedDocuments.forEach((file) => {
        formData.append("documents", file);
      });

      await api.post("/users/onboarding", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setApplicationSuccess("Application information saved successfully. Admin review is in progress.");
      setSelectedDocuments([]);
      setIsEditing(false);
      await loadData();
    } catch (error: any) {
      console.error("Application submit failed", error);
      setApplicationError(
        error?.response?.data?.message || error?.message || "Unable to save application. Please try again."
      );
    } finally {
      setSavingApplication(false);
    }
  };

  const getStatusUI = () => {
    const status = mentor?.mentorVerification?.status;

    if (status === "approved") {
      return {
        text: "Approved",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        icon: <CheckCircle2 size={18} />,
      };
    }

    if (status === "rejected") {
      return {
        text: "Rejected",
        color: "text-red-400",
        bg: "bg-red-400/10",
        icon: <XCircle size={18} />,
      };
    }

    return {
      text: "Pending Review",
      color: "text-[#33b6ff]",
      bg: "bg-[#33b6ff]/10",
      icon: <Clock3 size={18} />,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#33b6ff]/20 border-t-[#33b6ff] rounded-full animate-spin" />
      </div>
    );
  }

  const status = getStatusUI();
  const displayedProfile = isEditing ? applicationData : mentor?.learningProfile || {};

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 inset-0 z-0 pointer-events-none">
        <ParticlesBackground />

        <div className="absolute top-[-10%] left-[-10%] w-[700px] h-[700px] bg-[#33b6ff]/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-[#a855f7]/10 rounded-full blur-[180px]" />
      </div>

      {/* Top Nav */}
      <DashboardTopNav
        userName={mentor?.name || "Mentor"}
        userEmail={mentor?.email || "mentor@email.com"}
        onMenuToggle={() => {}}
        onSignOut={logout}
      />

      {/* Sidebar intentionally removed for this page */}

      {/* Main */}
      <main className="relative z-10 pt-28 pb-16 transition-all duration-500 lg:pl-28">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
          >
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                Mentor <span className="text-[#33b6ff]">Approval</span>
              </h1>

              <p className="text-slate-400 mt-3 uppercase tracking-widest text-xs font-bold">
                Submitted Application Dashboard
              </p>
            </div>

            <button
              onClick={loadData}
              className="px-5 py-3 rounded-xl bg-[#33b6ff] text-black font-bold flex items-center gap-2 hover:shadow-[0_0_25px_rgba(51,182,255,0.45)]"
            >
              <RefreshCcw size={16} />
              Refresh Status
            </button>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#33b6ff] to-[#a855f7] p-[2px]">
                  <div className="w-full h-full rounded-3xl bg-[#020617] flex items-center justify-center">
                    <ShieldCheck className="text-[#33b6ff]" size={34} />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold">
                    Application Status
                  </h3>

                  <div
                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bg} ${status.color} font-semibold text-sm`}
                  >
                    {status.icon}
                    {status.text}
                  </div>
                </div>
              </div>

              <p className="text-slate-400 max-w-md text-sm">
                Your mentor profile is being reviewed by the admin team. Update your details below while approval is in progress.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold">Complete Your Mentor Application</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Fill in the details needed for admin review. When the application is submitted, fields become read-only until you choose to edit.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 uppercase tracking-[0.3em] font-semibold">
                  Application details
                </span>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {applicationError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">
                {applicationError}
              </div>
            )}

            {applicationSuccess && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 mb-4">
                {applicationSuccess}
              </div>
            )}

            <form onSubmit={submitApplication} className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Expertise Track
                <input
                  value={applicationData.skillTrack}
                  onChange={(event) => handleApplicationChange("skillTrack", event.target.value)}
                  placeholder="e.g. Web Development"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Experience Level
                <input
                  value={applicationData.experienceLevel}
                  onChange={(event) => handleApplicationChange("experienceLevel", event.target.value)}
                  placeholder="e.g. 5+ years"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Availability
                <input
                  value={applicationData.commitmentTime}
                  onChange={(event) => handleApplicationChange("commitmentTime", event.target.value)}
                  placeholder="e.g. 10 hours/week"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Teaching Style
                <input
                  value={applicationData.learningStyle}
                  onChange={(event) => handleApplicationChange("learningStyle", event.target.value)}
                  placeholder="e.g. hands-on, project-based"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
                Mentor Goal
                <input
                  value={applicationData.learningGoal}
                  onChange={(event) => handleApplicationChange("learningGoal", event.target.value)}
                  placeholder="What outcomes will your mentees achieve?"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
                Personal Mission
                <input
                  value={applicationData.personalGoal}
                  onChange={(event) => handleApplicationChange("personalGoal", event.target.value)}
                  placeholder="Why do you want to mentor learners?"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Mentor Persona
                <input
                  value={applicationData.persona}
                  onChange={(event) => handleApplicationChange("persona", event.target.value)}
                  placeholder="e.g. Career coach, technical instructor"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                Strengths
                <input
                  value={applicationData.strengths}
                  onChange={(event) => handleApplicationChange("strengths", event.target.value)}
                  placeholder="List your strengths, separated by commas"
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
                Upload CV / Certificates
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handleDocumentSelection}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:text-white file:rounded-xl file:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                {selectedDocuments.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Selected: {selectedDocuments.map((file) => file.name).join(", ")}
                  </p>
                )}
              </label>

              <label className="space-y-2 text-sm text-slate-200 lg:col-span-2">
                Why should you be a mentor?
                <textarea
                  value={applicationData.recommendation}
                  onChange={(event) => handleApplicationChange("recommendation", event.target.value)}
                  placeholder="Explain why you are the right mentor for learners"
                  rows={4}
                  disabled={!isEditing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingApplication || !isEditing}
                  className="rounded-2xl bg-[#33b6ff] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#22a1f0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingApplication ? "Saving..." : isEditing ? "Save Application" : "Locked"}
                </button>
                <p className="text-sm text-slate-400">
                  {isEditing
                    ? "This information helps admin verify your mentor profile."
                    : "Submitted application is locked. Click Edit to make changes."}
                </p>
              </div>
            </form>
          </motion.div>

          {/* Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Submitted Data */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-8"
            >
              <h3 className="text-2xl font-bold mb-8">
                Submitted Information
              </h3>

              <div className="grid md:grid-cols-2 gap-5">
                <InfoCard
                  icon={<User size={18} />}
                  title="Full Name"
                  value={mentor?.name || "Not Provided"}
                />

                <InfoCard
                  icon={<Mail size={18} />}
                  title="Email"
                  value={mentor?.email || "Not Provided"}
                />

                <InfoCard
                  icon={<Briefcase size={18} />}
                  title="Expertise"
                  value={displayedProfile.skillTrack || "Software Engineering"}
                />

                <InfoCard
                  icon={<BadgeCheck size={18} />}
                  title="Experience"
                  value={displayedProfile.experienceLevel || "3+ Years Experience"}
                />

                <InfoCard
                  icon={<CalendarDays size={18} />}
                  title="Submitted Date"
                  value={
                    mentor?.createdAt
                      ? new Date(
                          mentor.createdAt
                        ).toLocaleDateString()
                      : "Today"
                  }
                />

                <InfoCard
                  icon={<FileText size={18} />}
                  title="Documents"
                  value={
                    isEditing
                      ? selectedDocuments.length
                        ? `${selectedDocuments.length} file(s) selected`
                        : mentor?.mentorVerification?.documents?.length
                        ? `${mentor.mentorVerification.documents.length} file(s) uploaded`
                        : "No documents uploaded"
                      : mentor?.mentorVerification?.documents?.length
                      ? `${mentor.mentorVerification.documents.length} file(s) uploaded`
                      : "No documents uploaded"
                  }
                />
              </div>
            </motion.div>

            {/* Right Side */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Timeline */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-7">
                <h3 className="text-xl font-bold mb-6">
                  Approval Progress
                </h3>

                <div className="space-y-5">
                  <Step
                    done
                    title="Application Submitted"
                  />
                  <Step
                    done
                    title="Profile Received"
                  />
                  <Step
                    active
                    title="Admin Reviewing"
                  />
                  <Step
                    title="Approval Granted"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-7 space-y-4">
                <button
                  onClick={loadData}
                  className="w-full px-4 py-3 rounded-xl bg-[#33b6ff] text-black font-bold"
                >
                  Check Again
                </button>

                <button
                  onClick={logout}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoCard = ({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <div className="flex items-center gap-2 text-[#33b6ff] mb-3">
      {icon}
      <span className="text-xs uppercase tracking-widest font-bold">
        {title}
      </span>
    </div>

    <p className="font-semibold text-slate-100">
      {value}
    </p>
  </div>
);

const Step = ({
  title,
  done,
  active,
}: {
  title: string;
  done?: boolean;
  active?: boolean;
}) => (
  <div className="flex items-center gap-4">
    <div
      className={`w-4 h-4 rounded-full ${
        done
          ? "bg-emerald-400"
          : active
          ? "bg-[#33b6ff]"
          : "bg-white/10"
      }`}
    />

    <p
      className={`font-medium ${
        active
          ? "text-white"
          : done
          ? "text-slate-200"
          : "text-slate-500"
      }`}
    >
      {title}
    </p>
  </div>
);

export default MentorPendingDashboard;