import { useEffect, useState, useRef } from "react";
import { chatSocket } from "@/services/chatSocket";

export const useChatSocket = () => {
  const [isConnected, setIsConnected] = useState(chatSocket.isConnected());
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef(chatSocket.getSocket());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      return;
    }

    let cancelled = false;

    chatSocket
      .connect(token)
      .then((socket) => {
        if (cancelled) return;
        socketRef.current = socket;
        setIsConnected(true);
        setError(null);

        // Track connection state changes for reconnections
        const handleConnect = () => {
          console.log("🔄 useChatSocket: socket reconnected");
          if (!cancelled) setIsConnected(true);
        };
        const handleDisconnect = () => {
          console.log("🔌 useChatSocket: socket disconnected");
          if (!cancelled) setIsConnected(false);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        // Cleanup these specific listeners
        return () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
        };
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setIsConnected(false);
      });

    return () => {
      cancelled = true;
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);

  return { isConnected, error, socket: chatSocket };
};
