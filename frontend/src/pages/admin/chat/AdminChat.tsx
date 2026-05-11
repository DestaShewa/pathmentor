import React, { useEffect, useRef, useState } from "react";
import { Send, User } from "lucide-react";
import chatApi from "../../../services/chatApi";
import { initSocket, getSocket } from "../../../services/socket";

type Props = {
  roomId?: string;
};

// Simple admin chat viewer for a specific roomId (e.g., assignment-room-123)
const AdminChat: React.FC<Props> = ({ roomId = "admin-room" }) => {
  const [messages, setMessages] = useState<Array<any>>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    try {
      const msgs = await chatApi.getMessages(roomId);
      setMessages(msgs || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      // ignore fetch errors silently
    }
  };

  useEffect(() => {
    fetchMessages();

    // init socket and join room
    const socket = initSocket();
    socket.emit("join", roomId);
    socket.on("newMessage", (msg: any) => {
      setMessages((m) => [...m, msg]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });

    // fallback polling in case sockets fail
    timerRef.current = window.setInterval(fetchMessages, 8000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      socket.emit("leave", roomId);
      socket.off("newMessage");
    };
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const socket = getSocket();
      const payload = { roomId, message: text.trim() };
      // send via socket; server will persist and broadcast
      if (socket && socket.connected) {
        socket.emit("sendMessage", payload);
      } else {
        // fallback to HTTP
        const sent = await chatApi.sendMessage(payload);
        setMessages((m) => [...m, sent]);
      }
      setText("");
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error("send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Admin Chat</h2>
        <p className="text-sm text-muted-foreground">Monitor and participate in chats for admins and mentors.</p>
      </div>

      <div className="flex h-[60vh] max-h-[700px] flex-col gap-4 rounded-2xl border border-white/10 bg-card p-4">
        <div className="flex-1 overflow-auto px-2">
          <div className="space-y-4">
            {messages.map((m: any, idx: number) => (
              <div key={m._id || idx} className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <User size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-sm">{m.sender?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 max-w-[80ch] break-words text-sm">{m.message}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm text-white focus:outline-none"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Send size={14} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
