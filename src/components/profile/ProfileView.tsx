import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { LogOut, Settings, ChevronLeft, Plus } from 'lucide-react';
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
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const toggleSubscription = async (platform: string) => {
    if (!user || !profile) return;
    const currentSubs = profile.subscriptions || [];
    const newSubs = currentSubs.includes(platform) 
      ? currentSubs.filter(s => s !== platform)
      : [...currentSubs, platform];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        subscriptions: newSubs
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (!user) return null;

  const platforms = [
    { id: 'netflix', name: 'Netflix', color: 'bg-[#E50914]' },
    { id: 'disney', name: 'Disney+', color: 'bg-[#006E99]' },
    { id: 'prime', name: 'Prime Video', color: 'bg-[#00A8E1]' },
    { id: 'hulu', name: 'Hulu', color: 'bg-[#1CE783]' }
  ];

  return (
    <div className="pb-32 bg-background">
      <Header 
        title="Profile" 
        rightElement={
          <button onClick={logout} className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all group">
            <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
          </button>
        } 
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col items-center mt-8 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-6"
          >
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={user.displayName || ''} 
              className="w-28 h-28 rounded-[2.5rem] border-4 border-[#1c1c1e] shadow-2xl ring-1 ring-white/10" 
            />
            <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-[#0A84FF] rounded-2xl flex items-center justify-center border-4 border-background shadow-lg">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-black text-white mb-1">{user.displayName}</h2>
          <p className="text-sm text-gray-400 font-medium mb-10">{user.email}</p>
          
          <div className="w-full mb-10">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">Preferences</h3>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-5 bg-[#1c1c1e] rounded-[2rem] border border-white/5 shadow-xl transition-all hover:border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0A84FF]/10 rounded-2xl">
                  <Settings className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Appearance</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{theme} mode active</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-background rounded-full relative p-1 transition-colors">
                <motion.div 
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  className="w-4 h-4 bg-[#0A84FF] rounded-full shadow-lg" 
                />
              </div>
            </motion.button>
          </div>

          <div className="w-full mb-10">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 px-2">Connected Platforms</h3>
            <div className="grid grid-cols-2 gap-4">
              {platforms.map(p => (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  key={p.id}
                  onClick={() => toggleSubscription(p.id)}
                  className={cn(
                    "flex flex-col items-start p-4 rounded-3xl transition-all border shadow-lg",
                    profile?.subscriptions?.includes(p.id) 
                      ? `${p.color} border-white/20` 
                      : "bg-[#1c1c1e] border-white/5 grayscale opacity-40"
                  )}
                >
                  <div className="w-full flex justify-between items-center mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      {profile?.subscriptions?.includes(p.id) ? (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      ) : (
                        <Plus className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{p.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="w-full space-y-4">
            {['My Rooms', 'Watch History', 'Settings'].map((item) => (
              <motion.button 
                key={item}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#1c1c1e] p-5 rounded-[2rem] border border-white/5 flex items-center justify-between shadow-xl hover:border-white/10 group transition-all"
              >
                <span className="text-sm font-bold text-white">{item}</span>
                <ChevronLeft className="w-5 h-5 rotate-180 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
