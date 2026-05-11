import { motion } from "framer-motion";
import { 
  Brain, 
  Target, 
  Users, 
  Zap, 
  LineChart, 
  Shield,
  Sparkles
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Roadmaps",
    description: "Get personalized learning paths crafted by AI based on your goals and current skill level.",
    gradient: "from-primary to-cyan-400",
  },
  {
    icon: Target,
    title: "Goal Tracking",
    description: "Set milestones and track your progress with visual dashboards and achievement systems.",
    gradient: "from-secondary to-purple-400",
  },
  {
    icon: Users,
    title: "Expert Mentorship",
    description: "Connect with industry experts who guide you through challenging concepts and career decisions.",
    gradient: "from-accent to-pink-400",
  },
  {
    icon: Zap,
    title: "Interactive Challenges",
    description: "Practice with real-world projects and coding challenges to reinforce your learning.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: LineChart,
    title: "Progress Analytics",
    description: "Detailed insights into your learning patterns help optimize your study sessions.",
    gradient: "from-cyan-400 to-primary",
  },
  {
    icon: Shield,
    title: "Skill Certification",
    description: "Earn verified certificates that showcase your expertise to potential employers.",
    gradient: "from-purple-400 to-secondary",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-32 px-4">
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
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-gradient">Excel</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with proven learning methodologies 
            to accelerate your journey to mastery.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <GlassCard className="p-6 h-full group">
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
