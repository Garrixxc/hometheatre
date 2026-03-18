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
      label: 'Create a YouTube watch party',
      action: () => setView('sources'),
    },
    {
      label: 'Share a direct MP4 link',
      action: () => setView('sources'),
    },
    {
      label: 'Pick a streaming platform and invite friends',
      action: () => setView('sources'),
    },
  ];

  return (
    <div className="page-shell">
      <Header
        title="Watch together, without the chaos."
        subtitle="Find live rooms, start one fast, and jump between phone and laptop without losing sync."
        rightElement={
          <button onClick={() => setView('sources')} className="primary-button whitespace-nowrap !px-5 !py-3 text-sm">
            Create Room
          </button>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="hero-panel rounded-[2rem] p-6 md:p-8">
          <p className="section-label mb-4">Shared Cinema</p>
          <h2 className="page-title max-w-2xl">Beautiful live rooms for movie nights, streams, and YouTube hangs.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted md:text-base">
            Jump into live rooms, invite your people, and keep playback in sync across phones and laptops.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Active rooms', value: rooms.length || 0 },
              { label: 'Live viewers', value: rooms.reduce((sum, room) => sum + (room.participantsCount || 0), 0) || 0 },
              { label: 'Sources ready', value: 6 },
            ].map((item) => (
              <div key={item.label} className="glass-panel rounded-[1.4rem] p-4">
                <p className="text-2xl font-extrabold tracking-[-0.05em]">{item.value}</p>
                <p className="mt-1 text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setView('sources')} className="primary-button">
              Start a room
            </button>
            <button onClick={() => setView('watch')} className="secondary-button">
              Browse live rooms
            </button>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <p className="section-label mb-4">Quick Find</p>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search shows, creators, or room names"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="soft-input pl-12"
            />
          </label>
          <div className="mt-6 space-y-3">
            {quickActions.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="block w-full rounded-[1.2rem] border border-border/70 bg-background/50 px-4 py-3 text-left text-sm text-muted transition-colors hover:border-[var(--accent)]/30 hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
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

      <section className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <div>
            <p className="section-label">Trending</p>
            <h3 className="text-2xl font-extrabold tracking-[-0.05em]">Popular on YouTube</h3>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {trending.length > 0
            ? trending.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setView('sources')}
                  className="glass-panel flex flex-col gap-4 rounded-[1.6rem] p-4 text-left sm:flex-row"
                >
                  <img
                    src={item.snippet.thumbnails.high.url}
                    alt={item.snippet.title}
                    className="aspect-video w-full rounded-[1.1rem] object-cover sm:w-56"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="section-label mb-2">Featured pick</p>
                    <h4 className="line-clamp-2 text-lg font-extrabold tracking-[-0.04em]">{item.snippet.title}</h4>
                    <p className="mt-2 truncate text-sm text-muted">{item.snippet.channelTitle}</p>
                    <p className="mt-3 text-sm font-semibold text-accent">
                      {(parseInt(item.statistics.viewCount, 10) / 1000000).toFixed(1)}M views
                    </p>
                  </div>
                </motion.button>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="glass-panel h-36 animate-pulse rounded-[1.6rem]" />
              ))}
        </div>
      </section>
    </div>
  );
};
