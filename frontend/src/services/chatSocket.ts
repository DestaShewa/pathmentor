import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

class ChatSocketService {
  private socket: Socket | null = null;
  private connectPromise: Promise<Socket> | null = null;
  private isIntentionalDisconnect = false;

  /**
   * Connect to the socket server. Returns a promise that resolves when connected.
   * Safe to call multiple times — reuses existing connection/promise.
   */
  connect(token: string): Promise<Socket> {
    // If already connected, return immediately
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    // If a connection attempt is already in progress, return that promise
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.isIntentionalDisconnect = false;

    // Clean up any existing disconnected socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectPromise = new Promise<Socket>((resolve, reject) => {
      console.log("🔌 ChatSocket: connecting to", SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      const onConnect = () => {
        console.log("✅ ChatSocket: connected, id =", this.socket?.id);
        this.connectPromise = null;
        resolve(this.socket!);
      };

      const onConnectError = (error: Error) => {
        console.error("❌ ChatSocket: connection error:", error.message);
        // Don't reject yet — let Socket.IO retry via reconnection
      };

      this.socket.on("connect", onConnect);
      this.socket.on("connect_error", onConnectError);

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 ChatSocket: disconnected:", reason);
        if (!this.isIntentionalDisconnect && reason === "io server disconnect") {
          this.socket?.connect();
        }
      });

      this.socket.on("error", (error) => {
        console.error("ChatSocket error:", error);
      });

      // Timeout: if not connected within 15 seconds, reject
      setTimeout(() => {
        if (!this.socket?.connected) {
          this.connectPromise = null;
          reject(new Error("Socket connection timeout"));
        }
      }, 15000);
    });

    return this.connectPromise;
  }

  disconnect() {
    if (this.socket) {
      this.isIntentionalDisconnect = true;
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connectPromise = null;
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
    if (this.socket?.connected) {
      this.socket.emit("join_conversation", { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit("leave_conversation", { conversationId });
    }
  }

  sendMessage(data: {
    conversationId: string;
    message: string;
    messageType?: string;
    tempId?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit("send_message", data);
    }
  }

  startTyping(conversationId: string) {
    this.socket?.emit("typing_start", { conversationId });
  }

  stopTyping(conversationId: string) {
    this.socket?.emit("typing_stop", { conversationId });
  }

  markAsRead(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit("mark_as_read", { conversationId });
    }
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
