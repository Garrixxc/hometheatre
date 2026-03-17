import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Clock, MoreVertical, CheckCircle2 } from 'lucide-react';
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
    id: 'T2wqeK-C2I0',
    title: 'Tears of Steel - Sci-Fi Short Film',
    thumbnail: 'https://img.youtube.com/vi/T2wqeK-C2I0/maxresdefault.jpg',
    channel: 'Blender Studio',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SciFi',
    views: '5.1M views',
    postedAt: '3 years ago',
    duration: '12:14',
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
  },
  {
    id: '9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    channel: 'officialpsy',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PSY',
    views: '5B views',
    postedAt: '11 years ago',
    duration: '4:12',
    category: 'Music'
  },
  {
    id: 'fHI8X4OXluQ',
    title: 'Relaxing Jazz Piano Radio - Slow Jazz Music - 24/7 Live Stream',
    thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluQ/maxresdefault.jpg',
    channel: 'Cafe Music',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jazz',
    views: '24K watching',
    postedAt: 'LIVE',
    duration: 'LIVE',
    category: 'Live'
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Ed Sheeran - Perfect (Official Music Video)',
    thumbnail: 'https://img.youtube.com/vi/2Vv-BfVoq4g/maxresdefault.jpg',
    channel: 'Ed Sheeran',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ed',
    views: '3.6B views',
    postedAt: '6 years ago',
    duration: '4:39',
    category: 'Music'
  },
  {
    id: 'lTRiuFIWV5M',
    title: '1Hour of Coding Music - LoFi Hip Hop Mix',
    thumbnail: 'https://img.youtube.com/vi/lTRiuFIWV5M/maxresdefault.jpg',
    channel: 'LoFi Girl',
    channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LoFi',
    views: '2M views',
    postedAt: '5 months ago',
    duration: '1:00:23',
    category: 'Gaming'
  }
];

interface YouTubeDiscoveryProps {
  onSelect: (video: Video) => void;
}

export const YouTubeDiscovery = ({ onSelect }: YouTubeDiscoveryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredVideos = useMemo(() => {
    return MOCK_VIDEOS.filter(v => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.channel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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

      {/* Video Grid */}
      <div className="px-4 mt-4 grid grid-cols-1 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredVideos.length > 0 ? (
            filteredVideos.map((video, idx) => (
              <motion.div
                key={video.id}
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
                    <h4 className="font-bold text-base text-white line-clamp-2 leading-snug group-hover:text-[#0A84FF] transition-colors mb-1">
                      {video.title}
                    </h4>
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
          ) : (
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
