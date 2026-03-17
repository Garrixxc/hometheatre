import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity as ActivityIcon } from 'lucide-react';
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
      setLoadingActivities(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'activity');
      setLoadingActivities(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFriends(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().displayName, 
        avatar: doc.data().photoURL, 
        status: doc.data().status 
      } as Friend)));
      setLoadingFriends(false);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, 'users');
      setLoadingFriends(false);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="pb-32 bg-background">
      <Header title="Social" rightElement={
        <button className="bg-[#0A84FF] text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-tighter shadow-lg shadow-[#0A84FF]/20">
          Add Friend
        </button>
      } />
      
      <section className="mt-8 px-6">
        <h2 className="text-xl font-black text-white mb-6 tracking-tight">Friends</h2>
        {loadingFriends ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {friends.map(friend => (
              <motion.div 
                key={friend.id} 
                whileHover={{ scale: 1.02, x: 4 }}
                className={cn(
                  "flex items-center justify-between p-4 bg-[#1c1c1e] rounded-2xl border border-white/5 shadow-xl transition-all",
                  friend.status === 'offline' && "opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`} 
                      alt={friend.name} 
                      className="w-12 h-12 rounded-2xl border border-white/10" 
                    />
                    {friend.status === 'online' && (
                      <div className="absolute -right-1 -bottom-1 w-4 h-4 bg-[#32D74B] border-[3px] border-[#1c1c1e] rounded-full shadow-lg" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-white">{friend.name || 'Anonymous'}</span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", friend.status === 'online' ? "text-[#32D74B]" : "text-gray-500")}>
                      {friend.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ActivityIcon className="w-5 h-5 text-gray-500" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 px-6">
        <h2 className="text-xl font-black text-white mb-6 tracking-tight">Recent Activity</h2>
        {loadingActivities ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="p-8 bg-[#1c1c1e] rounded-3xl border border-white/5 text-center">
                <p className="text-gray-500 text-sm italic">No recent activity. Tell your friends to watch something!</p>
              </div>
            ) : (
              activities.map(activity => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={activity.id} 
                  className="flex gap-5 p-4 bg-[#1c1c1e] rounded-3xl border border-white/5 shadow-2xl"
                >
                  {activity.thumbnail && (
                    <div className="relative">
                      <img src={activity.thumbnail} alt={activity.target} className="w-24 h-32 object-cover rounded-2xl shadow-2xl ring-1 ring-white/10" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={activity.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.userId}`} className="w-6 h-6 rounded-full border border-white/10" alt={activity.userName} />
                      <p className="text-xs text-gray-300">
                        <span className="font-black text-white">{activity.userName}</span> {activity.action}
                      </p>
                    </div>
                    <h3 className="font-black text-lg text-white leading-tight mb-2">{activity.target}</h3>
                    {activity.comment && (
                      <div className="bg-white/5 px-3 py-2 rounded-xl mb-3">
                        <p className="text-[11px] text-gray-400 italic line-clamp-2">"{activity.comment}"</p>
                      </div>
                    )}
                    <p className="text-[10px] text-[#0A84FF] font-black uppercase tracking-widest">
                      {activity.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
