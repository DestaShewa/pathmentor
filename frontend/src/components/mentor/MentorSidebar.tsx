import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, BarChart3, Upload,
  ClipboardList, Calendar, Users, HelpCircle,
  ChevronLeft, LogOut, Settings, Bell, FolderKanban, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",      path: "/mentor/dashboard" },
  { icon: BookOpen,        label: "My Classes",     path: "/mentor/classes" },
  { icon: Upload,          label: "Upload Content", path: "/mentor/upload/general" },
  { icon: HelpCircle,      label: "Quiz Builder",   path: "/mentor/task/general" },
  { icon: FolderKanban,    label: "Projects",       path: "/mentor/projects" },
  { icon: ClipboardList,   label: "Review Queue",   path: "/mentor/review" },
  { icon: Calendar,        label: "Sessions",       path: "/mentor/sessions" },
  { icon: MessageSquare,   label: "Messages",       path: "/mentor/chat" },
  { icon: Bell,            label: "Announcements",  path: "/mentor/announcements" },
  { icon: Settings,        label: "Settings",       path: "/mentor/settings" },
];

interface MentorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
}

export const MentorSidebar = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  userName = "Mentor",
  userEmail = "",
  onSignOut,
}: MentorSidebarProps) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isActive = (path: string) => {
    if (path === "/mentor/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path.replace("/general", ""));
  };

  const handleNav = (path: string) => {
    navigate(path);
    if (!isDesktop) onClose();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full p-4">
      {/* Collapse toggle — desktop only */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-muted border border-border items-center justify-center hover:bg-muted/80 transition shadow-md z-10"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
      </button>

      {/* Logo */}
      {!isCollapsed && (
        <div className="mb-6 px-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-black shrink-0">
              P
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-foreground truncate">PathMentor AI</p>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Mentor Portal</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none pb-4">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <item.icon size={19} className="shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-popover border border-border rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="border-t border-border pt-4 space-y-1">
        {!isCollapsed && (
          <div className="px-4 py-2 mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm"
        >
          <LogOut size={17} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
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

      {/* Desktop sidebar — always visible */}
      {isDesktop && (
        <aside
          style={{ width: isCollapsed ? 80 : 260 }}
          className="fixed top-0 left-0 h-full z-30 pt-20 bg-background/80 backdrop-blur-xl border-r border-border transition-all duration-300 overflow-y-auto scrollbar-none"
        >
          <NavContent />
        </aside>
      )}

      {/* Mobile sidebar */}
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
