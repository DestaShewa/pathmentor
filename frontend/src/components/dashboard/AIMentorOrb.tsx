import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, MessageCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import aiService, { ChatMessage } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AIMentorOrbProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AIMentorOrb = ({ isOpen: controlledOpen, onToggle }: AIMentorOrbProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen(!internalOpen));

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = message) => {
    if (!text.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      const response = await aiService.chat(text, messages);
      const assistantMessage: ChatMessage = { role: "assistant", content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast({
        title: "AI Mentor Offline",
        description: "The AI service is currently unavailable. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (action === "Get a summary") {
      handleSend("Can you summarize my recent progress?");
    } else if (action === "Get motivation") {
      handleSend("Give me some motivation for my studies today!");
    } else {
      handleToggle();
    }
  };

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

            {/* Messages Area */}
            <div className="h-64 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-4">How can I help you today?</p>
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickAction(action.label)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      <action.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm",
                  msg.role === 'user'
                    ? "ml-auto bg-primary text-primary-foreground rounded-tr-none"
                    : "mr-auto bg-white/10 text-white rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              ))}

              {isTyping && (
                <div className="mr-auto bg-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 pt-0">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your question..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleSend()}
                  disabled={isTyping}
                  className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center disabled:opacity-50"
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
