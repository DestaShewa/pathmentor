import api from "./api";

export const getMessages = async (roomId: string) => {
  const res = await api.get(`/messages/room/${roomId}`);
  return res.data.messages;
};

export const sendMessage = async (payload: { roomId: string; message: string }) => {
  const res = await api.post(`/messages`, payload);
  return res.data.message;
};

export default { getMessages, sendMessage };
