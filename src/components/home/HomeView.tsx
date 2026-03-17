import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Search, Play, Users, Clock, Flame } from 'lucide-react';
import { db } from '../../firebase';
import { Room } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';
import { View } from '../../types';
import { cn } from '../../lib/utils';

export const HomeView = ({ 
  onJoinRoom, 
  setView 
}: { 
  onJoinRoom: (roomId: string) => void,
  setView: (view: View) => void
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    // 1. Fetch Real Live Rooms
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
      setRooms(roomData);
      setLoading(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'rooms');
      setLoading(false);
    });

    // 2. Fetch YouTube Trending
    if (YOUTUBE_API_KEY) {
      fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=5&regionCode=IN&key=${YOUTUBE_API_KEY}`)
        .then(res => res.json())
        .then(data => {
          if (data.items) setTrending(data.items);
        })
        .catch(err => console.error('Trending fetch error:', err));
    }

    return unsubscribe;
  }, [YOUTUBE_API_KEY]);

  const getPlatformLogo = (platform: string) => {
    const logos: Record<string, string> = {
      youtube: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png",
      netflix: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      hotstar: "https://secure-media.hotstar.com/web-assets/prod/images/brand-logos/disney-hotstar-logo-dark.svg",
      disney: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
      prime: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
    };
    return logos[platform.toLowerCase()] || null;
  };

  return (
    <div className="pb-32 bg-background min-h-screen">
      <Header 
        title="HomeTheatre" 
        rightElement={
          <button 
            onClick={() => setView('sources')}
            className="group relative flex items-center gap-2 bg-white text-black text-[11px] font-black px-6 py-3 rounded-[1.5rem] uppercase tracking-widest shadow-2xl hover:bg-[#0A84FF] hover:text-white transition-all overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            Create Room
          </button>
        }
      />

      {/* Main Search */}
      <div className="px-6 mb-10">
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#0A84FF] transition-colors" />
          <input 
            type="text" 
            placeholder="Search communities, shows, or direct links..." 
            className="w-full bg-[#1c1c1e] border-none rounded-[2rem] py-5 pl-16 pr-6 text-sm text-white focus:ring-4 focus:ring-[#0A84FF]/10 outline-none transition-all shadow-2xl"
          />
        </div>
      </div>

      {/* Live Streams Section */}
      <section className="mb-12">
        <div className="px-6 flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">Live Experiences</h2>
        </div>
        
        {loading ? (
          <div className="px-6 flex gap-4 overflow-hidden">
            {[1, 2].map(i => (
              <div key={i} className="w-80 h-48 bg-[#1c1c1e] rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto no-scrollbar gap-6 px-6 pb-4">
            {rooms.length === 0 ? (
              <div className="flex-none w-full max-w-sm h-56 bg-gradient-to-br from-white/5 to-transparent border border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                  <Flame className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-white font-bold mb-1">Silence is Golden?</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed uppercase tracking-widest">No active rooms right now. Be the spark and start one yourself!</p>
              </div>
            ) : (
              rooms.map((room, idx) => (
                <motion.div 
                  key={room.id} 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="flex-none w-[340px] cursor-pointer group" 
                  onClick={() => onJoinRoom(room.id)}
                >
                  <div className="relative aspect-video rounded-[2.5rem] overflow-hidden mb-5 bg-[#1c1c1e] ring-1 ring-white/10 group-hover:ring-white/30 transition-all shadow-2xl">
                    {room.thumbnail ? (
                      <img src={room.thumbnail} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5">
                        <Play className="w-16 h-16 text-[#0A84FF] fill-[#0A84FF]/20 group-hover:scale-125 transition-transform" />
                      </div>
                    )}
                    
                    {/* Platform Badge Overlay */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-black/60 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10">
                        {getPlatformLogo(room.platform || room.type) ? (
                          <img src={getPlatformLogo(room.platform || room.type)!} className="h-4 object-contain filter brightness-0 invert" alt="" />
                        ) : (
                          <span className="text-[9px] font-black uppercase text-white/50">{room.platform || room.type}</span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                      <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                        <Users className="w-3 h-3 text-[#0A84FF]" />
                        <span className="text-[10px] text-white font-black">{room.participantsCount || 1} WATCHING</span>
                      </div>
                      <div className="bg-[#0A84FF] text-white text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest shadow-xl">Join Room</div>
                    </div>
                  </div>

                  <div className="px-2">
                    <h3 className="font-black text-lg text-white truncate mb-1 leading-tight group-hover:text-[#0A84FF] transition-colors">{room.title}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.hostId}`} alt="" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]">{room.hostName}</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-800 rounded-full" />
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Active Now</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Trending Section */}
      <section className="px-6 mb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Trending Now</span>
            </div>
            <h2 className="text-2xl font-black text-white leading-tight">Hot on YouTube</h2>
          </div>
          <button className="text-[11px] font-black uppercase tracking-widest text-[#0A84FF] hover:text-white transition-colors">See Feed</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trending.length > 0 ? (
            trending.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => {
                  setView('sources');
                  // This is a shortcut to start a room with this video
                }}
                className="group flex gap-5 bg-[#1c1c1e] p-4 rounded-[2.5rem] border border-white/5 hover:border-[#0A84FF]/30 hover:bg-[#1c1c1e]/80 transition-all cursor-pointer shadow-2xl"
              >
                <div className="relative w-40 h-24 flex-none rounded-2xl overflow-hidden ring-1 ring-white/10 group-hover:ring-[#0A84FF]/50 transition-all">
                  <img src={item.snippet.thumbnails.high.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-sm font-black text-white line-clamp-2 leading-tight mb-2 group-hover:text-[#0A84FF] transition-colors">{item.snippet.title}</h4>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{item.snippet.channelTitle}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-[#0A84FF]/80 uppercase tracking-tight">{(parseInt(item.statistics.viewCount) / 1000000).toFixed(1)}M VIEWS</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
             [1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-4 bg-[#1c1c1e] rounded-[2.5rem] animate-pulse">
                <div className="w-32 h-20 bg-white/5 rounded-xl" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
