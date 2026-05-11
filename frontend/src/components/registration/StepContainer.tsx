import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface StepContainerProps {
  children: ReactNode;
  stepKey: string | number;
  title: string;
  subtitle?: string;
}

export function StepContainer({ children, stepKey, title, subtitle }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 50, rotateY: -5 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        exit={{ opacity: 0, x: -50, rotateY: 5 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 25,
          mass: 0.8,
        }}
        className="w-full max-w-4xl mx-auto perspective-1000"
      >
        <div className="glass-elevated p-8 md:p-12 rounded-3xl preserve-3d">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-lg">
                {subtitle}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
