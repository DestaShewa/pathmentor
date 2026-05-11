import { motion } from 'framer-motion';
import { SkillTrack, SKILL_OPTIONS } from '@/lib/registrationTypes';

interface SkillTrackStepProps {
  selected: SkillTrack | null;
  onSelect: (skill: SkillTrack) => void;
}

export function SkillTrackStep({ selected, onSelect }: SkillTrackStepProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SKILL_OPTIONS.map((skill, index) => {
        const isSelected = selected === skill.id;

        return (
          <motion.button
            key={skill.id}
            onClick={() => onSelect(skill.id)}
            initial={{ opacity: 0, y: 20, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
            whileHover={{ 
              scale: 1.05, 
              y: -8,
              rotateY: 2,
              transition: { type: 'spring', stiffness: 400 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-6 rounded-2xl text-left transition-all duration-300
              preserve-3d perspective-1000
              ${isSelected 
                ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary shadow-glow' 
                : 'glass-inner-glow hover:bg-white/10'
              }
            `}
          >
            {/* Glow effect for selected */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layoutId="skill-glow"
              />
            )}

            <div className="relative z-10">
              <div className="text-4xl mb-3">{skill.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{skill.label}</h3>
              <p className="text-sm text-muted-foreground">{skill.description}</p>
            </div>

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

            {/* 3D floating orb */}
            <motion.div
              className={`absolute -z-10 w-20 h-20 rounded-full bg-gradient-to-br ${skill.color} opacity-20 blur-2xl`}
              animate={{
                y: [0, -10, 0],
                x: [0, 5, 0],
              }}
              transition={{
                duration: 4 + index * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ top: '20%', right: '10%' }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
