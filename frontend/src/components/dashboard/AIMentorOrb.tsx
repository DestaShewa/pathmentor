import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AIMentorOrbProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AIMentorOrb = ({ isOpen: controlledOpen, onToggle }: AIMentorOrbProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [message, setMessage] = useState("");
  
  const isOpen = controlledOpen ?? internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen(!internalOpen));

  const quickActions = [
    { label: "Get a summary", icon: Sparkles },
    { label: "Ask a question", icon: MessageCircle },
    { label: "Get motivation", icon: Bot },
  ];

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={handleToggle}
        className={cn(
          "fixed z-50 w-14 h-14 rounded-2xl flex items-center justify-center",
          "bg-gradient-teal shadow-3d",
          "bottom-24 right-4 lg:bottom-8 lg:right-8"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 0 20px hsl(175, 80%, 50%, 0.4)",
            "0 0 40px hsl(175, 80%, 50%, 0.6)",
            "0 0 20px hsl(175, 80%, 50%, 0.4)",
          ],
        }}
        transition={{
          boxShadow: { duration: 2, repeat: Infinity },
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-teal-foreground" />
          ) : (
            <Bot className="w-6 h-6 text-teal-foreground" />
          )}
        </motion.div>
      </motion.button>

      {/* Mini Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed z-40 w-80 max-w-[calc(100vw-2rem)]",
              "bottom-40 right-4 lg:bottom-24 lg:right-8",
              "glass-premium rounded-3xl overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center">
                  <Bot className="w-5 h-5 text-teal-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold">AI Mentor</h4>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-2">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm">{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 pt-0">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                >
                  <Send className="w-4 h-4 text-primary-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
