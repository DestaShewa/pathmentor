import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = () => {
  if (socket) return socket;
  const token = localStorage.getItem("token");
  
  // Extract userId from token (simple decode, not verification)
  let userId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload._id || payload.id;
    } catch (e) {
      console.error("Failed to decode token:", e);
    }
  }
  
  socket = io("http://localhost:5001", {
    transports: ["websocket"],
    auth: { token, userId },
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { initSocket, getSocket, disconnectSocket };
