import { useState, useEffect, useCallback } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { MessageSquare, Users, Loader2 } from "lucide-react";
import { initSocket, getSocket } from "@/services/socket";
import api from "@/services/api";

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

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  currentUserId: string;
  currentUserName: string;
}

export const ChatRoom = ({ roomId, roomName, currentUserId, currentUserName }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/messages/room/${roomId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Initialize socket and join room
  useEffect(() => {
    const socket = initSocket();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", roomId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Listen for new messages
    socket.on("newMessage", (newMsg: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    });

    // Fetch existing messages
    fetchMessages();

    // Cleanup
    return () => {
      socket.emit("leave", roomId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("newMessage");
    };
  }, [roomId, fetchMessages]);

  // Send message
  const handleSendMessage = async (message: string) => {
    const socket = getSocket();
    if (!socket || !connected) {
      console.error("Socket not connected");
      return;
    }

    try {
      // Send via socket for real-time delivery
      socket.emit("sendMessage", {
        roomId,
        message,
        sender: currentUserId,
      });

      // Also send via REST API as backup
      await api.post("/messages", {
        roomId,
        message,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <GlassCard className="flex flex-col h-[500px] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold">{roomName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
              <span>{connected ? "Connected" : "Disconnected"}</span>
            </div>
          </div>
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={16} />
          <span>{onlineCount} online</span>
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <MessageList messages={messages} currentUserId={currentUserId} />
      )}

      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={!connected} />
    </GlassCard>
  );
};
