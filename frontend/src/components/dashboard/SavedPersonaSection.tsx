import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { 
  Sparkles, Brain, Trophy, BookOpen, Compass, Target, 
  AlertTriangle, PlayCircle, CheckCircle2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SavedPersonaSection = ({ user }: { user: any }) => {
  const navigate = useNavigate();
  const profile = user?.learningProfile;

  if (!user?.onboardingCompleted || !profile?.persona) return null;

  return (
    <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles size={150} className="text-primary" />
      </div>
      
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
              <Sparkles size={14} /> My AI Identity
            </h3>
            <div className="flex items-center gap-4">
               <span className="text-6xl">{profile.emoji || "🚀"}</span>
               <div>
                  <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{profile.persona}</h4>
                  <p className="text-primary font-bold text-sm mt-1">{profile.tagline}</p>
               </div>
            </div>
          </div>
          <GlassButton 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/onboarding-persona")}
            className="text-[10px] h-8 shrink-0 border-white/10 bg-black/40 hover:bg-black/60"
          >
            Retake Persona Test
          </GlassButton>
        </div>

        {/* AI Insight Row */}
        <div className="grid md:grid-cols-3 gap-4">
           <div className="md:col-span-3 p-5 bg-primary/10 border border-primary/20 rounded-2xl">
             <p className="text-sm leading-relaxed text-foreground/90 italic">"{profile.aiSummary || profile.summary}"</p>
           </div>
           
           {profile.superpower && (
             <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col gap-2">
               <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1"><Brain size={12}/> Superpower</span>
               <p className="text-xs font-medium opacity-90">{profile.superpower}</p>
             </div>
           )}
           {profile.kryptonite && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2">
               <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> Kryptonite</span>
               <p className="text-xs font-medium opacity-90">{profile.kryptonite}</p>
             </div>
           )}
           <div className="p-4 bg-black/20 border border-white/10 rounded-2xl flex flex-col justify-between gap-3">
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Goal</span>
               <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{profile.learningGoal || "Career"}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Style</span>
               <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{profile.learningStyle || "Visual"}</span>
             </div>
           </div>
        </div>

        {/* Day 1 Action Plan */}
        {profile.dayOneActionPlan && (
          <div className="p-5 bg-accent/10 border border-accent/20 rounded-2xl">
             <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2 mb-2"><Target size={14} /> Day 1 Action Plan</span>
             <p className="text-sm font-medium">{profile.dayOneActionPlan}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 pt-2">
           {/* Left Column: Roadmap & Projects */}
           <div className="space-y-4">
              <div className="p-5 bg-black/20 rounded-3xl border border-white/5 space-y-4">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                   <Compass size={14} /> Path: {profile.roadmap || "Your Path"}
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Stage</span>
                      <span className="text-xs font-black">{profile.startingStage || "Beginner"}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Pacing</span>
                      <span className="text-xs font-black">{profile.lessonLength || profile.commitmentTime}</span>
                    </div>
                 </div>
              </div>

              <div className="p-5 bg-black/20 rounded-3xl border border-white/5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Trophy size={14} /> Core Projects
                </h4>
                <div className="space-y-3">
                  {(profile.recommendedProjects || profile.projects)?.slice(0, 2).map((project: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">{project.title || project}</p>
                        {project.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{project.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Right Column: Lessons */}
           <div className="p-6 bg-black/20 rounded-3xl border border-white/5 flex flex-col">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                <BookOpen size={14} /> Recommended First Lessons
              </h4>
              <div className="space-y-3 flex-1">
                 {(profile.recommendedLessons || profile.firstLessons)?.map((lesson: any, i: number) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer" onClick={() => navigate("/lessons")}>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary group-hover:bg-primary group-hover:text-black transition-colors">{i+1}</div>
                        <div>
                          <p className="text-xs font-bold group-hover:text-primary transition-colors">{lesson.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.time}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded">{lesson.matchScore || "90"}% Match</span>
                   </div>
                 ))}
              </div>
              <GlassButton variant="primary" className="w-full mt-6" onClick={() => navigate("/lessons")}>
                Start Path <PlayCircle size={16} className="ml-2" />
              </GlassButton>
           </div>
        </div>
      </div>
    </GlassCard>
  );
};
