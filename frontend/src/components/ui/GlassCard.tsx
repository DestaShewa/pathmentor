import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "inner";
  hover?: boolean;
  children: React.ReactNode;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = true, children, ...props }, ref) => {
    const variants = {
      default: "glass-panel",
      elevated: "glass-elevated",
      inner: "glass-inner-glow",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          variants[variant],
          hover && "transition-all duration-300 hover:border-foreground/20",
          className
        )}
        whileHover={hover ? { y: -5, scale: 1.01 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
