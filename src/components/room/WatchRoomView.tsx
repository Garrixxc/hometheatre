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
  X
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
  arrayRemove 
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
  const [newQueueUrl, setNewQueueUrl] = useState('');
  const [newQueueTitle, setNewQueueTitle] = useState('');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const initialSyncDone = useRef(false);

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
        
        if (videoRef.current && user?.uid !== data.hostId) {
          const video = videoRef.current;
          
          if (!initialSyncDone.current && video.readyState >= 1) {
            video.currentTime = data.currentTime;
            if (data.playbackState === 'playing') {
              video.play().catch(() => {});
            }
            initialSyncDone.current = true;
            setIsSyncing(false);
          }

          if (initialSyncDone.current) {
            if (data.playbackState === 'playing' && video.paused) {
              video.play().catch(() => {});
            } else if (data.playbackState === 'paused' && !video.paused) {
              video.pause();
            }

            const drift = Math.abs(video.currentTime - data.currentTime);
            if (drift > 2) {
              video.currentTime = data.currentTime;
            }
          }
        } else if (isHost) {
          setIsSyncing(false);
        }
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `rooms/${roomId}`));
    return unsubscribe;
  }, [roomId, user?.uid, isHost]);

  useEffect(() => {
    if (!isHost || !room || !videoRef.current) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;
      try {
        await updateDoc(doc(db, 'rooms', roomId), {
          currentTime: videoRef.current.currentTime,
          playbackState: videoRef.current.paused ? 'paused' : 'playing',
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to update host playback state", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, roomId, room?.id]);

  useEffect(() => {
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, `rooms/${roomId}/messages`));
    return unsubscribe;
  }, [roomId]);

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
    if (!isHost || !videoRef.current) return;
    const newState = videoRef.current.paused ? 'playing' : 'paused';
    if (newState === 'playing') videoRef.current.play();
    else videoRef.current.pause();

    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        playbackState: newState,
        currentTime: videoRef.current.currentTime
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleSeek = async (time: number) => {
    if (!isHost || !videoRef.current) return;
    videoRef.current.currentTime = time;
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
    if (!isHost || !videoRef.current) return;
    setLocalCurrentTime(time);
    videoRef.current.currentTime = time;
  };

  const handleScrubEnd = async () => {
    if (!isHost || !videoRef.current) return;
    setIsScrubbing(false);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        currentTime: videoRef.current.currentTime
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
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

  const handleAddToQueue = async () => {
    if (!isHost || !newQueueUrl.trim() || !newQueueTitle.trim()) return;
    
    const getThumbnail = (url: string) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
          return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
        }
      }
      return `https://picsum.photos/seed/${Math.random()}/320/180`;
    };

    const newItem: QueueItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newQueueTitle,
      videoUrl: newQueueUrl,
      thumbnail: getThumbnail(newQueueUrl)
    };
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        queue: arrayUnion(newItem)
      });
      setNewQueueUrl('');
      setNewQueueTitle('');
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

  const handlePlayNext = async () => {
    if (!isHost || !room?.queue || room.queue.length === 0) return;
    const nextItem = room.queue[0];
    const remainingQueue = room.queue.slice(1);
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        videoUrl: nextItem.videoUrl,
        title: nextItem.title,
        currentTime: 0,
        playbackState: 'playing',
        queue: remainingQueue
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${roomId}`);
    }
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
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <section className="relative w-full aspect-video bg-black flex items-center justify-center group">
        <video 
          ref={videoRef}
          src={room.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
          className="w-full h-full object-contain"
          playsInline
          muted={!isHost}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
            if (!isHost && room && !initialSyncDone.current) {
              videoRef.current!.currentTime = room.currentTime;
              if (room.playbackState === 'playing') {
                videoRef.current!.play().catch(() => {});
              }
              initialSyncDone.current = true;
              setIsSyncing(false);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setLocalCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => {
            if (isHost) updateDoc(doc(db, 'rooms', roomId), { playbackState: 'playing' });
          }}
          onPause={() => {
            if (isHost) updateDoc(doc(db, 'rooms', roomId), { playbackState: 'paused' });
          }}
          onEnded={() => {
            if (isHost) handlePlayNext();
          }}
        />

        <AnimatePresence>
          {isSyncing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10"
            >
              <div className="w-12 h-12 border-4 border-[#0A84FF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-gray-400">Syncing with host...</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-between items-start">
            <button onClick={onBack} className="p-2 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 bg-green-500/80 px-3 py-1 rounded-full text-[10px] font-bold">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>{isHost ? 'HOSTING' : 'LIVE SYNC'}</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-8">
            <button 
              onClick={() => isHost && handleSeek(Math.max(0, localCurrentTime - 10))}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              disabled={!isHost}
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button 
              onClick={togglePlayback}
              className="p-6 bg-white text-black rounded-full hover:scale-105 transition-transform shadow-xl"
              disabled={!isHost}
            >
              {room.playbackState === 'playing' ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black ml-1" />}
            </button>

            <button 
              onClick={() => isHost && handleSeek(Math.min(duration, localCurrentTime + 10))}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              disabled={!isHost}
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          <div className="w-full space-y-3">
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
              {/* Hover Preview Line */}
              {hoverTime !== null && isHost && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-0"
                  style={{ left: `${(hoverTime / duration) * 100}%` }}
                />
              )}
              
              {/* Hover Time Tooltip */}
              {hoverTime !== null && (
                <div 
                  className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-white -translate-x-1/2 pointer-events-none"
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
                onTouchStart={() => isHost && setIsScrubbing(true)}
                onChange={(e) => isHost && handleScrubChange(parseFloat(e.target.value))}
                onMouseUp={() => isHost && handleScrubEnd()}
                onTouchEnd={() => isHost && handleScrubEnd()}
                disabled={!isHost}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              
              <div 
                className="absolute top-0 left-0 h-full bg-[#0A84FF] rounded-full z-10" 
                style={{ width: `${(localCurrentTime / (duration || 1)) * 100}%` }} 
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 opacity-0 group-hover/seek:opacity-100 transition-opacity"
                style={{ left: `calc(${(localCurrentTime / (duration || 1)) * 100}% - 7px)` }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-[11px] font-medium text-gray-300 tabular-nums">
                  <span>{Math.floor(localCurrentTime / 60)}:{(Math.floor(localCurrentTime % 60)).toString().padStart(2, '0')}</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="opacity-50">{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                </div>

                <div className="flex items-center gap-2 group/volume">
                  <button onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 flex items-center">
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#0A84FF]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isHost && (
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = room.currentTime;
                        if (room.playbackState === 'playing') videoRef.current.play();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#0A84FF]/20 text-[#0A84FF] rounded-full text-[10px] font-bold hover:bg-[#0A84FF]/30 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    RE-SYNC
                  </button>
                )}
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  LIVE
                </div>
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <header className="px-6 py-4 bg-[#1c1c1e] border-b border-white/5 flex items-center justify-between shadow-lg z-10">
        <div className="flex flex-col">
          <h2 className="text-base font-black text-white leading-tight tracking-tight">{room.title}</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#32D74B] rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{room.participantsCount || 1} watching now</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <button 
              onClick={() => setShowQueue(!showQueue)}
              className={cn(
                "p-2.5 rounded-2xl transition-all border", 
                showQueue ? "bg-[#0A84FF] border-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20" : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          )}
          {isHost && (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <button 
            onClick={() => setShowInviteModal(true)}
            className="bg-[#0A84FF] text-white px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-tighter shadow-lg shadow-[#0A84FF]/20 hover:scale-105 transition-transform"
          >
            Invite
          </button>
        </div>
      </header>

      {showInviteModal && (
        <InviteModal 
          roomId={roomId} 
          roomTitle={room.title} 
          onClose={() => setShowInviteModal(false)} 
        />
      )}

      {showSettingsModal && (
        <RoomSettingsModal 
          room={room} 
          onClose={() => setShowSettingsModal(false)} 
        />
      )}

      <AnimatePresence>
        {showQueue && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#1c1c1e] border-b border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Playback Queue</h3>
                <span className="text-[10px] text-gray-500">{room.queue?.length || 0} items</span>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Video Title"
                    value={newQueueTitle}
                    onChange={(e) => setNewQueueTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-[#0A84FF]"
                  />
                  <input 
                    type="text" 
                    placeholder="Video URL"
                    value={newQueueUrl}
                    onChange={(e) => setNewQueueUrl(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-[#0A84FF]"
                  />
                </div>
                <button 
                  onClick={handleAddToQueue}
                  className="bg-[#0A84FF] text-white px-4 rounded-lg hover:bg-[#0A84FF]/80 transition-colors flex items-center justify-center"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
              </div>

              <Reorder.Group 
                axis="y" 
                values={room.queue || []} 
                onReorder={handleReorder}
                className="space-y-2 max-h-64 overflow-y-auto no-scrollbar"
              >
                {room.queue && room.queue.length > 0 ? (
                  room.queue.map((item) => (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      className="flex items-center justify-between bg-card border border-border/50 p-2 rounded-xl group cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isHost && (
                          <div className="text-gray-600">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <div className="w-20 h-12 bg-background rounded-lg overflow-hidden flex-shrink-0 border border-border/20">
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{item.title}</span>
                          <span className="text-[9px] text-gray-500 truncate">{item.videoUrl}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRemoveFromQueue(item.id)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </Reorder.Item>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-600 italic text-center py-4">Queue is empty</p>
                )}
              </Reorder.Group>
              
              {room.queue && room.queue.length > 0 && (
                <button 
                  onClick={handlePlayNext}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-colors"
                >
                  PLAY NEXT
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative">
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id}
            msg={msg}
            user={user}
            isHost={isHost}
            isMuted={room?.mutedUsers?.includes(msg.senderId) || false}
            moderatingUser={moderatingUser}
            setModeratingUser={setModeratingUser}
            onMute={handleMuteUser}
            onKick={handleKickUser}
          />
        ))}
      </div>

      <footer className="p-6 bg-[#1c1c1e] border-t border-white/5 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4">
          <button className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Plus className="w-6 h-6" />
          </button>
          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={room?.mutedUsers?.includes(user?.uid || '')}
              className={cn(
                "w-full bg-black/40 border border-white/10 rounded-3xl py-4 px-6 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0A84FF]/50 focus:ring-4 focus:ring-[#0A84FF]/10 transition-all",
                room?.mutedUsers?.includes(user?.uid || '') && "opacity-50 cursor-not-allowed bg-gray-900"
              )} 
              placeholder={room?.mutedUsers?.includes(user?.uid || '') ? "You are muted in this room" : "Type a message..."} 
            />
            <button 
              onClick={handleSend}
              disabled={room?.mutedUsers?.includes(user?.uid || '') || !inputValue.trim()}
              className={cn(
                "absolute right-3 top-2.5 p-2 rounded-2xl transition-all shadow-lg",
                inputValue.trim() ? "bg-[#0A84FF] text-white shadow-[#0A84FF]/20" : "bg-white/5 text-gray-600 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

      <AICompanion 
        mediaTitle={room.title} 
        chatHistory={messages.map(m => `${m.senderName}: ${m.text}`)} 
      />
    </div>
  );
};
