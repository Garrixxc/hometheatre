import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Search, Play } from 'lucide-react';
import { db } from '../../firebase';
import { Room } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';

export const HomeView = ({ onJoinRoom }: { onJoinRoom: (roomId: string) => void }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(10));
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
    <div className="pb-24">
      <Header title="HomeTheatre" />
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search movies, shows, or links" 
            className="w-full bg-card border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-[#0A84FF] outline-none"
          />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="px-4 text-lg font-semibold mb-3">Live Rooms</h2>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex overflow-x-auto no-scrollbar gap-4 px-4">
            {rooms.length === 0 ? (
              <div className="flex-none w-72 h-40 bg-card rounded-xl flex items-center justify-center text-gray-500 italic">
                No active rooms. Start one!
              </div>
            ) : (
              rooms.map(room => (
                <motion.div 
                  key={room.id} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4 }}
                  className="flex-none w-80 cursor-pointer group" 
                  onClick={() => onJoinRoom(room.id)}
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-[#1c1c1e] ring-1 ring-white/10 group-hover:ring-white/20 transition-all shadow-xl">
                    {room.thumbnail ? (
                      <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5">
                        <Play className="w-12 h-12 text-[#0A84FF] fill-[#0A84FF]/20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                  </div>
                  <div className="flex justify-between items-start px-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-white truncate mb-1">{room.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase text-white bg-[#0A84FF] px-2 py-0.5 rounded-md">
                          {room.platform || room.type}
                        </span>
                        {room.description && <p className="text-xs text-gray-500 truncate">{room.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-800 border border-white/10" />
                        <p className="text-[11px] text-gray-400 font-medium">Host: <span className="text-gray-200">{room.hostName}</span></p>
                      </div>
                    </div>
                    <button className="bg-white text-black text-[11px] font-black py-2 px-4 rounded-xl uppercase tracking-tighter hover:bg-[#0A84FF] hover:text-white transition-colors">Join</button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="px-4 flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Trending on YouTube</h2>
          <button className="text-[#0A84FF] text-sm">See All</button>
        </div>
        <div className="space-y-4 px-4">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-32 h-20 bg-card rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-card rounded w-3/4" />
                <div className="h-3 bg-card rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
