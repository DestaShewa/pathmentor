import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isGenerating: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  canProceed,
  isGenerating,
  onPrev,
  onNext,
  onComplete,
}: NavigationButtonsProps) {
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex justify-between items-center w-full max-w-4xl mx-auto mt-8"
    >
      {/* Back button */}
      <motion.button
        onClick={onPrev}
        disabled={isFirstStep}
        whileHover={{ scale: 1.02, x: -3 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
          ${isFirstStep 
            ? 'opacity-0 pointer-events-none' 
            : 'glass-inner-glow hover:bg-white/10'
          }
        `}
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </motion.button>

      {/* Next/Complete button */}
      <motion.button
        onClick={isLastStep ? onComplete : onNext}
        disabled={!canProceed || isGenerating}
        whileHover={canProceed ? { scale: 1.02, x: 3 } : undefined}
        whileTap={canProceed ? { scale: 0.98 } : undefined}
        className={`
          relative flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300
          overflow-hidden
          ${canProceed && !isGenerating
            ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-glow hover:shadow-glow' 
            : 'bg-muted/30 text-muted-foreground cursor-not-allowed'
          }
        `}
      >
        {/* Shimmer effect */}
        {canProceed && !isGenerating && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        <span className="relative z-10">
          {isGenerating ? 'Generating...' : isLastStep ? 'Start Learning' : 'Continue'}
        </span>
        
        <span className="relative z-10">
          {isGenerating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} />
            </motion.div>
          ) : isLastStep ? (
            <Sparkles size={20} />
          ) : (
            <ArrowRight size={20} />
          )}
        </span>
      </motion.button>
    </motion.div>
  );
}
