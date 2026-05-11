import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { ParticlesBackground } from "@/components/landing/ParticlesBackground";

const NotFound = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <ParticlesBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <GlassCard variant="elevated" className="p-8 md:p-12 max-w-md">
          <div className="text-8xl font-bold text-gradient mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <GlassButton variant="primary" glow>
                <Home className="w-4 h-4" />
                Go Home
              </GlassButton>
            </Link>
            <GlassButton variant="secondary" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default NotFound;
