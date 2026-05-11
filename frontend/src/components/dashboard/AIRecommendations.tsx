import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Clock, Star } from "lucide-react";
import { useRef } from "react";

interface Recommendation {
  id: string;
  title: string;
  category: string;
  duration: string;
  matchScore: number;
  reason: string;
  type: "lesson" | "project";
}

interface AIRecommendationsProps {
  recommendations: Recommendation[];
  learningGoal?: string;
  learningStyle?: string;
}

export const AIRecommendations = ({
  recommendations,
  learningGoal,
  learningStyle,
}: AIRecommendationsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultRecommendations: Recommendation[] = [
    {
      id: "1",
      title: "Build a REST API with Node.js",
      category: "Backend Development",
      duration: "45 min",
      matchScore: 0.95,
      reason: "Based on your goal: Build a project",
      type: "project",
    },
    {
      id: "2",
      title: "React State Management Deep Dive",
      category: "Frontend",
      duration: "30 min",
      matchScore: 0.89,
      reason: "Matched to your learning style",
      type: "lesson",
    },
    {
      id: "3",
      title: "Database Design Fundamentals",
      category: "Data Engineering",
      duration: "35 min",
      matchScore: 0.87,
      reason: "Recommended for your track",
      type: "lesson",
    },
    {
      id: "4",
      title: "Authentication System Project",
      category: "Security",
      duration: "60 min",
      matchScore: 0.82,
      reason: "Popular in your skill area",
      type: "project",
    },
  ];

  const items = recommendations.length > 0 ? recommendations : defaultRecommendations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">AI Recommendations</h3>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-premium min-w-[280px] md:min-w-[320px] p-5 rounded-2xl snap-start cursor-pointer group relative overflow-hidden"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />

            {/* Type badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-medium capitalize">
                {item.type}
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">
                  {Math.round(item.matchScore * 100)}%
                </span>
              </div>
            </div>

            {/* Content */}
            <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-3">{item.category}</p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {item.duration}
              </div>
              <span className="text-xs text-primary/80 max-w-[150px] truncate">
                {item.reason}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
