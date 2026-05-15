import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import api from "@/services/api";

const ResetPassword = () => {
  const navigate = useNavigate();

  // ── Step state: 'email' | 'otp' | 'success'
  const [step, setStep] = useState<"email" | "otp" | "success">("email");

  // ── Email step ──
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ── OTP + Password step ──
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // ── Password strength ──
  const passwordRules = [
    { label: "At least 8 characters", ok: newPassword.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(newPassword) },
    { label: "One number", ok: /\d/.test(newPassword) },
    { label: "One special character (@$!%*?&)", ok: /[@$!%*?&]/.test(newPassword) },
  ];
  const passwordValid = passwordRules.every(r => r.ok);

  // ── Step 1: Send OTP ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) { setEmailError("Please enter your email address."); return; }
    setEmailLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setStep("otp");
    } catch {
      // Always move to OTP step to prevent enumeration
      setStep("otp");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Step 2: Verify OTP + Reset ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP code.");
      return;
    }
    if (!passwordValid) {
      setOtpError("Password does not meet the requirements below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError("Passwords do not match.");
      return;
    }

    setOtpLoading(true);
    try {
      await api.post("/auth/reset-password", { email: email.trim(), otp, newPassword });
      setStep("success");
      setTimeout(() => navigate("/auth"), 3000);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setOtpLoading(false);
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

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {["email", "otp", "success"].map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === s ? "w-6 bg-primary" : i < ["email", "otp", "success"].indexOf(step) ? "w-2 bg-primary/50" : "w-2 bg-white/10"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1: Enter Email ── */}
            {step === "email" && (
              <motion.div key="email-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-center mb-1">Forgot Password?</h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Enter your email and we'll send you a 6-digit OTP code.
                </p>

                <form onSubmit={handleSendOtp} className="space-y-4">
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

                  {emailError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      {emailError}
                    </div>
                  )}

                  <GlassButton type="submit" variant="primary" glow className="w-full" disabled={emailLoading}>
                    {emailLoading
                      ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      : "Send OTP Code"
                    }
                  </GlassButton>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: Enter OTP + New Password ── */}
            {step === "otp" && (
              <motion.div key="otp-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h1 className="text-2xl font-bold">Enter OTP Code</h1>
                </div>
                <p className="text-muted-foreground text-sm mb-5">
                  We sent a 6-digit code to <span className="text-white font-medium">{email}</span>. Enter it below along with your new password.
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* OTP input */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="______"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full py-3 text-center text-2xl font-bold tracking-[0.5em] glass-inner-glow rounded-xl bg-transparent border border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-white/20"
                    />
                  </div>

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

                  {otpError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0" />
                      {otpError}
                    </div>
                  )}

                  <GlassButton type="submit" variant="primary" glow className="w-full" disabled={otpLoading}>
                    {otpLoading
                      ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      : "Reset Password"
                    }
                  </GlassButton>

                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(""); setOtpError(""); }}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    ← Use a different email
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === "success" && (
              <motion.div key="success-step" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
                <p className="text-muted-foreground text-sm mb-6">
                  Your password has been updated successfully. Redirecting you to login...
                </p>
                <Link to="/auth">
                  <GlassButton variant="primary" className="w-full">Go to Login</GlassButton>
                </Link>
              </motion.div>
            )}

          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
