import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Users, User, Clock, BookOpen, Tag, ArrowRight } from "lucide-react";

interface RoomCardProps {
  room: {
    _id: string;
    name: string;
    description: string;
    topic: string;
    creator: {
      name: string;
    };
    participants: any[];
    activeParticipants: any[];
    maxParticipants: number;
    status: string;
    course?: { title: string };
    level?: { title: string };
    tags: string[];
    createdAt: string;
  };
  onJoin: (roomId: string) => void;
  delay?: number;
  isOwner?: boolean;
}

export const RoomCard = ({ room, onJoin, delay = 0, isOwner }: RoomCardProps) => {
  const isFull = room.participants.length >= room.maxParticipants;
  const activeCount = room.activeParticipants?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <GlassCard className="p-5 h-full flex flex-col hover:border-primary/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate mb-1">{room.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User size={12} />
              <span className="truncate">{room.creator.name}</span>
              {isOwner && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                  OWNER
                </span>
              )}
            </div>
          </div>
          
          {/* Active indicator */}
          {activeCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>{activeCount} online</span>
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {room.description}
          </p>
        )}

        {/* Topic */}
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{room.topic}</span>
        </div>

        {/* Course/Level */}
        {(room.course || room.level) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {room.course && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {room.course.title}
              </span>
            )}
            {room.level && (
              <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full">
                {room.level.title}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {room.tags && room.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {room.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-white/5 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                <Tag size={8} />
                {tag}
              </span>
            ))}
            {room.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{room.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={14} />
              <span>
                {room.participants.length}/{room.maxParticipants}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={14} />
              <span>{new Date(room.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <GlassButton
            variant={isFull ? "ghost" : "primary"}
            size="sm"
            className="w-full"
            onClick={() => onJoin(room._id)}
            disabled={isFull && !isOwner}
          >
            {isFull && !isOwner ? (
              "Room Full"
            ) : (
              <>
                {isOwner ? "Open Room" : "Join Room"} <ArrowRight size={14} />
              </>
            )}
          </GlassButton>
        </div>
      </GlassCard>
    </motion.div>
  );
};
