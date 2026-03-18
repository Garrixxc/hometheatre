import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Users } from 'lucide-react';
import { signInWithGoogle } from '../../firebase';

export const LoginView = () => (
  <div className="app-shell flex min-h-screen items-center justify-center py-10">
    <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel relative overflow-hidden rounded-[2.4rem] p-8 md:p-12"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[var(--accent)] text-white shadow-[0_24px_60px_rgba(15,111,255,0.28)]">
            <Play className="h-9 w-9 fill-white/20" />
          </div>
          <p className="section-label mt-8">HomeTheatre</p>
          <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.08em] md:text-7xl">Host a room that actually feels premium.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-muted">
            Sync playback, invite friends, and create a polished shared-screening experience from anywhere.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="glass-panel rounded-[1.4rem] p-4">
              <Sparkles className="h-6 w-6 text-accent" />
              <p className="mt-3 font-bold">Refined watch spaces</p>
              <p className="mt-2 text-sm text-muted">Designed for modern phones and widescreen laptops.</p>
            </div>
            <div className="glass-panel rounded-[1.4rem] p-4">
              <Users className="h-6 w-6 text-accent" />
              <p className="mt-3 font-bold">Invite your crew</p>
              <p className="mt-2 text-sm text-muted">Rooms, messaging, and live coordination built in.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-panel flex flex-col justify-center rounded-[2.4rem] p-8 md:p-12"
      >
        <p className="section-label">Welcome back</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] md:text-4xl">Sign in and start your next watch party.</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          Google sign-in keeps the setup quick and your profile synced across devices.
        </p>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={signInWithGoogle}
          className="primary-button mt-8 flex w-full items-center justify-center gap-3 !rounded-[1.2rem] !py-4 text-base"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </motion.button>

        <p className="mt-5 text-sm text-muted">Firebase handles authentication and keeps the sign-in flow secure.</p>
      </motion.section>
    </div>
  </div>
);
