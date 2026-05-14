import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";
import { useToast } from "@/hooks/use-toast";
import aiService from "@/services/aiService";
import api from "@/services/api";
import { 
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, 
  Target, Rocket, Clock, Brain, Compass, Eye,
  Loader2, Trophy, BookOpen, Layers
} from "lucide-react";

const steps = [
  { id: "skills", title: "Skills & Track", icon: <Target className="w-5 h-5" /> },
  { id: "commitment", title: "Experience & Time", icon: <Clock className="w-5 h-5" /> },
  { id: "style", title: "Style & Goal", icon: <Brain className="w-5 h-5" /> },
  { id: "vision", title: "Personal Vision", icon: <Eye className="w-5 h-5" /> },
  { id: "generation", title: "AI Generation", icon: <Sparkles className="w-5 h-5" /> }
];

const paths = [
  "Frontend Development", "Backend Development", "Fullstack Web", 
  "Mobile App Development", "Data Science", "Machine Learning", 
  "UI/UX Design", "Cybersecurity", "Cloud Computing"
];

const OnboardingPersona = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    skillTrack: "",
    experienceLevel: "Beginner",
    commitmentTime: "1-2 hours / day",
    learningStyle: "Systematic",
    learningGoal: "",
    personalGoal: ""
  });
  const [personaResult, setPersonaResult] = useState<any>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const startGeneration = async () => {
    if (!formData.skillTrack || !formData.learningGoal) {
      toast({ title: "Incomplete", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setCurrentStep(4); // Move to generation step

    try {
      const res = await aiService.generatePersona(formData);
      setPersonaResult(res.result);
      
      // Save to backend
      await api.put("/users/profile/persona", {
        ...formData,
        ...res.result
      });

      toast({ title: "Success!", description: "Your personalized learning profile is ready." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate persona.", variant: "destructive" });
      setCurrentStep(3); // Go back if failed
    } finally {
      setIsGenerating(false);
    }
  };

  const currentStepId = steps[currentStep].id;

  return (
    <div className="min-h-screen relative bg-background text-white overflow-hidden">
      <ParticlesBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto pt-20 pb-16 px-4 md:px-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30"
          >
            <Sparkles className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-white">
            AI Personalization
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Let's build your unique learning identity and roadmap.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 -z-10" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${idx <= currentStep ? "bg-primary border-primary text-black" : "bg-background border-white/10 text-white/40"}`}>
                {idx < currentStep ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${idx <= currentStep ? "text-primary" : "text-white/20"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <GlassCard className="flex-1 p-8 md:p-12 mb-8 border-primary/20 shadow-[-20px_20px_60px_rgba(0,0,0,0.5)]">
          <AnimatePresence mode="wait">
            {currentStepId === "skills" && (
              <motion.div 
                key="skills"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    What's your learning track? <Rocket className="text-primary w-5 h-5" />
                  </h2>
                  <p className="text-muted-foreground text-sm">Choose the domain you want to master.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paths.map(path => (
                    <button
                      key={path}
                      onClick={() => setFormData(prev => ({ ...prev, skillTrack: path }))}
                      className={`p-4 rounded-2xl text-sm font-medium transition-all duration-200 border ${formData.skillTrack === path ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                    >
                      {path}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStepId === "commitment" && (
              <motion.div 
                key="commitment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">What's your experience?</h2>
                    <p className="text-muted-foreground text-sm">Where are you currently in your journey?</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {["Beginner", "Intermediate", "Advanced"].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setFormData(prev => ({ ...prev, experienceLevel: lvl }))}
                        className={`px-8 py-4 rounded-2xl text-sm font-bold border transition-all duration-200 ${formData.experienceLevel === lvl ? "bg-primary text-black border-primary" : "bg-white/5 border-white/10 text-white/50"}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Daily Commitment</h2>
                    <p className="text-muted-foreground text-sm">How much time can you dedicate daily?</p>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {["< 1 hour", "1-2 hours", "3-5 hours", "Full-time"].map(time => (
                      <button
                        key={time}
                        onClick={() => setFormData(prev => ({ ...prev, commitmentTime: time }))}
                        className={`p-4 rounded-xl text-xs font-bold border transition-all duration-200 ${formData.commitmentTime === time ? "bg-white/20 border-white/40" : "bg-white/5 border-white/10 opacity-60"}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStepId === "style" && (
              <motion.div 
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Learning Style</h2>
                    <p className="text-muted-foreground text-sm">How do you learn most effectively?</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["Visual", "Hands-on", "Systematic", "Project-based"].map(style => (
                      <button
                        key={style}
                        onClick={() => setFormData(prev => ({ ...prev, learningStyle: style }))}
                        className={`p-4 rounded-2xl text-xs font-bold border transition-all duration-200 ${formData.learningStyle === style ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-white/40"}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">Main Learning Goal <Compass className="text-primary w-5 h-5" /></h2>
                  <textarea 
                    value={formData.learningGoal}
                    onChange={e => setFormData(prev => ({ ...prev, learningGoal: e.target.value }))}
                    placeholder="e.g. Become a Senior Frontend Engineer at a big tech company..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary resize-none h-32"
                  />
                </div>
              </motion.div>
            )}

            {currentStepId === "vision" && (
              <motion.div 
                key="vision"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">Personal Vision <Eye className="text-primary w-5 h-5" /></h2>
                  <p className="text-muted-foreground text-sm">Tell us the "Why" behind your Master’s journey.</p>
                </div>
                <textarea 
                  value={formData.personalGoal}
                  onChange={e => setFormData(prev => ({ ...prev, personalGoal: e.target.value }))}
                  placeholder="What motivates you? What impact do you want to create?"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:outline-none focus:border-primary resize-none h-48 leading-relaxed"
                />
              </motion.div>
            )}

            {currentStepId === "generation" && (
              <motion.div 
                key="generation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center"
              >
                {isGenerating ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Crafting your destiny...</h3>
                      <p className="text-muted-foreground text-sm animate-pulse">Our AI is analyzing your goals, vision, and skills.</p>
                    </div>
                  </div>
                ) : personaResult ? (
                  <div className="w-full space-y-8 animate-in fade-in zoom-in duration-500 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="p-8 bg-primary/10 border border-primary/20 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Trophy size={100} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-1">Your Learning Persona</h3>
                        <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                          {personaResult.persona}
                        </h4>
                        <p className="text-primary font-bold text-lg mb-4">{personaResult.tagline}</p>
                        <p className="text-sm text-foreground/70 max-w-lg leading-relaxed mb-6">
                          {personaResult.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {personaResult.keywords?.map((kw: string) => (
                            <span key={kw} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                         <Compass className="w-3 h-3" /> Your Personalized Path
                       </h3>
                       <p className="text-sm text-muted-foreground leading-relaxed">
                         {personaResult.summary}
                       </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Layers className="w-3 h-3" /> Roadmap
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(personaResult.roadmap || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="w-3 h-3 text-primary" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</p>
                                <p className="text-xs font-medium">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <BookOpen className="w-3 h-3" /> First Lessons
                        </h4>
                        <div className="space-y-3">
                          {personaResult.firstLessons?.map((lesson: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                              <div>
                                <p className="text-xs font-bold">{lesson.title}</p>
                                <p className="text-[10px] text-muted-foreground">{lesson.time}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-primary">{lesson.matchScore}% Match</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4 text-left">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                         <Rocket className="w-3 h-3" /> Recommended Projects
                       </h4>
                       <div className="grid sm:grid-cols-3 gap-4">
                         {personaResult.projects?.map((item: any, i: number) => (
                           <div key={i} className="space-y-1">
                             <p className="text-xs font-bold">{item.title}</p>
                             <p className="text-[10px] text-muted-foreground line-clamp-2">{item.description}</p>
                           </div>
                         ))}
                       </div>
                    </div>

                    <div className="p-6 bg-primary/20 rounded-3xl border border-primary/30 text-center italic text-sm">
                      "{personaResult.recommendation}"
                    </div>

                    <GlassButton variant="primary" className="w-full py-6 text-lg font-bold" onClick={() => navigate("/dashboard")}>
                      Enter Dashboard <ArrowRight className="ml-2" />
                    </GlassButton>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* Footer Navigation */}
        {!isGenerating && !personaResult && (
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBack} 
              className={`flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors ${currentStep === 0 ? "opacity-0 pointer-events-none" : ""}`}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <GlassButton 
              variant="primary" 
              glow={currentStep === 3}
              onClick={currentStep === 3 ? startGeneration : handleNext}
              className="px-10"
            >
              {currentStep === 3 ? "Complete & Analyze" : "Continue"} <ArrowRight size={16} className="ml-2" />
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPersona;
