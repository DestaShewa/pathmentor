import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export const EmptyLessonsState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <GlassCard className="p-12 text-center max-w-md">
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">
          No Lessons Available
        </h2>
        <p className="text-muted-foreground mb-6">
          We're working on creating amazing content for you. Check back soon for new lessons tailored to your learning journey!
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Sparkles className="w-4 h-4" />
          <span>New content coming soon</span>
        </div>
      </GlassCard>
    </motion.div>
  );
};
