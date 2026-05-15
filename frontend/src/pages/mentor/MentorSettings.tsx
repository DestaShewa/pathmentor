import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { DashboardTopNav } from "@/components/dashboard/DashboardTopNav";
import { MentorSidebar } from "@/components/mentor/MentorSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/context/ThemeContext";
import {
  User, Key, Bell, Monitor, Save, Eye, EyeOff, Camera,
  Shield, LogOut, ChevronRight, Sun, Moon, Calendar
} from "lucide-react";

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${checked ? "bg-primary" : "bg-white/20"}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`} />
  </button>
);

const MentorSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Profile form
  const [name, setName]               = useState("");
  const [skillTrack, setSkillTrack]   = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [commitmentTime, setCommitmentTime]   = useState("");
  const [bio, setBio]                 = useState("");
  const [avatar, setAvatar]           = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Availability form
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [timezone, setTimezone] = useState("UTC");
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Password form
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [savingPwd, setSavingPwd]     = useState(false);

  // Notification prefs (localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("mentorNotifPrefs") || "{}");
    return {
      sessionReminders:   saved.sessionReminders   ?? true,
      newStudentAssigned: saved.newStudentAssigned  ?? true,
      projectSubmissions: saved.projectSubmissions  ?? true,
      emailDigest:        saved.emailDigest         ?? false,
    };
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchUser();
  }, [navigate]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/profile");
      const u = res.data.user;
      if (u.role !== "mentor") { navigate("/dashboard"); return; }
      setUser(u);
      setName(u.name || "");
      setSkillTrack(u.learningProfile?.skillTrack || "");
      setExperienceLevel(u.learningProfile?.experienceLevel || "");
      setCommitmentTime(u.learningProfile?.commitmentTime || "");
      setBio(u.learningProfile?.personalGoal || "");
      setAvatar(u.avatarUrl || null);
      
      if (u.availability) {
        setWorkingDays(u.availability.workingDays || [1, 2, 3, 4, 5]);
        setStartHour(u.availability.startHour ?? 9);
        setEndHour(u.availability.endHour ?? 17);
        setTimezone(u.availability.timezone || "UTC");
      }
    } catch { navigate("/auth"); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const res = await api.post("/users/upload-avatar", formData);
      setAvatar(res.data.avatarUrl);
      setUser((prev: any) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.response?.data?.message || "Error", variant: "destructive" });
    } finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast({ title: "Error", description: "Name is required", variant: "destructive" }); return; }
    setSavingProfile(true);
    try {
      const res = await api.put("/mentor/profile", { name: name.trim(), skillTrack, experienceLevel, commitmentTime, bio });
      setUser(res.data.user); // Update with the full user object from response
      toast({ title: "Profile updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const res = await api.put("/sessions/availability", { workingDays, startHour, endHour, timezone });
      setUser((prev: any) => ({ ...prev, availability: res.data.availability }));
      toast({ title: "Working hours updated!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to update availability", variant: "destructive" });
    } finally { setSavingAvailability(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast({ title: "Error", description: "Passwords do not match", variant: "destructive" }); return; }
    setSavingPwd(true);
    try {
      await api.put("/users/change-password", { currentPassword: currentPwd, newPassword: newPwd });
      toast({ title: "Password changed!" });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd(""); setShowPwdForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed", variant: "destructive" });
    } finally { setSavingPwd(false); }
  };

  const updateNotif = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem("mentorNotifPrefs", JSON.stringify(updated));
  };

  const handleSignOut = () => { localStorage.removeItem("token"); navigate("/auth"); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen relative bg-background text-white">
      <ParticlesBackground />
      <DashboardTopNav userName={user?.name || "Mentor"} userEmail={user?.email || ""} onSignOut={handleSignOut} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} role="mentor" avatarUrl={user?.avatarUrl} />
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name} userEmail={user?.email} onSignOut={handleSignOut} />

      <main className={`relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-2xl mx-auto transition-all duration-300 ${sidebarCollapsed ? "lg:pl-28" : "lg:pl-72"}`}>

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-extrabold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your mentor profile and preferences</p>
        </motion.div>

        <div className="space-y-6">

          {/* ── Profile ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile</h2>
            </div>
            <GlassCard className="overflow-hidden divide-y divide-white/5">
              {/* Avatar Upload */}
              <div className="px-5 py-6 flex flex-col items-center border-b border-white/5">
                <div className="relative group mb-3">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-black shrink-0 overflow-hidden border-2 border-white/10 shadow-2xl">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-3xl">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full mt-1 inline-block">Mentor Portal</p>
                </div>
              </div>

              {/* Form fields */}
              <div className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Skill Track</label>
                    <input value={skillTrack} onChange={e => setSkillTrack(e.target.value)} placeholder="e.g. Web Development"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Experience Level</label>
                    <input value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} placeholder="e.g. 5+ years"
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Weekly Availability</label>
                  <input value={commitmentTime} onChange={e => setCommitmentTime(e.target.value)} placeholder="e.g. 10 hours/week"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Bio / Teaching Philosophy</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Tell students about your teaching approach..."
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary resize-none" />
                </div>
                <GlassButton variant="primary" onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                  <Save size={15} /> {savingProfile ? "Saving..." : "Save Profile"}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Working Hours (Availability) ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Working Hours</h2>
            </div>
            <GlassCard className="overflow-hidden">
              <div className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          if (workingDays.includes(idx)) {
                            setWorkingDays(workingDays.filter(d => d !== idx));
                          } else {
                            setWorkingDays([...workingDays, idx]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${workingDays.includes(idx) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Start Hour (24h)</label>
                    <input type="number" min="0" max="23" value={startHour} onChange={e => setStartHour(parseInt(e.target.value) || 0)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">End Hour (24h)</label>
                    <input type="number" min="1" max="24" value={endHour} onChange={e => setEndHour(parseInt(e.target.value) || 24)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-gray-900 border border-white/10 text-foreground focus:outline-none focus:border-primary">
                    <option value="UTC">UTC (Default)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET/CEST)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Kolkata">Mumbai (IST)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                  </select>
                </div>
                <GlassButton variant="primary" onClick={handleSaveAvailability} disabled={savingAvailability} className="w-full">
                  <Save size={15} /> {savingAvailability ? "Saving..." : "Save Availability"}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Appearance ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={14} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Appearance</h2>
            </div>
            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-yellow-400" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch between dark and light theme</p>
                  </div>
                </div>
                <Toggle checked={isDark} onChange={toggleTheme} />
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Notifications ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notifications</h2>
            </div>
            <GlassCard className="overflow-hidden divide-y divide-white/5">
              {[
                { key: "sessionReminders"   as const, label: "Session Reminders",    desc: "Get notified before upcoming sessions" },
                { key: "newStudentAssigned" as const, label: "New Student Assigned", desc: "When a new student is assigned to you" },
                { key: "projectSubmissions" as const, label: "Project Submissions",  desc: "When a student submits a project" },
                { key: "emailDigest"        as const, label: "Weekly Email Digest",  desc: "Summary of your week's activity" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Toggle checked={notifPrefs[item.key]} onChange={() => updateNotif(item.key)} />
                </div>
              ))}
            </GlassCard>
          </motion.div>

          {/* ── Security ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security</h2>
            </div>
            <GlassCard className="overflow-hidden divide-y divide-white/5">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <button onClick={() => setShowPwdForm(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <Key size={15} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">Change Password</span>
                </div>
                <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showPwdForm ? "rotate-90" : ""}`} />
              </button>

              {showPwdForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
                  <form onSubmit={handleChangePassword} className="px-5 pb-5 pt-4 space-y-3 border-t border-white/5">
                    {[
                      { label: "Current Password", value: currentPwd, setter: setCurrentPwd },
                      { label: "New Password",     value: newPwd,     setter: setNewPwd },
                      { label: "Confirm Password", value: confirmPwd, setter: setConfirmPwd },
                    ].map(({ label, value, setter }) => (
                      <div key={label}>
                        <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                        <div className="relative">
                          <input type={showPwd ? "text" : "password"} value={value} onChange={e => setter(e.target.value)} required
                            className="w-full p-2.5 pr-9 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary text-sm" />
                          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">8+ chars · uppercase · number · symbol</p>
                    <div className="flex gap-2">
                      <GlassButton type="submit" variant="primary" size="sm" disabled={savingPwd}>
                        {savingPwd ? "Saving..." : "Update Password"}
                      </GlassButton>
                      <GlassButton type="button" variant="secondary" size="sm" onClick={() => setShowPwdForm(false)}>Cancel</GlassButton>
                    </div>
                  </form>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>

          {/* ── Account ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <GlassCard className="overflow-hidden">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/5 transition-colors text-left">
                <LogOut size={16} className="text-red-400" />
                <span className="text-sm font-medium text-red-400">Sign Out</span>
              </button>
            </GlassCard>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground/40 pb-4">PathMentor AI · Mentor Portal · v1.0.0</p>
        </div>
      </main>
    </div>
  );
};

export default MentorSettings;
