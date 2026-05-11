import React, { useState } from 'react';
import { Search, MessageCircle, MoreVertical, Send, ShieldAlert, CheckCheck } from 'lucide-react';
import AdminChat from '../chat/AdminChat';

const Conversations = () => {
  const [selectedChat, setSelectedChat] = useState(0);

  const chatList = [
    { id: 0, name: "Liam Johnson (Student)", lastMsg: "I can't access the React module...", time: "2m ago", online: true, unread: 2 },
    { id: 1, name: "Sarah Smith (Mentor)", lastMsg: "The payment has been processed.", time: "1h ago", online: true, unread: 0 },
    { id: 2, name: "Bruce Wayne (Admin)", lastMsg: "System maintenance at 12 PM.", time: "3h ago", online: false, unread: 0 },
  ];

  return (
    <div className="flex h-[calc(100vh-160px)] gap-6 animate-in fade-in duration-500">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto [scrollbar-width:none]">
          {chatList.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`w-full p-4 flex gap-3 border-b border-white/5 transition-all text-left ${selectedChat === chat.id ? 'bg-blue-600/10 border-r-2 border-r-blue-500' : 'hover:bg-white/5'}`}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                  {chat.name.charAt(0)}
                </div>
                {chat.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#020617]" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-xs font-bold text-white truncate">{chat.name}</p>
                  <p className="text-[10px] text-slate-500">{chat.time}</p>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <div className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center mt-1">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {chatList[selectedChat].name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{chatList[selectedChat].name}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Online now</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-red-400"><ShieldAlert size={18}/></button>
            <button className="p-2 text-slate-400 hover:text-white"><MoreVertical size={18}/></button>
          </div>
        </div>

        <AdminChat roomId={`chat-${chatList[selectedChat].id}`} />
      </div>
    </div>
  );
};

export default Conversations;