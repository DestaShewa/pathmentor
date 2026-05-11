import { motion } from "framer-motion";
import { ArrowRight, Play, Users, Award, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { FloatingOrb } from "./FloatingOrb";
import { SkillBubbles } from "./SkillBubbles";

const stats = [
  { icon: Users, label: "Active Learners", value: "50K+" },
  { icon: Award, label: "Expert Mentors", value: "500+" },
  { icon: TrendingUp, label: "Success Rate", value: "94%" },
];

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-inner-glow mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">AI-Powered Learning Platform</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your Roadmap From{" "}
              <span className="text-gradient">Beginner to Mastery</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              Transform your learning journey with PathMentor AI. Get personalized roadmaps, 
              expert guidance, and accelerate your growth in any skill.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link to="/register">
                <GlassButton variant="primary" size="lg" glow className="w-full sm:w-auto">
                  Start Learning Free
                  <ArrowRight className="w-5 h-5" />
                </GlassButton>
              </Link>
              <Link to="/auth">
                <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Play className="w-5 h-5" />
                  Sign In
                </GlassButton>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right content - 3D Card with Orb */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center perspective-1000"
          >
            <GlassCard
              variant="elevated"
              className="p-8 relative preserve-3d hover:rotate-y-12 hover:rotate-x-6 transition-transform duration-500"
            >
              <div className="flex flex-col items-center gap-6">
                <FloatingOrb />
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">AI Learning Assistant</h3>
                  <p className="text-muted-foreground text-sm">
                    Your personal guide to mastering any skill
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-xl" />
            </GlassCard>
          </motion.div>
        </div>

        {/* Skill bubbles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <SkillBubbles />
        </motion.div>
      </div>
    </section>
  );
};
