import { useMessages } from "@/hooks/useMessages";
import { MessageInput } from "./MessageInput";
import { MessageList } from "./MessageList";
import { Loader2, MessageSquare, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatWindowProps {
  conversation: any;
  currentUserId: string;
}

export const ChatWindow = ({ conversation, currentUserId }: ChatWindowProps) => {
  const { messages, loading, typing, sendMessage, handleTyping, messagesEndRef } = useMessages(
    conversation?._id
  );

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-white/[0.02] border border-white/10 rounded-2xl">
        <div className="text-center">
          <MessageSquare size={64} className="mx-auto mb-4 opacity-30 text-primary" />
          <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
          <p className="text-sm text-slate-400">
            Choose a conversation from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "Last seen recently";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Last seen just now";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]"
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-lg font-bold text-black">
            {conversation.participant?.name[0]?.toUpperCase() || "?"}
          </div>
          {conversation.participant?.isOnline && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">
            {conversation.participant?.name || "Unknown User"}
          </p>
          <div className="flex items-center gap-1.5 text-xs">
            {conversation.participant?.isOnline ? (
              <>
                <Circle size={8} className="fill-green-500 text-green-500" />
                <span className="text-green-400">Online</span>
              </>
            ) : (
              <span className="text-slate-400">
                {formatLastSeen(conversation.participant?.lastSeen)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <MessageList messages={messages} currentUserId={currentUserId} />
          <div ref={messagesEndRef} />
        </>
      )}

      {/* Typing indicator */}
      {typing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="px-6 py-2 text-sm text-primary italic"
        >
          {typing.join(", ")} {typing.length === 1 ? "is" : "are"} typing
          <span className="inline-flex ml-1">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
          </span>
        </motion.div>
      )}

      {/* Input */}
      <MessageInput onSend={sendMessage} onTyping={handleTyping} disabled={false} />
    </div>
  );
};
