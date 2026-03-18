import React, { useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Bell, Check, Play, X } from 'lucide-react';
import { db } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { Invitation, View } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Header } from '../common/UI';

export const NotificationsView = ({
  setView,
  setActiveRoomId,
}: {
  setView: (v: View) => void;
  setActiveRoomId: (id: string) => void;
}) => {
  const { user } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'invitations'), where('toId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInvitations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invitation)));
      },
      (e) => handleFirestoreError(e, OperationType.LIST, 'invitations'),
    );
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
    <div className="page-shell">
      <Header title="Invites and updates" />

      <div className="mt-6">
        {invitations.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-10 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted" />
            <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.05em]">Your inbox is clear</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
              New watch-party invites and updates will appear here as they come in.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="glass-panel rounded-[1.6rem] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-accent">
                    <Play className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base leading-7">
                      <span className="font-bold">{invitation.fromName}</span> invited you to join{' '}
                      <span className="font-bold text-accent">{invitation.roomTitle || 'a watch party'}</span>.
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {invitation.timestamp?.toDate().toLocaleString() || 'Just now'}
                    </p>
                  </div>
                </div>

                {invitation.status === 'pending' ? (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button onClick={() => handleAction(invitation, 'declined')} className="secondary-button flex-1">
                      <X className="mr-2 inline h-4 w-4" />
                      Decline
                    </button>
                    <button onClick={() => handleAction(invitation, 'accepted')} className="primary-button flex-1">
                      <Check className="mr-2 inline h-4 w-4" />
                      Accept
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 rounded-full bg-background/60 px-4 py-2 text-center text-sm font-semibold text-muted">
                    {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
