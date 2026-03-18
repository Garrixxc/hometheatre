import React, { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { addDoc, collection, limit, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Check, Copy, Link2, Loader2, Search, Send, Share2, UserPlus, Users, X } from 'lucide-react';
import { db } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { cn } from '../../lib/utils';

export const InviteModal = ({
  roomId,
  roomTitle,
  onClose,
}: {
  roomId: string;
  roomTitle: string;
  onClose: () => void;
}) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [linkState, setLinkState] = useState<'idle' | 'copied' | 'shared'>('idle');

  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.origin);
    url.searchParams.set('room', roomId);
    return url.toString();
  }, [roomId]);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(30));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userData = snapshot.docs
          .map((doc) => ({ uid: doc.data().uid || doc.id, ...doc.data() } as UserProfile))
          .filter((candidate) => candidate.uid !== user?.uid);

        setUsers(userData);
        setLoading(false);
      },
      (e) => {
        handleFirestoreError(e, OperationType.LIST, 'users');
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [user]);

  const filteredUsers = useMemo(() => {
    const normalized = queryText.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((candidate) =>
      [candidate.displayName, candidate.email].some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [queryText, users]);

  const handleInvite = async (targetUser: UserProfile) => {
    if (!user) return;

    setInvitingIds((prev) => new Set(prev).add(targetUser.uid));
    try {
      await addDoc(collection(db, 'invitations'), {
        fromId: user.uid,
        fromName: user.displayName || 'Anonymous',
        toId: targetUser.uid,
        roomId,
        roomTitle,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'invitations');
    } finally {
      setInvitingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.uid);
        return next;
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkState('copied');
      window.setTimeout(() => setLinkState('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy invite link', error);
    }
  };

  const handleShareLink = async () => {
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: roomTitle,
        text: `Join me in ${roomTitle} on HomeTheatre.`,
        url: inviteLink,
      });
      setLinkState('shared');
      window.setTimeout(() => setLinkState('idle'), 2000);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to share invite link', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/92 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">Invite Friends</p>
              <h2 className="truncate text-2xl font-extrabold tracking-[-0.05em]">{roomTitle}</h2>
              <p className="mt-2 text-sm text-slate-400">Pick people from your network and send them straight into this room.</p>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-white/10 p-3 text-slate-400 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Invite Link</p>
                <p className="mt-2 text-sm text-slate-400">Copy or share a direct room link that opens this watch party.</p>
              </div>
              <Link2 className="mt-1 h-5 w-5 shrink-0 text-[#6eb7ff]" />
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
              <p className="truncate">{inviteLink}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleCopyLink}
                className="flex-1 rounded-2xl bg-[#6eb7ff] px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-[#94caff]"
              >
                {linkState === 'copied' ? (
                  <>
                    <Check className="mr-2 inline h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 inline h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                {linkState === 'shared' ? (
                  <>
                    <Check className="mr-2 inline h-4 w-4" />
                    Shared
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 inline h-4 w-4" />
                    Share Link
                  </>
                )}
              </button>
            </div>
          </div>

          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-[#6eb7ff] focus:outline-none focus:ring-4 focus:ring-[#6eb7ff]/15"
            />
          </label>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#6eb7ff]" />
              <p className="mt-4 text-sm text-slate-400">Loading available friends...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                {users.length === 0 ? <Users className="h-7 w-7 text-slate-400" /> : <Search className="h-7 w-7 text-slate-400" />}
              </div>
              <h3 className="mt-5 text-xl font-bold">
                {users.length === 0 ? 'No other users found yet' : 'No matches for that search'}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
                {users.length === 0
                  ? 'Once more people sign in to HomeTheatre, they will appear here and you can invite them into this room.'
                  : 'Try a different name or email address.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((candidate) => {
                const inviting = invitingIds.has(candidate.uid);

                return (
                  <div
                    key={candidate.uid}
                    className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={candidate.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.uid}`}
                        className="h-12 w-12 rounded-2xl object-cover"
                        alt={candidate.displayName}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{candidate.displayName || 'Anonymous'}</p>
                        <p className="truncate text-xs text-slate-400">{candidate.email || 'No email available'}</p>
                        <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                          {candidate.status === 'online' ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInvite(candidate)}
                      disabled={inviting}
                      className={cn(
                        'shrink-0 rounded-2xl px-4 py-2 text-sm font-bold transition-all',
                        inviting
                          ? 'bg-white/8 text-slate-500'
                          : 'bg-[#6eb7ff] text-slate-950 hover:bg-[#94caff]',
                      )}
                    >
                      {inviting ? (
                        <>
                          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                          Sending
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 inline h-4 w-4" />
                          Invite
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
          <UserPlus className="mr-2 inline h-4 w-4" />
          Invitations are sent in-app and appear in the recipient&apos;s notifications tab.
        </div>
      </motion.div>
    </div>
  );
};
