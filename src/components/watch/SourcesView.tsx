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

  const sources = [
    { id: 'netflix', name: 'Netflix', icon: <Film className="w-6 h-6" />, color: 'bg-[#E50914]' },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-6 h-6" />, color: 'bg-[#FF0000]' },
    { id: 'disney', name: 'Disney+', icon: <Play className="w-6 h-6" />, color: 'bg-[#006E99]' },
    { id: 'prime', name: 'Prime Video', icon: <Play className="w-6 h-6" />, color: 'bg-[#00A8E1]' },
    { id: 'hulu', name: 'Hulu', icon: <Play className="w-6 h-6" />, color: 'bg-[#1CE783]' },
    { id: 'hbo', name: 'HBO Max', icon: <Film className="w-6 h-6" />, color: 'bg-[#0051FF]' },
    { id: 'twitch', name: 'Twitch', icon: <HardDrive className="w-6 h-6" />, color: 'bg-[#6441A5]' },
    { id: 'crunchyroll', name: 'Crunchyroll', icon: <Play className="w-6 h-6" />, color: 'bg-[#F47521]' },
    { id: 'gaming', name: 'Gaming', icon: <HardDrive className="w-6 h-6" />, color: 'bg-[#333333]' },
    { id: 'movie', name: 'Local File', icon: <Film className="w-6 h-6" />, color: 'bg-card' },
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
    <div className="pb-24">
      <Header title="Watch" showBack onBack={() => setView('watch')} />
      
      <div className="px-4 mt-4">
        {!selectedSource ? (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search platforms..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
              />
            </div>

            <h2 className="text-lg font-bold mb-4">Select Source</h2>
            <div className="grid grid-cols-2 gap-4">
              {filteredSources.map(source => (
                <button 
                  key={source.id}
                  onClick={() => {
                    setSelectedSource(source);
                    setRoomTitle(`${source.name} Party`);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-2xl gap-3 transition-transform active:scale-95",
                    source.color
                  )}
                >
                  {source.icon}
                  <span className="text-xs font-bold">{source.name}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 text-center">
            <div className={cn("w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6", selectedSource.color)}>
              {selectedSource.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">Setup your {selectedSource.name} Room</h2>
            <p className="text-gray-500 mb-8 text-sm">Give your watch party a name.</p>
            
            <input 
              type="text" 
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder="Enter room title..."
              className="w-full bg-card p-4 rounded-2xl text-center font-bold text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
              autoFocus
            />

            <textarea 
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-card p-4 rounded-2xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] h-20 resize-none"
            />

            <div className="space-y-2 mb-8">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block text-left px-2">Direct Video URL (Optional)</label>
              <input 
                type="url" 
                value={roomVideoUrl}
                onChange={(e) => setRoomVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-card p-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
              />
              <p className="text-[10px] text-gray-600 text-left px-2">Leave empty to use the default demo video.</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedSource(null)}
                className="flex-1 bg-card py-4 rounded-2xl font-bold"
              >
                Back
              </button>
              <button 
                onClick={handleCreateRoom}
                className="flex-[2] bg-[#0A84FF] py-4 rounded-2xl font-bold text-white"
              >
                Start Party
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
