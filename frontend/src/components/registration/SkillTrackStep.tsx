import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, BookOpen, AlertCircle } from "lucide-react";
import axios from "axios";

// Fallback icon map for known categories
const CATEGORY_ICONS: Record<string, string> = {
  "Web Development":        "💻",
  "Full-Stack Coding":      "💻",
  "Full-Stack":             "💻",
  "UI/UX Design":           "🎨",
  "Design":                 "🎨",
  "Data Science":           "📊",
  "AI & Machine Learning":  "🤖",
  "Machine Learning":       "🤖",
  "Cybersecurity":          "🔐",
  "Mobile Development":     "📱",
  "Cloud & DevOps":         "☁️",
  "Video Editing":          "🎬",
  "Graphic Design":         "✏️",
  "General":                "📚",
};

const CATEGORY_COLORS: Record<string, string> = {
  "Web Development":        "from-blue-500 to-cyan-400",
  "Full-Stack Coding":      "from-blue-500 to-cyan-400",
  "Full-Stack":             "from-blue-500 to-cyan-400",
  "UI/UX Design":           "from-pink-500 to-rose-400",
  "Design":                 "from-pink-500 to-rose-400",
  "Data Science":           "from-teal-500 to-cyan-400",
  "AI & Machine Learning":  "from-purple-500 to-violet-400",
  "Machine Learning":       "from-purple-500 to-violet-400",
  "Cybersecurity":          "from-green-500 to-emerald-400",
  "Mobile Development":     "from-indigo-500 to-blue-400",
  "Cloud & DevOps":         "from-slate-500 to-gray-400",
  "Video Editing":          "from-red-500 to-orange-400",
  "Graphic Design":         "from-amber-500 to-yellow-400",
  "General":                "from-slate-500 to-slate-400",
};

interface Course {
  _id: string;
  title: string;
  category?: string;
}

interface SkillTrackStepProps {
  selected: string | null;
  onSelect: (courseTitle: string) => void;
}

export function SkillTrackStep({ selected, onSelect }: SkillTrackStepProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/courses");
        // API returns { success, data: Course[] }
        const data: Course[] = res.data?.data || res.data || [];
        setCourses(data);
      } catch (err: any) {
        setError("Could not load courses. Please try again.");
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading available tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">No courses available yet.</p>
        <p className="text-xs text-muted-foreground/60">
          Ask an admin to add courses to the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-2">
        Choose the course you want to enroll in
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course, index) => {
          const isSelected = selected === course.title;
          const category = course.category || "General";
          const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS[course.title] || "📚";
          const color = CATEGORY_COLORS[category] || CATEGORY_COLORS[course.title] || "from-slate-500 to-slate-400";

          return (
            <motion.button
              key={course._id}
              onClick={() => onSelect(course.title)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.04, y: -6, transition: { type: "spring", stiffness: 400 } }}
              whileTap={{ scale: 0.97 }}
              className={`
                relative p-6 rounded-2xl text-left transition-all duration-300
                ${isSelected
                  ? "bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary shadow-glow"
                  : "glass-inner-glow hover:bg-white/10 border border-white/10"
                }
              `}
            >
              {/* Glow for selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              <div className="relative z-10">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-semibold text-base mb-1 leading-tight">{course.title}</h3>
                {category && category !== "General" && (
                  <p className="text-xs text-muted-foreground">{category}</p>
                )}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </motion.div>
              )}

              {/* Floating orb */}
              <motion.div
                className={`absolute -z-10 w-16 h-16 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl`}
                animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
                transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: "20%", right: "10%" }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
