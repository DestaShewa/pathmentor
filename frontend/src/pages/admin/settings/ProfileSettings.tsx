import { useState, useEffect } from "react";
import { User, Key, Save, Camera, Mail, Shield } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      const u = res.data.user;
      setName(u.name || "");
      setEmail(u.email || "");
      setRole(u.role || "admin");
    } catch {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      await api.put("/users/profile", { name: name.trim() });
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to update", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "Please fill all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/users/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast({ title: "Password changed successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to change password", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      {/* Profile header card */}
      <div className="flex items-center gap-6 p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-xl">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
            {name?.[0]?.toUpperCase() || "A"}
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 rounded-lg text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all">
            <Camera size={16} />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{name || "Admin"}</h2>
          <p className="text-slate-400 text-sm">{email}</p>
          <span className="inline-block mt-2 text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> Personal Details
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 ml-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed opacity-60"
              />
            </div>
            <p className="text-[10px] text-slate-600 ml-1">Email cannot be changed here</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 ml-1">Role</label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={role}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed opacity-60 capitalize"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
          >
            <Save size={16} /> {savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Key size={14} /> Change Password
          </h3>

          {[
            { label: "Current Password", value: currentPassword, setter: setCurrentPassword },
            { label: "New Password",     value: newPassword,     setter: setNewPassword },
            { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword },
          ].map(({ label, value, setter }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs text-slate-500 ml-1">{label}</label>
              <input
                type="password"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          ))}

          <p className="text-[10px] text-slate-600">
            8+ chars · uppercase · number · symbol (@$!%#*?&)
          </p>

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
          >
            <Key size={16} /> {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
