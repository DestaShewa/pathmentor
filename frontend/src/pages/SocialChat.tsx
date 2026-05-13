import React, { useState } from "react";
import {
  Search,
  Send,
  UserCircle2,
  MoreVertical,
  Phone,
  Video,
  Hash,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const SocialChat = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const users = [
    { id: 1, name: "Abebe Kebede", status: "Online", role: "Mentor" },
    { id: 2, name: "Sara Tesfaye", status: "Last seen 2h ago", role: "Student" },
    { id: 3, name: "Samuel Hailu", status: "Online", role: "Admin" },
  ];

  return (
    <div
      className="
        flex flex-col lg:flex-row
        h-full w-full min-h-0
        gap-4
      "
    >
      {/* LEFT SIDEBAR */}
      <GlassCard
        className="
          w-full lg:w-80
          flex flex-col
          p-4
          min-h-[300px] lg:min-h-0
        "
      >
        {/* SEARCH */}
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search students or mentors..."
            className="
              w-full
              bg-secondary/30
              rounded-full
              py-2 pl-10 pr-4
              outline-none
              text-sm
              focus:ring-2 ring-purple-500/50
            "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* USERS LIST */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
            Suggested Contacts
          </h3>

          {users.map((user) => (
            <button
              key={user.id}
              className="
                w-full flex items-center gap-3
                p-3 rounded-xl
                hover:bg-white/5
                transition
              "
            >
              <div className="relative">
                <UserCircle2 size={38} className="text-muted-foreground" />
                {user.status === "Online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                )}
              </div>

              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.role} • {user.status}
                </p>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* RIGHT CHAT AREA */}
      <GlassCard
        className="
          flex-1
          flex flex-col
          min-h-0
          overflow-hidden
        "
      >
        {/* HEADER */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle2 size={32} className="text-purple-400" />
            <div>
              <h2 className="font-bold text-sm">Abebe Kebede</h2>
              <p className="text-[10px] text-green-400">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-muted-foreground">
            <Phone size={18} className="cursor-pointer hover:text-white" />
            <Video size={18} className="cursor-pointer hover:text-white" />
            <MoreVertical size={18} className="cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* MESSAGES */}
        <div
          className="
            flex-1
            min-h-0
            overflow-y-auto
            p-4
            space-y-4
          "
        >
          <div className="flex justify-center">
            <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full">
              Today
            </span>
          </div>

          {/* RECEIVED */}
          <div className="flex max-w-[85%]">
            <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none">
              <p className="text-sm">
                Selam! Great progress on PathMentor 🚀
              </p>
              <span className="text-[10px] text-muted-foreground">
                10:45 AM
              </span>
            </div>
          </div>

          {/* SENT */}
          <div className="flex justify-end max-w-[85%] ml-auto">
            <div className="bg-purple-600 p-3 rounded-2xl rounded-tr-none">
              <p className="text-sm">
                Finished authentication module today.
              </p>
              <span className="text-[10px] text-purple-200">
                10:47 AM
              </span>
            </div>
          </div>
        </div>

        {/* INPUT */}
        <div className="p-3 border-t border-white/10">
          <form
            className="
              flex items-center gap-2
              bg-secondary/30
              rounded-2xl
              px-3 py-2
              focus-within:ring-1 ring-purple-500/50
            "
          >
            <Hash size={18} className="text-muted-foreground" />

            <input
              type="text"
              placeholder="Write a message..."
              className="flex-1 bg-transparent outline-none text-sm"
            />

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 p-2 rounded-xl"
            >
              <Send size={18} className="text-white" />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default SocialChat;