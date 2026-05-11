import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: "lesson" | "quiz" | "project" | "review";
}

interface TodaysLearningPlanProps {
  commitmentTime: string;
  tasks: Task[];
  onToggleTask?: (id: string) => void;
}

const getTasksForCommitment = (commitment: string): Task[] => {
  const baseTasks: Task[] = [
    { id: "1", title: "Review yesterday's concepts", duration: "10 min", completed: false, type: "review" },
    { id: "2", title: "Complete lesson module", duration: "25 min", completed: false, type: "lesson" },
    { id: "3", title: "Practice quiz", duration: "15 min", completed: false, type: "quiz" },
  ];

  if (commitment.includes("1") || commitment.includes("hour")) {
    baseTasks.push({ id: "4", title: "Mini project exercise", duration: "20 min", completed: false, type: "project" });
  }
  if (commitment.includes("2") || commitment.includes("3")) {
    baseTasks.push(
      { id: "4", title: "Deep dive project", duration: "45 min", completed: false, type: "project" },
      { id: "5", title: "Advanced concepts", duration: "30 min", completed: false, type: "lesson" }
    );
  }
  if (commitment.includes("4+") || commitment.includes("plus")) {
    baseTasks.push(
      { id: "4", title: "Full project build", duration: "90 min", completed: false, type: "project" },
      { id: "5", title: "Advanced mastery", duration: "45 min", completed: false, type: "lesson" },
      { id: "6", title: "Code review & optimization", duration: "30 min", completed: false, type: "review" }
    );
  }

  return baseTasks;
};

export const TodaysLearningPlan = ({
  commitmentTime,
  tasks: propTasks,
  onToggleTask,
}: TodaysLearningPlanProps) => {
  const tasks = propTasks.length > 0 ? propTasks : getTasksForCommitment(commitmentTime);
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = (completedCount / tasks.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-premium p-6 rounded-3xl mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-1">Today's Learning Plan</h3>
          <p className="text-sm text-muted-foreground">
            Based on your {commitmentTime} commitment
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">{completedCount}</span>
          <span className="text-muted-foreground">/{tasks.length}</span>
          <p className="text-xs text-muted-foreground">Tasks done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-teal rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onToggleTask?.(task.id)}
              className={cn(
                "checklist-item cursor-pointer group",
                task.completed && "completed"
              )}
            >
              <motion.div
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                  task.completed
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-white/30 group-hover:border-primary/50"
                )}
                whileTap={{ scale: 0.9 }}
              >
                {task.completed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className="w-3 h-3 text-transparent group-hover:text-primary/30" />
                )}
              </motion.div>

              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium transition-all",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{task.duration}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground capitalize">
                    {task.type}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
