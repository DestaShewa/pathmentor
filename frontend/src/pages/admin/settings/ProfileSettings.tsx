import { useState, useEffect, useRef } from "react";
import { User, Key, Save, Camera, Mail, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      const u = res.data.user;
      setName(u.name || "");
      setEmail(u.email || "");
      setRole(u.role || "admin");
      setAvatarUrl(u.avatarUrl || null);
    } catch {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle avatar file selection — preview immediately, upload on save
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be under 5 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    try {
      // If there's a new avatar file, upload it first
      if (avatarPreview && fileInputRef.current?.files?.[0]) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("avatar", fileInputRef.current.files[0]);
        try {
          // Upload via multipart — backend stores in uploads/avatars/
          const uploadRes = await api.post("/users/upload-avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setAvatarUrl(uploadRes.data.avatarUrl);
          setAvatarPreview(null);
        } catch {
          // Avatar upload failed — still save name
          toast({ title: "Warning", description: "Avatar upload failed, but name will be saved", variant: "destructive" });
        } finally {
          setUploadingAvatar(false);
        }
      }

      await api.put("/users/profile", { name: name.trim() });
      toast({ title: "Profile updated successfully!" });
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
    const strongPwd = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!strongPwd.test(newPassword)) {
      toast({ title: "Error", description: "Password must be 8+ chars with uppercase, lowercase, number, and symbol", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/users/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
      toast({ title: "Password changed successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to change password", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;

  if (loadingProfile) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">

      {/* ── Profile header card ── */}
      <div className="flex items-center gap-6 p-8 bg-slate-900/40 border border-white/10 rounded-3xl backdrop-blur-xl">
        {/* Avatar with upload */}
        <div className="relative group shrink-0">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
              {name?.[0]?.toUpperCase() || "A"}
            </div>
          )}

          {/* Upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Change profile picture"
          >
            {uploadingAvatar ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <Camera size={20} className="text-white" />
            )}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {/* Preview badge */}
          {avatarPreview && (
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              NEW
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">{name || "Admin"}</h2>
          <p className="text-slate-400 text-sm">{email}</p>
          <span className="inline-block mt-2 text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            {role}
          </span>
          <p className="text-xs text-slate-500 mt-2">
            Click the avatar to change your profile picture
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Personal Details ── */}
        <form onSubmit={handleSaveProfile} className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> Personal Details
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 ml-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5">
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

          {/* Avatar upload hint */}
          {avatarPreview && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              <Camera size={13} />
              New avatar selected — click Save to apply
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile || uploadingAvatar}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
          >
            {savingProfile || uploadingAvatar ? (
              <><Loader2 size={15} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={15} /> Save Profile</>
            )}
          </button>
        </form>

        {/* ── Change Password ── */}
        <form onSubmit={handleChangePassword} className="p-6 bg-slate-900/40 border border-white/10 rounded-3xl space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Key size={14} /> Change Password
          </h3>

          {/* Current password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 ml-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 ml-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Strength hint */}
          <div className="text-[10px] text-slate-600 space-y-0.5 ml-1">
            <p>Requirements: 8+ characters</p>
            <p>Must include: uppercase · lowercase · number · symbol (@$!%*?&)</p>
          </div>

          {/* Password strength indicator */}
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
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors ${met ? "bg-emerald-500" : "bg-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                {[/[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /\d/.test(newPassword), /[@$!%*?&]/.test(newPassword), newPassword.length >= 8].filter(Boolean).length}/5 requirements met
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-60"
          >
            {savingPassword ? (
              <><Loader2 size={15} className="animate-spin" /> Changing...</>
            ) : (
              <><Key size={15} /> Change Password</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
