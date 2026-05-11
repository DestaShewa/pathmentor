import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface Reminder {
  type: "streak_risk" | "inactive" | "daily_nudge";
  message: string;
  urgency: "high" | "medium" | "low";
}

export const SmartReminder = () => {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const res = await api.get("/progress/reminder");
        if (res.data.reminder) {
          setReminder(res.data.reminder);
        }
      } catch (err) {
        console.error("Failed to fetch reminder:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReminder();
  }, []);

  if (loading || !reminder || dismissed) return null;

  const getStyles = () => {
    if (reminder.urgency === "high") {
      return {
        bg: "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40",
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        iconBg: "bg-red-500/20"
      };
    }
    if (reminder.urgency === "medium") {
      return {
        bg: "bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500/40",
        icon: <Bell className="w-5 h-5 text-orange-400" />,
        iconBg: "bg-orange-500/20"
      };
    }
    return {
      bg: "bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/40",
      icon: <Bell className="w-5 h-5 text-primary" />,
      iconBg: "bg-primary/20"
    };
  };

  const styles = getStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className={`glass-premium p-4 rounded-2xl border ${styles.bg} relative overflow-hidden`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">{reminder.message}</p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
              aria-label="Dismiss reminder"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
