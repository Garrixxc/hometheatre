import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'framer-motion';
import { 
  Search, 
  Film, 
  Youtube, 
  Play, 
  HardDrive 
} from 'lucide-react';
import { db } from '../../firebase';
import { View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header } from '../common/UI';
import { cn } from '../../lib/utils';
import { YouTubeDiscovery } from './YouTubeDiscovery';

export const SourcesView = ({ 
  user, 
  setView, 
  setActiveRoomId 
}: { 
  user: FirebaseUser, 
  setView: (v: View) => void, 
  setActiveRoomId: (id: string) => void 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<{ id: string, name: string, color: string } | null>(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomVideoUrl, setRoomVideoUrl] = useState('');
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);

    { 
      id: 'youtube', 
      name: 'YouTube', 
      logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg",
      color: 'from-[#FF0000]/20 to-[#FF0000]/5',
      accent: '#FF0000'
    },
    { 
      id: 'netflix', 
      name: 'Netflix', 
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      color: 'from-[#E50914]/20 to-[#E50914]/5',
      accent: '#E50914'
    },
    { 
      id: 'hotstar', 
      name: 'Hotstar', 
      logo: "https://secure-media.hotstar.com/web-assets/prod/images/brand-logos/disney-hotstar-logo-dark.svg",
      color: 'from-[#01147C]/20 to-[#01147C]/5',
      accent: '#01147C'
    },
    { 
      id: 'disney', 
      name: 'Disney+', 
      logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
      color: 'from-[#006E99]/20 to-[#006E99]/5',
      accent: '#006E99'
    },
    { 
      id: 'prime', 
      name: 'Prime Video', 
      logo: "https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg",
      color: 'from-[#00A8E1]/20 to-[#00A8E1]/5',
      accent: '#00A8E1'
    },
    { 
      id: 'movie', 
      name: 'MP4 Link', 
      logo: "direct",
      color: 'from-white/10 to-white/5',
      accent: '#FFFFFF'
    },
  ];

  const filteredSources = sources.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = async () => {
    if (!selectedSource || !roomTitle.trim()) return;
    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        title: roomTitle.trim(),
        description: roomDescription.trim(),
        videoUrl: roomVideoUrl.trim() || null,
        hostId: user.uid,
        hostName: user.displayName || 'Anonymous',
        participantsCount: 1,
        createdAt: serverTimestamp(),
        playbackState: 'paused',
        currentTime: 0,
        type: selectedSource.id,
        platform: selectedSource.id
      });
      setActiveRoomId(docRef.id);
      setView('watch');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'rooms');
    }
  };

  return (
    <div className="pb-32 bg-background min-h-screen">
      <Header 
        title={selectedSource?.id === 'youtube' ? "Youtube Discovery" : "Watch Party"} 
        showBack 
        onBack={() => {
          if (isSearchingYouTube) setIsSearchingYouTube(false);
          else if (selectedSource) setSelectedSource(null);
          else setView('watch');
        }} 
      />
      
      <div className="px-6 mt-8">
        {!selectedSource ? (
          <>
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search platforms..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1e] pl-14 pr-6 py-4 rounded-[2rem] text-sm text-white focus:outline-none focus:ring-4 focus:ring-[#0A84FF]/10 transition-all border border-white/5"
              />
            </div>

            <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 px-4">Select Source</h2>
            <div className="grid grid-cols-2 gap-6">
              {filteredSources.map((source, idx) => (
                <motion.button 
                  key={source.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedSource(source);
                    setRoomTitle(`${source.name} Party`);
                    if (source.id === 'youtube') setIsSearchingYouTube(true);
                  }}
                  className={cn(
                    "relative group h-48 flex flex-col items-center justify-center p-6 rounded-[3rem] gap-4 transition-all overflow-hidden",
                    "bg-gradient-to-br border border-white/10 shadow-2xl",
                    source.color
                  )}
                >
                  {/* Decorative background blast */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl -z-10" />
                  
                  <div className="w-full flex-1 flex items-center justify-center px-4">
                    {source.logo === "direct" ? (
                      <HardDrive className="w-12 h-12 text-white opacity-40" />
                    ) : (
                        src={source.logo} 
                        alt={source.name} 
                        className="max-w-full max-h-12 object-contain filter brightness-0 invert opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                      />
                    )}
                  </div>
                  
                  <div className="mt-auto py-2 px-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/20 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 group-hover:text-white">{source.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        ) : selectedSource.id === 'youtube' && isSearchingYouTube ? (
          <YouTubeDiscovery 
            onSelect={(video) => {
              if (video.id === 'custom') {
                setIsSearchingYouTube(false);
              } else {
                setRoomVideoUrl(`https://www.youtube.com/watch?v=${video.id}`);
                setRoomTitle(video.title);
                setIsSearchingYouTube(false);
              }
            }} 
          />
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8">
            <div className="text-center mb-10">
              <div className={cn("w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center mb-6 shadow-2xl border-4 border-background ring-1 ring-white/10", selectedSource.color)}>
                {selectedSource.icon}
              </div>
              <h2 className="text-3xl font-black text-white mb-2 leading-tight">Start {selectedSource.name} Room</h2>
              <p className="text-gray-500 font-medium text-sm">Review your party details.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4">Room Title</label>
                <input 
                  type="text" 
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="e.g. Movie Night with Friends"
                  className="w-full bg-[#1c1c1e] p-6 rounded-[2rem] font-bold text-white border border-white/5 focus:outline-none focus:border-[#0A84FF]/50 transition-all shadow-xl"
                  autoFocus
                />
              </div>

              <div className="space-y-3 bg-[#1c1c1e] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Video Source URL</label>
                  <span className="text-[9px] bg-[#0A84FF]/20 text-[#0A84FF] px-2 py-0.5 rounded-full font-black">REQUIRED</span>
                </div>
                <input 
                  type="url" 
                  value={roomVideoUrl}
                  onChange={(e) => setRoomVideoUrl(e.target.value)}
                  placeholder={selectedSource.id === 'youtube' ? "https://youtube.com/watch?v=..." : "https://example.com/video.mp4"}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-[#0A84FF]/50 transition-all font-mono"
                />
                <div className="flex gap-2 px-2 mt-2">
                  <div className="w-1 h-1 bg-gray-600 rounded-full mt-1.5" />
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    {selectedSource.id === 'youtube' 
                      ? "Everyone will see this YouTube video in sync." 
                      : selectedSource.id === 'movie'
                      ? "Direct MP4/M3U8 link required for sync playback."
                      : `Syncing ${selectedSource.name}. Make sure everyone has an active account.`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-12 pb-12">
              {['netflix', 'hotstar', 'disney', 'prime'].includes(selectedSource.id) && (
                <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 p-6 rounded-[2rem] mb-4 text-left">
                  <p className="text-[10px] font-black text-[#FF9500] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#FF9500] rounded-full" />
                    External Platform Notice
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                    To watch {selectedSource.name} together, ensure all participants are logged into their own accounts on the official site. We'll sync the experience via the link provided.
                  </p>
                </div>
              )}
              <button 
                onClick={handleCreateRoom}
                className="w-full bg-[#0A84FF] py-5 rounded-[2rem] font-black text-white shadow-2xl shadow-[#0A84FF]/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
              >
                Launch Watch Room
              </button>
              <button 
                onClick={() => {
                  setSelectedSource(null);
                  setIsSearchingYouTube(false);
                }}
                className="w-full bg-white/5 py-5 rounded-[2rem] font-black text-gray-400 hover:text-white transition-all text-xs uppercase tracking-widest"
              >
                Change Platform
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
