import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, File, Image, Mic, StopCircle } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

interface MessageInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
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
    return <File size={14} className="text-slate-400" />;
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
    <div className="border-t border-white/10">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-white/10 bg-white/[0.02]">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs group"
              >
                {getFileIcon(file)}
                <div className="flex flex-col min-w-0">
                  <span className="truncate max-w-[150px] text-white">{file.name}</span>
                  <span className="text-slate-500">{formatFileSize(file.size)}</span>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-2 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="p-3 border-b border-white/10 bg-red-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-medium">Recording...</span>
              <span className="text-sm text-slate-400">{formatRecordingTime(recordingTime)}</span>
            </div>
            <button
              onClick={stopRecording}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors"
            >
              <StopCircle size={14} /> Stop
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex gap-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || attachments.length >= 5}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file (max 5)"
          >
            <Paperclip size={18} />
          </button>

          {/* Voice recording button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            className={`p-2.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            title={isRecording ? "Stop recording" : "Record voice message"}
          >
            <Mic size={18} />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || isRecording}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send button */}
          <GlassButton
            variant="primary"
            onClick={handleSend}
            disabled={(!message.trim() && attachments.length === 0) || disabled || isRecording}
            className="px-4"
          >
            <Send size={18} />
          </GlassButton>

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

        {/* Helper text */}
        <p className="text-[10px] text-slate-500 mt-2">
          Attach images, documents, audio, or video (max 25MB per file, 5 files total)
        </p>
      </div>
    </div>
  );
};
