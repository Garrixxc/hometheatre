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
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginView />;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#0A84FF]/30">
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HomeView onJoinRoom={(id) => { setActiveRoomId(id); setView('watch'); }} />
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
            <WatchRoomView roomId={activeRoomId} onBack={() => setView('home')} />
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
