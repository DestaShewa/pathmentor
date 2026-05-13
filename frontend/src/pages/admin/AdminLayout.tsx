import React, { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { initSocket, disconnectSocket } from "@/services/socket";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  LayoutDashboard, Users, UserCheck, BarChart3,
  Star, GraduationCap, Clock,
  Activity, FileText, CheckSquare, BookOpen,
  Layers, MessageSquare, Ticket, Settings,
  ShieldCheck, LogOut, Menu, ChevronDown,
  MessageCircle, Cog, Terminal, ClipboardList, Bell, User,
  UserCircle, X, Save
} from "lucide-react";

// The "glass" style for components inside the layout
const glass =
  "relative overflow-hidden rounded-2xl " +
  "bg-white/10 backdrop-blur-3xl border border-white/20 " +
  "shadow-[0_8px_32_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] " +
  "hover:border-cyan-300/30 transition-all duration-300";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Initialize socket for real-time notifications
  useEffect(() => {
    initSocket();
  }, []);

  // Integrated Sign Out logic
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    disconnectSocket();
    navigate("/auth");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuGroups = [
    {
      title: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Activity, label: "Activity", path: "/admin/activities" },
      ]
    },
    {
      title: "Mentors",
      items: [
        { icon: Users, label: "All Mentors", path: "/admin/mentors" },
        { icon: UserCheck, label: "Applications", path: "/admin/applications" },
        { icon: BarChart3, label: "Performance", path: "/admin/performance" },
        { icon: Star, label: "Reviews", path: "/admin/mentor-reviews" },
      ]
    },
    {
      title: "Students",
      items: [
        { icon: GraduationCap, label: "All Students", path: "/admin/allstudents" },
        { icon: Clock, label: "Enrollments", path: "/admin/enrollments" },
        { icon: Activity, label: "Progress", path: "/admin/progress" },
        { icon: CheckSquare, label: "Grades & Status", path: "/admin/grades" },
        { icon: FileText, label: "Reports", path: "/admin/reports" },
      ]
    },
    {
      title: "Courses",
      items: [
        { icon: BookOpen, label: "All Courses", path: "/admin/all-courses" },
        { icon: Layers, label: "Categories", path: "/admin/categories" },
        { icon: FileText, label: "Lessons", path: "/admin/lessons" },
        { icon: Star, label: "Reviews", path: "/admin/reviews" },
        { icon: ClipboardList, label: "Assignments", path: "/admin/assignments" },
      ]
    },
    {
      title: "Chats & Support",
      items: [
        { icon: MessageCircle, label: "User Messages", path: "/admin/user-chat" },
        { icon: Ticket, label: "Support Tickets", path: "/admin/tickets" },
      ]
    },
    {
      title: "Feedback",
      items: [
        { icon: MessageSquare, label: "All Feedback", path: "/admin/feedback" },
      ]
    },
    {
      title: "Settings",
      items: [
        { icon: Users, label: "Profile Settings", path: "/admin/settings/profile" },
        { icon: Cog, label: "System Settings", path: "/admin/settings/system" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-400 overflow-hidden font-sans relative">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* COMPACT EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-md font-bold text-white">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</label>
                <input type="text" placeholder="Admin User" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</label>
                <input type="email" placeholder="admin@pathmentor.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" />
              </div>
              <button type="submit" onClick={() => setIsEditModalOpen(false)} className="w-full py-2.5 mt-2 rounded-lg font-bold bg-blue-600 text-white text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`relative z-20 bg-slate-900/40 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}>
        <div className="h-20 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* ORIGINAL PATHMENTOR LOGO (P) */}
            <div className="w-9 h-9 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            {sidebarOpen && <span className="text-white font-bold text-xl">PathMentor</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-7 pb-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {sidebarOpen && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">{group.title}</p>}
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 
                    ${isActive(item.path) ? "bg-white/10 text-white shadow-inner" : "hover:bg-white/5 hover:text-slate-200"}`}
                >
                  <item.icon size={18} className={isActive(item.path) ? "text-blue-400" : "text-slate-500"} />
                  {sidebarOpen && <span className="text-xs font-semibold text-left flex-1">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 flex flex-col">
        <header className="h-20 shrink-0 border-b border-white/10 bg-slate-900/20 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="text-sm font-medium text-slate-500">
            Admin / {location.pathname.split('/').pop()?.replace('-', ' ')}
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="relative" ref={profileRef}>
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 group focus:outline-none">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                  <User size={18} className="text-slate-300" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-white leading-tight">Admin User</p>
                  <p className="text-[10px] text-slate-500 font-medium">Super Admin</p>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <button
                    onClick={() => { setIsEditModalOpen(true); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <UserCircle size={16} className="text-blue-400" />
                    Edit Profile
                  </button>
                  <div className="h-[1px] bg-white/5 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#f87171] hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;