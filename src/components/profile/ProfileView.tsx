import React, { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { LogOut, MonitorCog, MoonStar, Plus, Tv2 } from 'lucide-react';
import { db, logout } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header, LoadingSpinner } from '../common/UI';
import { cn } from '../../lib/utils';

export const ProfileView = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        }
        setLoading(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  const toggleSubscription = async (platform: string) => {
    if (!user || !profile) return;

    const currentSubs = profile.subscriptions || [];
    const newSubs = currentSubs.includes(platform)
      ? currentSubs.filter((s) => s !== platform)
      : [...currentSubs, platform];

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptions: newSubs,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (!user) return null;

  const platforms = [
    { id: 'netflix', name: 'Netflix', accent: 'bg-[#E50914]' },
    { id: 'disney', name: 'Disney+', accent: 'bg-[#0057D8]' },
    { id: 'prime', name: 'Prime Video', accent: 'bg-[#00A8E1]' },
    { id: 'hulu', name: 'Hulu', accent: 'bg-[#1CE783]' },
  ];

  return (
    <div className="page-shell">
      <Header
        title="Your profile and viewing setup"
        rightElement={
          <button onClick={logout} className="secondary-button !p-3 text-[var(--danger)]" aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </button>
        }
      />

      {loading ? (
        <div className="mt-6">
          <LoadingSpinner label="Loading your profile..." />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="hero-panel rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="relative">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt={user.displayName || ''}
                  className="h-28 w-28 rounded-[1.75rem] object-cover shadow-[var(--shadow-lg)]"
                />
                <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-lg">
                  <Plus className="h-5 w-5" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="section-label mb-2">Account</p>
                <h2 className="text-3xl font-extrabold tracking-[-0.06em]">{user.displayName}</h2>
                <p className="mt-2 break-all text-sm text-muted">{user.email}</p>
                <div className="mt-4 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready to host
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <p className="section-label mb-4">Preferences</p>
            <div className="space-y-4">
              <button onClick={toggleTheme} className="flex w-full items-center justify-between rounded-[1.4rem] border border-border/70 bg-background/60 p-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
                    {theme === 'dark' ? <MoonStar className="h-6 w-6" /> : <MonitorCog className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-bold">Appearance</p>
                    <p className="text-sm text-muted">{theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}</p>
                  </div>
                </div>
                <div className="rounded-full bg-card px-3 py-1 text-sm font-semibold text-accent">Toggle</div>
              </button>

              <div className="rounded-[1.4rem] border border-border/70 bg-background/60 p-4">
                <div className="flex items-center gap-3">
                  <Tv2 className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-bold">Connected services</p>
                    <p className="text-sm text-muted">Choose what you usually watch with friends.</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {platforms.map((platform) => {
                    const active = profile?.subscriptions?.includes(platform.id);

                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={platform.id}
                        onClick={() => toggleSubscription(platform.id)}
                        className={cn(
                          'rounded-[1.25rem] border p-4 text-left transition-all',
                          active
                            ? `${platform.accent} border-transparent text-white shadow-lg`
                            : 'border-border/70 bg-card/70',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{platform.name}</span>
                          <span className={cn('text-xs font-semibold', active ? 'text-white/90' : 'text-muted')}>
                            {active ? 'Connected' : 'Add'}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
