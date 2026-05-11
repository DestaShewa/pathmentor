import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "@/services/api";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { Users, MessageSquare, Search, Loader2, UserCircle } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  learningProfile?: {
    skillTrack?: string;
    experienceLevel?: string;
  };
}

const glass =
  "relative overflow-hidden rounded-2xl " +
  "bg-white/10 backdrop-blur-3xl border border-white/20 " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] " +
  "hover:border-cyan-300/30 transition-all duration-300";

const AdminChatPage = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "mentor">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const fetchData = async () => {
    try {
      const [profileRes, usersRes] = await Promise.all([
        api.get("/users/profile"),
        api.get("/admin/users"),
      ]);

      setCurrentUser(profileRes.data.user);
      
      // /admin/users returns a plain array (not { users: [] })
      let allUsers: User[] = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || usersRes.data.data || []);
      
      // Exclude the current admin from the list
      allUsers = allUsers.filter((u: User) => u._id !== profileRes.data.user._id);
      
      // Filter by role
      if (roleFilter !== "all") {
        allUsers = allUsers.filter((u: User) => u.role === roleFilter);
      }
      
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Generate room ID for admin-user chat
  const getRoomId = (userId: string) => {
    const ids = [currentUser._id, userId].sort();
    return `admin-${ids[0]}-${ids[1]}`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-500/20 text-blue-300";
      case "mentor":
        return "bg-purple-500/20 text-purple-300";
      case "admin":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-white mb-2">
          User <span className="text-cyan-400">Messages</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Chat with students and mentors
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: User List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className={glass + " p-6"}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Users size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Users</h3>
                <p className="text-xs text-slate-400">
                  {users.length} user{users.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex gap-2 mb-4">
              {(["all", "student", "mentor"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    roleFilter === role
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Users size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">
                    {searchQuery ? "No users found" : "No users available"}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      selectedUser?._id === user._id
                        ? "bg-cyan-500/20 border border-cyan-500/30"
                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-lg font-bold text-black shrink-0">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate text-white">
                          {user.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRoleBadgeColor(
                              user.role
                            )}`}
                          >
                            {user.role.toUpperCase()}
                          </span>
                          {user.learningProfile?.skillTrack && (
                            <span className="text-xs text-slate-400 truncate">
                              {user.learningProfile.skillTrack}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right: Chat */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          {selectedUser ? (
            <ChatRoom
              roomId={getRoomId(selectedUser._id)}
              roomName={`Chat with ${selectedUser.name}`}
              currentUserId={currentUser._id}
              currentUserName={currentUser.name}
            />
          ) : (
            <div className={glass + " p-12 text-center h-[500px] flex items-center justify-center"}>
              <div>
                <MessageSquare size={64} className="mx-auto mb-4 opacity-30 text-cyan-400" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  Select a User to Chat
                </h3>
                <p className="text-sm text-slate-400">
                  Choose a user from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminChatPage;
