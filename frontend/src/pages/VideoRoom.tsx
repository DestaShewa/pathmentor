import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  Video, VideoOff, Mic, MicOff, PhoneOff,
  Users, Clock, ExternalLink, AlertCircle, CheckCircle2
} from "lucide-react";

interface SessionData {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  mentorId:  { _id: string; name: string; email: string; learningProfile?: { skillTrack?: string } };
  date: string;
  status: string;
  meetingLink: string;
  summary?: string;
}

declare global {
  interface Window { JitsiMeetExternalAPI: any; }
}

const VideoRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const jitsiRef = useRef<HTMLDivElement>(null);
  const apiRef   = useRef<any>(null);

  const [user, setUser]         = useState<any>(null);
  const [session, setSession]   = useState<SessionData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [jitsiReady, setJitsiReady] = useState(false);
  const [inCall, setInCall]     = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/auth"); return; }
    fetchSession();
    loadJitsiScript();
    return () => {
      if (apiRef.current) apiRef.current.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate]);

  const fetchSession = async () => {
    try {
      const [profileRes, sessionRes] = await Promise.all([
        api.get("/users/profile"),
        api.get(`/sessions/${id}`)
      ]);
      setUser(profileRes.data.user);
      setSession(sessionRes.data.data);
    } catch (e: any) {
      if (e?.response?.status === 401) navigate("/auth");
      else setError(e?.response?.data?.message || "Failed to load session");
    } finally { setLoading(false); }
  };

  const loadJitsiScript = () => {
    if (window.JitsiMeetExternalAPI) { setJitsiReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => setJitsiReady(true);
    script.onerror = () => setError("Failed to load video call library. Check your internet connection.");
    document.head.appendChild(script);
  };

  const startCall = () => {
    if (!jitsiReady || !session?.meetingLink || !jitsiRef.current) return;

    // Extract room name from the Jitsi URL
    const roomName = session.meetingLink.replace("https://meet.jit.si/", "");

    apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      parentNode: jitsiRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: user?.name || "Participant",
        email: user?.email || "",
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone", "camera", "closedcaptions", "desktop",
          "fullscreen", "fodeviceselection", "hangup", "chat",
          "recording", "raisehand", "videoquality", "filmstrip",
          "tileview", "download", "help",
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: "#0f172a",
      },
    });

    apiRef.current.addEventListener("videoConferenceJoined", () => {
      setInCall(true);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    });

    apiRef.current.addEventListener("videoConferenceLeft", () => {
      setInCall(false);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    apiRef.current.addEventListener("readyToClose", () => {
      handleLeave();
    });
  };

  const handleLeave = () => {
    if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
    setInCall(false);
    // Navigate back to sessions
    if (user?.role === "mentor") navigate("/mentor/sessions");
    else navigate("/sessions");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <GlassCard className="p-8 max-w-md text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Cannot Join Session</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <GlassButton variant="primary" onClick={() => navigate(-1)}>Go Back</GlassButton>
      </GlassCard>
    </div>
  );

  if (!session) return null;

  const isMentor  = user?._id === session.mentorId?._id || user?.role === "mentor";
  const other     = isMentor ? session.studentId : session.mentorId;
  const sessionTime = new Date(session.date);
  const now = new Date();
  const minutesUntil = Math.round((sessionTime.getTime() - now.getTime()) / 60000);
  const canJoin = session.status === "scheduled" && minutesUntil <= 15;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Video size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Session with {other?.name}</p>
            <p className="text-xs text-muted-foreground">
              {sessionTime.toLocaleDateString()} at {sessionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {inCall && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-red-400">{formatTime(elapsed)}</span>
            </div>
          )}
          <button onClick={handleLeave} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl text-sm font-bold transition-all">
            <PhoneOff size={15} /> Leave
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!inCall ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg space-y-6">
            {/* Session info card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-black shrink-0">
                  {other?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold">{other?.name}</p>
                  <p className="text-sm text-muted-foreground">{other?.email}</p>
                  {!isMentor && (session.mentorId as any)?.learningProfile?.skillTrack && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                      {(session.mentorId as any).learningProfile.skillTrack}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Clock size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold">{sessionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-xs text-muted-foreground">Session Time</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Users size={16} className="text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold capitalize">{session.status}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>

              {/* Join status */}
              {session.status !== "scheduled" ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-500/10 text-slate-400 text-sm">
                  <AlertCircle size={16} />
                  This session is {session.status}. You cannot join.
                </div>
              ) : !canJoin ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-400 text-sm">
                  <Clock size={16} />
                  Session starts in {minutesUntil > 60
                    ? `${Math.floor(minutesUntil / 60)}h ${minutesUntil % 60}m`
                    : `${minutesUntil} minutes`}. You can join 15 minutes before.
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-400 text-sm mb-4">
                  <CheckCircle2 size={16} />
                  Session is ready to join!
                </div>
              )}
            </GlassCard>

            {/* Action buttons */}
            <div className="space-y-3">
              {canJoin && (
                <GlassButton
                  variant="primary"
                  glow
                  className="w-full py-4 text-lg"
                  onClick={startCall}
                  disabled={!jitsiReady}
                >
                  <Video size={20} />
                  {jitsiReady ? "Join Video Call" : "Loading..."}
                </GlassButton>
              )}

              {/* Open in Jitsi directly */}
              {session.meetingLink && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all text-sm font-medium"
                >
                  <ExternalLink size={15} /> Open in Jitsi (new tab)
                </a>
              )}

              <button
                onClick={handleLeave}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all text-sm"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        ) : (
          /* Jitsi embed */
          <div className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden border border-white/10">
            <div ref={jitsiRef} className="w-full h-full" style={{ minHeight: "600px" }} />
          </div>
        )}
      </div>

      {/* Pre-call: show Jitsi container hidden so it can initialize */}
      {!inCall && (
        <div ref={jitsiRef} className="hidden" />
      )}
    </div>
  );
};

export default VideoRoom;
