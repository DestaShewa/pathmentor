import { useEffect, useState } from "react";
import { chatSocket } from "@/services/chatSocket";

export const useChatSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token found");
      return;
    }

    chatSocket
      .connect(token)
      .then(() => {
        setIsConnected(true);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // chatSocket.disconnect();
    };
  }, []);

  return { isConnected, error, socket: chatSocket };
};
