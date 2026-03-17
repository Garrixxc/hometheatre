import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, MicOff, UserMinus } from 'lucide-react';
import { Message } from '../../types';
import { cn } from '../../lib/utils';

export const MessageItem: React.FC<{ 
  msg: Message; 
  user: any; 
  isHost: boolean; 
  isMuted: boolean;
  moderatingUser: string | null;
  setModeratingUser: (id: string | null) => void;
  onMute: (id: string) => void;
  onKick: (id: string) => void;
  isAdmin?: boolean;
}> = ({ 
  msg, 
  user, 
  isHost, 
  isMuted, 
  moderatingUser, 
  setModeratingUser, 
  onMute, 
  onKick,
  isAdmin
}) => {
  return (
    <div className={cn("flex gap-3 max-w-[85%] group/msg", msg.senderId === user?.uid ? "flex-row-reverse self-end" : "flex-row self-start")}>
      <img 
        src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`} 
        alt={msg.senderName}
        className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0 mt-1"
        referrerPolicy="no-referrer"
      />
      <div className={cn("flex flex-col", msg.senderId === user?.uid ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-[10px] text-gray-500", msg.senderId === user?.uid ? "order-2" : "order-1")}>
            {msg.senderId !== user?.uid && `${msg.senderName} • `}
            {msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
          </span>
          {isAdmin && (
            <span className="bg-[#0A84FF] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter order-2">
              Admin
            </span>
          )}
          {isHost && msg.senderId !== user?.uid && (
            <button 
              onClick={() => setModeratingUser(moderatingUser === msg.senderId ? null : msg.senderId)}
              className="opacity-0 group-hover/msg:opacity-100 p-1 hover:bg-white/10 rounded transition-all order-3"
            >
              <MoreVertical className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      
        <div className="relative">
          <div className={cn(
            "px-4 py-2 text-sm rounded-2xl",
            msg.senderId === user?.uid ? "bg-[#007AFF] rounded-br-none" : "bg-[#262629] rounded-bl-none",
            isMuted && "opacity-50 italic"
          )}>
            {isMuted && <MicOff className="w-3 h-3 inline mr-1 opacity-50" />}
            {msg.text}
          </div>

          <AnimatePresence>
            {moderatingUser === msg.senderId && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute z-20 top-full mt-2 left-0 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[120px]"
              >
                <button 
                  onClick={() => onMute(msg.senderId)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <MicOff className="w-4 h-4 text-yellow-500" />
                  <span>{isMuted ? 'Unmute' : 'Mute User'}</span>
                </button>
                <button 
                  onClick={() => onKick(msg.senderId)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-xs hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Kick User</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
