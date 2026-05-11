import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PersonalGoalStepProps {
  value: string;
  onChange: (value: string) => void;
}

export function PersonalGoalStep({ value, onChange }: PersonalGoalStepProps) {
  const [isFocused, setIsFocused] = useState(false);
  const maxLength = 150;

  const placeholders = [
    "I want to build my own startup app...",
    "I want to land a job at a tech company...",
    "I want to create beautiful designs...",
    "I want to understand AI and use it in my projects...",
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder(prev => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Decorative elements */}
        <motion.div
          className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-primary/20 blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-secondary/20 blur-2xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        {/* Input container */}
        <motion.div
          className={`
            relative glass-inner-glow rounded-2xl p-6 transition-all duration-300
            ${isFocused ? 'ring-2 ring-primary shadow-glow' : ''}
          `}
          animate={{
            borderColor: isFocused ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ✨
            </motion.span>
            <p className="text-muted-foreground text-sm">
              Tell us your learning goal in one sentence (optional)
            </p>
          </div>

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholders[currentPlaceholder]}
            maxLength={maxLength}
            className="
              w-full h-32 bg-transparent border-none outline-none resize-none
              text-lg text-foreground placeholder:text-muted-foreground/50
              scrollbar-glass
            "
          />

          {/* Character counter */}
          <div className="flex justify-between items-center mt-4">
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              This helps us personalize your experience
            </motion.p>
            <span className={`text-sm ${value.length > maxLength * 0.8 ? 'text-accent' : 'text-muted-foreground'}`}>
              {value.length}/{maxLength}
            </span>
          </div>
        </motion.div>

        {/* Suggestion chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {['🎯 Career change', '🚀 Side project', '📚 Continuous learning', '💡 Curiosity'].map((chip, index) => (
            <motion.button
              key={chip}
              onClick={() => onChange(value + (value ? ' ' : '') + chip.substring(2))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="skill-bubble text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              {chip}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
