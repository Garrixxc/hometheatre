import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Activity as ActivityIcon, ArrowUpRight, Users2 } from 'lucide-react';
import { db } from '../../firebase';
import { Activity, Friend } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';
import { cn } from '../../lib/utils';

export const SocialView = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'activity'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActivities(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Activity)));
        setLoadingActivities(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.LIST, 'activity');
        setLoadingActivities(false);
      },
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(20));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setFriends(
          snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                name: doc.data().displayName,
                avatar: doc.data().photoURL,
                status: doc.data().status,
              }) as Friend,
          ),
        );
        setLoadingFriends(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.LIST, 'users');
        setLoadingFriends(false);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <div className="page-shell">
      <Header title="Your people and their latest activity" />

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-panel rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-label mb-2">Friends</p>
              <h2 className="text-2xl font-extrabold tracking-[-0.05em]">Watch circle</h2>
            </div>
            <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-accent">
              {friends.length} connected
            </div>
          </div>

          {loadingFriends ? (
            <LoadingSpinner label="Loading your friends..." />
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <motion.div
                  key={friend.id}
                  whileHover={{ y: -2 }}
                  className={cn(
                    'flex items-center justify-between rounded-[1.35rem] border border-border/70 bg-background/60 p-4 transition-all',
                    friend.status === 'offline' && 'opacity-70',
                  )}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative">
                      <img
                        src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                        alt={friend.name}
                        className="h-14 w-14 rounded-[1rem] object-cover"
                      />
                      <span
                        className={cn(
                          'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background',
                          friend.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">{friend.name || 'Anonymous'}</p>
                      <p className="text-sm text-muted">{friend.status === 'online' ? 'Online now' : 'Offline'}</p>
                    </div>
                  </div>
                  <button className="secondary-button !p-3">
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
              {friends.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-border p-6 text-center text-sm text-muted">
                  No friends found yet. Once profiles start appearing in Firestore, this panel will populate automatically.
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="glass-panel rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-label mb-2">Recent Activity</p>
              <h2 className="text-2xl font-extrabold tracking-[-0.05em]">What everyone is watching</h2>
            </div>
            <Users2 className="h-6 w-6 text-accent" />
          </div>

          {loadingActivities ? (
            <LoadingSpinner label="Loading recent activity..." />
          ) : activities.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border p-8 text-center">
              <ActivityIcon className="mx-auto h-10 w-10 text-muted" />
              <p className="mt-4 text-sm text-muted">No recent activity yet. Start a room and it will begin appearing here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.5rem] border border-border/70 bg-background/60 p-4"
                >
                  <div className="flex gap-4">
                    {activity.thumbnail ? (
                      <img
                        src={activity.thumbnail}
                        alt={activity.target}
                        className="h-24 w-20 rounded-[1rem] object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={activity.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userId}`}
                          alt={activity.userName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <p className="text-sm text-muted">
                          <span className="font-bold text-foreground">{activity.userName}</span> {activity.action}
                        </p>
                      </div>
                      <h3 className="mt-3 text-lg font-extrabold tracking-[-0.04em]">{activity.target}</h3>
                      {activity.comment ? (
                        <p className="mt-2 rounded-xl bg-card/70 px-3 py-2 text-sm italic text-muted">&quot;{activity.comment}&quot;</p>
                      ) : null}
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                        {activity.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
