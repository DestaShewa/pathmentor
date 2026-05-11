import { motion } from "framer-motion";

export const FloatingOrb = () => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-secondary/40"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.2, 0.4],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent orb-glow"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Inner shine */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />

        {/* Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <svg
            className="w-12 h-12 md:w-16 md:h-16 text-white/90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </motion.div>
      </motion.div>

      {/* Orbiting particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/60"
          style={{
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos((i * Math.PI * 2) / 6) * 80,
              Math.cos((i * Math.PI * 2) / 6 + Math.PI) * 80,
              Math.cos((i * Math.PI * 2) / 6) * 80,
            ],
            y: [
              Math.sin((i * Math.PI * 2) / 6) * 80,
              Math.sin((i * Math.PI * 2) / 6 + Math.PI) * 80,
              Math.sin((i * Math.PI * 2) / 6) * 80,
            ],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
