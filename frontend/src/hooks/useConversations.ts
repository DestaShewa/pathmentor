import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";
import { chatSocket } from "@/services/chatSocket";

interface Participant {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface LastMessage {
  _id: string;
  message: string;
  sender: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Conversation {
  _id: string;
  participant: Participant;
  lastMessage?: LastMessage;
  lastMessageAt?: string;
  unreadCount: number;
  isTyping: boolean;
  type: string;
  createdAt: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/conversations");
      setConversations(res.data.conversations || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch conversations:", err);
      setError(err.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Listen for conversation updates
    const handleConversationUpdate = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId
            ? {
                ...conv,
                lastMessage: data.lastMessage,
                lastMessageAt: data.lastMessageAt,
                unreadCount: data.unreadCount !== undefined ? data.unreadCount : conv.unreadCount,
              }
            : conv
        )
      );
    };

    // Listen for user online/offline status
    const handleUserOnline = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participant._id === data.userId
            ? { ...conv, participant: { ...conv.participant, isOnline: true } }
            : conv
        )
      );
    };

    const handleUserOffline = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participant._id === data.userId
            ? {
                ...conv,
                participant: {
                  ...conv.participant,
                  isOnline: false,
                  lastSeen: data.lastSeen,
                },
              }
            : conv
        )
      );
    };

    // Listen for typing indicators
    const handleTypingStart = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId ? { ...conv, isTyping: true } : conv
        )
      );
    };

    const handleTypingStop = (data: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === data.conversationId ? { ...conv, isTyping: false } : conv
        )
      );
    };

    chatSocket.onConversationUpdated(handleConversationUpdate);
    chatSocket.onUserOnline(handleUserOnline);
    chatSocket.onUserOffline(handleUserOffline);
    chatSocket.onTypingStart(handleTypingStart);
    chatSocket.onTypingStop(handleTypingStop);

    return () => {
      chatSocket.offConversationUpdated(handleConversationUpdate);
      chatSocket.offUserOnline(handleUserOnline);
      chatSocket.offUserOffline(handleUserOffline);
      chatSocket.offTypingStart(handleTypingStart);
      chatSocket.offTypingStop(handleTypingStop);
    };
  }, [fetchConversations]);

  const createConversation = useCallback(async (otherUserId: string, type = "direct") => {
    try {
      const res = await api.post("/conversations", { otherUserId, type });
      await fetchConversations(); // Refresh list
      return res.data.conversation;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Failed to create conversation");
    }
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    createConversation,
  };
};
