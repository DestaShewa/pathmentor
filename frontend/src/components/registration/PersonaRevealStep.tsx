import { motion } from 'framer-motion';

interface PersonaRevealStepProps {
  profile: any;
  isGenerating: boolean;
}

export function PersonaRevealStep({ profile, isGenerating }: PersonaRevealStepProps) {

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1, repeat: Infinity },
          }}
        />
        <motion.p
          className="mt-6 text-lg text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Analyzing your learning profile...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Persona reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center"
      >
        <motion.div
          className="inline-block mb-4"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-8xl">{profile.emoji || "🚀"}</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-primary font-medium mb-2">You are a...</p>
          <h2 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-3`}>
            {profile.persona}
          </h2>
          <p className="text-lg text-muted-foreground mb-4">{profile.tagline}</p>
          <p className="text-foreground max-w-md mx-auto">{profile.description}</p>
        </motion.div>

        {/* Traits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-3 mt-6 flex-wrap"
        >
          {profile.traits?.map((trait: string, index: number) => (
            <motion.span
              key={trait}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="skill-bubble"
            >
              {trait}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      {/* Learning profile summary */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-inner-glow rounded-2xl p-6 space-y-6"
      >
        <h3 className="text-xl font-semibold text-center text-gradient">Your Personalized Path</h3>

        {/* AI Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/20"
        >
          <p className="text-sm text-foreground leading-relaxed">{profile.aiSummary}</p>
        </motion.div>

        {/* Superpower & Kryptonite */}
        {(profile.superpower || profile.kryptonite) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {profile.superpower && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-left">
                <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>⚡</span> Your Superpower
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{profile.superpower}</p>
              </div>
            )}
            {profile.kryptonite && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>⚠️</span> Your Kryptonite
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{profile.kryptonite}</p>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Day 1 Action Plan */}
        {profile.dayOneActionPlan && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.08 }}
            className="p-5 rounded-xl bg-accent/10 border border-accent/20 text-left mt-4"
          >
            <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🎯</span> Day 1 Action Plan
            </h4>
            <p className="text-sm font-medium text-foreground/90 leading-relaxed">{profile.dayOneActionPlan}</p>
          </motion.div>
        )}

        {/* Profile details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Roadmap', value: profile.roadmap, icon: '🗺️' },
            { label: 'Starting Stage', value: profile.startingStage, icon: '🚀' },
            { label: 'Lesson Format', value: profile.lessonLength, icon: '📚' },
            { label: 'Content Style', value: profile.contentPriority, icon: '🎯' },
            { label: 'Daily Plan', value: profile.dailyPlan, icon: '📅' },
            { label: 'Project Focus', value: profile.projectRecommendation, icon: '🏗️' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/20"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommended lessons preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="glass-inner-glow rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📖</span> Your First Lessons
        </h3>
        <div className="space-y-3">
          {profile.recommendedLessons?.slice(0, 3).map((item: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6 + index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
              <div className="text-xs text-primary font-medium">
                {item.matchScore}% match
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommended projects */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        className="glass-inner-glow rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🎯</span> Recommended Projects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profile.recommendedProjects?.map((project: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.9 + index * 0.1 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
            >
              <h4 className="font-semibold text-sm mb-1">{project.title}</h4>
              <p className="text-xs text-muted-foreground">{project.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
