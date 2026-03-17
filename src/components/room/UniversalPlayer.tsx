import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

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
  onEnded
}: UniversalPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [ytId, setYtId] = useState<string | null>(null);

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

  // Direct Video Handling
  useEffect(() => {
    if (isYouTube || !videoRef.current) return;
    const video = videoRef.current;

    if (playbackState === 'playing' && video.paused) {
      video.play().catch(() => {});
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
      <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
        <div className="w-full h-full relative">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=0&mute=${isHost ? 0 : 1}&origin=${window.location.origin}`}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {/* Overlay to catch clicks and sync - note: complex sync for YT requires API, this is a placeholder/basic embed */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center mb-20">
             <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl flex items-center gap-3">
               <YoutubeIcon className="w-6 h-6 text-[#FF0000]" />
               <p className="text-[11px] font-black text-white uppercase tracking-widest">YouTube Active Sync</p>
             </div>
          </div>
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
            <p className="text-[11px] text-gray-400">Past a direct .mp4 or .m3u8 link from a different provider, or use a YouTube link for full sync support.</p>
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
      className="w-full h-full object-contain"
      playsInline
      muted={!isHost}
      onLoadedMetadata={() => {
        if (videoRef.current) {
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

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
