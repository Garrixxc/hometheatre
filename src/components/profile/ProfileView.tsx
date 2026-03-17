import React, { useState, useEffect, useContext } from 'react';
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
    <div className="pb-24">
      <Header 
        title="Profile" 
        rightElement={
          <button onClick={logout} className="text-red-500">
            <LogOut className="w-6 h-6" />
          </button>
        } 
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="flex flex-col items-center mt-6 px-6">
          <img src={user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`} alt={user.displayName || ''} className="w-20 h-20 rounded-full mb-3 border-4 border-card" />
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-xs text-gray-400 mb-6">{user.email}</p>
          
          <div className="w-full mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Appearance</h3>
            <button 
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 bg-card rounded-2xl transition-all hover:opacity-90"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg">
                  <Settings className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <span className="font-medium">Theme</span>
              </div>
              <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full">
                <span className="text-xs font-bold uppercase tracking-wider">{theme}</span>
              </div>
            </button>
          </div>

          <div className="w-full mb-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Connected Platforms</h3>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map(p => (
                <button 
                  key={p.id}
                  onClick={() => toggleSubscription(p.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-all",
                    profile?.subscriptions?.includes(p.id) ? p.color : "bg-card grayscale opacity-50"
                  )}
                >
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  {profile?.subscriptions?.includes(p.id) ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full space-y-3">
            <button className="w-full bg-card p-4 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-semibold">My Rooms</span>
              <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600" />
            </button>
            <button className="w-full bg-card p-4 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-semibold">Watch History</span>
              <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600" />
            </button>
            <button className="w-full bg-card p-4 rounded-2xl flex items-center justify-between">
              <span className="text-sm font-semibold">Settings</span>
              <ChevronLeft className="w-4 h-4 rotate-180 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
