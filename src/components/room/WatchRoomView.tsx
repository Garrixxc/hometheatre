import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RefreshCw, 
  Maximize, 
  VolumeX, 
  Volume1, 
  Volume2, 
  ListMusic, 
  Settings, 
  Plus, 
  Send,
  ListPlus,
  GripVertical,
  X,
  Share2
} from 'lucide-react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  setDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthContext } from '../../context/AuthContext';
import { Room, Message, QueueItem } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { cn } from '../../lib/utils';
import { RoomSettingsModal } from './RoomSettingsModal';
import { InviteModal } from './InviteModal';
import { MessageItem } from './MessageItem';
import { AICompanion } from './AICompanion';
import { UniversalPlayer } from './UniversalPlayer';
import { QueueSearch } from './QueueSearch';

export const WatchRoomView = ({ roomId, onBack }: { roomId: string, onBack: () => void }) => {
  const { user } = useContext(AuthContext);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHost = user?.uid === room?.hostId;
  const [isSyncing, setIsSyncing] = useState(true);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [moderatingUser, setModeratingUser] = useState<string | null>(null);
  const [showQueue, setShowQueue] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false);
  const [participants, setParticipants] = useState<{uid: string, name: string, joinedAt: any}[]>([]);
  const initialSyncDone = useRef(false);
  const isLeaving = useRef(false);

  useEffect(() => {
    if (room && user && room.kickedUsers?.includes(user.uid)) {
      onBack();
    }
  }, [room?.kickedUsers, user?.uid, onBack]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (document) => {
      if (document.exists()) {
        const data = { id: document.id, ...document.data() } as Room;
        setRoom(data);
        
        // Track local time for Guests with latency compensation
        if (!isHost) {
          const lastUpdated = data.lastUpdated?.toDate?.()?.getTime() || Date.now();
          const now = Date.now();
          const latencyMillis = now - lastUpdated;
          const compensatedTime = data.playbackState === 'playing' 
            ? data.currentTime + (latencyMillis / 1000)
            : data.currentTime;

          const drift = Math.abs(localCurrentTime - compensatedTime);
          if (drift > 3) { // tighter threshold with compensation
            setLocalCurrentTime(compensatedTime);
          }
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `rooms/${roomId}`));
    return unsubscribe;
  }, [roomId, isHost, localCurrentTime]);

  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, `rooms/${roomId}/messages`));
    return unsubscribe;
  }, [roomId]);

  // 3. Participant Tracking & Cleanup
  useEffect(() => {
    if (!user || !roomId) return;

    const participantDocRef = doc(db, 'rooms', roomId, 'participants', user.uid);
    const roomRef = doc(db, 'rooms', roomId);

    // Add self to participants
    const joinRoom = async () => {
      try {
        await setDoc(participantDocRef, {
          uid: user.uid,
          name: user.displayName || 'Anonymous',
          joinedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error joining room participants:", e);
      }
    };

    joinRoom();

    // Listen to participants for host migration info
    const participantsQuery = query(collection(db, 'rooms', roomId, 'participants'), orderBy('joinedAt', 'asc'));
    const unsubscribeParticipants = onSnapshot(participantsQuery, (snapshot) => {
      const pList = snapshot.docs.map(d => d.data() as {uid: string, name: string, joinedAt: any});
      setParticipants(pList);

      updateDoc(roomRef, {
        participantsCount: snapshot.size,
        lastUpdated: serverTimestamp()
      }).catch((error) => {
        console.error("Error syncing participant count:", error);
      });
    });

    // Cleanup on Leave
    return () => {
      if (isLeaving.current) return;
      isLeaving.current = true;

      const leaveRoom = async () => {
        try {
          // 1. Remove self from participants
          await deleteDoc(participantDocRef);

          // 2. Fetch remaining participants to decide next step
          const remainingSnap = await getDocs(participantsQuery);
          const remaining = remainingSnap.docs
            .map(d => d.data() as {uid: string, name: string})
            .filter(p => p.uid !== user.uid);

          if (remaining.length === 0) {
            // Room is empty, delete it
            await deleteDoc(roomRef);
          } else if (user.uid === room?.hostId) {
            // Host is leaving, migrate host to the next person in line
            const nextHost = remaining[0];
            await updateDoc(roomRef, {
              hostId: nextHost.uid,
              hostName: nextHost.name,
              lastUpdated: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Error during room cleanup:", e);
        }
      };

      leaveRoom();
      unsubscribeParticipants();
    };
  }, [roomId, user?.uid, room?.hostId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !user) return;
    const text = inputValue;
    setInputValue('');
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        senderAvatar: user.photoURL,
        timestamp: serverTimestamp(),
        type: 'message'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `rooms/${roomId}/messages`);
    }
  };

  const togglePlayback = async () => {
    if (!isHost || !room) return;
    const newState = room.playbackState === 'playing' ? 'paused' : 'playing';
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        playbackState: newState,
        currentTime: localCurrentTime
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleSeek = async (time: number) => {
    if (!isHost) return;
    setLocalCurrentTime(time);
    
    if (!isScrubbing) {
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          currentTime: time
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
      }
    }
  };

  const handleScrubChange = (time: number) => {
    if (!isHost) return;
    setLocalCurrentTime(time);
  };

  const handleScrubEnd = async () => {
    if (!isHost) return;
    setIsScrubbing(false);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        currentTime: localCurrentTime
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleMuteUser = async (userId: string) => {
    if (!isHost || !room) return;
    const isCurrentlyMuted = room.mutedUsers?.includes(userId);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        mutedUsers: isCurrentlyMuted ? arrayRemove(userId) : arrayUnion(userId)
      });
      setModeratingUser(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleKickUser = async (userId: string) => {
    if (!isHost || !room) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        kickedUsers: arrayUnion(userId)
      });
      setModeratingUser(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleAddToQueue = async (video: { title: string; videoUrl: string; thumbnail: string }) => {
    if (!isHost) return;
    
    const newItem: QueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: video.title,
      videoUrl: video.videoUrl,
      thumbnail: video.thumbnail
    };
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        queue: arrayUnion(newItem)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleReorder = async (newQueue: QueueItem[]) => {
    if (!isHost || !room) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        queue: newQueue
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handlePlayItem = async (item: QueueItem) => {
    if (!isHost) return;
    
    // Remove the item from queue if it exists there
    const newQueue = room?.queue?.filter(i => i.id !== item.id) || [];
    
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        videoUrl: item.videoUrl,
        title: item.title,
        currentTime: 0,
        playbackState: 'playing',
        queue: newQueue,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handlePlayNext = async () => {
    if (!isHost) return;

    // 1. If queue has items, play the first one
    if (room?.queue && room.queue.length > 0) {
      const nextItem = room.queue[0];
      handlePlayItem(nextItem);
      return;
    }

    // 2. If queue is empty, try Autoplay (fetch related video)
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    const extractId = (url: string) => {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const currentId = room?.videoUrl ? extractId(room.videoUrl) : null;
    if (API_KEY && currentId) {
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&relatedToVideoId=${currentId}&type=video&key=${API_KEY}`
        );
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const next = data.items[0];
          const nextItem: QueueItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: next.snippet.title,
            videoUrl: `https://www.youtube.com/watch?v=${next.id.videoId}`,
            thumbnail: next.snippet.thumbnails.medium?.url || next.snippet.thumbnails.default?.url
          };
          
          await updateDoc(doc(db, 'rooms', roomId), {
            videoUrl: nextItem.videoUrl,
            title: nextItem.title,
            currentTime: 0,
            playbackState: 'playing',
            lastUpdated: serverTimestamp()
          });
          return;
        }
      } catch (err) {
        console.error('Autoplay Error:', err);
      }
    }

    // 3. Last fallback: just reset or do nothing
    console.log("No next video found for autoplay");
  };

  const handleRemoveFromQueue = async (itemId: string) => {
    if (!isHost || !room?.queue) return;
    const updatedQueue = room.queue.filter(item => item.id !== itemId);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        queue: updatedQueue
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  if (!room) return <div className="h-screen bg-background text-foreground flex items-center justify-center">Loading room...</div>;

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0a0b] overflow-hidden">
      {/* Left Column: Video & Controls */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 h-full lg:h-screen">
        <section className="relative w-full aspect-video lg:aspect-auto lg:flex-1 bg-black flex items-center justify-center group overflow-hidden">
          <UniversalPlayer 
            videoUrl={room.videoUrl}
            platform={room.platform || 'movie'}
            playbackState={room.playbackState}
            currentTime={localCurrentTime}
            isHost={isHost}
            onReady={() => setIsSyncing(false)}
            onAutoplayBlocked={() => !isHost && setShowAutoplayOverlay(true)}
            onTimeUpdate={async (time) => {
              setLocalCurrentTime(time);
              if (isHost && Math.abs(time - room.currentTime) > 2) {
                try {
                  await updateDoc(doc(db, 'rooms', roomId), { 
                    currentTime: time,
                    lastUpdated: serverTimestamp()
                  });
                } catch (e) {
                  console.error("Failed to update host time", e);
                }
              }
            }}
            onPlaybackChange={async (state) => {
              if (isHost && state !== room.playbackState) {
                try {
                  await updateDoc(doc(db, 'rooms', roomId), { 
                    playbackState: state,
                    currentTime: localCurrentTime,
                    lastUpdated: serverTimestamp()
                  });
                } catch (e) {
                  console.error("Failed to update host playback state", e);
                }
              }
            }}
            onDurationChange={(d) => setDuration(d)}
            onEnded={() => {
              if (isHost) handlePlayNext();
            }}
            volume={volume}
            isMuted={isMuted}
          />

          <AnimatePresence>
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30"
              >
                <div className="w-12 h-12 border-4 border-[#0A84FF] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-gray-500">Syncing Engine...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAutoplayOverlay && !isSyncing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-40"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAutoplayOverlay(false);
                    setVolume(v => v); 
                  }}
                  className="group relative flex flex-col items-center gap-6"
                >
                  <div className="w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-10 h-10 fill-black ml-1.5" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Join the Party</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">Click to unmute & start syncing</p>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="absolute inset-0 flex flex-col justify-between p-4 lg:p-8 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="flex justify-between items-start">
              <button onClick={onBack} className="p-3 rounded-2xl bg-black/50 backdrop-blur-xl hover:bg-black/70 transition-all border border-white/5">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-2 bg-[#32D74B]/80 px-4 py-1.5 rounded-full text-[10px] font-black border border-white/10">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="uppercase tracking-widest">{isHost ? 'HOSTING' : 'LIVE SYNC'}</span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-10">
              <button 
                onClick={() => isHost && handleSeek(Math.max(0, localCurrentTime - 10))}
                className="p-3 hover:bg-white/10 rounded-full transition-colors hidden sm:block"
                disabled={!isHost}
              >
                <SkipBack className="w-8 h-8" />
              </button>
              
              <button 
                onClick={togglePlayback}
                className="p-8 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-2xl"
                disabled={!isHost}
              >
                {room.playbackState === 'playing' ? <Pause className="w-10 h-10 fill-black" /> : <Play className="w-10 h-10 fill-black ml-1.5" />}
              </button>

              <button 
                onClick={() => isHost && handleSeek(Math.min(duration, localCurrentTime + 10))}
                className="p-3 hover:bg-white/10 rounded-full transition-colors hidden sm:block"
                disabled={!isHost}
              >
                <SkipForward className="w-8 h-8" />
              </button>
            </div>

            <div className="w-full space-y-4">
              <div 
                className="group/seek relative h-1.5 hover:h-2 w-full bg-white/20 rounded-full cursor-pointer transition-all duration-200"
                onMouseMove={(e) => {
                  if (!duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  setHoverTime(percent * duration);
                }}
                onMouseLeave={() => setHoverTime(null)}
              >
                {hoverTime !== null && (
                  <div 
                    className="absolute bottom-full mb-4 px-3 py-1.5 bg-black/80 backdrop-blur-xl rounded-xl text-[10px] font-black text-white -translate-x-1/2 pointer-events-none border border-white/10 shadow-2xl"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {Math.floor(hoverTime / 60)}:{(Math.floor(hoverTime % 60)).toString().padStart(2, '0')}
                  </div>
                )}

                <input 
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={localCurrentTime}
                  onMouseDown={() => isHost && setIsScrubbing(true)}
                  onChange={(e) => isHost && handleScrubChange(parseFloat(e.target.value))}
                  onMouseUp={() => isHost && handleScrubEnd()}
                  disabled={!isHost}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                
                <div 
                  className="absolute top-0 left-0 h-full bg-[#0A84FF] rounded-full z-10" 
                  style={{ width: `${(localCurrentTime / (duration || 1)) * 100}%` }} 
                />
              </div>
              
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-6">
                  <div className="flex items-center text-[11px] font-black text-gray-300 tabular-nums uppercase tracking-widest">
                    <span>{Math.floor(localCurrentTime / 60)}:{(Math.floor(localCurrentTime % 60)).toString().padStart(2, '0')}</span>
                    <span className="mx-2 opacity-30">/</span>
                    <span className="opacity-50">{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-3 group/volume">
                    <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-24 lg:w-32 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#0A84FF]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isHost && (
                    <button 
                      onClick={() => setLocalCurrentTime(room.currentTime)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Sync Now
                    </button>
                  )}
                  <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Room Header Info (Desktop) */}
        <header className="px-6 py-6 bg-[#151516] flex items-center justify-between border-b border-white/5 z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-white tracking-tight uppercase">{room.title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{room.participantsCount || 1} Watching</span>
              <div className="w-1 h-1 bg-gray-700 rounded-full" />
              <span className="text-[10px] font-black text-[#0A84FF] uppercase tracking-[0.2em]">{room.platform || 'movie'} Party</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#0A84FF] hover:text-white transition-all"
            >
              Invite
            </button>
            {isHost && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </header>
      </div>

      {/* Right Column: Chat & Queue (Side panel on Desktop, Vertical on Mobile) */}
      <div className="w-full lg:w-[450px] flex flex-col bg-[#151516] h-[50vh] lg:h-screen">
        <div className="flex items-center border-b border-white/5 p-2 bg-[#1c1c1e]">
          <button 
            onClick={() => setShowQueue(false)}
            className={cn(
              "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
              !showQueue ? "bg-white/5 text-white" : "text-gray-500 hover:text-white"
            )}
          >
            Chat History
          </button>
          {isHost && (
            <button 
              onClick={() => setShowQueue(true)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all",
                showQueue ? "bg-[#0A84FF] text-white" : "text-gray-500 hover:text-white"
              )}
            >
              Playlist
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {showQueue && isHost ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar space-y-8">
              <QueueSearch 
                currentVideoUrl={room.videoUrl} 
                onAdd={handleAddToQueue} 
              />

              <div className="flex-1 space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Up Next ({room.queue?.length || 0})</p>
                <Reorder.Group axis="y" values={room.queue || []} onReorder={handleReorder} className="space-y-3">
                  {room.queue?.map(item => (
                    <Reorder.Item 
                      key={item.id} 
                      value={item} 
                      className="bg-black/40 border border-white/5 p-3 rounded-2xl flex items-center gap-4 group cursor-pointer hover:border-[#0A84FF]/30 transition-all"
                      onClick={() => isHost && handlePlayItem(item)}
                    >
                      <div className="relative w-20 h-12 bg-gray-900 rounded-lg overflow-hidden flex-none">
                        <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-white truncate uppercase group-hover:text-[#0A84FF] transition-colors">{item.title}</p>
                        <p className="text-[9px] text-gray-600 truncate">{item.videoUrl}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromQueue(item.id);
                        }} 
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
              
              {room.queue && room.queue.length > 0 && (
                <button 
                  onClick={handlePlayNext}
                  className="w-full py-4 bg-white/5 hover:bg-white text-gray-400 hover:text-black rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all mt-auto"
                >
                  Skip to Next
                </button>
              )}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {messages.map((msg) => (
                  <MessageItem 
                    key={msg.id}
                    msg={msg}
                    user={user}
                    isHost={isHost}
                    isMuted={room?.mutedUsers?.includes(msg.senderId) || false}
                    isAdmin={msg.senderId === room?.hostId}
                    moderatingUser={moderatingUser}
                    setModeratingUser={setModeratingUser}
                    onMute={handleMuteUser}
                    onKick={handleKickUser}
                  />
                ))}
              </div>

              <div className="p-6 bg-[#1c1c1e] border-t border-white/5">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={room?.mutedUsers?.includes(user?.uid || '')}
                    className={cn(
                      "w-full bg-black/40 border border-white/5 rounded-3xl py-4 pl-6 pr-14 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0A84FF]/40 transition-all",
                      room?.mutedUsers?.includes(user?.uid || '') && "opacity-30 cursor-not-allowed"
                    )} 
                    placeholder={room?.mutedUsers?.includes(user?.uid || '') ? "Chat Restricted" : "Type a message..."} 
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className={cn(
                      "absolute right-2 top-2 p-2.5 rounded-2xl transition-all shadow-xl",
                      inputValue.trim() ? "bg-[#0A84FF] text-white" : "bg-white/5 text-gray-700"
                    )}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteModal roomId={roomId} roomTitle={room.title} onClose={() => setShowInviteModal(false)} />
      )}
      {showSettingsModal && (
        <RoomSettingsModal room={room} onClose={() => setShowSettingsModal(false)} />
      )}

      <AICompanion mediaTitle={room.title} chatHistory={messages.map(m => `${m.senderName}: ${m.text}`)} />
    </div>
  );
};
