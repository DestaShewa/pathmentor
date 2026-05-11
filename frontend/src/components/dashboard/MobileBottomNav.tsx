import { motion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Map, BookOpen, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Home",        path: "/dashboard" },
  { icon: Map,             label: "Roadmap",     path: "/roadmap" },
  { icon: BookOpen,        label: "Learn",       path: "/lessons" },
  { icon: Trophy,          label: "Leaderboard", path: "/leaderboard" },
  { icon: User,            label: "Profile",     path: "/profile" },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      <div className="glass-bottom-nav px-2 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all",
                  isActive && "bg-primary/20"
                )}
              >
                <motion.div whileTap={{ scale: 0.9 }} className="relative">
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </motion.div>
                <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};
