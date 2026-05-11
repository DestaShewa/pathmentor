import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  children: React.ReactNode;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", size = "md", glow = false, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl overflow-hidden";
    
    const variants = {
      primary: "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-glow",
      secondary: "glass-inner-glow text-foreground hover:bg-foreground/10",
      ghost: "bg-transparent text-foreground hover:bg-foreground/10",
      outline: "bg-transparent border border-foreground/20 text-foreground hover:bg-foreground/10 hover:border-foreground/30",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glow && "btn-glow",
          className
        )}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        <span className="absolute inset-0 overflow-hidden rounded-xl">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        </span>
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
