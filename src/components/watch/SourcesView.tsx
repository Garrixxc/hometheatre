import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Clapperboard, HardDrive, Search, Youtube } from 'lucide-react';
import { db } from '../../firebase';
import { View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header } from '../common/UI';
import { cn } from '../../lib/utils';
import { YouTubeDiscovery } from './YouTubeDiscovery';

type Source = {
  id: string;
  name: string;
  accent: string;
  icon: React.ReactNode;
  summary: string;
};

export const SourcesView = ({
  user,
  setView,
  setActiveRoomId,
}: {
  user: FirebaseUser;
  setView: (v: View) => void;
  setActiveRoomId: (id: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomVideoUrl, setRoomVideoUrl] = useState('');
  const [isSearchingYouTube, setIsSearchingYouTube] = useState(false);

  const sources: Source[] = [
    {
      id: 'youtube',
      name: 'YouTube',
      accent: 'from-rose-500/20 to-red-500/5',
      icon: <Youtube className="h-8 w-8 text-rose-500" />,
      summary: 'Pick a public or unlisted video and launch in seconds.',
    },
    {
      id: 'netflix',
      name: 'Netflix',
      accent: 'from-[#E50914]/20 to-[#E50914]/5',
      icon: <Clapperboard className="h-8 w-8 text-[#E50914]" />,
      summary: 'Share a title link and sync the watch session.',
    },
    {
      id: 'disney',
      name: 'Disney+',
      accent: 'from-[#0057D8]/20 to-[#0057D8]/5',
      icon: <Clapperboard className="h-8 w-8 text-[#0057D8]" />,
      summary: 'Great for family nights and big-screen marathons.',
    },
    {
      id: 'prime',
      name: 'Prime Video',
      accent: 'from-[#00A8E1]/20 to-[#00A8E1]/5',
      icon: <Clapperboard className="h-8 w-8 text-[#00A8E1]" />,
      summary: 'Start a room around a Prime link or trailer.',
    },
    {
      id: 'hotstar',
      name: 'Hotstar',
      accent: 'from-[#01147C]/20 to-[#01147C]/5',
      icon: <Clapperboard className="h-8 w-8 text-[#01147C]" />,
      summary: 'Useful for sports streams, shows, and live events.',
    },
    {
      id: 'movie',
      name: 'Direct Link',
      accent: 'from-slate-500/20 to-slate-500/5',
      icon: <HardDrive className="h-8 w-8 text-slate-500" />,
      summary: 'Paste an MP4 or M3U8 link for direct playback.',
    },
  ];

  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
        participantsCount: 0,
        createdAt: serverTimestamp(),
        playbackState: 'paused',
        currentTime: 0,
        type: selectedSource.id,
        platform: selectedSource.id,
      });
      setActiveRoomId(docRef.id);
      setView('watch');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'rooms');
    }
  };

  return (
    <div className="page-shell">
      <Header
        title={selectedSource?.id === 'youtube' ? 'Find your YouTube video' : 'Create a watch room'}
        showBack
        onBack={() => {
          if (isSearchingYouTube) setIsSearchingYouTube(false);
          else if (selectedSource) setSelectedSource(null);
          else setView('watch');
        }}
      />

      {!selectedSource ? (
        <div className="mt-6 space-y-6">
          <section className="hero-panel rounded-[2rem] p-6 md:p-8">
            <p className="section-label mb-3">Room Setup</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.06em] md:text-5xl">Choose a source that matches how your group watches.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              The setup flow stays clean on mobile and desktop, while giving you fast access to YouTube, direct links, and streaming platforms.
            </p>
          </section>

          <section className="glass-panel rounded-[1.8rem] p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search platforms"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="soft-input pl-12"
              />
            </label>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSources.map((source, index) => (
              <motion.button
                key={source.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setSelectedSource(source);
                  setRoomTitle(`${source.name} Party`);
                  setRoomDescription('');
                  setRoomVideoUrl('');
                  if (source.id === 'youtube') {
                    setIsSearchingYouTube(true);
                  }
                }}
                className={cn(
                  'glass-panel overflow-hidden rounded-[1.8rem] p-5 text-left',
                  'bg-gradient-to-br',
                  source.accent,
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 dark:bg-black/20">
                  {source.icon}
                </div>
                <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.05em]">{source.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{source.summary}</p>
              </motion.button>
            ))}
          </section>
        </div>
      ) : selectedSource.id === 'youtube' && isSearchingYouTube ? (
        <div className="mt-6">
          <YouTubeDiscovery
            onSelect={(video) => {
              if (video.id === 'custom') {
                setIsSearchingYouTube(false);
                return;
              }

              setRoomVideoUrl(`https://www.youtube.com/watch?v=${video.id}`);
              setRoomTitle(video.title);
              setRoomDescription(`Watch together from ${video.channel}.`);
              setIsSearchingYouTube(false);
            }}
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className={cn('hero-panel rounded-[2rem] p-6 md:p-8 bg-gradient-to-br', selectedSource.accent)}>
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-white/70 dark:bg-black/25">
              {selectedSource.icon}
            </div>
            <p className="section-label mt-6">Selected source</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em]">{selectedSource.name}</h2>
            <p className="mt-4 text-sm leading-6 text-muted">{selectedSource.summary}</p>
            {['netflix', 'hotstar', 'disney', 'prime'].includes(selectedSource.id) ? (
              <div className="mt-6 rounded-[1.3rem] border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-300">
                Everyone in the room should be signed in to their own streaming account. HomeTheatre will sync the session around the link you provide.
              </div>
            ) : null}
          </section>

          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-5">
              <div>
                <label className="section-label">Room title</label>
                <input
                  type="text"
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="Movie night with friends"
                  className="soft-input mt-2"
                />
              </div>

              <div>
                <label className="section-label">Description</label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="What are you watching tonight?"
                  rows={4}
                  className="soft-input mt-2 resize-none"
                />
              </div>

              <div>
                <label className="section-label">Video URL</label>
                <input
                  type="url"
                  value={roomVideoUrl}
                  onChange={(e) => setRoomVideoUrl(e.target.value)}
                  placeholder={
                    selectedSource.id === 'youtube'
                      ? 'https://youtube.com/watch?v=...'
                      : selectedSource.id === 'movie'
                        ? 'https://example.com/video.mp4'
                        : 'Paste the show or stream link'
                  }
                  className="soft-input mt-2"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleCreateRoom} className="primary-button flex-1">
                Launch room
              </button>
              <button
                onClick={() => {
                  setSelectedSource(null);
                  setIsSearchingYouTube(false);
                }}
                className="secondary-button flex-1"
              >
                Change platform
              </button>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
};
