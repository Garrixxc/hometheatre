import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Clock, MoreVertical, CheckCircle2, Loader2, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelAvatar: string;
  views: string;
  postedAt: string;
  duration: string;
  category: string;
}

const CATEGORIES = ['All', 'Music', 'Gaming', 'Mixes', 'Tech', 'Live', 'Movies', 'Sports', 'Cooking'];

const MOCK_VIDEOS: Video[] = [
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny - 4K 60fps CGI Animation',
    thumbnail: 'https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg',
    channel: 'Blender Studio',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blender',
    views: '12M views',
    postedAt: '1 year ago',
    duration: '10:34',
    category: 'Movies'
  },
  {
    id: 'YE7VzlLtp-4',
    title: 'Sintel - Third Open Movie by Blender Foundation',
    thumbnail: 'https://img.youtube.com/vi/YE7VzlLtp-4/maxresdefault.jpg',
    channel: 'Blender',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blender2',
    views: '8.4M views',
    postedAt: '2 years ago',
    duration: '14:48',
    category: 'Movies'
  },
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channel: 'Rick Astley',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rick',
    views: '1.4B views',
    postedAt: '14 years ago',
    duration: '3:32',
    category: 'Music'
  }
];

interface YouTubeDiscoveryProps {
  onSelect: (video: Video) => void;
}

export const YouTubeDiscovery = ({ onSelect }: YouTubeDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchYouTubeVideos = useCallback(async (query: string, category: string) => {
    if (!API_KEY) {
      // Fallback to local filtering of mocks if no API key
      const filtered = MOCK_VIDEOS.filter(v => 
        (v.title.toLowerCase().includes(query.toLowerCase()) || v.channel.toLowerCase().includes(query.toLowerCase())) &&
        (category === 'All' || v.category === category)
      );
      setVideos(filtered);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const q = category === 'All' ? query : `${query} ${category}`;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(q)}&type=video&key=${API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const mappedVideos: Video[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        channel: item.snippet.channelTitle,
        channelAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.snippet.channelId}`,
        views: 'Live Search',
        postedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
        duration: 'HD', // Would need another API call for exact duration
        category: category
      }));

      setVideos(mappedVideos);
    } catch (err: any) {
      console.error('YouTube Search Error:', err);
      setError(err.message || 'Failed to fetch videos');
      // On error, show mocks so UI isn't empty
      setVideos(MOCK_VIDEOS);
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY]);

  useEffect(() => {
    fetchYouTubeVideos(debouncedQuery, selectedCategory);
  }, [debouncedQuery, selectedCategory, fetchYouTubeVideos]);

  return (
    <div className="flex flex-col h-full bg-background pb-32">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl px-4 py-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0A84FF] transition-colors" />
          <input 
            type="text" 
            placeholder="Search YouTube..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1c1c1e] pl-14 pr-6 py-4 rounded-[2rem] text-sm text-white focus:outline-none focus:ring-4 focus:ring-[#0A84FF]/10 transition-all border border-white/5 shadow-2xl"
          />
          {isLoading && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-[#0A84FF] animate-spin" />
            </div>
          )}
        </div>

        {/* Category Selector */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedCategory === cat 
                  ? "bg-white text-black border-white shadow-xl scale-105" 
                  : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* API Warning if missing */}
      {!API_KEY && (
        <div className="mx-4 mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-500" />
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
            Demo Mode: Real YouTube search requires an API Key in .env
          </p>
        </div>
      )}

      {/* Video Grid */}
      <div className="px-4 mt-4 grid grid-cols-1 gap-8">
        <AnimatePresence mode="popLayout">
          {videos.length > 0 ? (
            videos.map((video, idx) => (
              <motion.div
                key={video.id + idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelect(video)}
                className="group cursor-pointer"
              >
                {/* Thumbnail Wrapper */}
                <div className="relative aspect-video rounded-3xl overflow-hidden mb-4 bg-white/5 shadow-2xl ring-1 ring-white/5 group-hover:ring-white/10 transition-all">
                  <img 
                    src={video.thumbnail} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={video.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white shadow-xl shadow-black/20">
                    {video.duration}
                  </div>

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-110 group-hover:scale-100 duration-500">
                    <div className="w-16 h-16 bg-[#FF0000] rounded-full flex items-center justify-center shadow-2xl shadow-[#FF0000]/40">
                      <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex gap-4 px-1">
                  <div className="w-12 h-12 flex-none rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/5">
                    <img src={video.channelAvatar} className="w-full h-full object-cover" alt={video.channel} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-white line-clamp-2 leading-snug group-hover:text-[#0A84FF] transition-colors mb-1"
                        dangerouslySetInnerHTML={{ __html: video.title }} />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-1">
                        <span className="group-hover:text-gray-300 transition-colors">{video.channel}</span>
                        <CheckCircle2 className="w-3 h-3 text-gray-500 fill-gray-500/20" />
                      </div>
                      <div className="w-1 h-1 bg-gray-700 rounded-full" />
                      <span>{video.views}</span>
                      <div className="w-1 h-1 bg-gray-700 rounded-full" />
                      <span className={cn(video.postedAt === 'LIVE' ? "text-[#FF0000] font-black" : "")}>
                        {video.postedAt}
                      </span>
                    </div>
                  </div>
                  <button className="flex-none p-2 h-10 w-10 text-gray-600 hover:text-white transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : !isLoading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-20 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-600 opacity-50" />
              </div>
              <h5 className="text-white font-bold mb-2">No results found</h5>
              <p className="text-sm text-gray-500">Try searching for something else or change category.</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isLoading && videos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-white">Fetching results...</p>
          </div>
        )}
      </div>

      {/* Manual Link Footer */}
      <div className="mt-12 text-center pb-20">
        <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-4">Have an unlisted link?</p>
        <button 
          onClick={() => onSelect({ id: 'custom', title: '', thumbnail: '', channel: '', channelAvatar: '', views: '', postedAt: '', duration: '', category: '' })}
          className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all border border-white/5"
        >
          Paste Custom Link
        </button>
      </div>
    </div>
  );
};
