import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Crown } from "lucide-react";

interface Participant {
  _id: string;
  name: string;
  email: string;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
  };
}

interface ParticipantListProps {
  participants: Participant[];
  activeParticipants: any[];
  creator: {
    _id: string;
    name: string;
  };
}

export const ParticipantList = ({ participants, activeParticipants, creator }: ParticipantListProps) => {
  const activeIds = new Set(activeParticipants.map((p: any) => p._id || p));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-primary" />
          <h3 className="font-bold">
            Participants ({participants.length})
          </h3>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {participants.map((participant, idx) => {
            const isCreator = participant._id === creator._id;
            const isActive = activeIds.has(participant._id);

            return (
              <motion.div
                key={participant._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                    isCreator
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
                      : "bg-gradient-to-br from-primary to-secondary text-black"
                  }`}>
                    {participant.name[0]?.toUpperCase()}
                  </div>
                  {/* Online indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{participant.name}</p>
                    {isCreator && (
                      <Crown size={12} className="text-yellow-400 shrink-0" />
                    )}
                  </div>
                  {participant.learningProfile?.skillTrack && (
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.learningProfile.skillTrack}
                      {participant.learningProfile.experienceLevel && 
                        ` • ${participant.learningProfile.experienceLevel}`
                      }
                    </p>
                  )}
                </div>

                {/* Status */}
                {isActive && (
                  <span className="text-[10px] text-green-400 font-medium shrink-0">
                    Online
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
};
