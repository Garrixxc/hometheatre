import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { collection, query, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { cn } from '../../lib/utils';

export const InviteModal = ({ 
  roomId, 
  roomTitle, 
  onClose 
}: { 
  roomId: string, 
  roomTitle: string, 
  onClose: () => void 
}) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== user?.uid);
      setUsers(userData);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'users'));
    return unsubscribe;
  }, [user]);

  const handleInvite = async (targetUser: UserProfile) => {
    if (!user) return;
    setInvitingIds(prev => new Set(prev).add(targetUser.uid));
    try {
      await addDoc(collection(db, 'invitations'), {
        fromId: user.uid,
        fromName: user.displayName || 'Anonymous',
        toId: targetUser.uid,
        roomId,
        roomTitle,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'invitations');
    } finally {
      setInvitingIds(prev => {
        const next = new Set(prev);
        next.delete(targetUser.uid);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold">Invite Friends</h2>
          <button onClick={onClose} className="p-2 text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {users.map(u => (
            <div key={u.uid} className="flex items-center justify-between bg-card p-3 rounded-2xl">
              <div className="flex items-center gap-3">
                <img src={u.photoURL || `https://i.pravatar.cc/150?u=${u.uid}`} className="w-10 h-10 rounded-full" alt={u.displayName} />
                <div>
                  <p className="font-bold text-sm">{u.displayName}</p>
                  <p className="text-[10px] text-gray-500">{u.status === 'online' ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <button 
                onClick={() => handleInvite(u)}
                disabled={invitingIds.has(u.uid)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
                  invitingIds.has(u.uid) ? "bg-gray-700 text-gray-400" : "bg-[#0A84FF] text-white"
                )}
              >
                {invitingIds.has(u.uid) ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
