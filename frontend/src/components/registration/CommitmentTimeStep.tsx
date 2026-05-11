import { motion } from 'framer-motion';
import { CommitmentTime, COMMITMENT_OPTIONS } from '@/lib/registrationTypes';

interface CommitmentTimeStepProps {
  selected: CommitmentTime | null;
  onSelect: (time: CommitmentTime) => void;
}

export function CommitmentTimeStep({ selected, onSelect }: CommitmentTimeStepProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {COMMITMENT_OPTIONS.map((option, index) => {
        const isSelected = selected === option.id;

        return (
          <motion.button
            key={option.id}
            onClick={() => onSelect(option.id)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ 
              scale: 1.05,
              y: -5,
            }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-6 rounded-2xl text-center transition-all duration-300
              ${isSelected 
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary shadow-glow' 
                : 'glass-inner-glow hover:bg-white/10'
              }
            `}
          >
            {/* Animated icon */}
            <motion.div
              className="text-4xl mb-3"
              animate={isSelected ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {option.icon}
            </motion.div>

            <h3 className="font-semibold text-lg mb-1">{option.label}</h3>
            <p className="text-sm text-muted-foreground">{option.description}</p>

            {/* Time indicator bar */}
            <div className="mt-4 h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: isSelected ? '100%' : `${(index + 1) * 25}%` }}
                transition={{ delay: 0.2, duration: 0.5 }}
              />
            </div>

            {/* Selection glow */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                  boxShadow: [
                    '0 0 20px rgba(99, 102, 241, 0.3)',
                    '0 0 40px rgba(99, 102, 241, 0.5)',
                    '0 0 20px rgba(99, 102, 241, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
