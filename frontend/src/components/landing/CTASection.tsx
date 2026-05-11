import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="relative py-24 md:py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard variant="elevated" className="p-8 md:p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-[100px]" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-inner-glow mb-6"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Start Your Journey Today</span>
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Ready to <span className="text-gradient">Transform Your Career?</span>
              </h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of learners who have already accelerated their growth with PathMentor AI. 
                Your personalized learning journey starts now.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=register">
                  <GlassButton variant="primary" size="lg" glow className="w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </GlassButton>
                </Link>
                <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto">
                  Talk to Sales
                </GlassButton>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};
