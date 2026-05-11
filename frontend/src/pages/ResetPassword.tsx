import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import api from "@/services/api";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // ── Forgot password state ──
  const [email, setEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  // ── Reset password state ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // ── Password strength check ──
  const passwordRules = [
    { label: "At least 8 characters", ok: newPassword.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(newPassword) },
    { label: "One number", ok: /\d/.test(newPassword) },
    { label: "One special character (@$!%*?&)", ok: /[@$!%*?&]/.test(newPassword) },
  ];
  const passwordValid = passwordRules.every(r => r.ok);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!email.trim()) { setForgotError("Please enter your email address."); return; }
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
    } catch {
      // intentionally swallow — always show success to prevent enumeration
    } finally {
      setForgotSent(true);
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!passwordValid) {
      setResetError("Password does not meet the requirements below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setResetSuccess(true);
      setTimeout(() => navigate("/auth"), 3000);
    } catch (err: any) {
      setResetError(
        err.response?.data?.message || "Reset failed. The link may have expired."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <ParticlesBackground />

      <Link
        to="/auth"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard variant="elevated" className="p-8">

          {/* ── Logo ── */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── TOKEN PRESENT: Set new password ── */}
            {token && !resetSuccess && (
              <motion.div key="reset-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-center mb-1">Set New Password</h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Choose a strong password for your account.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirm password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-sm"
                    />
                  </div>

                  {/* Password rules */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1 p-3 rounded-xl bg-white/5 border border-white/10">
                      {passwordRules.map(rule => (
                        <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.ok ? "text-green-400" : "text-muted-foreground"}`}>
                          <CheckCircle2 size={12} className={rule.ok ? "text-green-400" : "text-white/20"} />
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {resetError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      {resetError}
                    </div>
                  )}

                  <GlassButton
                    type="submit"
                    variant="primary"
                    glow
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading
                      ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      : "Reset Password"
                    }
                  </GlassButton>
                </form>
              </motion.div>
            )}

            {/* ── TOKEN PRESENT: Success ── */}
            {token && resetSuccess && (
              <motion.div key="reset-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
                <p className="text-muted-foreground text-sm mb-6">
                  Your password has been updated. Redirecting you to login...
                </p>
                <Link to="/auth">
                  <GlassButton variant="primary" className="w-full">Go to Login</GlassButton>
                </Link>
              </motion.div>
            )}

            {/* ── NO TOKEN: Email sent confirmation ── */}
            {!token && forgotSent && (
              <motion.div key="email-sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
                <p className="text-muted-foreground text-sm mb-2">
                  We sent a reset link to:
                </p>
                <p className="font-semibold text-white mb-4">{email}</p>
                <p className="text-muted-foreground text-xs mb-6">
                  The link expires in 1 hour. Check your spam folder if you don't see it.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => { setForgotSent(false); setEmail(""); }}
                    className="w-full text-sm text-primary hover:underline"
                  >
                    Try a different email
                  </button>
                  <Link to="/auth">
                    <GlassButton variant="secondary" className="w-full">Back to Login</GlassButton>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── NO TOKEN: Forgot password form ── */}
            {!token && !forgotSent && (
              <motion.div key="forgot-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-bold text-center mb-1">Forgot Password?</h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Enter your email and we'll send you a reset link.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground text-sm"
                    />
                  </div>

                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      {forgotError}
                    </div>
                  )}

                  <GlassButton
                    type="submit"
                    variant="primary"
                    glow
                    className="w-full"
                    disabled={forgotLoading}
                  >
                    {forgotLoading
                      ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      : "Send Reset Link"
                    }
                  </GlassButton>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
