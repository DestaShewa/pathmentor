import { motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

interface LessonFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  experienceLevels: string[];
  selectedLevel: string | null;
  onLevelChange: (level: string | null) => void;
}

export const LessonFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  experienceLevels,
  selectedLevel,
  onLevelChange,
}: LessonFiltersProps) => {
  const hasFilters = selectedCategory || selectedLevel;

  return (
    <GlassCard className="p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Divider */}
        {categories.length > 0 && experienceLevels.length > 0 && (
          <div className="h-6 w-px bg-white/10" />
        )}

        {/* Level filters */}
        <div className="flex flex-wrap gap-2">
          {experienceLevels.map((level) => (
            <motion.button
              key={level}
              onClick={() => onLevelChange(selectedLevel === level ? null : level)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                selectedLevel === level
                  ? "bg-accent text-accent-foreground"
                  : "bg-white/10 text-muted-foreground hover:bg-white/20 hover:text-foreground"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {level}
            </motion.button>
          ))}
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => {
              onCategoryChange(null);
              onLevelChange(null);
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </GlassButton>
        )}
      </div>
    </GlassCard>
  );
};
