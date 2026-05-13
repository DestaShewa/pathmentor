import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, File, Download, Play, Pause, Image as ImageIcon, FileText, Music } from "lucide-react";

interface Attachment {
  type: "document" | "image" | "audio" | "video";
  url: string;
  filename?: string;
  size?: number;
  mimeType?: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  message: string;
  messageType?: string;
  attachments?: Attachment[];
  isEdited?: boolean;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const AttachmentPreview = ({ attachment }: { attachment: Attachment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getFileIcon = () => {
    switch (attachment.type) {
      case "image":
        return <ImageIcon size={16} />;
      case "audio":
        return <Music size={16} />;
      case "document":
        return <FileText size={16} />;
      default:
        return <File size={16} />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Image attachment
  if (attachment.type === "image") {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-xs">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.filename || "Image"}
            className="w-full h-auto hover:opacity-90 transition-opacity cursor-pointer"
            loading="lazy"
          />
        </a>
      </div>
    );
  }

  // Audio attachment
  if (attachment.type === "audio") {
    return (
      <div className="mt-2 flex items-center gap-3 bg-white/5 rounded-xl p-3 min-w-[250px]">
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors shrink-0"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{attachment.filename || "Voice message"}</p>
          <audio
            ref={audioRef}
            src={attachment.url}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="w-full mt-1"
            controls
            style={{ height: "32px" }}
          />
        </div>
      </div>
    );
  }

  // Video attachment
  if (attachment.type === "video") {
    return (
      <div className="mt-2 rounded-xl overflow-hidden max-w-sm">
        <video
          src={attachment.url}
          controls
          className="w-full h-auto"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  // Document attachment
  return (
    <div className="mt-2 flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.filename || "Document"}</p>
        <p className="text-[10px] text-slate-500">{formatFileSize(attachment.size)}</p>
      </div>
      <a
        href={attachment.url}
        download={attachment.filename}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        title="Download"
      >
        <Download size={16} />
      </a>
    </div>
  );
};

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isOwn = msg.sender?._id === currentUserId;
          const showAvatar = idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id;
          const hasAttachments = msg.attachments && msg.attachments.length > 0;

          return (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              {showAvatar ? (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOwn ? "bg-primary/20 text-primary" : "bg-white/10 text-white"
                    }`}
                >
                  {msg.sender ? (
                    <span className="text-xs font-bold">
                      {msg.sender.name[0]?.toUpperCase()}
                    </span>
                  ) : (
                    <User size={14} />
                  )}
                </div>
              ) : (
                <div className="w-8 shrink-0" />
              )}

              {/* Message bubble */}
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {showAvatar && msg.sender && (
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="text-xs text-muted-foreground">
                      {isOwn ? "You" : msg.sender.name}
                    </span>
                    {msg.sender.role && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${msg.sender.role === "admin"
                            ? "bg-red-500/20 text-red-400"
                            : msg.sender.role === "mentor"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                      >
                        {msg.sender.role}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`rounded-2xl ${isOwn
                      ? "bg-primary text-black rounded-br-sm"
                      : "bg-white/10 text-white rounded-bl-sm"
                    } ${!msg.message && hasAttachments ? "bg-transparent p-0" : "px-4 py-2"}`}
                >
                  {msg.message && (
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {msg.message}
                      {msg.isEdited && (
                        <span className="text-[10px] opacity-60 ml-2">(edited)</span>
                      )}
                    </p>
                  )}

                  {/* Attachments */}
                  {hasAttachments && (
                    <div className="space-y-2">
                      {msg.attachments!.map((attachment, i) => (
                        <AttachmentPreview key={i} attachment={attachment} />
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};
