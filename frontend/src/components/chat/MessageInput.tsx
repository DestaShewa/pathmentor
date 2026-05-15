import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, File as FileIcon, Image, Mic, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "@/components/ui/GlassButton";

interface MessageInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, onTyping, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if ((!message.trim() && attachments.length === 0) || disabled) return;
    onSend(message.trim(), attachments);
    setMessage("");
    setAttachments([]);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Limit to 5 files total
      const newAttachments = [...attachments, ...files].slice(0, 5);
      setAttachments(newAttachments);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image size={14} className="text-blue-400" />;
    return <FileIcon size={14} className="text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        setAttachments(prev => [...prev, audioFile]);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-transparent overflow-hidden">
      {/* Attachments preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-b border-white/5 bg-white/[0.01]"
          >
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs group transition-all hover:bg-white/[0.06] hover:border-white/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate max-w-[120px] text-white font-bold">{file.name}</span>
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-2 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors active:scale-90"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-b border-white/5 bg-red-500/[0.02] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-ping absolute inset-0 opacity-40" />
                  <div className="w-4 h-4 rounded-full bg-red-500 relative shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
                <div>
                  <span className="text-[10px] text-red-500 font-black uppercase tracking-[0.2em] block mb-0.5">Capturing Audio Signal</span>
                  <span className="text-lg text-white font-black font-mono leading-none">{formatRecordingTime(recordingTime)}</span>
                </div>
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(239,68,68,0.1)] border border-red-500/20 active:scale-95"
              >
                <StopCircle size={16} /> Stop Capture
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="p-6">
        <div className="flex items-end gap-4">
          <div className="flex gap-2 pb-0.5">
            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || attachments.length >= 5}
              className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-500 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 group relative overflow-hidden"
              title="Attach Payload (max 5)"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Paperclip size={22} className="group-hover:rotate-12 transition-transform relative z-10" />
            </button>

            {/* Voice recording button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              className={`w-12 h-12 rounded-2xl border transition-all active:scale-90 group relative overflow-hidden ${isRecording
                  ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : "bg-white/[0.03] border-white/10 text-slate-500 hover:text-primary hover:bg-primary/10 hover:border-primary/30"
                }`}
              title={isRecording ? "Terminate recording" : "Initiate audio capture"}
            >
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity ${isRecording ? "from-red-500/10 to-transparent opacity-100" : "from-primary/5 to-transparent opacity-0 group-hover:opacity-100"}`} />
              <Mic size={22} className={`relative z-10 ${isRecording ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`} />
            </button>
          </div>

          {/* Text input */}
          <div className="flex-1 relative group">
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (onTyping) onTyping();
              }}
              onKeyPress={(e: any) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Transmit a message..."
              disabled={disabled || isRecording}
              rows={1}
              className="w-full px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-40 text-sm font-medium [scrollbar-width:none] shadow-inner"
              style={{ minHeight: "56px" }}
            />
            <div className="absolute right-4 bottom-4 flex gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <div className="w-1 h-1 rounded-full bg-primary/30" />
              <div className="w-1 h-1 rounded-full bg-primary/30" />
            </div>
          </div>

          {/* Send button */}
          <div className="pb-0.5">
            <button
              onClick={handleSend}
              disabled={(!message.trim() && attachments.length === 0) || disabled || isRecording}
              className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all shadow-[0_20px_40px_-10px_rgba(20,255,236,0.3)] active:scale-90 group relative overflow-hidden ${
                (!message.trim() && attachments.length === 0) || disabled || isRecording
                  ? "bg-white/[0.03] text-slate-700 border border-white/5 cursor-not-allowed shadow-none"
                  : "bg-primary text-black hover:shadow-[0_0_30px_rgba(20,255,236,0.4)] hover:scale-105"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
              <Send size={24} className={`relative z-10 ${(!message.trim() && attachments.length === 0) ? "" : "ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"}`} />
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between px-2 mt-4">
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
              {attachments.length > 0 ? `${attachments.length}/5 Blocks Ready` : "End-to-End Encrypted Node"}
            </p>
            {attachments.length > 0 && (
              <div className="flex gap-1">
                {attachments.map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-primary/20" />
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Protocol v4.2</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
