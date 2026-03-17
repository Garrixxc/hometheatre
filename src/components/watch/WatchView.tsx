import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Play, Plus, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { Room, View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';

export const WatchView = ({ 
  setView, 
  setActiveRoomId 
}: { 
  setView: (v: View) => void, 
  setActiveRoomId: (id: string) => void 
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomData);
      setLoading(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'rooms');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="pb-32 bg-background">
      <Header 
        title="Live Parties" 
        rightElement={
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setView('sources')} 
            className="p-2.5 bg-[#0A84FF] text-white rounded-2xl shadow-lg shadow-[#0A84FF]/20"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        } 
      />
      
      <div className="px-6 space-y-6 mt-8">
        {loading ? (
          <LoadingSpinner />
        ) : rooms.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-32 bg-[#1c1c1e] rounded-[3rem] border border-white/5 shadow-2xl"
          >
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-gray-600 opacity-50" />
            </div>
            <p className="text-gray-400 font-medium mb-6">No active watch parties right now.</p>
            <button 
              onClick={() => setView('sources')} 
              className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#0A84FF] hover:text-white transition-all shadow-xl"
            >
              Start Your Own
            </button>
          </motion.div>
        ) : (
          rooms.map(room => (
            <motion.div 
              key={room.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setActiveRoomId(room.id); setView('watch'); }} 
              className="bg-[#1c1c1e] p-5 rounded-[2.5rem] flex items-center gap-5 cursor-pointer shadow-2xl border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#0A84FF] to-[#0051FF] rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-lg text-white truncate mb-1">{room.title}</h3>
                <p className="text-xs text-gray-500 font-bold mb-3 flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-gray-500 rounded-full" />
                  Host: <span className="text-gray-300">{room.hostName}</span>
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-1 rounded-lg">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Live</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                    {room.participantsCount || 1} watching
                  </span>
                  {room.platform && (
                    <span className="text-[10px] font-black uppercase tracking-tighter text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-1 rounded-lg">
                      {room.platform}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
