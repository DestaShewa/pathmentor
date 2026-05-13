import { useState, useEffect, useCallback, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { MessageSquare, Loader2, Trash2 } from "lucide-react";
import { chatSocket } from "@/services/chatSocket";
import { useChatSocket } from "@/hooks/useChatSocket";
import { initSocket } from "@/services/socket";
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
  tempId?: string;
  isOptimistic?: boolean;
}

interface ChatRoomProps {
  /** Modern: pass a real Conversation ObjectId for full conversation-based messaging */
  conversationId?: string;
  /** Legacy fallback: room ID string (used by StudyRooms, deprecated for StudyBuddies) */
  roomId?: string;
  roomName: string;
  currentUserId: string;
  currentUserName: string;
  showDeleteButton?: boolean;
  onConversationDeleted?: () => void;
}

export const ChatRoom = ({
  conversationId,
  roomId,
  roomName,
  currentUserId,
  currentUserName,
  showDeleteButton = false,
  onConversationDeleted,
}: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to modern socket
  const { isConnected } = useChatSocket();

  // Determine mode: modern (conversationId) or legacy (roomId)
  const useModernApi = !!conversationId;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch existing messages
  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      let res;
      if (useModernApi) {
        res = await api.get(`/conversations/${conversationId}/messages`);
      } else if (roomId) {
        res = await api.get(`/messages/room/${roomId}`);
      } else {
        setLoading(false);
        return;
      }
      
      const fetchedMessages = res.data.messages || [];
      
      setMessages((prev) => {
        // Only scroll to bottom if there are new messages or it's the first load
        if (isInitial || prev.length !== fetchedMessages.length) {
          setTimeout(scrollToBottom, 100);
        }
        return fetchedMessages;
      });
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, roomId, useModernApi, scrollToBottom]);

  // Fetch messages on mount and when conversation changes
  useEffect(() => {
    if (!conversationId && !roomId) return;
    fetchMessages(true);
    
    // Polling fallback: fetch messages every 5 seconds to guarantee delivery
    const intervalId = setInterval(() => {
      fetchMessages(false);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [conversationId, roomId, fetchMessages]);

  // Socket event setup — gated on isConnected so listeners attach after socket is ready
  useEffect(() => {
    if (useModernApi && conversationId && isConnected) {
      // Get the raw socket instance directly for reliable listener management
      const rawSocket = chatSocket.getSocket();
      if (!rawSocket) {
        console.warn("⚠️ ChatRoom: isConnected=true but no raw socket available");
        return;
      }

      console.log("📨 ChatRoom: joining conversation", conversationId, "socket:", rawSocket.id);

      // Join the conversation room on the server
      chatSocket.joinConversation(conversationId);
      chatSocket.markAsRead(conversationId);

      const handleNewMessage = (data: any) => {
        console.log("💬 ChatRoom: received new_message event", data.conversationId);
        if (data.conversationId === conversationId) {
          setMessages((prev) => {
            // Remove optimistic message if it matches
            const filtered = prev.filter((m) => !m.tempId || m.tempId !== data.tempId);
            // Prevent duplicates
            if (filtered.find((m) => m._id === data.message._id)) return filtered;
            return [...filtered, data.message];
          });
          chatSocket.markAsRead(conversationId);
          setTimeout(scrollToBottom, 100);
        }
      };

      // Re-join the room after reconnection (server loses room memberships on disconnect)
      const handleReconnect = () => {
        console.log("🔄 ChatRoom: socket reconnected, re-joining conversation", conversationId);
        chatSocket.joinConversation(conversationId);
        chatSocket.markAsRead(conversationId);
      };

      // Attach listeners directly on the raw socket for reliability
      rawSocket.on("new_message", handleNewMessage);
      rawSocket.on("connect", handleReconnect);

      return () => {
        console.log("📤 ChatRoom: leaving conversation", conversationId);
        chatSocket.leaveConversation(conversationId);
        rawSocket.off("new_message", handleNewMessage);
        rawSocket.off("connect", handleReconnect);
      };
    } else if (!useModernApi && roomId) {
      // Legacy: use the legacy socket for study rooms
      const socket = initSocket();

      if (!socket) {
        console.warn("Legacy socket service not available");
        return;
      }

      const handleConnect = () => {
        socket.emit("join", roomId);
      };

      const handleNewMessage = (newMsg: Message) => {
        setMessages((prev) => {
          if (prev.find((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
      };

      socket.on("connect", handleConnect);
      socket.on("newMessage", handleNewMessage);

      if (socket.connected) {
        handleConnect();
      }

      return () => {
        socket.emit("leave", roomId);
        socket.off("connect", handleConnect);
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [conversationId, roomId, useModernApi, isConnected, scrollToBottom]);

  // Send message with optional attachments
  const handleSendMessage = async (message: string, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    if (message.trim()) {
      const optimisticMessage: Message = {
        _id: tempId,
        tempId,
        message: message.trim(),
        sender: { _id: currentUserId, name: currentUserName, email: "" },
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setTimeout(scrollToBottom, 100);
    }

    try {
      if (useModernApi && conversationId) {
        // Modern: use conversation-based API for both text and attachments
        const formData = new FormData();
        if (message.trim()) {
          formData.append("message", message.trim());
        } else {
          formData.append("message", "Sent an attachment");
        }
        
        if (attachments && attachments.length > 0) {
          attachments.forEach((file) => formData.append("attachments", file));
        }

        const res = await api.post(`/conversations/${conversationId}/messages`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Replace optimistic message with real one
        const newMsg = res.data.message;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== tempId);
          if (filtered.find((m) => m._id === newMsg._id)) return filtered;
          return [...filtered, newMsg];
        });
      } else if (roomId) {
        // Legacy: use REST API
        const formData = new FormData();
        formData.append("roomId", roomId);
        if (message.trim()) {
          formData.append("message", message.trim());
        }
        if (attachments && attachments.length > 0) {
          attachments.forEach((file) => formData.append("attachments", file));
        }

        const res = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Replace optimistic message with real one
        const newMsg = res.data.message;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== tempId);
          if (filtered.find((m) => m._id === newMsg._id)) return filtered;
          return [...filtered, newMsg];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      alert("Failed to send message. Please try again.");
    }
  };

  // Delete entire conversation
  const handleDeleteConversation = async () => {
    if (!confirm("Are you sure you want to delete this entire conversation? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      if (useModernApi && conversationId) {
        await api.delete(`/conversations/${conversationId}`);
      } else if (roomId) {
        await api.delete(`/messages/room/${roomId}`);
      }
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
