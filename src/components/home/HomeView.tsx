import React, { useState, useEffect } from 'react';
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
                <div key={room.id} className="flex-none w-72 cursor-pointer" onClick={() => onJoinRoom(room.id)}>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-card">
                    {room.thumbnail ? (
                      <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                        <Play className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Live</div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm">{room.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase text-[#0A84FF] bg-[#0A84FF]/10 px-1.5 py-0.5 rounded">
                          {room.platform || room.type}
                        </span>
                        {room.description && <p className="text-[10px] text-gray-500 line-clamp-1">{room.description}</p>}
                      </div>
                      <p className="text-xs text-gray-400">Host: {room.hostName}</p>
                    </div>
                    <button className="bg-[#0A84FF] text-white text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wider">Join</button>
                  </div>
                </div>
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
