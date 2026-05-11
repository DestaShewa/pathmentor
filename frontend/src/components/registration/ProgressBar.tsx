import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ progress, currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="relative h-2 rounded-full overflow-hidden bg-muted/50 backdrop-blur-sm">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/50 via-secondary/50 to-accent/50 blur-md"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <motion.div
              key={stepNumber}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                transition-all duration-300
                ${isCompleted 
                  ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground' 
                  : isCurrent 
                    ? 'bg-primary/20 border-2 border-primary text-primary'
                    : 'bg-muted/30 text-muted-foreground'
                }
              `}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {isCompleted ? '✓' : stepNumber}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
