import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  User, Mail, BookOpen, Target, Clock,
  Zap, Award, Eye, EyeOff, Save, TrendingUp,
  Camera, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { handleSidebarNav } from "@/lib/navHelper";

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [achievementCount, setAchievementCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit name
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, xpRes, streakRes, achRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/progress/xp"),
        api.get("/progress/streak"),
        api.get("/progress/achievements"),
      ]);
      const userData = profileRes.data.user;
      setUser(userData);
      setEditName(userData.name || "");
      setXp(xpRes.data.totalXP || 0);
      setStreak(streakRes.data.streak || { current: 0, longest: 0 });
      setAchievementCount((achRes.data.data || []).length);
    } catch {
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  // ── Avatar ──────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/users/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev: any) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      setAvatarPreview(null);
      toast.success("Profile picture updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Name ────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await api.put("/users/profile", { name: editName.trim() });
      setUser((prev: any) => ({ ...prev, name: editName.trim() }));
      toast.success("Profile updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Password ────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const strong = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!strong.test(newPassword)) {
      toast.error("Password must be 8+ chars with uppercase, lowercase, number, and symbol");
      return;
    }
    setChangingPassword(true);
    try {
      await api.put("/users/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Password change failed");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";
  const displayAvatar = avatarPreview || (user?.avatarUrl ? `http://localhost:5001${user.avatarUrl}` : null);

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav
        userName={userName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="profile"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-1">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and view your progress</p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4">
            <GlassCard className="p-5 text-center">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{xp.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <TrendingUp className="w-6 h-6 text-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{streak.current} 🔥</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </GlassCard>
            <GlassCard className="p-5 text-center">
              <Award className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{achievementCount}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </GlassCard>
          </motion.div>

          {/* Account Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard className="p-6 space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User size={18} className="text-primary" /> Account Info
              </h2>

              {/* Avatar + info */}
              <div className="flex items-center gap-5">
                {/* Avatar with upload */}
                <div className="relative group shrink-0">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-black">
                      {userName[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Camera overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Change profile picture"
                  >
                    {uploadingAvatar
                      ? <Loader2 size={20} className="text-white animate-spin" />
                      : <Camera size={20} className="text-white" />
                    }
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {avatarPreview && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
                    {user?.role}
                  </span>
                  {avatarPreview && (
                    <div className="mt-2 flex gap-2">
                      <GlassButton variant="primary" size="sm" onClick={handleUploadAvatar} disabled={uploadingAvatar}>
                        {uploadingAvatar ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : <><Save size={12} /> Save Photo</>}
                      </GlassButton>
                      <GlassButton variant="ghost" size="sm" onClick={() => { setAvatarPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                        Cancel
                      </GlassButton>
                    </div>
                  )}
                  {!avatarPreview && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline mt-1 block"
                    >
                      Change profile picture
                    </button>
                  )}
                </div>
              </div>

              {/* Edit name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Display Name
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveProfile(); }}
                    className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                  />
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving || editName === user?.name || !editName.trim()}
                  >
                    <Save size={14} /> {saving ? "Saving..." : "Save"}
                  </GlassButton>
                </div>
              </div>

              {/* Learning profile summary */}
              {user?.learningProfile && (
                <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  {user.learningProfile.skillTrack && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={14} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">Track:</span>
                      <span className="font-medium truncate">{user.learningProfile.skillTrack}</span>
                    </div>
                  )}
                  {user.learningProfile.experienceLevel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target size={14} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium">{user.learningProfile.experienceLevel}</span>
                    </div>
                  )}
                  {user.learningProfile.commitmentTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">Daily goal:</span>
                      <span className="font-medium">{user.learningProfile.commitmentTime}</span>
                    </div>
                  )}
                  {user.learningProfile.learningGoal && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={14} className="text-primary shrink-0" />
                      <span className="text-muted-foreground">Goal:</span>
                      <span className="font-medium truncate">{user.learningProfile.learningGoal}</span>
                    </div>
                  )}
                  {user.learningProfile.course?.title && (
                    <div className="flex items-center gap-2 text-sm sm:col-span-2">
                      <BookOpen size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-muted-foreground">Enrolled in:</span>
                      <span className="font-medium text-emerald-400 truncate">{user.learningProfile.course.title}</span>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Change Password */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Eye size={18} className="text-primary" /> Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full p-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Strength indicator */}
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[
                        /[A-Z]/.test(newPassword),
                        /[a-z]/.test(newPassword),
                        /\d/.test(newPassword),
                        /[@$!%*?&]/.test(newPassword),
                        newPassword.length >= 8,
                      ].map((met, i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${met ? "bg-emerald-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      8+ chars · uppercase · lowercase · number · symbol
                    </p>
                  </div>
                )}

                <GlassButton type="submit" variant="primary" disabled={changingPassword}>
                  {changingPassword ? <><Loader2 size={14} className="animate-spin" /> Changing...</> : "Change Password"}
                </GlassButton>
              </form>
            </GlassCard>
          </motion.div>

          {/* Quick links */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="grid grid-cols-2 gap-4">
            <GlassButton variant="secondary" className="w-full" onClick={() => navigate("/achievements")}>
              <Award size={16} /> View Achievements
            </GlassButton>
            <GlassButton variant="secondary" className="w-full" onClick={() => navigate("/leaderboard")}>
              <Zap size={16} /> Leaderboard
            </GlassButton>
          </motion.div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default ProfilePage;
