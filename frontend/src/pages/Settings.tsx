import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { handleSidebarNav } from "@/lib/navHelper";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import {
  User, Lock, Bell, Monitor, Shield, LogOut,
  Eye, EyeOff, Save, Sun, Moon, ChevronRight,
  BookOpen, Target, Clock, Zap, Award, TrendingUp,
  Trash2, AlertTriangle
} from "lucide-react";

// ── Toggle Switch ──────────────────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${checked ? "bg-primary" : "bg-white/20"}`}
    role="switch"
    aria-checked={checked}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-6" : "translate-x-0"}`}
    />
  </button>
);

// ── Section wrapper ────────────────────────────────────────────
const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-primary" />
      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h2>
    </div>
    <GlassCard className="overflow-hidden divide-y divide-white/5">
      {children}
    </GlassCard>
  </motion.div>
);

// ── Row ────────────────────────────────────────────────────────
const Row = ({
  label, description, children
}: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-4">
    <div className="min-w-0">
      <p className="text-sm font-medium text-white">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Preferences (stored locally)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }

    // Load saved preferences
    const prefs = JSON.parse(localStorage.getItem("userPrefs") || "{}");
    if (prefs.emailNotifs !== undefined) setEmailNotifs(prefs.emailNotifs);
    if (prefs.streakReminders !== undefined) setStreakReminders(prefs.streakReminders);
    if (prefs.sessionReminders !== undefined) setSessionReminders(prefs.sessionReminders);

    fetchUser();
  }, [navigate]);

  const savePrefs = (updates: object) => {
    const current = JSON.parse(localStorage.getItem("userPrefs") || "{}");
    localStorage.setItem("userPrefs", JSON.stringify({ ...current, ...updates }));
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/profile");
      const u = res.data.user;
      setUser(u);
      setEditName(u.name || "");
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName === user?.name) return;
    setSavingName(true);
    try {
      await api.put("/users/profile", { name: editName.trim() });
      setUser((p: any) => ({ ...p, name: editName.trim() }));
      setEditingName(false);
      toast({ title: "Name updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSavingName(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPwd(true);
    try {
      await api.put("/users/change-password", { currentPassword: currentPwd, newPassword: newPwd });
      toast({ title: "Password changed!" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setShowPasswordForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSavingPwd(false); }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.name || "Learner";
  const userEmail = user?.email || "";

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
        activeView="settings"
        onViewChange={(v) => handleSidebarNav(v, navigate)}
      />

      <main className={`relative z-10 pt-24 pb-24 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your account, preferences, and security</p>
          </motion.div>

          {/* ── PROFILE ── */}
          <Section title="Profile" icon={User}>
            {/* Avatar + name */}
            <div className="px-5 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold text-black shrink-0">
                {userName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 border border-primary/50 text-white text-sm focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="px-3 py-1.5 rounded-lg bg-primary text-black text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
                    >
                      {savingName ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingName(false); setEditName(user?.name || ""); }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{userName}</p>
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full capitalize shrink-0">
                {user?.role}
              </span>
            </div>

            {/* Learning profile info */}
            {user?.learningProfile?.skillTrack && (
              <Row label="Skill Track" description="Your current learning path">
                <span className="text-sm text-primary font-medium">{user.learningProfile.skillTrack}</span>
              </Row>
            )}
            {user?.learningProfile?.experienceLevel && (
              <Row label="Experience Level">
                <span className="text-sm text-muted-foreground">{user.learningProfile.experienceLevel}</span>
              </Row>
            )}
            {user?.learningProfile?.commitmentTime && (
              <Row label="Daily Commitment">
                <span className="text-sm text-muted-foreground">{user.learningProfile.commitmentTime}</span>
              </Row>
            )}

            {/* Quick links */}
            <button
              onClick={() => navigate("/achievements")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award size={16} className="text-primary" />
                <span className="text-sm font-medium">Achievements & Badges</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-primary" />
                <span className="text-sm font-medium">Leaderboard</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </Section>

          {/* ── APPEARANCE ── */}
          <Section title="Appearance" icon={Monitor}>
            <Row label="Dark Mode" description="Use dark theme across the app">
              <Toggle
                checked={isDark}
                onChange={toggleTheme}
              />
            </Row>
          </Section>

          {/* ── NOTIFICATIONS ── */}
          <Section title="Notifications" icon={Bell}>
            <Row label="Email Notifications" description="Receive updates via email">
              <Toggle
                checked={emailNotifs}
                onChange={() => {
                  setEmailNotifs(v => { savePrefs({ emailNotifs: !v }); return !v; });
                }}
              />
            </Row>
            <Row label="Streak Reminders" description="Get reminded when your streak is at risk">
              <Toggle
                checked={streakReminders}
                onChange={() => {
                  setStreakReminders(v => { savePrefs({ streakReminders: !v }); return !v; });
                }}
              />
            </Row>
            <Row label="Session Reminders" description="Reminders before booked mentor sessions">
              <Toggle
                checked={sessionReminders}
                onChange={() => {
                  setSessionReminders(v => { savePrefs({ sessionReminders: !v }); return !v; });
                }}
              />
            </Row>
          </Section>

          {/* ── SECURITY ── */}
          <Section title="Security" icon={Shield}>
            <Row label="Email Address" description="Your login email">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
            </Row>

            <div>
              <button
                onClick={() => setShowPasswordForm(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-primary" />
                  <span className="text-sm font-medium">Change Password</span>
                </div>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showPasswordForm ? "rotate-90" : ""}`} />
              </button>

              {showPasswordForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleChangePassword} className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                    {[
                      { label: "Current Password", value: currentPwd, setter: setCurrentPwd },
                      { label: "New Password",     value: newPwd,     setter: setNewPwd },
                      { label: "Confirm Password", value: confirmPwd, setter: setConfirmPwd },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                        <div className="relative">
                          <input
                            type={showPwd ? "text" : "password"}
                            value={value}
                            onChange={e => setter(e.target.value)}
                            required
                            className="w-full p-2.5 pr-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(v => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      8+ chars · uppercase · number · symbol
                    </p>
                    <div className="flex gap-2 pt-1">
                      <GlassButton type="submit" variant="primary" size="sm" disabled={savingPwd}>
                        {savingPwd ? "Saving..." : "Update Password"}
                      </GlassButton>
                      <GlassButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => { setShowPasswordForm(false); setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); }}
                      >
                        Cancel
                      </GlassButton>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>

            <button
              onClick={() => navigate("/reset-password")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium">Forgot Password?</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </Section>

          {/* ── ACCOUNT ── */}
          <Section title="Account" icon={User}>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors text-left"
            >
              <LogOut size={16} className="text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Sign Out</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/5 transition-colors text-left"
            >
              <Trash2 size={16} className="text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-400">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
              </div>
            </button>
          </Section>

          {/* App version */}
          <p className="text-center text-xs text-muted-foreground/40 pb-4">
            PathMentor AI · v1.0.0
          </p>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            <GlassCard className="p-6 border-red-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold">Delete Account?</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently delete your account, all progress, XP, and achievements. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Account deletion would require a backend endpoint
                    toast({ title: "Contact support", description: "Please contact support to delete your account.", variant: "destructive" });
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default Settings;
