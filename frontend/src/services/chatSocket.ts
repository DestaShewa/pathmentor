import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

class ChatSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionalDisconnect = false;

  connect(token: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.isIntentionalDisconnect = false;

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error("Failed to connect after multiple attempts"));
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        
        if (!this.isIntentionalDisconnect && reason === "io server disconnect") {
          // Server disconnected, try to reconnect
          this.socket?.connect();
        }
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.isIntentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected intentionally");
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // ========== CONVERSATION EVENTS ==========
  
  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", { conversationId });
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", { conversationId });
  }

  sendMessage(data: {
    conversationId: string;
    message: string;
    messageType?: string;
    tempId?: string;
  }) {
    this.socket?.emit("send_message", data);
  }

  startTyping(conversationId: string) {
    this.socket?.emit("typing_start", { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit("typing_stop", { conversationId });
  }

  markAsRead(conversationId: string) {
    this.socket?.emit("mark_as_read", { conversationId });
  }

  // ========== EVENT LISTENERS ==========
  
  onNewMessage(callback: (data: any) => void) {
    this.socket?.on("new_message", callback);
  }

  onConversationUpdated(callback: (data: any) => void) {
    this.socket?.on("conversation_updated", callback);
  }

  onTypingStart(callback: (data: any) => void) {
    this.socket?.on("typing_start", callback);
  }

  onTypingStop(callback: (data: any) => void) {
    this.socket?.on("typing_stop", callback);
  }

  onMessagesRead(callback: (data: any) => void) {
    this.socket?.on("messages_read", callback);
  }

  onMessagesDelivered(callback: (data: any) => void) {
    this.socket?.on("messages_delivered", callback);
  }

  onUserOnline(callback: (data: any) => void) {
    this.socket?.on("user_online", callback);
  }

  onUserOffline(callback: (data: any) => void) {
    this.socket?.on("user_offline", callback);
  }

  onNewMessageNotification(callback: (data: any) => void) {
    this.socket?.on("new_message_notification", callback);
  }

  // ========== REMOVE LISTENERS ==========
  
  offNewMessage(callback?: (data: any) => void) {
    this.socket?.off("new_message", callback);
  }

  offConversationUpdated(callback?: (data: any) => void) {
    this.socket?.off("conversation_updated", callback);
  }

  offTypingStart(callback?: (data: any) => void) {
    this.socket?.off("typing_start", callback);
  }

  offTypingStop(callback?: (data: any) => void) {
    this.socket?.off("typing_stop", callback);
  }

  offMessagesRead(callback?: (data: any) => void) {
    this.socket?.off("messages_read", callback);
  }

  offMessagesDelivered(callback?: (data: any) => void) {
    this.socket?.off("messages_delivered", callback);
  }

  offUserOnline(callback?: (data: any) => void) {
    this.socket?.off("user_online", callback);
  }

  offUserOffline(callback?: (data: any) => void) {
    this.socket?.off("user_offline", callback);
  }

  offNewMessageNotification(callback?: (data: any) => void) {
    this.socket?.off("new_message_notification", callback);
  }
}

export const chatSocket = new ChatSocketService();
