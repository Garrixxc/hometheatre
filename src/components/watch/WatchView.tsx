import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Play, Plus, ChevronLeft } from 'lucide-react';
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
    <div className="pb-24">
      <Header 
        title="Watch Parties" 
        rightElement={
          <button onClick={() => setView('sources')} className="text-[#0A84FF]">
            <Plus className="w-6 h-6" />
          </button>
        } 
      />
      
      <div className="px-4 space-y-4 mt-4">
        {loading ? (
          <LoadingSpinner />
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No active watch parties.</p>
            <button onClick={() => setView('sources')} className="mt-4 text-[#0A84FF] font-bold">Start One</button>
          </div>
        ) : (
          rooms.map(room => (
            <div 
              key={room.id} 
              onClick={() => { setActiveRoomId(room.id); setView('watch'); }} 
              className="bg-card p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#0A84FF] to-[#0051FF] rounded-xl flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{room.title}</h3>
                <p className="text-xs text-gray-500 truncate">Host: {room.hostName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase">Live</span>
                  <span className="text-[10px] text-gray-500">{room.participantsCount || 1} watching</span>
                  {room.platform && <span className="text-[10px] text-gray-500 uppercase">· {room.platform}</span>}
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 rotate-180 text-gray-600" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
