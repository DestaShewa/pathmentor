import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, MessageCircle, Trash2, Maximize2, Minimize2, PlusCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import aiService, { ChatMessage } from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";

interface AIMentorOrbProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AIMentorOrb = ({ isOpen: controlledOpen, onToggle }: AIMentorOrbProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [message, setMessage] = useState("");
  // --- Persistence ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("pathmentor_ai_chat");
    return saved ? JSON.parse(saved) : [];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const handleToggle = onToggle ?? (() => setInternalOpen(!internalOpen));

  // --- Persistence Effect ---
  useEffect(() => {
    localStorage.setItem("pathmentor_ai_chat", JSON.stringify(messages));
  }, [messages]);

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

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to delete all messages?")) {
      setMessages([]);
      localStorage.removeItem("pathmentor_ai_chat");
      toast({ title: "Chat Cleared", description: "Your history has been deleted." });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem("pathmentor_ai_chat");
    toast({ title: "New Session", description: "Ready for your next question!" });
  };

  const handleQuickAction = async (action: string) => {
    if (action === "Roadmap help") {
      handleSend("Can you help me create a learning roadmap for my goals?");
    } else if (action === "Explain concepts") {
      handleSend("Please explain the core concepts of my current lesson.");
    } else {
      handleSend("Give me some motivation for my studies today!");
    }
  };

  const quickActions = [
    { label: "Roadmap help", icon: Sparkles },
    { label: "Explain concepts", icon: MessageCircle },
    { label: "Get motivation", icon: Bot },
  ];

  return (
    <>
      {/* Floating Orb Button */}
      <motion.button
        onClick={handleToggle}
        className={cn(
          "fixed z-50 w-16 h-16 rounded-2xl flex items-center justify-center",
          "bg-gradient-teal shadow-3d border border-white/20 backdrop-blur-sm",
          "bottom-24 right-4 lg:bottom-8 lg:right-8"
        )}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          y: [0, -10, 0],
          boxShadow: [
            "0 10px 20px hsl(175, 80%, 50%, 0.3)",
            "0 20px 40px hsl(175, 80%, 50%, 0.5)",
            "0 10px 20px hsl(175, 80%, 50%, 0.3)",
          ],
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
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

      {/* Mini/Maxi Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              width: isMaximized ? "450px" : "320px",
              height: isMaximized ? "75vh" : "450px"
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed z-40 max-w-[calc(100vw-2rem)]",
              "bottom-40 right-4 lg:bottom-24 lg:right-8",
              "glass-premium rounded-3xl overflow-hidden flex flex-col border border-white/10"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-teal flex items-center justify-center">
                  <Bot className="w-5 h-5 text-teal-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">PathMentor AI</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Active System</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  title="New Session"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Minimize" : "Maximize"}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClearChat}
                  title="Clear History"
                  className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-muted-foreground mb-4 font-medium px-1">How can I help you today?</p>
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickAction(action.label)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left border border-white/5 group"
                    >
                      <action.icon className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">{action.label}</span>
                    </motion.button>
                  ))}
                  <div className="pt-8 text-center opacity-20 filter grayscale">
                    <Bot className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-[10px]">AI-POWERED EDUCATIONAL MENTOR</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => {
                const isAI = msg.role === 'assistant';
                const hasCode = msg.content.includes("```");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed",
                      !isAI
                        ? "ml-auto bg-primary text-primary-foreground rounded-tr-none shadow-md"
                        : cn(
                          "mr-auto bg-white/10 backdrop-blur-md text-white rounded-tl-none border border-white/10",
                          hasCode ? "border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-teal-500/20"
                        )
                    )}
                  >
                    {msg.content}
                  </motion.div>
                );
              })}

              {isTyping && (
                <div className="mr-auto bg-white/10 backdrop-blur-md p-3 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-1.5 w-max">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-teal-400"
                    />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/20">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-teal-500/50 transition-colors group">
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
                  className="w-10 h-10 rounded-lg bg-gradient-teal flex items-center justify-center disabled:opacity-50 shadow-lg"
                >
                  <Send className="w-5 h-5 text-teal-foreground" />
                </motion.button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 opacity-50">
                PathMentor AI can make mistakes. Verify important info.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
