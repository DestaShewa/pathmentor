import { motion } from 'framer-motion';
import { ExperienceLevel, EXPERIENCE_OPTIONS } from '@/lib/registrationTypes';

interface ExperienceLevelStepProps {
  selected: ExperienceLevel | null;
  onSelect: (level: ExperienceLevel) => void;
}

export function ExperienceLevelStep({ selected, onSelect }: ExperienceLevelStepProps) {
  const levelIcons = ['🌱', '🌿', '🌳', '🏆'];
  const levelColors = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
  ];

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto">
      {EXPERIENCE_OPTIONS.map((level, index) => {
        const isSelected = selected === level.id;

        return (
          <motion.button
            key={level.id}
            onClick={() => onSelect(level.id)}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ 
              scale: 1.02, 
              x: 10,
              transition: { type: 'spring', stiffness: 400 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300
              ${isSelected 
                ? 'bg-gradient-to-r from-primary/30 to-secondary/30 border-2 border-primary shadow-glow' 
                : 'glass-inner-glow hover:bg-white/10'
              }
            `}
          >
            {/* Icon with glow */}
            <div className="relative">
              <motion.div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                  bg-gradient-to-br ${levelColors[index]} bg-opacity-20
                `}
                animate={isSelected ? {
                  boxShadow: ['0 0 20px rgba(99, 102, 241, 0.3)', '0 0 40px rgba(99, 102, 241, 0.5)', '0 0 20px rgba(99, 102, 241, 0.3)'],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {levelIcons[index]}
              </motion.div>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lg">{level.label}</h3>
              <p className="text-sm text-muted-foreground">{level.description}</p>
            </div>

            {/* Selection indicator */}
            <motion.div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                transition-all duration-300
                ${isSelected 
                  ? 'border-primary bg-primary' 
                  : 'border-muted-foreground'
                }
              `}
            >
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-primary-foreground text-xs"
                >
                  ✓
                </motion.span>
              )}
            </motion.div>

            {/* Progress line indicator */}
            <motion.div
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b ${levelColors[index]}`}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: isSelected ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
