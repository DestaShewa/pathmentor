import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, BarChart, Users, Settings,
  ChevronLeft, Clock3, ShieldCheck, Trophy, Award,
  Bell, Calendar, User, FolderKanban, LifeBuoy,MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeView?: string;
  onViewChange?: (view: string) => void;
  pendingMode?: boolean;
}

export const DashboardSidebar = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  activeView = "dashboard",
  onViewChange = () => {},
  pendingMode = false,
}: DashboardSidebarProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const normalNavItems = [
    { icon: LayoutDashboard, label: "Dashboard",     id: "dashboard" },
    { icon: BookOpen,        label: "My Courses",    id: "lessons" },
    { icon: BarChart,        label: "Progress",      id: "progress" },
    { icon: MessageCircle, label: "Social Chat", id: "socialchat" },
    { icon: Trophy,          label: "Leaderboard",   id: "leaderboard" },
    { icon: Award,           label: "Achievements",  id: "achievements" },
    { icon: Bell,            label: "Announcements", id: "announcements" },
    { icon: Users,           label: "Study Buddies", id: "community" },
    { icon: Calendar,        label: "Sessions",      id: "sessions" },
    { icon: FolderKanban,    label: "Projects",      id: "projects" },
    { icon: User,            label: "Profile",       id: "profile" },
    { icon: Settings,        label: "Settings",      id: "settings" },
    { icon: LifeBuoy,        label: "Support",       id: "support" },
  ];

  const pendingNavItems = [
    { icon: ShieldCheck, label: "Application", id: "application" },
    { icon: Clock3,      label: "Status",      id: "status" },
    { icon: Settings,    label: "Settings",    id: "settings" },
  ];

  const navItems = pendingMode ? pendingNavItems : normalNavItems;

  // On desktop the sidebar is always visible — no animation needed
  // On mobile it slides in/out based on isOpen
  const sidebarVisible = isDesktop || isOpen;

  const NavContent = () => (
    <div className="flex flex-col h-full p-4">
      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-muted border border-border items-center justify-center hover:bg-muted/80 transition shadow-md z-10"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
      </button>

      {!isCollapsed && (
        <div className="mb-6 px-3">
          <h2 className="font-extrabold text-lg tracking-tight">
            PathMentor <span className="text-primary">{pendingMode ? "Pending" : "AI"}</span>
          </h2>
        </div>
      )}

      <nav className="flex-1 space-y-1 pb-6 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (!isDesktop) onClose();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-popover border border-border rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && !isDesktop && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar — always visible, no animation */}
      {isDesktop && (
        <aside
          style={{ width: isCollapsed ? 80 : 260 }}
          className="fixed top-0 left-0 h-full z-30 pt-20 bg-background/80 backdrop-blur-xl border-r border-border transition-all duration-300 overflow-y-auto scrollbar-none"
        >
          <NavContent />
        </aside>
      )}

      {/* Mobile sidebar — slides in/out */}
      {!isDesktop && (
        <AnimatePresence>
          {isOpen && (
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: 260 }}
              className="fixed top-0 left-0 h-full z-50 pt-20 bg-background/95 backdrop-blur-xl border-r border-border overflow-y-auto scrollbar-none"
            >
              <NavContent />
            </motion.aside>
          )}
        </AnimatePresence>
      )}
    </>
  );
};
