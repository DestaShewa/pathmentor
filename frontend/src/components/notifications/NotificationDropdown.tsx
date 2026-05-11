import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Trophy, Calendar, FolderKanban, MessageSquare,
  Megaphone, UserPlus, Unlock, Bell, X, Check,
  CheckCheck, Loader2, RefreshCw
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  icon?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  calendar: Calendar,
  folder: FolderKanban,
  message: MessageSquare,
  megaphone: Megaphone,
  userPlus: UserPlus,
  unlock: Unlock,
  bell: Bell,
};

const typeColorMap: Record<string, string> = {
  achievement: "text-yellow-400 bg-yellow-400/20",
  session: "text-blue-400 bg-blue-400/20",
  project: "text-green-400 bg-green-400/20",
  message: "text-purple-400 bg-purple-400/20",
  announcement: "text-orange-400 bg-orange-400/20",
  buddy_request: "text-pink-400 bg-pink-400/20",
  level_unlock: "text-cyan-400 bg-cyan-400/20",
  reminder: "text-red-400 bg-red-400/20",
};

export const NotificationDropdown = ({
  notifications,
  loading,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRefresh,
}: NotificationDropdownProps) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-50"
      >
        <GlassCard className="overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-lg">Notifications</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw size={16} className="text-muted-foreground" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Actions */}
          {notifications.length > 0 && notifications.some((n) => !n.read) && (
            <div className="px-4 py-2 border-b border-white/10">
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = iconMap[notification.icon || "bell"] || Bell;
                const colorClass = typeColorMap[notification.type] || "text-primary bg-primary/20";
                const [textColor, bgColor] = colorClass.split(" ");

                return (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer ${
                      !notification.read ? "bg-white/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={textColor} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-muted-foreground">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(notification._id);
                                }}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                                aria-label="Mark as read"
                              >
                                <Check size={12} className="text-muted-foreground" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification._id);
                              }}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                              aria-label="Delete"
                            >
                              <X size={12} className="text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <GlassButton
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigate("/notifications");
                  onClose();
                }}
              >
                View All Notifications
              </GlassButton>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </>
  );
};
