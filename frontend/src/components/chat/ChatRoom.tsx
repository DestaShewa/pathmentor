import { useState, useEffect, useCallback, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
import { initSocket, getSocket } from "@/services/socket";
import api from "@/services/api";

interface Attachment {
  type: "document" | "image" | "audio" | "video";
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  message: string;
  messageType?: string;
  attachments?: Attachment[];
  isEdited?: boolean;
  createdAt: string;
}

interface ChatRoomProps {
  roomId: string;
  roomName: string;
  currentUserId: string;
  currentUserName: string;
  showDeleteButton?: boolean;
  onConversationDeleted?: () => void;
}

export const ChatRoom = ({ roomId, roomName, currentUserId, currentUserName, showDeleteButton = false, onConversationDeleted }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const socketRef = useRef<any>(null);

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
    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join", roomId);
    };

    const handleDisconnect = () => {
      setConnected(true); // Keep showing as connected for better UX
    };

    const handleNewMessage = (newMsg: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("newMessage", handleNewMessage);

    // Initial connection check
    if (socket.connected) {
      handleConnect();
    }

    // Fetch existing messages
    fetchMessages();

    // Cleanup
    return () => {
      socket.emit("leave", roomId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("newMessage", handleNewMessage);
    };
  }, [roomId, fetchMessages]);

  // Send message with optional attachments
  const handleSendMessage = async (message: string, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("roomId", roomId);
      if (message.trim()) {
        formData.append("message", message.trim());
      }
      
      // Append attachments if any
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      // Send via REST API with multipart/form-data
      const res = await api.post("/messages", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Optimistically add message to UI
      const newMsg = res.data.message;
      setMessages((prev) => {
        if (prev.find((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      // Also emit via socket for real-time delivery to others
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit("sendMessage", {
          roomId,
          message: newMsg,
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  // Delete entire conversation (admin only)
  const handleDeleteConversation = async () => {
    if (!confirm("Are you sure you want to delete this entire conversation? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/messages/room/${roomId}`);
      setMessages([]);
      alert("Conversation deleted successfully");
      if (onConversationDeleted) {
        onConversationDeleted();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      alert("Failed to delete conversation. Please try again.");
    } finally {
      setDeleting(false);
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
            <p className="text-xs text-muted-foreground">Active conversation</p>
          </div>
        </div>
        {showDeleteButton && (
          <button
            onClick={handleDeleteConversation}
            disabled={deleting}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete conversation"
          >
            {deleting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        )}
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
      <MessageInput onSend={handleSendMessage} disabled={false} />
    </GlassCard>
  );
};
