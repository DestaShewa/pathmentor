import { motion } from 'framer-motion';
import { LearningStyle, LEARNING_STYLE_OPTIONS } from '@/lib/registrationTypes';

interface LearningStyleStepProps {
  selected: LearningStyle | null;
  onSelect: (style: LearningStyle) => void;
}

export function LearningStyleStep({ selected, onSelect }: LearningStyleStepProps) {
  const styleColors = [
    'from-red-500 to-pink-500',
    'from-blue-500 to-indigo-500',
    'from-orange-500 to-amber-500',
    'from-teal-500 to-cyan-500',
    'from-purple-500 to-violet-500',
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
      {LEARNING_STYLE_OPTIONS.map((style, index) => {
        const isSelected = selected === style.id;

        return (
          <motion.button
            key={style.id}
            onClick={() => onSelect(style.id)}
            initial={{ opacity: 0, y: 30, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ 
              delay: index * 0.08, 
              type: 'spring', 
              stiffness: 200,
              damping: 15 
            }}
            whileHover={{ 
              scale: 1.08,
              y: -8,
              rotateY: 5,
              transition: { type: 'spring', stiffness: 400 }
            }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative w-36 h-36 p-4 rounded-2xl flex flex-col items-center justify-center
              transition-all duration-300 preserve-3d
              ${isSelected 
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary shadow-glow' 
                : 'glass-inner-glow hover:bg-white/10'
              }
            `}
          >
            {/* Floating orb background */}
            <motion.div
              className={`
                absolute -z-10 w-16 h-16 rounded-full 
                bg-gradient-to-br ${styleColors[index]} opacity-30 blur-xl
              `}
              animate={{
                scale: isSelected ? [1, 1.3, 1] : 1,
                opacity: isSelected ? [0.3, 0.5, 0.3] : 0.2,
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.div
              className="text-4xl mb-2"
              animate={isSelected ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.5 }}
            >
              {style.icon}
            </motion.div>

            <h3 className="font-semibold text-sm text-center">{style.label}</h3>

            {/* Selection ring */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            )}

            {/* Checkmark */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg"
              >
                <span className="text-primary-foreground text-sm">✓</span>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
