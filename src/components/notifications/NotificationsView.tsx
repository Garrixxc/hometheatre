import React, { useState, useEffect, useContext } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Bell, Play } from 'lucide-react';
import { db } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { Invitation, View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header } from '../common/UI';

export const NotificationsView = ({ 
  setView, 
  setActiveRoomId 
}: { 
  setView: (v: View) => void, 
  setActiveRoomId: (id: string) => void 
}) => {
  const { user } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'invitations'), 
      where('toId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'invitations'));
    return unsubscribe;
  }, [user]);

  const handleAction = async (invitation: Invitation, status: 'accepted' | 'declined') => {
    try {
      await updateDoc(doc(db, 'invitations', invitation.id), { status });
      if (status === 'accepted') {
        setActiveRoomId(invitation.roomId);
        setView('watch');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `invitations/${invitation.id}`);
    }
  };

  return (
    <div className="pb-24">
      <Header title="Notifications" />
      <div className="px-4 mt-4 space-y-4">
        {invitations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No new notifications.</p>
          </div>
        ) : (
          invitations.map(inv => (
            <div key={inv.id} className="bg-card p-4 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A84FF]/20 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{inv.fromName}</span> invited you to join <span className="font-bold text-[#0A84FF]">{inv.roomTitle || 'a watch party'}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {inv.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
                  </p>
                </div>
              </div>
              {inv.status === 'pending' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(inv, 'declined')}
                    className="flex-1 bg-background py-2 rounded-xl text-xs font-bold"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleAction(inv, 'accepted')}
                    className="flex-1 bg-[#0A84FF] py-2 rounded-xl text-xs font-bold text-white"
                  >
                    Accept
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-center text-gray-500 uppercase font-bold tracking-wider">
                  {inv.status === 'accepted' ? 'Accepted' : 'Declined'}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
