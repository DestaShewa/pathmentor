import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const skills = [
  { name: "Web Development", x: -30, y: -20, delay: 0 },
  { name: "UI/UX Design", x: 25, y: -35, delay: 0.1 },
  { name: "AI & ML", x: -40, y: 15, delay: 0.2 },
  { name: "Data Science", x: 35, y: 10, delay: 0.3 },
  { name: "Cloud Computing", x: -15, y: 40, delay: 0.4 },
  { name: "Mobile Apps", x: 30, y: 35, delay: 0.5 },
];

export const SkillBubbles = () => {
  const isMobile = useIsMobile();
  const multiplier = isMobile ? 1.5 : 2.5;

  return (
    <div className="relative w-full h-40 md:h-48 lg:h-56 flex items-center justify-center">
      {skills.map((skill, index) => (
        <motion.div
          key={skill.name}
          className="absolute skill-bubble cursor-pointer whitespace-nowrap"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: skill.x * multiplier,
            y: skill.y * 1.2,
          }}
          transition={{
            duration: 0.6,
            delay: skill.delay + 0.5,
            type: "spring",
            stiffness: 200,
          }}
          whileHover={{ scale: 1.15, zIndex: 10 }}
        >
          <motion.span
            className="text-foreground/90"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3 + index * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {skill.name}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};
