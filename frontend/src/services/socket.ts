import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

export const initSocket = () => {
  const token = localStorage.getItem("token");

  // If we already have a socket, ensure it is using the correct active token
  if (socket) {
    if (currentToken === token) return socket;
    socket.disconnect();
    socket = null;
  }

  if (!token) return null;

  currentToken = token;

  // Extract userId from token
  let userId = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    userId = payload._id || payload.id;
  } catch (e) {
    console.error("Failed to decode token:", e);
  }

  socket = io("http://localhost:5001", {
    transports: ["websocket"],
    auth: { token, userId },
    reconnection: true,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};

export default { initSocket, getSocket, disconnectSocket };
