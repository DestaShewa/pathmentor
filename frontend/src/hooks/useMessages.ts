import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/services/api";
import { chatSocket } from "@/services/chatSocket";

interface Message {
  _id: string;
  message: string;
  sender: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  messageType?: string;
  attachments?: any[];
  createdAt: string;
  isOptimistic?: boolean;
  tempId?: string;
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data.messages || []);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setTyping([]);
      return;
    }

    fetchMessages();
    chatSocket.joinConversation(conversationId);
    chatSocket.markAsRead(conversationId);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => {
          // Remove optimistic message if it exists
          const filtered = prev.filter((m) => m.tempId !== data.tempId);
          // Add real message
          return [...filtered, data.message];
        });
        chatSocket.markAsRead(conversationId);
        setTimeout(scrollToBottom, 100);
      }
    };

    // Listen for typing
    const handleTypingStart = (data: any) => {
      if (data.conversationId === conversationId) {
        setTyping((prev) => {
          if (!prev.includes(data.userName)) {
            return [...prev, data.userName];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (data: any) => {
      if (data.conversationId === conversationId) {
        setTyping((prev) => prev.filter((name) => name !== data.userName));
      }
    };

    // Listen for messages read
    const handleMessagesRead = (data: any) => {
      if (data.conversationId === conversationId) {
        // Update UI to show messages as read
        console.log("Messages read by:", data.userId);
      }
    };

    chatSocket.onNewMessage(handleNewMessage);
    chatSocket.onTypingStart(handleTypingStart);
    chatSocket.onTypingStop(handleTypingStop);
    chatSocket.onMessagesRead(handleMessagesRead);

    return () => {
      chatSocket.leaveConversation(conversationId);
      chatSocket.offNewMessage(handleNewMessage);
      chatSocket.offTypingStart(handleTypingStart);
      chatSocket.offTypingStop(handleTypingStop);
      chatSocket.offMessagesRead(handleMessagesRead);
    };
  }, [conversationId, fetchMessages, scrollToBottom]);

  const sendMessage = useCallback(
    (message: string, attachments?: File[]) => {
      if (!conversationId || (!message.trim() && (!attachments || attachments.length === 0))) {
        return;
      }

      const tempId = `temp-${Date.now()}`;

      // Optimistic update for text messages
      if (message.trim()) {
        const optimisticMessage: Message = {
          _id: tempId,
          tempId,
          message: message.trim(),
          sender: { _id: "current", name: "You" },
          createdAt: new Date().toISOString(),
          isOptimistic: true,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(scrollToBottom, 100);
      }

      // If there are attachments, use REST API
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append("message", message.trim() || "Sent an attachment");
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });

        api
          .post(`/conversations/${conversationId}/messages`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(() => {
            // Message will be received via socket
          })
          .catch((err) => {
            console.error("Failed to send message with attachments:", err);
            // Remove optimistic message
            setMessages((prev) => prev.filter((m) => m.tempId !== tempId));
          });
      } else {
        // Send text message via socket
        chatSocket.sendMessage({
          conversationId,
          message: message.trim(),
          tempId,
        });
      }

      // Stop typing
      chatSocket.stopTyping(conversationId);
    },
    [conversationId, scrollToBottom]
  );

  const handleTyping = useCallback(() => {
    if (!conversationId) return;

    chatSocket.startTyping(conversationId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      chatSocket.stopTyping(conversationId);
    }, 2000);
  }, [conversationId]);

  return {
    messages,
    loading,
    typing,
    error,
    sendMessage,
    handleTyping,
    messagesEndRef,
  };
};
