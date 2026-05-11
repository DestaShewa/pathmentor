import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PersonaType, PERSONAS } from "@/lib/registrationTypes";

interface WelcomeSectionProps {
  userName: string;
  personaType?: PersonaType;
}

export const WelcomeSection = ({ userName, personaType }: WelcomeSectionProps) => {
  const persona = personaType ? PERSONAS[personaType] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="flex items-start gap-4">
        {/* Floating AI Avatar */}
        <motion.div
          className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-teal items-center justify-center float"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Sparkles className="w-8 h-8 text-teal-foreground" />
        </motion.div>

        <div className="flex-1">
          <motion.h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back,{" "}
            <span className="text-gradient">{userName}</span> 👋
          </motion.h1>

          {persona ? (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-muted-foreground">
                You're learning like a
              </span>
              <motion.div
                className="persona-badge flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-lg">{persona.emoji}</span>
                <span className="font-semibold">{persona.name}</span>
              </motion.div>
              <span className="text-muted-foreground">today.</span>
            </motion.div>
          ) : (
            <motion.p
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Ready to start your personalized learning journey?
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
