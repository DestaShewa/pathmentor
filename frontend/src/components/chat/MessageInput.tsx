import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/10">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <GlassButton
          variant="primary"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="px-4"
        >
          <Send size={18} />
        </GlassButton>
      </div>
    </div>
  );
};
