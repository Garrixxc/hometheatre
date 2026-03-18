import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ChevronRight, Play, Plus, Radio, Users } from 'lucide-react';
import { db } from '../../firebase';
import { Room, View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';

export const WatchView = ({
  setView,
  setActiveRoomId,
}: {
  setView: (v: View) => void;
  setActiveRoomId: (id: string) => void;
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roomData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Room));
        setRooms(roomData);
        setLoading(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.LIST, 'rooms');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <div className="page-shell">
      <Header
        title="Live watch rooms"
        rightElement={
          <button onClick={() => setView('sources')} className="primary-button !p-3" aria-label="Create room">
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <section className="hero-panel mt-6 rounded-[2rem] p-6 md:p-8">
        <p className="section-label mb-3">Live Now</p>
        <h2 className="text-3xl font-extrabold tracking-[-0.06em] md:text-5xl">Find a room and drop straight in.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted md:text-base">
          Each room stays synced for everyone, whether they join from a phone on the couch or a laptop at a desk.
        </p>
      </section>

      <div className="mt-8">
        {loading ? (
          <LoadingSpinner label="Loading live rooms..." />
        ) : rooms.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
              <Play className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-[-0.05em]">No active rooms yet</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              Start a new watch party and this space becomes the live lobby for everyone else.
            </p>
            <button onClick={() => setView('sources')} className="primary-button mt-6">
              Start a room
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {rooms.map((room, index) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => {
                  setActiveRoomId(room.id);
                  setView('watch');
                }}
                className="glass-panel flex flex-col gap-5 rounded-[1.8rem] p-5 text-left sm:flex-row sm:items-center"
              >
                <div className="flex h-24 w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#0f6fff] to-[#102142] text-white sm:w-24">
                  <Play className="h-10 w-10 fill-white/20" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
                      <Radio className="mr-1 inline h-3.5 w-3.5" />
                      Live
                    </span>
                    {room.platform ? (
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-accent">
                        {room.platform}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-2xl font-extrabold tracking-[-0.05em]">{room.title}</h3>
                  <p className="mt-2 text-sm text-muted">Hosted by {room.hostName}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                    <Users className="h-4 w-4" />
                    <span>{room.participantsCount || 1} people watching</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/70">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
