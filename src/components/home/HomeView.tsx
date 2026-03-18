import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Clock3, Flame, Play, Search, Sparkles, Users } from 'lucide-react';
import { db } from '../../firebase';
import { Room, View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header } from '../common/UI';
import { hydrateRoom, resolveLiveRooms } from '../../lib/rooms';

export const HomeView = ({
  onJoinRoom,
  setView,
}: {
  onJoinRoom: (roomId: string) => void;
  setView: (view: View) => void;
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const roomData = snapshot.docs.map(hydrateRoom);
        const liveRooms = await resolveLiveRooms(roomData);
        setRooms(liveRooms);
        setLoading(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.LIST, 'rooms');
        setLoading(false);
      },
    );

    if (YOUTUBE_API_KEY) {
      fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=6&regionCode=US&key=${YOUTUBE_API_KEY}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.items) {
            setTrending(data.items);
          }
        })
        .catch((err) => console.error('Trending fetch error:', err));
    }

    return unsubscribe;
  }, [YOUTUBE_API_KEY]);

  const filteredRooms = rooms.filter((room) => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return true;

    return [room.title, room.hostName, room.platform, room.type]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalized));
  });

  const quickActions = [
    {
      label: 'YouTube Party',
      icon: <Play className="h-5 w-5" />,
      color: 'bg-red-500/10 text-red-500',
      action: () => setView('sources'),
    },
    {
      label: 'MP4 Link',
      icon: <Search className="h-5 w-5" />,
      color: 'bg-blue-500/10 text-blue-500',
      action: () => setView('sources'),
    },
    {
      label: 'Invite Friends',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-500/10 text-purple-500',
      action: () => setView('sources'),
    },
    {
      label: 'Live Streams',
      icon: <Flame className="h-5 w-5" />,
      color: 'bg-orange-500/10 text-orange-500',
      action: () => setView('sources'),
    },
  ];

  return (
    <div className="page-shell">
      <Header
        title="Watch together, without the chaos."
        subtitle="Real-time watch parties for you and your friends."
        rightElement={
          <button onClick={() => setView('sources')} className="primary-button whitespace-nowrap !px-5 !py-3 text-sm">
            Create Room
          </button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="relative overflow-hidden rounded-[2.5rem] hero-panel min-h-[400px] flex flex-col justify-end p-8 md:p-10">
          <img 
            src="/assets/images/hero-bg.png" 
            alt="Hero Background" 
            className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          <div className="relative z-10">
            <p className="section-label mb-3 text-white/80">Shared Cinema</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl leading-[1.1]">
              Beautiful live rooms for movie nights and YouTube hangs.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70">
              Jump into live rooms, invite your people, and keep playback in sync across all devices.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <div className="flex -space-x-3 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-slate-800" />
                ))}
              </div>
              <p className="text-sm font-medium text-white/60">
                <span className="text-white font-bold">{rooms.length * 4 + 12}</span> people watching now
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setView('sources')} className="primary-button !py-4 !px-8">
                Start a room
              </button>
              <button onClick={() => setView('watch')} className="secondary-button !bg-white/10 !text-white !border-white/10 backdrop-blur-md">
                Browse live rooms
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="glass-panel flex-1 rounded-[2.5rem] p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="section-label">Quick Actions</p>
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="group relative flex flex-col gap-3 rounded-[1.8rem] bg-background/40 p-5 text-left transition-all hover:bg-background/60 hover:scale-[1.02] border border-transparent hover:border-border"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-bold tracking-tight">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel flex-1 rounded-[2.5rem] p-8">
            <p className="section-label mb-6">Search Anything</p>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Shows, creators, or rooms..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="soft-input pl-12 bg-background/30 rounded-2xl"
              />
            </label>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Active', value: rooms.length || 0 },
                { label: 'Live', value: rooms.reduce((sum, room) => sum + (room.participantsCount || 0), 0) || 0 },
                { label: 'Sources', value: 6 },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xl font-black">{item.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted font-bold mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="section-label mb-2">Live Rooms</p>
            <h3 className="text-2xl font-extrabold tracking-[-0.05em]">Ready to join now</h3>
          </div>
          <button onClick={() => setView('watch')} className="text-sm font-semibold text-accent">
            View all
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="glass-panel h-64 animate-pulse rounded-[1.75rem]" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="hero-panel rounded-[2rem] p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
              <Sparkles className="h-7 w-7" />
            </div>
            <h4 className="text-xl font-extrabold tracking-[-0.04em]">
              {searchQuery.trim() ? 'No matching live rooms' : 'No one is live yet'}
            </h4>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              {searchQuery.trim()
                ? 'Try another title, creator, or platform.'
                : 'Start the first room and set the tone for tonight&apos;s watch party.'}
            </p>
            <button onClick={() => setView('sources')} className="primary-button mt-6">
              {searchQuery.trim() ? 'Create a new room' : 'Create the first room'}
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room, idx) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => onJoinRoom(room.id)}
                className="glass-panel overflow-hidden rounded-[1.75rem] text-left transition-transform"
              >
                <div className="relative aspect-video bg-slate-900">
                  {room.thumbnail ? (
                    <img src={room.thumbnail} alt={room.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0f6fff] to-[#102142] text-white">
                      <Play className="h-12 w-12 fill-white/20" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white">
                    {room.platform || room.type}
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="text-xl font-extrabold tracking-[-0.04em]">{room.title}</h4>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    Hosted by {room.hostName}. Jump in and stay synced with the room in real time.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                    <span className="rounded-full bg-background/60 px-3 py-1">
                      <Users className="mr-1 inline h-3.5 w-3.5" />
                      {room.participantsCount || 1} watching
                    </span>
                    <span className="rounded-full bg-background/60 px-3 py-1">
                      <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                      Active now
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="section-label !mb-0">Trending</p>
              <h3 className="text-2xl font-extrabold tracking-tight">Popular on YouTube</h3>
            </div>
          </div>
          <button onClick={() => setView('sources')} className="text-sm font-bold text-accent hover:underline">
            See more
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {trending.length > 0
            ? trending.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setView('sources')}
                  className="glass-panel group overflow-hidden flex flex-col gap-6 rounded-[2.2rem] p-5 text-left sm:flex-row transition-all hover:scale-[1.01]"
                >
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-[1.6rem] sm:w-56">
                    <img
                      src={item.snippet.thumbnails.high.url}
                      alt={item.snippet.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                      HD
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Featured pick</p>
                    <h4 className="line-clamp-2 text-lg font-extrabold tracking-tight leading-[1.3] group-hover:text-accent transition-colors">{item.snippet.title}</h4>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-800" />
                      <p className="truncate text-sm font-semibold text-muted">{item.snippet.channelTitle}</p>
                    </div>
                  </div>
                </motion.button>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-panel h-40 animate-pulse rounded-[2.2rem]" />
              ))}
        </div>
      </section>
    </div>
  );
};
