import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Youtube as YoutubeIcon, Lock as LockIcon } from 'lucide-react';

interface UniversalPlayerProps {
  videoUrl: string | null;
  platform: string;
  playbackState: 'playing' | 'paused';
  currentTime: number;
  isHost: boolean;
  onTimeUpdate: (time: number) => void;
  onPlaybackChange: (state: 'playing' | 'paused') => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  onReady?: () => void;
  onAutoplayBlocked?: () => void;
  volume?: number;
  isMuted?: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export const UniversalPlayer = ({
  videoUrl,
  platform,
  playbackState,
  currentTime,
  isHost,
  onTimeUpdate,
  onPlaybackChange,
  onDurationChange,
  onEnded,
  onReady,
  onAutoplayBlocked,
  volume = 1,
  isMuted = false
}: UniversalPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [ytId, setYtId] = useState<string | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    if (videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')) {
      setIsYouTube(true);
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = videoUrl.match(regExp);
      setYtId(match && match[2].length === 11 ? match[2] : null);
    } else {
      setIsYouTube(false);
      setYtId(null);
    }
  }, [videoUrl]);

  // Load YouTube API
  useEffect(() => {
    if (!isYouTube || ytId === null) return;

    if (!window.YT) {
      // Check if tag already exists to prevent duplicates across fast navigations
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const checkApi = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsApiReady(true);
          clearInterval(checkApi);
        }
      }, 100);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
      
      return () => clearInterval(checkApi);
    } else {
      setIsApiReady(true);
    }
  }, [isYouTube, ytId]);

  // Initialize YouTube Player
  useEffect(() => {
    if (!isApiReady || !ytId || !containerRef.current || playerRef.current) return;

    const onPlayerStateChange = (event: any) => {
      if (!isHost) return;

      if (event.data === window.YT.PlayerState.PLAYING) {
        onPlaybackChange('playing');
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        onPlaybackChange('paused');
      } else if (event.data === window.YT.PlayerState.ENDED) {
        onEnded();
      }
    };

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: ytId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        modestbranding: 1,
        origin: window.location.origin,
        rel: 0,
        mute: isHost ? 0 : 1
      },
      events: {
        onReady: (event: any) => {
          onDurationChange(event.target.getDuration());
          event.target.seekTo(currentTime, true);
          
          if (playbackState === 'playing') {
            // Attempt autoplay
            const playPromise = event.target.playVideo();
            // YouTube doesn't always return a promise here, but we can check state
            setTimeout(() => {
              if (event.target.getPlayerState() !== window.YT.PlayerState.PLAYING && onAutoplayBlocked) {
                onAutoplayBlocked();
              }
            }, 1000);
          } else {
            event.target.pauseVideo();
          }
          if (onReady) onReady();
        },
        onStateChange: onPlayerStateChange
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiReady, ytId, isHost]);

  // Sync YouTube Player
  useEffect(() => {
    if (!playerRef.current || !isYouTube || !isApiReady) return;
    const player = playerRef.current;

    if (player.getPlayerState) {
      const state = player.getPlayerState();
      if (playbackState === 'playing' && state !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
      } else if (playbackState === 'paused' && state !== window.YT.PlayerState.PAUSED) {
        player.pauseVideo();
      }

      const drift = Math.abs(player.getCurrentTime() - currentTime);
      if (drift > 2) {
        player.seekTo(currentTime, true);
      }
    }
  }, [playbackState, currentTime, isYouTube, isApiReady, volume, isMuted]);

  // Track Volume Changes for YouTube
  useEffect(() => {
    if (playerRef.current?.setVolume && isYouTube) {
      playerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted, isYouTube]);

  // Tracking Interval for Host (YouTube)
  useEffect(() => {
    if (!isHost || !isYouTube || !playerRef.current) return;

    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        onTimeUpdate(playerRef.current.getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, isYouTube]);

  // Direct Video Handling
  useEffect(() => {
    if (isYouTube || !videoRef.current) return;
    const video = videoRef.current;

    if (playbackState === 'playing' && video.paused) {
      video.play().catch((err) => {
        if (err.name === 'NotAllowedError' && onAutoplayBlocked) {
          onAutoplayBlocked();
        }
      });
    } else if (playbackState === 'paused' && !video.paused) {
      video.pause();
    }

    const drift = Math.abs(video.currentTime - currentTime);
    if (drift > 2) {
      video.currentTime = currentTime;
    }
  }, [playbackState, currentTime, isYouTube]);

  if (isYouTube && ytId) {
    return (
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full h-full relative">
          <div ref={containerRef} className="w-full h-full" />
          
          {/* Controls Overlay Only for Hover */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center mb-20 pointer-events-none">
             <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
               <YoutubeIcon className="w-6 h-6 text-[#FF0000]" />
               <p className="text-[11px] font-black text-white uppercase tracking-widest">YouTube Active Sync</p>
             </div>
          </div>

          {/* Block YouTube related videos and overlays */}
          <div className="absolute inset-0 z-0 bg-transparent" />
        </div>
      </div>
    );
  }

  if (platform === 'netflix' || platform === 'hotstar' || platform === 'disney' || platform === 'prime') {
    return (
      <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <LockIcon className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter">Premium Source Detected</h3>
          <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">
            {platform.charAt(0).toUpperCase() + platform.slice(1)} uses high-level DRM protection and cannot be embedded directly.
          </p>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-8">
            <p className="text-[10px] text-[#0A84FF] font-black uppercase tracking-widest mb-2">Recommended fix</p>
            <p className="text-[11px] text-gray-400">Paste a direct .mp4 or .m3u8 link from a different provider, or use a YouTube link for full sync support.</p>
          </div>
          <button 
            onClick={() => window.open(videoUrl || '#', '_blank')}
            className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#0A84FF] hover:text-white transition-all"
          >
            Open Original Link
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <video 
      ref={videoRef}
      src={videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
      className="w-full h-full object-contain shadow-2xl"
      playsInline
      muted={isMuted || !isHost}
      onLoadedMetadata={() => {
        if (videoRef.current) {
          videoRef.current.volume = volume;
          onDurationChange(videoRef.current.duration);
        }
      }}
      onTimeUpdate={() => {
        if (videoRef.current) {
          onTimeUpdate(videoRef.current.currentTime);
        }
      }}
      onPlay={() => onPlaybackChange('playing')}
      onPause={() => onPlaybackChange('paused')}
      onEnded={onEnded}
    />
  );
};
