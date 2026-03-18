import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeContext, ThemeProvider } from './context/ThemeContext';
import { 
  ErrorBoundary, 
  BottomNav 
} from './components/common/UI';
import { HomeView } from './components/home/HomeView';
import { SocialView } from './components/social/SocialView';
import { WatchView } from './components/watch/WatchView';
import { SourcesView } from './components/watch/SourcesView';
import { WatchRoomView } from './components/room/WatchRoomView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { LoginView } from './components/auth/LoginView';
import { View, Invitation } from './types';
import { handleFirestoreError, OperationType } from './lib/error';

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);
  const [view, setView] = useState<View>('home');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const roomIdFromUrl = params.get('room');

    if (roomIdFromUrl) {
      setActiveRoomId(roomIdFromUrl);
      setView('watch');
    }
  }, [user]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (view === 'watch' && activeRoomId) {
      url.searchParams.set('room', activeRoomId);
    } else {
      url.searchParams.delete('room');
    }

    window.history.replaceState({}, '', url.toString());
  }, [view, activeRoomId]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'invitations'), 
      where('toId', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'invitations'));
    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--accent-soft)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!user) return <LoginView />;

  return (
    <div className="app-shell min-h-screen text-foreground font-sans selection:bg-[var(--accent-soft)]">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HomeView 
              onJoinRoom={(id) => { setActiveRoomId(id); setView('watch'); }} 
              setView={setView}
            />
            <BottomNav activeView={view} setView={setView} notificationCount={pendingInvitations.length} />
          </motion.div>
        )}
        {view === 'social' && (
          <motion.div key="social" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SocialView />
            <BottomNav activeView={view} setView={setView} notificationCount={pendingInvitations.length} />
          </motion.div>
        )}
        {view === 'watch' && !activeRoomId && (
          <motion.div key="watch-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WatchView setView={setView} setActiveRoomId={setActiveRoomId} />
            <BottomNav activeView={view} setView={setView} notificationCount={pendingInvitations.length} />
          </motion.div>
        )}
        {view === 'sources' && (
          <motion.div key="sources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SourcesView user={user} setView={setView} setActiveRoomId={setActiveRoomId} />
          </motion.div>
        )}
        {view === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <NotificationsView setView={setView} setActiveRoomId={setActiveRoomId} />
            <BottomNav activeView={view} setView={setView} notificationCount={pendingInvitations.length} />
          </motion.div>
        )}
        {view === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfileView />
            <BottomNav activeView={view} setView={setView} notificationCount={pendingInvitations.length} />
          </motion.div>
        )}
        {view === 'watch' && activeRoomId && (
          <motion.div key="watch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-[100]">
            <WatchRoomView roomId={activeRoomId} onBack={() => { setActiveRoomId(null); setView('home'); }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
