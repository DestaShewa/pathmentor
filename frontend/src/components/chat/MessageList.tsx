import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User } from "lucide-react";

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  } | null;
  message: string;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, idx) => {
        const isOwn = msg.sender?._id === currentUserId;
        const showAvatar = idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id;

        return (
          <motion.div
            key={msg._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            {showAvatar ? (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isOwn ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
              }`}>
                {msg.sender ? (
                  <span className="text-xs font-bold">
                    {msg.sender.name[0]?.toUpperCase()}
                  </span>
                ) : (
                  <User size={14} />
                )}
              </div>
            ) : (
              <div className="w-8 shrink-0" />
            )}

            {/* Message bubble */}
            <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
              {showAvatar && msg.sender && (
                <span className={`text-xs text-muted-foreground mb-1 ${isOwn ? "text-right" : "text-left"}`}>
                  {isOwn ? "You" : msg.sender.name}
                </span>
              )}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-primary text-black rounded-br-sm"
                    : "bg-white/10 text-white rounded-bl-sm"
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </motion.div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
