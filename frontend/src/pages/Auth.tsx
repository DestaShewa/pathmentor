import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft,Briefcase, Mail,FileText, Lock, User, Upload } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import api from "@/services/api";


const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["student", "mentor" ]),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "mentor",
  }); 

   const [cvFile, setCvFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [user, setUser] = useState(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  //const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "register");
  }, [searchParams]);


  const validateForm = () => {
    try {
      if (isLogin) {
        authSchema.pick({ email: true, password: true }).parse(formData);
      } else {
        authSchema.parse({ ...formData, fullName: formData.name || undefined });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };
    
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const endpoint = isLogin ? "/auth/login" : "/auth/register";

    const payload = isLogin
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

    const res = await api.post(endpoint, payload);

    const { token, user } = res.data;

    // Save JWT
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    toast({
      title: isLogin ? "Welcome back!" : "Account created!",
      description: isLogin
        ? "Successfully signed in."
        : "Welcome to PathMentor!",
    });

    console.log("LOGIN USER:", user);
    console.log("MENTOR STATUS:", user.mentorVerification?.status);

    // ✅ Proper Role-Based Navigation
    if (user.role === "mentor") {
      const status = user.mentorVerification?.status?.toLowerCase().trim();
      // Only redirect to pending if explicitly "pending"
      // null, undefined, "approved" all go to dashboard
      if (status === "pending") {
        navigate("/mentor/pending");
      } else if (status === "rejected") {
        navigate("/mentor/pending"); // show rejection status
      } else {
        navigate("/mentor/dashboard");
      }
    } else if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "student") {
      if (!user.onboardingCompleted) {
        navigate("/register");
      } else {
        navigate("/dashboard");
      }
    }

  } catch (error: any) {
    toast({
      title: isLogin ? "Login failed" : "Sign up failed",
      description:
        error.response?.data?.message ||
        "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <ParticlesBackground />

      {/* Back link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <GlassCard variant="elevated" className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-2xl font-bold">PathMentor</span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 p-1 glass-inner-glow rounded-xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isLogin
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isLogin
                  ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form  className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
  <div className="relative">
    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
    <select
      value={formData.role}
      onChange={(e) =>
        setFormData({ ...formData, role: e.target.value as "student" | "mentor" })
      }
      className="w-full pl-10 pr-4 py-3 glass-inner-glow rounded-xl bg-black/20 border-none focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none text-sm"
    >
      <option value="student">
        Sign up as Student
      </option>
      <option value="mentor">
        Sign up as Mentor
      </option>
    </select>
  </div>
)}

            {!isLogin && (
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"/>
                </div>
                {errors.fullName && (
                  <p className="text-destructive text-xs mt-1 ml-1">{errors.fullName}</p>
                )}
              </div>
            )
            }

            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-destructive text-xs mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 glass-inner-glow rounded-xl bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1 ml-1">{errors.password}</p>
              )}
            </div>

            {isLogin && (
              <div className="text-right">
                <a href="/reset-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            )}

            {/* Mentor Specific Fields */}
            <AnimatePresence>
              {!isLogin && formData.role === "mentor" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <p className="text-xs font-semibold text-primary px-1">Professional Verification</p>
                  
                  {/* CV Upload */}
                  <div className="relative group">
                    <label className="flex items-center justify-center gap-2 w-full py-3 px-4 glass-inner-glow rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer">
                      <FileText className={`w-4 h-4 ${cvFile ? "text-green-400" : "text-muted-foreground"}`} />
                      <span className="text-sm text-muted-foreground truncate">
                        {cvFile ? cvFile.name : "Upload CV / Resume (PDF)"}
                      </span>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        className="hidden" 
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {/* Additional File Upload */}
                  <div className="relative group">
                    <label className="flex items-center justify-center gap-2 w-full py-3 px-4 glass-inner-glow rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 transition-all cursor-pointer">
                      <Upload className={`w-4 h-4 ${additionalFile ? "text-green-400" : "text-muted-foreground"}`} />
                      <span className="text-sm text-muted-foreground truncate">
                        {additionalFile ? additionalFile.name : "Other Certifications (Optional)"}
                      </span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => setAdditionalFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <GlassButton
              type="submit"
              variant="primary"
              glow
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </GlassButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <GlassButton variant="outline" className="w-full" type="button">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </GlassButton>
            <GlassButton variant="outline" className="w-full" type="button">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </GlassButton>
          </div>

          {/* Info text */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            {isLogin ? (
              <>Don't have an account? <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">Sign up</button></>
            ) : (
              <>Already have an account? <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">Sign in</button></>
            )}
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Auth;
