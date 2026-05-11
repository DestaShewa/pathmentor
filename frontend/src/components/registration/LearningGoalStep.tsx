import { motion } from 'framer-motion';
import { LearningGoal, GOAL_OPTIONS } from '@/lib/registrationTypes';

interface LearningGoalStepProps {
  selected: LearningGoal | null;
  onSelect: (goal: LearningGoal) => void;
}

export function LearningGoalStep({ selected, onSelect }: LearningGoalStepProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {GOAL_OPTIONS.map((goal, index) => {
        const isSelected = selected === goal.id;

        return (
          <motion.button
            key={goal.id}
            onClick={() => onSelect(goal.id)}
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
              delay: index * 0.1, 
              type: 'spring', 
              stiffness: 200,
              damping: 20 
            }}
            whileHover={{ 
              scale: 1.05,
              y: -10,
              transition: { type: 'spring', stiffness: 400 }
            }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative p-6 rounded-2xl text-center transition-all duration-300
              preserve-3d perspective-1000
              ${isSelected 
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary shadow-glow' 
                : 'glass-inner-glow hover:bg-white/10'
              }
            `}
          >
            {/* Large animated icon */}
            <motion.div
              className="text-5xl mb-4"
              animate={isSelected ? {
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={{ duration: 1, repeat: isSelected ? Infinity : 0, repeatDelay: 1 }}
            >
              {goal.icon}
            </motion.div>

            <h3 className="font-bold text-lg mb-2">{goal.label}</h3>
            <p className="text-sm text-muted-foreground">{goal.description}</p>

            {/* Particle effects for selected */}
            {isSelected && (
              <>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary/50"
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      opacity: 0 
                    }}
                    animate={{ 
                      x: [0, (Math.random() - 0.5) * 100],
                      y: [0, (Math.random() - 0.5) * 100],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.3,
                      ease: 'easeOut'
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  />
                ))}
              </>
            )}

            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <span className="text-primary-foreground text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
