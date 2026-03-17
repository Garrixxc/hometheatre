import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
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
    <div className="pb-24">
      <Header title="Social" rightElement={<button className="text-[#0A84FF] font-medium">Add Friend</button>} />
      
      <section className="mt-6 px-4">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Friends</h2>
        {loadingFriends ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {friends.map(friend => (
              <div key={friend.id} className={cn("flex items-center justify-between", friend.status === 'offline' && "opacity-60")}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={friend.avatar || `https://i.pravatar.cc/150?u=${friend.id}`} alt={friend.name} className="w-10 h-10 rounded-full" />
                    {friend.status === 'online' && (
                      <div className="absolute right-0 bottom-0 w-3 h-3 bg-[#32D74B] border-2 border-black rounded-full" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{friend.name || 'Anonymous'}</span>
                </div>
                <span className={cn("text-xs font-medium", friend.status === 'online' ? "text-[#32D74B]" : "text-gray-500")}>
                  {friend.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 px-4">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Recent Activity</h2>
        {loadingActivities ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No recent activity.</p>
            ) : (
              activities.map(activity => (
                <div key={activity.id} className="flex gap-4">
                  {activity.thumbnail && <img src={activity.thumbnail} alt={activity.target} className="w-20 h-28 object-cover rounded-lg shadow-lg shrink-0" />}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={activity.userAvatar || `https://i.pravatar.cc/150?u=${activity.userId}`} className="w-5 h-5 rounded-full" alt={activity.userName} />
                      <p className="text-sm"><span className="font-bold">{activity.userName}</span> {activity.action}</p>
                    </div>
                    <h3 className="font-bold text-base">{activity.target}</h3>
                    {activity.comment && <p className="text-xs text-gray-500 mt-1 italic">{activity.comment}</p>}
                    <p className="text-[10px] text-[#0A84FF] mt-2 font-semibold">
                      {activity.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
