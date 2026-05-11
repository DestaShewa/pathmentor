import { motion } from "framer-motion";
import { Check, Lock, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

const levels = [
  { name: "Foundations", status: "completed", progress: 100 },
  { name: "Core Concepts", status: "completed", progress: 100 },
  { name: "Intermediate", status: "current", progress: 65 },
  { name: "Advanced", status: "locked", progress: 0 },
  { name: "Expert", status: "locked", progress: 0 },
];

export const RoadmapPreview = () => {
  return (
    <section className="relative py-24 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-inner-glow mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Learning Path</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Your Journey to <span className="text-gradient">Mastery</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow a structured 7-level progression from complete beginner to industry expert.
          </p>
        </motion.div>

        {/* Roadmap preview */}
        <div className="max-w-3xl mx-auto">
          {levels.map((level, index) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < levels.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              <GlassCard
                className={`p-4 mb-4 flex items-center gap-4 ${
                  level.status === "locked" ? "opacity-60" : ""
                }`}
                hover={level.status !== "locked"}
              >
                {/* Status icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    level.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : level.status === "current"
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {level.status === "completed" ? (
                    <Check className="w-6 h-6" />
                  ) : level.status === "locked" ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className="font-semibold">{level.name}</h3>
                  {level.status === "current" && (
                    <div className="mt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-secondary progress-glow"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${level.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {level.progress}% complete
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {level.status === "current" && (
                  <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/roadmap">
            <GlassButton variant="primary" size="lg" glow>
              Explore Full Roadmap
              <ArrowRight className="w-5 h-5" />
            </GlassButton>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
